import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { erpPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

const router = Router()
router.use(authenticateToken)

router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const [categories] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY name'
    )
    res.json({ success: true, data: categories })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch categories' })
  }
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, categoryId, isActive, page = '1', limit = '50' } = req.query
    
    let query = `
      SELECT p.*, c.name as category_name, 
             i.quantity_on_hand, i.quantity_reserved, i.quantity_on_order,
             u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (search) {
      query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }
    
    if (categoryId) {
      query += ' AND p.category_id = ?'
      params.push(categoryId)
    }
    
    if (isActive !== undefined) {
      query += ' AND p.is_active = ?'
      params.push(isActive === 'true')
    }
    
    // Build count query separately to avoid regex issues with JOINs
    let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `
    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)'
    }
    if (categoryId) {
      countQuery += ' AND p.category_id = ?'
    }
    if (isActive !== undefined) {
      countQuery += ' AND p.is_active = ?'
    }
    const [countResult] = await erpPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]!.total
    
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum
    
    query += ' ORDER BY p.name ASC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)
    
    const [products] = await erpPool.query<RowDataPacket[]>(query, params)
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error: any) {
    console.error('Get products error:', error?.message || error)
    console.error('Error stack:', error?.stack)
    res.status(500).json({ success: false, error: 'Failed to fetch products', details: error?.message })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const [products] = await erpPool.query<RowDataPacket[]>(
      `SELECT p.*, c.name as category_name,
              i.quantity_on_hand, i.quantity_reserved, i.quantity_on_order
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.id = ?`,
      [req.params.id]
    )
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }
    
    res.json({ success: true, data: products[0] })
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch product' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { sku, name, description, categoryId, unit, costPrice, sellingPrice, reorderLevel, initialQuantity } = req.body
    
    if (!sku || !name) {
      return res.status(400).json({ success: false, error: 'SKU and name are required' })
    }
    
    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT id FROM products WHERE sku = ?',
      [sku]
    )
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'SKU already exists' })
    }
    
    const productId = uuidv4()
    const inventoryId = uuidv4()
    const now = new Date()
    
    await erpPool.query<ResultSetHeader>(
      `INSERT INTO products (id, sku, name, description, category_id, unit, cost_price, selling_price, reorder_level, is_active, created_at, updated_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?)`,
      [productId, sku, name, description || null, categoryId || null, unit || 'pcs', costPrice || 0, sellingPrice || 0, reorderLevel || 10, now, now, req.user!.id]
    )
    
    await erpPool.query<ResultSetHeader>(
      `INSERT INTO inventory (id, product_id, quantity_on_hand, quantity_reserved, quantity_on_order, updated_at)
       VALUES (?, ?, ?, 0, 0, ?)`,
      [inventoryId, productId, initialQuantity || 0, now]
    )
    
    if (initialQuantity && initialQuantity > 0) {
      await erpPool.query<ResultSetHeader>(
        `INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, quantity_before, quantity_after, notes, created_by, created_at)
         VALUES (?, ?, 'adjustment', ?, 0, ?, 'Initial inventory setup', ?, ?)`,
        [uuidv4(), productId, initialQuantity, initialQuantity, req.user!.id, now]
      )
    }
    
    const [newProduct] = await erpPool.query<RowDataPacket[]>(
      `SELECT p.*, c.name as category_name, i.quantity_on_hand
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.id = ?`,
      [productId]
    )
    
    res.status(201).json({ success: true, data: newProduct[0] })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ success: false, error: 'Failed to create product' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { sku, name, description, categoryId, unit, costPrice, sellingPrice, reorderLevel, isActive } = req.body
    
    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT id FROM products WHERE id = ?',
      [req.params.id]
    )
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }
    
    if (sku) {
      const [duplicateSku] = await erpPool.query<RowDataPacket[]>(
        'SELECT id FROM products WHERE sku = ? AND id != ?',
        [sku, req.params.id]
      )
      
      if (duplicateSku.length > 0) {
        return res.status(400).json({ success: false, error: 'SKU already exists' })
      }
    }
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE products SET 
        sku = COALESCE(?, sku),
        name = COALESCE(?, name),
        description = ?,
        category_id = ?,
        unit = COALESCE(?, unit),
        cost_price = COALESCE(?, cost_price),
        selling_price = COALESCE(?, selling_price),
        reorder_level = COALESCE(?, reorder_level),
        is_active = COALESCE(?, is_active),
        updated_at = ?
       WHERE id = ?`,
      [sku, name, description, categoryId, unit, costPrice, sellingPrice, reorderLevel, isActive, new Date(), req.params.id]
    )
    
    const [updated] = await erpPool.query<RowDataPacket[]>(
      `SELECT p.*, c.name as category_name, i.quantity_on_hand
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.id = ?`,
      [req.params.id]
    )
    
    res.json({ success: true, data: updated[0] })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ success: false, error: 'Failed to update product' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const [items] = await erpPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM purchase_order_items WHERE product_id = ?',
      [req.params.id]
    )
    
    if ((items[0]?.count ?? 0) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete product with existing purchase order items. Deactivate instead.' 
      })
    }
    
    await erpPool.query<ResultSetHeader>(
      'DELETE FROM inventory WHERE product_id = ?',
      [req.params.id]
    )
    
    await erpPool.query<ResultSetHeader>(
      'DELETE FROM products WHERE id = ?',
      [req.params.id]
    )
    
    res.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete product' })
  }
})

export default router
