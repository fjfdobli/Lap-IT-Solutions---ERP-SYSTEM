import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { erpPool } from '../database/database'
import { authenticateToken, requireSuperAdmin } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { notifyDeviceActivity } from '../utils/notifications'

const router = Router()

router.use(authenticateToken)

router.get('/', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, page = '1', limit = '50' } = req.query

    let query = `
      SELECT d.id, d.device_name, d.device_key, d.user_id, d.last_seen, 
             d.is_active, d.registered_at,
             u.first_name, u.last_name, u.email
      FROM devices d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (status === 'online') {
      query += ' AND d.last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE) AND d.is_active = TRUE'
    } else if (status === 'offline') {
      query += ' AND (d.last_seen IS NULL OR d.last_seen <= DATE_SUB(NOW(), INTERVAL 5 MINUTE)) AND d.is_active = TRUE'
    } else if (status === 'disabled') {
      query += ' AND d.is_active = FALSE'
    }

    if (search) {
      query += ' AND (d.device_name LIKE ? OR d.device_key LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern)
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await erpPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY d.registered_at DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [devices] = await erpPool.query<RowDataPacket[]>(query, params)
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    res.json({
      success: true,
      data: {
        devices: devices.map(d => {
          let deviceStatus: 'online' | 'offline' | 'disabled' = 'offline'
          if (!d.is_active) {
            deviceStatus = 'disabled'
          } else if (d.last_seen && new Date(d.last_seen) > fiveMinutesAgo) {
            deviceStatus = 'online'
          }
          
          return {
            id: d.id,
            deviceName: d.device_name,
            deviceId: d.device_key,
            status: deviceStatus,
            lastSeen: d.last_seen,
            ipAddress: null, 
            osVersion: null, 
            appVersion: null, 
            createdAt: d.registered_at,
            updatedAt: d.registered_at,
            userId: d.user_id,
            userName: d.first_name ? `${d.first_name} ${d.last_name}` : null,
          }
        }),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        }
      }
    })
  } catch (err) {
    console.error('List devices error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const [devices] = await erpPool.query<RowDataPacket[]>(
      `SELECT d.*, u.first_name, u.last_name, u.email
       FROM devices d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [id]
    )

    if (devices.length === 0) {
      res.status(404).json({ success: false, error: 'Device not found' })
      return
    }

    const d = devices[0]!
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    
    let deviceStatus: 'online' | 'offline' | 'disabled' = 'offline'
    if (!d.is_active) {
      deviceStatus = 'disabled'
    } else if (d.last_seen && new Date(d.last_seen) > fiveMinutesAgo) {
      deviceStatus = 'online'
    }

    res.json({
      success: true,
      data: {
        id: d.id,
        deviceName: d.device_name,
        deviceId: d.device_key,
        status: deviceStatus,
        lastSeen: d.last_seen,
        ipAddress: null,
        osVersion: null,
        appVersion: null,
        createdAt: d.registered_at,
        updatedAt: d.registered_at,
        userId: d.user_id,
        userName: d.first_name ? `${d.first_name} ${d.last_name}` : null,
      }
    })
  } catch (err) {
    console.error('Get device error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.put('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { deviceName, status } = req.body
    const [devices] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM devices WHERE id = ?',
      [id]
    )

    if (devices.length === 0) {
      res.status(404).json({ success: false, error: 'Device not found' })
      return
    }

    const updates: string[] = []
    const params: any[] = []

    if (deviceName !== undefined) {
      updates.push('device_name = ?')
      params.push(deviceName)
    }

    if (status !== undefined) {
      updates.push('is_active = ?')
      params.push(status !== 'disabled')
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No updates provided' })
      return
    }

    params.push(id)
    await erpPool.query(
      `UPDATE devices SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    await erpPool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, 'update', 'device', ?, NOW())`,
      [uuidv4(), req.user!.userId, id]
    )

    res.json({ success: true, message: 'Device updated successfully' })
  } catch (err) {
    console.error('Update device error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.delete('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const [devices] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM devices WHERE id = ?',
      [id]
    )

    if (devices.length === 0) {
      res.status(404).json({ success: false, error: 'Device not found' })
      return
    }

    const deviceName = devices[0]?.device_name || 'Unknown Device'

    await erpPool.query('DELETE FROM devices WHERE id = ?', [id])

    await erpPool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, created_at)
       VALUES (?, ?, 'delete', 'device', ?, ?, NOW())`,
      [uuidv4(), req.user!.userId, id, JSON.stringify(devices[0])]
    )

    // Notify admins about device removal
    await notifyDeviceActivity(req.user!.userId, 'removed', deviceName)

    res.json({ success: true, message: 'Device removed successfully' })
  } catch (err) {
    console.error('Delete device error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Device registration (for desktop app login)
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { deviceName, deviceKey } = req.body

    if (!deviceName || !deviceKey) {
      res.status(400).json({ success: false, error: 'Device name and key are required' })
      return
    }

    // Check if device already exists
    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM devices WHERE device_key = ?',
      [deviceKey]
    )

    if (existing.length > 0) {
      // Check if device is disabled - don't allow registration
      const existingDevice = existing[0]!
      if (!existingDevice.is_active) {
        // Return 200 with success: false to avoid console errors on client
        res.json({
          success: false,
          error: 'This device has been disabled by the Super Admin. Please contact your administrator to re-enable access.',
          code: 'DEVICE_DISABLED'
        })
        return
      }
      
      // Update existing device (keep is_active unchanged)
      await erpPool.query(
        `UPDATE devices SET user_id = ?, device_name = ?, last_seen = NOW() WHERE device_key = ?`,
        [userId, deviceName, deviceKey]
      )

      res.json({
        success: true,
        data: {
          id: existingDevice.id,
          deviceName,
          deviceKey,
          isNew: false,
        }
      })
    } else {
      const id = uuidv4()
      await erpPool.query(
        `INSERT INTO devices (id, user_id, device_name, device_key, last_seen, is_active, registered_at)
         VALUES (?, ?, ?, ?, NOW(), TRUE, NOW())`,
        [id, userId, deviceName, deviceKey]
      )

      await notifyDeviceActivity(userId, 'registered', deviceName)

      res.status(201).json({
        success: true,
        data: {
          id,
          deviceName,
          deviceKey,
          isNew: true,
        }
      })
    }
  } catch (err) {
    console.error('Register device error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Device heartbeat (to keep device online)
router.post('/heartbeat', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { deviceKey } = req.body

    if (!deviceKey) {
      res.status(400).json({ success: false, error: 'Device key is required' })
      return
    }

    // Check if device exists and is active
    const [devices] = await erpPool.query<RowDataPacket[]>(
      `SELECT id, device_name, is_active FROM devices WHERE device_key = ?`,
      [deviceKey]
    )

    if (devices.length === 0) {
      res.status(404).json({ success: false, error: 'Device not found', code: 'DEVICE_NOT_FOUND' })
      return
    }

    const device = devices[0]!

    if (!device.is_active) {
      res.status(403).json({ 
        success: false, 
        error: 'Device has been disabled by administrator', 
        code: 'DEVICE_DISABLED' 
      })
      return
    }

    // Update last seen
    await erpPool.query(
      `UPDATE devices SET last_seen = NOW(), user_id = ? WHERE device_key = ?`,
      [userId, deviceKey]
    )

    res.json({ 
      success: true, 
      message: 'Heartbeat received',
      data: {
        deviceId: device.id,
        deviceName: device.device_name,
        isActive: true
      }
    })
  } catch (err) {
    console.error('Heartbeat error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Check device status (for desktop app to verify if still allowed)
router.get('/status/:deviceKey', async (req: AuthRequest, res: Response) => {
  try {
    const { deviceKey } = req.params

    const [devices] = await erpPool.query<RowDataPacket[]>(
      `SELECT id, device_name, is_active, last_seen FROM devices WHERE device_key = ?`,
      [deviceKey]
    )

    if (devices.length === 0) {
      res.status(404).json({ 
        success: false, 
        error: 'Device not registered', 
        code: 'DEVICE_NOT_FOUND' 
      })
      return
    }

    const device = devices[0]!

    res.json({
      success: true,
      data: {
        deviceId: device.id,
        deviceName: device.device_name,
        isActive: device.is_active,
        lastSeen: device.last_seen
      }
    })
  } catch (err) {
    console.error('Device status error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
