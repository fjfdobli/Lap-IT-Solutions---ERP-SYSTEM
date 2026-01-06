import { Router, Response } from 'express'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { erpPool } from '../database/database'
import { config } from '../config'
import { authenticateToken, requireSuperAdmin } from '../middleware/auth'
import { AuthRequest, UserType } from '../types'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { notifyUserActivity, notifyRoleChange } from '../utils/notifications'

const router = Router()

router.use(authenticateToken)

router.get('/', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userType, isActive, search, page = '1', limit = '20' } = req.query

    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.user_type, 
             u.is_active, u.email_verified, u.last_login, u.created_at,
             creator.first_name as creator_first_name, creator.last_name as creator_last_name
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id
      WHERE 1=1
    `
    const params: any[] = []

    if (userType) {
      query += ' AND u.user_type = ?'
      params.push(userType)
    }

    if (isActive !== undefined) {
      query += ' AND u.is_active = ?'
      params.push(isActive === 'true')
    }

    if (search) {
      query += ' AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await erpPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]!.total

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [users] = await erpPool.query<RowDataPacket[]>(query, params)

    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          userType: u.user_type,
          isActive: u.is_active,
          emailVerified: u.email_verified,
          lastLogin: u.last_login,
          createdAt: u.created_at,
          createdBy: u.creator_first_name ? `${u.creator_first_name} ${u.creator_last_name}` : null,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        }
      }
    })
  } catch (err) {
    console.error('List users error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const [users] = await erpPool.query<RowDataPacket[]>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.user_type, 
              u.is_active, u.email_verified, u.last_login, u.created_at, u.updated_at,
              creator.first_name as creator_first_name, creator.last_name as creator_last_name
       FROM users u
       LEFT JOIN users creator ON u.created_by = creator.id
       WHERE u.id = ?`,
      [id]
    )

    if (users.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    const u = users[0]!

    const [roles] = await erpPool.query<RowDataPacket[]>(
      `SELECT r.id, r.name, r.description
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [id]
    )

    res.json({
      success: true,
      data: {
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        userType: u.user_type,
        isActive: u.is_active,
        emailVerified: u.email_verified,
        lastLogin: u.last_login,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        createdBy: u.creator_first_name ? `${u.creator_first_name} ${u.creator_last_name}` : null,
        roles: roles.map(r => ({ id: r.id, name: r.name, description: r.description })),
      }
    })
  } catch (err) {
    console.error('Get user error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, userType, roleIds, isActive } = req.body

    if (!email || !password || !firstName || !lastName || !userType) {
      res.status(400).json({ success: false, error: 'All fields required' })
      return
    }

    if (!['super_admin', 'admin', 'manager'].includes(userType)) {
      res.status(400).json({ success: false, error: 'Invalid user type' })
      return
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters' })
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

    const userId = uuidv4()
    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds)
    const now = new Date()

    await erpPool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, user_type, is_active, email_verified, created_at, updated_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?)`,
      [userId, email, passwordHash, firstName, lastName, userType, isActive !== false, now, now, req.user!.userId]
    )

    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      const roleValues = roleIds.map(roleId => [userId, roleId, now, req.user!.userId])
      await erpPool.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by) VALUES ?`,
        [roleValues]
      )
    }

    // Send notification for new user creation
    await notifyUserActivity(
      req.user!.userId,
      'created',
      `${firstName} ${lastName}`,
      userType
    )

    res.status(201).json({
      success: true,
      data: {
        id: userId,
        email,
        firstName,
        lastName,
        userType,
      }
    })
  } catch (err) {
    console.error('Create user error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.put('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { firstName, lastName, userType, isActive, roleIds } = req.body

    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT id, user_type, first_name, last_name, is_active FROM users WHERE id = ?',
      [id]
    )

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    const existingUser = existing[0]!
    const updates: string[] = []
    const params: any[] = []

    if (firstName !== undefined) {
      updates.push('first_name = ?')
      params.push(firstName)
    }

    if (lastName !== undefined) {
      updates.push('last_name = ?')
      params.push(lastName)
    }

    if (userType !== undefined) {
      if (!['super_admin', 'admin', 'manager'].includes(userType)) {
        res.status(400).json({ success: false, error: 'Invalid user type' })
        return
      }
      updates.push('user_type = ?')
      params.push(userType)
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?')
      params.push(isActive)
    }

    if (updates.length > 0) {
      params.push(id)
      await erpPool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      )
    }

    if (roleIds !== undefined && Array.isArray(roleIds)) {
      await erpPool.query('DELETE FROM user_roles WHERE user_id = ?', [id])
      
      if (roleIds.length > 0) {
        const roleValues = roleIds.map(roleId => [id, roleId, req.user!.userId])
        await erpPool.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ?`,
          [roleValues]
        )
        
        // Get role names for notification
        const [roles] = await erpPool.query<RowDataPacket[]>(
          'SELECT name FROM roles WHERE id IN (?)',
          [roleIds]
        )
        if (roles.length > 0) {
          await notifyRoleChange(
            req.user!.userId,
            'assigned',
            roles.map((r: any) => r.name).join(', '),
            `${existingUser.first_name} ${existingUser.last_name}`
          )
        }
      }
    }

    // Send notification for user update
    const userName = firstName || existingUser.first_name
    const userLastName = lastName || existingUser.last_name
    
    if (isActive !== undefined && isActive !== existingUser.is_active) {
      await notifyUserActivity(
        req.user!.userId,
        isActive ? 'activated' : 'deactivated',
        `${userName} ${userLastName}`,
        userType || existingUser.user_type
      )
    } else if (updates.length > 0) {
      await notifyUserActivity(
        req.user!.userId,
        'updated',
        `${userName} ${userLastName}`,
        userType || existingUser.user_type
      )
    }

    res.json({ success: true, message: 'User updated successfully' })
  } catch (err) {
    console.error('Update user error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.delete('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    if (id === req.user!.userId) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' })
      return
    }

    // Get user info before deletion for notification
    const [userInfo] = await erpPool.query<RowDataPacket[]>(
      'SELECT first_name, last_name, user_type FROM users WHERE id = ?',
      [id]
    )

    const [result] = await erpPool.query<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    // Send notification for user deletion
    if (userInfo.length > 0) {
      const user = userInfo[0]!
      await notifyUserActivity(
        req.user!.userId,
        'deleted',
        `${user.first_name} ${user.last_name}`,
        user.user_type
      )
    }

    res.json({ success: true, message: 'User deleted successfully' })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/:id/reset-password', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters' })
      return
    }

    const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds)

    const [result] = await erpPool.query<ResultSetHeader>(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    )

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    await erpPool.query('DELETE FROM sessions WHERE user_id = ?', [id])

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
