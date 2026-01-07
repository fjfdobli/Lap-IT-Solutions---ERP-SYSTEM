import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { erpPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

const router = Router()

router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { isRead, type, page = '1', limit = '20' } = req.query

    let query = `
      SELECT id, user_id, title, message, type, source, is_read, created_at
      FROM notifications
      WHERE user_id = ?
    `
    const params: any[] = [userId]

    if (isRead !== undefined) {
      query += ' AND is_read = ?'
      params.push(isRead === 'true')
    }

    if (type) {
      query += ' AND type = ?'
      params.push(type)
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await erpPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [notifications] = await erpPool.query<RowDataPacket[]>(query, params)
    const [unreadResult] = await erpPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    )

    res.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type,
          source: n.source,
          isRead: n.is_read,
          createdAt: n.created_at,
        })),
        unreadCount: unreadResult[0]?.count || 0,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        }
      }
    })
  } catch (err) {
    console.error('Get notifications error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const [notifications] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    if (notifications.length === 0) {
      res.status(404).json({ success: false, error: 'Notification not found' })
      return
    }

    await erpPool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    )

    res.json({ success: true, message: 'Notification marked as read' })
  } catch (err) {
    console.error('Mark notification read error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    await erpPool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    )

    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (err) {
    console.error('Mark all notifications read error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const [notifications] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    if (notifications.length === 0) {
      res.status(404).json({ success: false, error: 'Notification not found' })
      return
    }

    await erpPool.query('DELETE FROM notifications WHERE id = ?', [id])

    res.json({ success: true, message: 'Notification deleted' })
  } catch (err) {
    console.error('Delete notification error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.delete('/clear/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    await erpPool.query(
      'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE',
      [userId]
    )

    res.json({ success: true, message: 'Read notifications cleared' })
  } catch (err) {
    console.error('Clear notifications error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, title, message, type = 'info', source = 'system' } = req.body

    if (!userId || !title || !message) {
      res.status(400).json({ success: false, error: 'Missing required fields' })
      return
    }

    const id = uuidv4()
    await erpPool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, source, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [id, userId, title, message, type, source]
    )

    res.status(201).json({
      success: true,
      data: {
        id,
        userId,
        title,
        message,
        type,
        source,
        isRead: false,
        createdAt: new Date(),
      }
    })
  } catch (err) {
    console.error('Create notification error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
