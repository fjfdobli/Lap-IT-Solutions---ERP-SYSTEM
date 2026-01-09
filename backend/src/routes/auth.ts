import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { erpPool } from '../database/database'
import { config } from '../config'
import { 
  authenticateToken, 
  requireSuperAdmin, 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken 
} from '../middleware/auth'
import { AuthRequest, UserWithPassword, Session, Invitation, JWTPayload } from '../types'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

const router = Router()

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, platform, rememberMe } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' })
      return
    }

    // First check if user exists (regardless of active status)
    const [allUsers] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if (allUsers.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const user = allUsers[0] as UserWithPassword

    // Check if user account is deactivated
    if (!user.is_active) {
      res.status(200).json({ 
        success: false, 
        code: 'USER_DEACTIVATED',
        error: 'Your account has been deactivated. Please contact your administrator.' 
      })
      return
    }

    const isWebLogin = platform === 'web' || !platform 
    
    if (isWebLogin && user.user_type !== 'super_admin') {
      res.status(403).json({ 
        success: false, 
        error: 'Access denied. Only Super Admins can access the web portal.' 
      })
      return
    }
    
    if (platform === 'desktop' && user.user_type === 'super_admin') {
      res.status(403).json({ 
        success: false, 
        error: 'Access denied. Super Admin accounts cannot access the desktop application.' 
      })
      return
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const payload: JWTPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      userType: user.user_type
    }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    const sessionId = uuidv4()
    // Set session expiry based on rememberMe:
    // If rememberMe is true: 30 days
    // If rememberMe is false: 7 days (default)
    const sessionDays = rememberMe ? 30 : 7
    const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000)
    const now = new Date()
    
    await erpPool.query(
      `INSERT INTO sessions (id, user_id, refresh_token, device_info, ip_address, expires_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, user.id, refreshToken, req.headers['user-agent'] || null, req.ip || null, expiresAt, now]
    )

    await erpPool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id])

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
        },
        accessToken,
        refreshToken,
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { token, firstName, lastName, password } = req.body

    if (!token || !firstName || !lastName || !password) {
      res.status(400).json({ success: false, error: 'All fields required' })
      return
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters' })
      return
    }

    const [invitations] = await erpPool.query<RowDataPacket[]>(
      `SELECT * FROM invitations 
       WHERE token = ? AND accepted_at IS NULL AND expires_at > NOW()`,
      [token]
    )

    if (invitations.length === 0) {
      res.status(400).json({ success: false, error: 'Invalid or expired invitation' })
      return
    }

    const invitation = invitations[0] as Invitation

    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [invitation.email]
    )

    if (existing.length > 0) {
      res.status(400).json({ success: false, error: 'Email already registered' })
      return
    }

    const userId = uuidv4()
    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds)

    await erpPool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, user_type, email_verified, created_by)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [userId, invitation.email, passwordHash, firstName, lastName, invitation.user_type, invitation.invited_by]
    )

    await erpPool.query(
      'UPDATE invitations SET accepted_at = NOW() WHERE id = ?',
      [invitation.id]
    )

    const payload: JWTPayload = {
      id: userId,
      userId,
      email: invitation.email,
      userType: invitation.user_type
    }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    const sessionId = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    await erpPool.query(
      `INSERT INTO sessions (id, user_id, refresh_token, device_info, ip_address, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, userId, refreshToken, req.headers['user-agent'] || null, req.ip || null, expiresAt]
    )

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userId,
          email: invitation.email,
          firstName,
          lastName,
          userType: invitation.user_type,
        },
        accessToken,
        refreshToken,
      }
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' })
      return
    }

    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      res.status(403).json({ success: false, error: 'Invalid refresh token' })
      return
    }

    const [sessions] = await erpPool.query<RowDataPacket[]>(
      `SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > NOW()`,
      [refreshToken]
    )

    if (sessions.length === 0) {
      res.status(403).json({ success: false, error: 'Session expired or invalid' })
      return
    }

    const newAccessToken = generateAccessToken({
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
      userType: payload.userType
    })

    res.json({
      success: true,
      data: { accessToken: newAccessToken }
    })
  } catch (err) {
    console.error('Refresh error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      await erpPool.query('DELETE FROM sessions WHERE refresh_token = ?', [refreshToken])
    } else if (req.user) {
      await erpPool.query('DELETE FROM sessions WHERE user_id = ?', [req.user.userId])
    }

    res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    console.error('Logout error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const [users] = await erpPool.query<RowDataPacket[]>(
      `SELECT id, email, first_name, last_name, user_type, is_active, email_verified, last_login, created_at
       FROM users WHERE id = ?`,
      [req.user.userId]
    )

    if (users.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    const user = users[0]!

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        lastLogin: user.last_login,
        createdAt: user.created_at,
      }
    })
  } catch (err) {
    console.error('Get me error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/invite', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, userType } = req.body

    if (!email || !userType) {
      res.status(400).json({ success: false, error: 'Email and user type required' })
      return
    }

    if (!['super_admin', 'admin', 'manager'].includes(userType)) {
      res.status(400).json({ success: false, error: 'Invalid user type' })
      return
    }

    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (existing.length > 0) {
      res.status(400).json({ success: false, error: 'Email already registered' })
      return
    }

    const [pendingInvites] = await erpPool.query<RowDataPacket[]>(
      `SELECT id FROM invitations WHERE email = ? AND accepted_at IS NULL AND expires_at > NOW()`,
      [email]
    )

    if (pendingInvites.length > 0) {
      res.status(400).json({ success: false, error: 'Pending invitation already exists for this email' })
      return
    }

    const inviteId = uuidv4()
    const token = uuidv4() 
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 

    await erpPool.query(
      `INSERT INTO invitations (id, email, user_type, token, invited_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [inviteId, email, userType, token, req.user!.userId, expiresAt]
    )

    res.status(201).json({
      success: true,
      data: {
        inviteId,
        email,
        userType,
        token,
        expiresAt,
        registrationUrl: `/register?token=${token}`
      }
    })
  } catch (err) {
    console.error('Invite error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    const [invitations] = await erpPool.query<RowDataPacket[]>(
      `SELECT i.*, u.first_name as inviter_first_name, u.last_name as inviter_last_name
       FROM invitations i
       JOIN users u ON i.invited_by = u.id
       WHERE i.token = ? AND i.accepted_at IS NULL AND i.expires_at > NOW()`,
      [token]
    )

    if (invitations.length === 0) {
      res.status(404).json({ success: false, error: 'Invalid or expired invitation' })
      return
    }

    const invitation = invitations[0]!

    res.json({
      success: true,
      data: {
        email: invitation.email,
        userType: invitation.user_type,
        invitedBy: `${invitation.inviter_first_name} ${invitation.inviter_last_name}`,
        expiresAt: invitation.expires_at,
      }
    })
  } catch (err) {
    console.error('Validate invite error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
