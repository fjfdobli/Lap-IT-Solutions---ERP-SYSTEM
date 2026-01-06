import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { erpPool } from '../database/database'
import { authenticateToken, requireSuperAdmin } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

const router = Router()

router.use(authenticateToken)

// Get all devices
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
      // Consider online if last seen within 5 minutes
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

    // Count total
    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await erpPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0

    // Pagination
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY d.registered_at DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [devices] = await erpPool.query<RowDataPacket[]>(query, params)

    // Determine status for each device
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
            ipAddress: null, // Would come from session data
            osVersion: null, // Would come from device registration
            appVersion: null, // Would come from device registration
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

// Get single device
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

// Update device
router.put('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { deviceName, status } = req.body

    // Check if device exists
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

    // Log audit
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

// Delete device
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

    await erpPool.query('DELETE FROM devices WHERE id = ?', [id])

    // Log audit
    await erpPool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, created_at)
       VALUES (?, ?, 'delete', 'device', ?, ?, NOW())`,
      [uuidv4(), req.user!.userId, id, JSON.stringify(devices[0])]
    )

    res.json({ success: true, message: 'Device removed successfully' })
  } catch (err) {
    console.error('Delete device error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
