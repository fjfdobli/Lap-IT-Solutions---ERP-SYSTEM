import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import { erpPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket } from 'mysql2'

const router = Router()

router.use(authenticateToken)

router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const [users] = await erpPool.query<RowDataPacket[]>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.user_type,
              u.is_active, u.email_verified, u.last_login, u.created_at
       FROM users u
       WHERE u.id = ?`,
      [userId]
    )

    if (users.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    const user = users[0]!

    // Get user roles
    const [roles] = await erpPool.query<RowDataPacket[]>(
      `SELECT r.id, r.name FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    )

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
        role: roles.length > 0 && roles[0] ? { id: roles[0].id, name: roles[0].name } : null,
      }
    })
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Update current user profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { firstName, lastName } = req.body

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

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No updates provided' })
      return
    }

    // Add updated_at
    updates.push('updated_at = ?')
    params.push(new Date())

    params.push(userId)
    await erpPool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    // Log audit
    await erpPool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, 'update', 'user_profile', ?, NOW())`,
      [uuidv4(), userId, userId]
    )

    res.json({ success: true, message: 'Profile updated successfully' })
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Change password
router.put('/password', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current and new password are required' })
      return
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters' })
      return
    }

    // Get current password hash
    const [users] = await erpPool.query<RowDataPacket[]>(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, users[0]!.password_hash)
    if (!validPassword) {
      res.status(400).json({ success: false, error: 'Current password is incorrect' })
      return
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const newPasswordHash = await bcrypt.hash(newPassword, salt)

    // Update password
    await erpPool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    )

    // Log audit
    await erpPool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, 'password_change', 'user', ?, NOW())`,
      [uuidv4(), userId, userId]
    )

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err) {
    console.error('Change password error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get notification preferences (stored in user_settings table)
router.get('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    // Default preferences
    const defaults: Record<string, boolean> = {
      emailNotifications: true,
      pushNotifications: true,
      loginAlerts: true,
      securityAlerts: true,
      systemUpdates: false,
      userActivityNotifications: true,
      deviceNotifications: true,
      roleChangeNotifications: true,
      auditAlertNotifications: false,
    }

    // Try to load from user_settings table
    try {
      const [settings] = await erpPool.query<RowDataPacket[]>(
        'SELECT setting_key, setting_value FROM user_settings WHERE user_id = ? AND setting_key LIKE "notification_%"',
        [userId]
      )

      if (Array.isArray(settings) && settings.length > 0) {
        settings.forEach((setting: any) => {
          const key = setting.setting_key.replace('notification_', '')
          // Convert snake_case to camelCase
          const camelKey = key.replace(/_([a-z])/g, (_: string, letter: string) => letter?.toUpperCase() ?? '')
          if (camelKey in defaults) {
            defaults[camelKey] = setting.setting_value === 'true'
          }
        })
      }
    } catch (dbErr) {
      // Table might not exist yet, return defaults
      console.log('user_settings table may not exist, using defaults')
    }

    res.json({
      success: true,
      data: defaults
    })
  } catch (err) {
    console.error('Get notification preferences error:', err)
    res.json({
      success: true,
      data: {
        emailNotifications: true,
        pushNotifications: true,
        loginAlerts: true,
        securityAlerts: true,
        systemUpdates: false,
        userActivityNotifications: true,
        deviceNotifications: true,
        roleChangeNotifications: true,
        auditAlertNotifications: false,
      }
    })
  }
})

// Update notification preferences
router.put('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const preferences = req.body

    // Try to create table if it doesn't exist
    try {
      await erpPool.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id CHAR(36) PRIMARY KEY,
          user_id CHAR(36) NOT NULL,
          setting_key VARCHAR(100) NOT NULL,
          setting_value TEXT,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          UNIQUE KEY unique_user_setting (user_id, setting_key),
          INDEX idx_user_id (user_id)
        )
      `)

      // Save each preference
      for (const [key, value] of Object.entries(preferences)) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        const settingKey = `notification_${snakeKey}`
        
        await erpPool.query(`
          INSERT INTO user_settings (id, user_id, setting_key, setting_value, created_at, updated_at)
          VALUES (UUID(), ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()
        `, [userId, settingKey, String(value), String(value)])
      }
    } catch (dbErr) {
      console.error('Failed to save preferences to DB:', dbErr)
    }
    
    // Log audit
    await erpPool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, created_at)
       VALUES (?, ?, 'update', 'notification_preferences', ?, ?, NOW())`,
      [uuidv4(), userId, userId, JSON.stringify(preferences)]
    )

    res.json({ success: true, message: 'Notification preferences updated' })
  } catch (err) {
    console.error('Update notification preferences error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get active sessions
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const [sessions] = await erpPool.query<RowDataPacket[]>(
      `SELECT id, device_info, ip_address, created_at
       FROM sessions
       WHERE user_id = ? AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    )

    res.json({
      success: true,
      data: {
        sessions: sessions.map(s => ({
          id: s.id,
          deviceInfo: s.device_info,
          ipAddress: s.ip_address,
          lastActive: s.created_at, // Using created_at as last_active
          createdAt: s.created_at,
        }))
      }
    })
  } catch (err) {
    console.error('Get sessions error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Revoke session
router.delete('/sessions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const [sessions] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM sessions WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    if (sessions.length === 0) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    await erpPool.query('DELETE FROM sessions WHERE id = ?', [id])

    // Log audit
    await erpPool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, 'session_revoke', 'session', ?, NOW())`,
      [uuidv4(), userId, id]
    )

    res.json({ success: true, message: 'Session revoked successfully' })
  } catch (err) {
    console.error('Revoke session error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Revoke all other sessions
router.delete('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const currentSessionId = req.headers['x-session-id'] as string

    await erpPool.query(
      'DELETE FROM sessions WHERE user_id = ? AND id != ?',
      [userId, currentSessionId || '']
    )

    // Log audit
    await erpPool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, 'sessions_revoke_all', 'user', ?, NOW())`,
      [uuidv4(), userId, userId]
    )

    res.json({ success: true, message: 'All other sessions revoked' })
  } catch (err) {
    console.error('Revoke all sessions error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
