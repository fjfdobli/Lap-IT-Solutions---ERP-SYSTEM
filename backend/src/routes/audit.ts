import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { erpPool } from '../database/database'
import { authenticateToken, requireSuperAdmin } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket } from 'mysql2'

const router = Router()

router.use(authenticateToken)

router.get('/', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      action, 
      entityType, 
      userId,
      startDate,
      endDate,
      search,
      page = '1', 
      limit = '50' 
    } = req.query

    let query = `
      SELECT al.id, al.user_id, al.action, al.entity_type, al.entity_id, 
             al.old_values, al.ip_address, al.user_agent, al.created_at,
             u.first_name, u.last_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (action) {
      query += ' AND al.action = ?'
      params.push(action)
    }

    if (entityType) {
      query += ' AND al.entity_type = ?'
      params.push(entityType)
    }

    if (userId) {
      query += ' AND al.user_id = ?'
      params.push(userId)
    }

    if (startDate) {
      query += ' AND al.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      query += ' AND al.created_at <= ?'
      params.push(endDate)
    }

    if (search) {
      query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR al.action LIKE ? OR al.entity_type LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await erpPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [logs] = await erpPool.query<RowDataPacket[]>(query, params)

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log.id,
          userId: log.user_id,
          userName: log.first_name ? `${log.first_name} ${log.last_name}` : 'System',
          userEmail: log.email,
          action: log.action,
          entityType: log.entity_type,
          entityId: log.entity_id,
          details: log.old_values ? JSON.parse(log.old_values) : null,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          timestamp: log.created_at,
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
    console.error('Get audit logs error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/stats', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [actionStats] = await erpPool.query<RowDataPacket[]>(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY action
    `)

    const [entityStats] = await erpPool.query<RowDataPacket[]>(`
      SELECT entity_type, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY entity_type
    `)

    const [recentActivity] = await erpPool.query<RowDataPacket[]>(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `)

    const [totalLogs] = await erpPool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total FROM audit_logs
    `)

    res.json({
      success: true,
      data: {
        totalLogs: totalLogs[0]?.total || 0,
        actionStats: actionStats.map(s => ({ action: s.action, count: s.count })),
        entityStats: entityStats.map(s => ({ entityType: s.entity_type, count: s.count })),
        recentActivity: recentActivity.map(r => ({ date: r.date, count: r.count })),
      }
    })
  } catch (err) {
    console.error('Get audit stats error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const [logs] = await erpPool.query<RowDataPacket[]>(
      `SELECT al.*, u.first_name, u.last_name, u.email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.id = ?`,
      [id]
    )

    if (logs.length === 0) {
      res.status(404).json({ success: false, error: 'Audit log not found' })
      return
    }

    const log = logs[0]!

    res.json({
      success: true,
      data: {
        id: log.id,
        userId: log.user_id,
        userName: log.first_name ? `${log.first_name} ${log.last_name}` : 'System',
        userEmail: log.email,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        details: log.old_values ? JSON.parse(log.old_values) : null,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        timestamp: log.created_at,
      }
    })
  } catch (err) {
    console.error('Get audit log error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/export/csv', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query

    let query = `
      SELECT al.id, al.action, al.entity_type, al.entity_id, 
             al.ip_address, al.created_at,
             u.first_name, u.last_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (startDate) {
      query += ' AND al.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      query += ' AND al.created_at <= ?'
      params.push(endDate)
    }

    query += ' ORDER BY al.created_at DESC LIMIT 10000'

    const [logs] = await erpPool.query<RowDataPacket[]>(query, params)

    const headers = ['ID', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Timestamp']
    const rows = logs.map(log => [
      log.id,
      log.first_name ? `${log.first_name} ${log.last_name}` : 'System',
      log.email || '-',
      log.action,
      log.entity_type,
      log.entity_id || '-',
      log.ip_address || '-',
      log.created_at,
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`)
    res.send(csv)
  } catch (err) {
    console.error('Export audit logs error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
