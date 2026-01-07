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
    const { search, isActive, page = '1', limit = '50' } = req.query
    
    let query = `
      SELECT s.*, u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM suppliers s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (search) {
      query += ' AND (s.name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }
    
    if (isActive !== undefined) {
      query += ' AND s.is_active = ?'
      params.push(isActive === 'true')
    }
    
    // Build count query separately to avoid regex issues with JOINs
    let countQuery = `
      SELECT COUNT(*) as total
      FROM suppliers s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1
    `
    if (search) {
      countQuery += ' AND (s.name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ?)'
    }
    if (isActive !== undefined) {
      countQuery += ' AND s.is_active = ?'
    }
    const [countResult] = await erpPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]!.total
    
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum
    
    query += ' ORDER BY s.name ASC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)
    
    const [suppliers] = await erpPool.query<RowDataPacket[]>(query, params)
    
    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Get suppliers error:', error)
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    res.status(500).json({ success: false, error: 'Failed to fetch suppliers', details: String(error) })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const [suppliers] = await erpPool.query<RowDataPacket[]>(
      `SELECT s.*, u.first_name as creator_first_name, u.last_name as creator_last_name
       FROM suppliers s
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = ?`,
      [req.params.id]
    )
    
    if (suppliers.length === 0) {
      return res.status(404).json({ success: false, error: 'Supplier not found' })
    }
    
    res.json({ success: true, data: suppliers[0] })
  } catch (error) {
    console.error('Get supplier error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch supplier' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, contactPerson, email, phone, viber, address, notes } = req.body
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Supplier name is required' })
    }
    
    const id = uuidv4()
    const now = new Date()
    
    await erpPool.query<ResultSetHeader>(
      `INSERT INTO suppliers (id, name, contact_person, email, phone, viber, address, notes, is_active, created_at, updated_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?)`,
      [id, name, contactPerson || null, email || null, phone || null, viber || null, address || null, notes || null, now, now, req.user!.id]
    )
    
    const [newSupplier] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM suppliers WHERE id = ?',
      [id]
    )
    
    res.status(201).json({ success: true, data: newSupplier[0] })
  } catch (error) {
    console.error('Create supplier error:', error)
    res.status(500).json({ success: false, error: 'Failed to create supplier' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, contactPerson, email, phone, viber, address, notes, isActive } = req.body
    
    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT id FROM suppliers WHERE id = ?',
      [req.params.id]
    )
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Supplier not found' })
    }
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE suppliers SET 
        name = COALESCE(?, name),
        contact_person = ?,
        email = ?,
        phone = ?,
        viber = ?,
        address = ?,
        notes = ?,
        is_active = COALESCE(?, is_active),
        updated_at = ?
       WHERE id = ?`,
      [name, contactPerson, email, phone, viber, address, notes, isActive, new Date(), req.params.id]
    )
    
    const [updated] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM suppliers WHERE id = ?',
      [req.params.id]
    )
    
    res.json({ success: true, data: updated[0] })
  } catch (error) {
    console.error('Update supplier error:', error)
    res.status(500).json({ success: false, error: 'Failed to update supplier' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const [orders] = await erpPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?',
      [req.params.id]
    )
    
    if ((orders[0]?.count ?? 0) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete supplier with existing purchase orders. Deactivate instead.' 
      })
    }
    
    await erpPool.query<ResultSetHeader>(
      'DELETE FROM suppliers WHERE id = ?',
      [req.params.id]
    )
    
    res.json({ success: true, message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Delete supplier error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete supplier' })
  }
})

export default router
