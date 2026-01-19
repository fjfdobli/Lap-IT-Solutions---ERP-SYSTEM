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
    const { search, lowStock, categoryId, page = '1', limit = '50' } = req.query
    
    let query = `
      SELECT i.*, p.sku, p.name as product_name, p.unit, p.cost_price, p.selling_price, p.reorder_level,
             c.name as category_name, p.is_active
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
    `
    const params: any[] = []
    
    if (search) {
      query += ' AND (p.name LIKE ? OR p.sku LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern)
    }
    
    if (categoryId) {
      query += ' AND p.category_id = ?'
      params.push(categoryId)
    }
    
    if (lowStock === 'true') {
      query += ' AND i.quantity_on_hand <= p.reorder_level'
    }
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `
    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.sku LIKE ?)'
    }
    if (categoryId) {
      countQuery += ' AND p.category_id = ?'
    }
    if (lowStock === 'true') {
      countQuery += ' AND i.quantity_on_hand <= p.reorder_level'
    }
    const [countResult] = await erpPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]!.total
    
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum
    
    query += ' ORDER BY p.name ASC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)
    
    const [inventory] = await erpPool.query<RowDataPacket[]>(query, params)
    
    res.json({
      success: true,
      data: {
        inventory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error: any) {
    console.error('Get inventory error:', error?.message || error)
    console.error('Error stack:', error?.stack)
    res.status(500).json({ success: false, error: 'Failed to fetch inventory', details: error?.message })
  }
})

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [totalProducts] = await erpPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM products WHERE is_active = TRUE'
    )
    
    const [lowStockItems] = await erpPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE p.is_active = TRUE AND i.quantity_on_hand <= p.reorder_level`
    )
    
    const [outOfStock] = await erpPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE p.is_active = TRUE AND i.quantity_on_hand = 0`
    )
    
    const [totalValue] = await erpPool.query<RowDataPacket[]>(
      `SELECT SUM(i.quantity_on_hand * p.cost_price) as value
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE p.is_active = TRUE`
    )
    
    res.json({
      success: true,
      data: {
        totalProducts: totalProducts[0]?.count ?? 0,
        lowStockItems: lowStockItems[0]?.count ?? 0,
        outOfStock: outOfStock[0]?.count ?? 0,
        totalValue: totalValue[0]?.value ?? 0
      }
    })
  } catch (error) {
    console.error('Get inventory stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch inventory stats' })
  }
})

router.get('/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const [inventory] = await erpPool.query<RowDataPacket[]>(
      `SELECT i.*, p.sku, p.name as product_name, p.unit, p.cost_price, p.selling_price, p.reorder_level,
              c.name as category_name
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE i.product_id = ?`,
      [req.params.productId]
    )
    
    if (inventory.length === 0) {
      return res.status(404).json({ success: false, error: 'Inventory record not found' })
    }
    
    const [transactions] = await erpPool.query<RowDataPacket[]>(
      `SELECT t.*, u.first_name, u.last_name
       FROM inventory_transactions t
       JOIN users u ON t.created_by = u.id
       WHERE t.product_id = ?
       ORDER BY t.created_at DESC
       LIMIT 20`,
      [req.params.productId]
    )
    
    res.json({ 
      success: true, 
      data: { 
        ...inventory[0], 
        transactions 
      } 
    })
  } catch (error) {
    console.error('Get inventory item error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch inventory item' })
  }
})

router.post('/:productId/adjust', async (req: AuthRequest, res: Response) => {
  try {
    const { adjustment, notes } = req.body
    const productId = req.params.productId
    
    if (adjustment === undefined || adjustment === 0) {
      return res.status(400).json({ success: false, error: 'Adjustment quantity is required' })
    }
    
    const [current] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM inventory WHERE product_id = ?',
      [productId]
    )
    
    if (current.length === 0) {
      return res.status(404).json({ success: false, error: 'Inventory record not found' })
    }
    
    const quantityBefore = current[0]!.quantity_on_hand
    const quantityAfter = quantityBefore + adjustment
    
    if (quantityAfter < 0) {
      return res.status(400).json({ success: false, error: 'Cannot have negative inventory' })
    }
    
    const now = new Date()
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE inventory SET quantity_on_hand = ?, last_count_date = ?, last_count_by = ?, updated_at = ?
       WHERE product_id = ?`,
      [quantityAfter, now, req.user!.id, now, productId]
    )
    
    await erpPool.query<ResultSetHeader>(
      `INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, quantity_before, quantity_after, notes, created_by, created_at)
       VALUES (?, ?, 'adjustment', ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), productId, adjustment, quantityBefore, quantityAfter, notes || null, req.user!.id, now]
    )
    
    const [updated] = await erpPool.query<RowDataPacket[]>(
      `SELECT i.*, p.sku, p.name as product_name
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.product_id = ?`,
      [productId]
    )
    
    res.json({ success: true, data: updated[0] })
  } catch (error) {
    console.error('Adjust inventory error:', error)
    res.status(500).json({ success: false, error: 'Failed to adjust inventory' })
  }
})

router.post('/:productId/count', async (req: AuthRequest, res: Response) => {
  try {
    const { actualCount, notes } = req.body
    const productId = req.params.productId
    
    if (actualCount === undefined || actualCount < 0) {
      return res.status(400).json({ success: false, error: 'Valid actual count is required' })
    }
    
    const [current] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM inventory WHERE product_id = ?',
      [productId]
    )
    
    if (current.length === 0) {
      return res.status(404).json({ success: false, error: 'Inventory record not found' })
    }
    
    const quantityBefore = current[0]!.quantity_on_hand
    const adjustment = actualCount - quantityBefore
    const now = new Date()
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE inventory SET quantity_on_hand = ?, last_count_date = ?, last_count_by = ?, updated_at = ?
       WHERE product_id = ?`,
      [actualCount, now, req.user!.id, now, productId]
    )
    
    await erpPool.query<ResultSetHeader>(
      `INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, quantity_before, quantity_after, notes, created_by, created_at)
       VALUES (?, ?, 'count', ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), productId, adjustment, quantityBefore, actualCount, notes || 'Physical inventory count', req.user!.id, now]
    )
    
    const [updated] = await erpPool.query<RowDataPacket[]>(
      `SELECT i.*, p.sku, p.name as product_name
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.product_id = ?`,
      [productId]
    )
    
    res.json({ success: true, data: updated[0] })
  } catch (error) {
    console.error('Inventory count error:', error)
    res.status(500).json({ success: false, error: 'Failed to update inventory count' })
  }
})

router.get('/:productId/transactions', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50' } = req.query
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum
    
    const [countResult] = await erpPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM inventory_transactions WHERE product_id = ?',
      [req.params.productId]
    )
    const total = countResult[0]?.total ?? 0
    
    const [transactions] = await erpPool.query<RowDataPacket[]>(
      `SELECT t.*, u.first_name, u.last_name
       FROM inventory_transactions t
       JOIN users u ON t.created_by = u.id
       WHERE t.product_id = ?
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.productId, limitNum, offset]
    )
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' })
  }
})

export default router
