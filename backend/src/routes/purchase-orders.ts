import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { erpPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

const router = Router()

router.use(authenticateToken)

async function generatePONumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `PO-${year}-`
  
  const [result] = await erpPool.query<RowDataPacket[]>(
    `SELECT po_number FROM purchase_orders 
     WHERE po_number LIKE ?
     ORDER BY created_at DESC LIMIT 1`,
    [`${prefix}%`]
  )
  
  let nextNumber = 1
  if (result.length > 0 && result[0]) {
    const lastNumber = parseInt(result[0].po_number.split('-').pop() || '0', 10)
    nextNumber = lastNumber + 1
  }
  
  return `${prefix}${nextNumber.toString().padStart(5, '0')}`
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, supplierId, search, startDate, endDate, page = '1', limit = '50' } = req.query
    
    let query = `
      SELECT po.*, 
             s.name as supplier_name, s.email as supplier_email, s.phone as supplier_phone,
             creator.first_name as creator_first_name, creator.last_name as creator_last_name,
             approver.first_name as approver_first_name, approver.last_name as approver_last_name,
             (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = po.id) as item_count
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      JOIN users creator ON po.created_by = creator.id
      LEFT JOIN users approver ON po.approved_by = approver.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (status) {
      query += ' AND po.status = ?'
      params.push(status)
    }
    
    if (supplierId) {
      query += ' AND po.supplier_id = ?'
      params.push(supplierId)
    }
    
    if (search) {
      query += ' AND (po.po_number LIKE ? OR s.name LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern)
    }
    
    if (startDate) {
      query += ' AND po.order_date >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      query += ' AND po.order_date <= ?'
      params.push(endDate)
    }
    
    // Build count query separately to avoid regex issues with JOINs
    let countQuery = `
      SELECT COUNT(*) as total
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      JOIN users creator ON po.created_by = creator.id
      LEFT JOIN users approver ON po.approved_by = approver.id
      WHERE 1=1
    `
    if (status) {
      countQuery += ' AND po.status = ?'
    }
    if (supplierId) {
      countQuery += ' AND po.supplier_id = ?'
    }
    if (search) {
      countQuery += ' AND (po.po_number LIKE ? OR s.name LIKE ?)'
    }
    if (startDate) {
      countQuery += ' AND po.order_date >= ?'
    }
    if (endDate) {
      countQuery += ' AND po.order_date <= ?'
    }
    const [countResult] = await erpPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]!.total
    
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum
    
    query += ' ORDER BY po.created_at DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)
    
    const [purchaseOrders] = await erpPool.query<RowDataPacket[]>(query, params)
    
    res.json({
      success: true,
      data: {
        purchaseOrders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error: any) {
    console.error('Get purchase orders error:', error?.message || error)
    console.error('Error stack:', error?.stack)
    res.status(500).json({ success: false, error: 'Failed to fetch purchase orders', details: error?.message })
  }
})

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [pending] = await erpPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'pending_approval'`
    )
    
    const [approved] = await erpPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'approved'`
    )
    
    const [sent] = await erpPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'sent'`
    )
    
    const [partial] = await erpPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'partial'`
    )
    
    const [onHold] = await erpPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'on_hold'`
    )
    
    const [thisMonth] = await erpPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM purchase_orders 
       WHERE MONTH(order_date) = MONTH(CURRENT_DATE()) 
       AND YEAR(order_date) = YEAR(CURRENT_DATE())`
    )
    
    res.json({
      success: true,
      data: {
        pendingApproval: pending[0]?.count ?? 0,
        approved: approved[0]?.count ?? 0,
        sent: sent[0]?.count ?? 0,
        partial: partial[0]?.count ?? 0,
        onHold: onHold[0]?.count ?? 0,
        thisMonth: {
          count: thisMonth[0]?.count ?? 0,
          total: thisMonth[0]?.total ?? 0
        }
      }
    })
  } catch (error) {
    console.error('Get PO stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch PO stats' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const [purchaseOrders] = await erpPool.query<RowDataPacket[]>(
      `SELECT po.*, 
              s.name as supplier_name, s.email as supplier_email, s.phone as supplier_phone, s.viber as supplier_viber, s.address as supplier_address,
              creator.first_name as creator_first_name, creator.last_name as creator_last_name,
              approver.first_name as approver_first_name, approver.last_name as approver_last_name
       FROM purchase_orders po
       JOIN suppliers s ON po.supplier_id = s.id
       JOIN users creator ON po.created_by = creator.id
       LEFT JOIN users approver ON po.approved_by = approver.id
       WHERE po.id = ?`,
      [req.params.id]
    )
    
    if (purchaseOrders.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' })
    }
    
    const [items] = await erpPool.query<RowDataPacket[]>(
      `SELECT poi.*, p.sku, p.name as product_name, p.unit
       FROM purchase_order_items poi
       JOIN products p ON poi.product_id = p.id
       WHERE poi.purchase_order_id = ?`,
      [req.params.id]
    )
    
    res.json({ 
      success: true, 
      data: { 
        ...purchaseOrders[0], 
        items 
      } 
    })
  } catch (error) {
    console.error('Get purchase order error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch purchase order' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, orderDate, expectedDate, notes, deliveryMethod, items } = req.body
    
    if (!supplierId || !orderDate || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Supplier, order date, and items are required' })
    }
    
    const poId = uuidv4()
    const poNumber = await generatePONumber()
    const now = new Date()
    
    let subtotal = 0
    for (const item of items) {
      subtotal += item.quantity * item.unitCost
    }
    const taxAmount = 0 
    const totalAmount = subtotal + taxAmount
    
    await erpPool.query<ResultSetHeader>(
      `INSERT INTO purchase_orders (id, po_number, supplier_id, status, order_date, expected_date, subtotal, tax_amount, total_amount, notes, delivery_method, created_by, created_at, updated_at)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [poId, poNumber, supplierId, orderDate, expectedDate || null, subtotal, taxAmount, totalAmount, notes || null, deliveryMethod || 'delivery', req.user!.id, now, now]
    )
    
    for (const item of items) {
      await erpPool.query<ResultSetHeader>(
        `INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity_ordered, unit_cost, total_cost, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), poId, item.productId, item.quantity, item.unitCost, item.quantity * item.unitCost, item.notes || null, now, now]
      )
      
      await erpPool.query<ResultSetHeader>(
        `UPDATE inventory SET quantity_on_order = quantity_on_order + ?, updated_at = ?
         WHERE product_id = ?`,
        [item.quantity, now, item.productId]
      )
    }
    
    const [newPO] = await erpPool.query<RowDataPacket[]>(
      `SELECT po.*, s.name as supplier_name
       FROM purchase_orders po
       JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = ?`,
      [poId]
    )
    
    res.status(201).json({ success: true, data: newPO[0] })
  } catch (error) {
    console.error('Create purchase order error:', error)
    res.status(500).json({ success: false, error: 'Failed to create purchase order' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, orderDate, expectedDate, notes, deliveryMethod, items } = req.body
    
    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM purchase_orders WHERE id = ?',
      [req.params.id]
    )
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' })
    }
    
    const po = existing[0]!
    
    if (!['draft', 'pending_approval'].includes(po.status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Can only edit purchase orders in draft or pending approval status' 
      })
    }
    
    const now = new Date()
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE purchase_orders SET 
        supplier_id = COALESCE(?, supplier_id),
        order_date = COALESCE(?, order_date),
        expected_date = ?,
        notes = ?,
        delivery_method = COALESCE(?, delivery_method),
        updated_at = ?
       WHERE id = ?`,
      [supplierId, orderDate, expectedDate, notes, deliveryMethod, now, req.params.id]
    )
    
    if (items && items.length > 0) {
      const [existingItems] = await erpPool.query<RowDataPacket[]>(
        'SELECT product_id, quantity_ordered FROM purchase_order_items WHERE purchase_order_id = ?',
        [req.params.id]
      )
      
      for (const item of existingItems) {
        await erpPool.query<ResultSetHeader>(
          `UPDATE inventory SET quantity_on_order = quantity_on_order - ?, updated_at = ?
           WHERE product_id = ?`,
          [item.quantity_ordered, now, item.product_id]
        )
      }
      
      await erpPool.query<ResultSetHeader>(
        'DELETE FROM purchase_order_items WHERE purchase_order_id = ?',
        [req.params.id]
      )
      
      let subtotal = 0
      for (const item of items) {
        subtotal += item.quantity * item.unitCost
        
        await erpPool.query<ResultSetHeader>(
          `INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity_ordered, unit_cost, total_cost, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), req.params.id, item.productId, item.quantity, item.unitCost, item.quantity * item.unitCost, item.notes || null, now, now]
        )
        
        await erpPool.query<ResultSetHeader>(
          `UPDATE inventory SET quantity_on_order = quantity_on_order + ?, updated_at = ?
           WHERE product_id = ?`,
          [item.quantity, now, item.productId]
        )
      }
      
      await erpPool.query<ResultSetHeader>(
        `UPDATE purchase_orders SET subtotal = ?, total_amount = ?, updated_at = ?
         WHERE id = ?`,
        [subtotal, subtotal, now, req.params.id]
      )
    }
    
    const [updated] = await erpPool.query<RowDataPacket[]>(
      `SELECT po.*, s.name as supplier_name
       FROM purchase_orders po
       JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = ?`,
      [req.params.id]
    )
    
    res.json({ success: true, data: updated[0] })
  } catch (error) {
    console.error('Update purchase order error:', error)
    res.status(500).json({ success: false, error: 'Failed to update purchase order' })
  }
})

router.post('/:id/submit', async (req: AuthRequest, res: Response) => {
  try {
    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM purchase_orders WHERE id = ?',
      [req.params.id]
    )
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' })
    }
    
    if (existing[0]!.status !== 'draft') {
      return res.status(400).json({ success: false, error: 'Only draft POs can be submitted for approval' })
    }
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE purchase_orders SET status = 'pending_approval', updated_at = ?
       WHERE id = ?`,
      [new Date(), req.params.id]
    )
    
    res.json({ success: true, message: 'Purchase order submitted for approval' })
  } catch (error) {
    console.error('Submit PO error:', error)
    res.status(500).json({ success: false, error: 'Failed to submit purchase order' })
  }
})

router.post('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const { approvalNotes } = req.body
    
    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM purchase_orders WHERE id = ?',
      [req.params.id]
    )
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' })
    }
    
    if (existing[0]!.status !== 'pending_approval') {
      return res.status(400).json({ success: false, error: 'Only pending POs can be approved' })
    }
    
    const now = new Date()
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE purchase_orders SET 
        status = 'approved', 
        approved_by = ?, 
        approved_at = ?,
        approval_notes = ?,
        updated_at = ?
       WHERE id = ?`,
      [req.user!.id, now, approvalNotes || null, now, req.params.id]
    )
    
    res.json({ success: true, message: 'Purchase order approved' })
  } catch (error) {
    console.error('Approve PO error:', error)
    res.status(500).json({ success: false, error: 'Failed to approve purchase order' })
  }
})

router.post('/:id/send', async (req: AuthRequest, res: Response) => {
  try {
    const { sentVia } = req.body
    
    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM purchase_orders WHERE id = ?',
      [req.params.id]
    )
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' })
    }
    
    if (existing[0]!.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Only approved POs can be sent' })
    }
    
    const now = new Date()
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE purchase_orders SET 
        status = 'sent', 
        sent_via = ?,
        sent_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [sentVia || 'email', now, now, req.params.id]
    )
    
    res.json({ success: true, message: 'Purchase order marked as sent' })
  } catch (error) {
    console.error('Send PO error:', error)
    res.status(500).json({ success: false, error: 'Failed to update purchase order' })
  }
})

router.post('/:id/receive', async (req: AuthRequest, res: Response) => {
  try {
    const { items, receiptNumber, discrepancyNotes } = req.body
    
    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM purchase_orders WHERE id = ?',
      [req.params.id]
    )
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' })
    }
    
    if (!['sent', 'partial'].includes(existing[0]!.status)) {
      return res.status(400).json({ success: false, error: 'Can only receive items for sent or partial POs' })
    }
    
    const now = new Date()
    let allReceived = true
    
    for (const item of items) {
      const [currentItem] = await erpPool.query<RowDataPacket[]>(
        'SELECT * FROM purchase_order_items WHERE id = ?',
        [item.itemId]
      )
      
      if (currentItem.length === 0) continue
      
      const currentItemData = currentItem[0]!
      const newReceived = currentItemData.quantity_received + item.quantityReceived
      
      await erpPool.query<ResultSetHeader>(
        `UPDATE purchase_order_items SET quantity_received = ?, updated_at = ?
         WHERE id = ?`,
        [newReceived, now, item.itemId]
      )
      
      await erpPool.query<ResultSetHeader>(
        `UPDATE inventory SET 
          quantity_on_hand = quantity_on_hand + ?, 
          quantity_on_order = GREATEST(0, quantity_on_order - ?),
          updated_at = ?
         WHERE product_id = ?`,
        [item.quantityReceived, item.quantityReceived, now, currentItemData.product_id]
      )
      
      const [currentInv] = await erpPool.query<RowDataPacket[]>(
        'SELECT quantity_on_hand FROM inventory WHERE product_id = ?',
        [currentItemData.product_id]
      )
      
      if (currentInv.length > 0) {
        const currentInvData = currentInv[0]!
        await erpPool.query<ResultSetHeader>(
          `INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, quantity_before, quantity_after, reference_type, reference_id, notes, created_by, created_at)
           VALUES (?, ?, 'purchase_receive', ?, ?, ?, 'purchase_order', ?, ?, ?, ?)`,
          [
            uuidv4(), 
            currentItemData.product_id, 
            item.quantityReceived, 
            currentInvData.quantity_on_hand - item.quantityReceived,
            currentInvData.quantity_on_hand,
            req.params.id,
            `Received from PO: ${existing[0]!.po_number}`,
            req.user!.id, 
            now
          ]
        )
      }
      
      if (newReceived < currentItemData.quantity_ordered) {
        allReceived = false
      }
    }
    
    const [allItems] = await erpPool.query<RowDataPacket[]>(
      `SELECT SUM(quantity_ordered) as total_ordered, SUM(quantity_received) as total_received
       FROM purchase_order_items WHERE purchase_order_id = ?`,
      [req.params.id]
    )
    
    const newStatus = (allItems[0]?.total_received ?? 0) >= (allItems[0]?.total_ordered ?? 0) ? 'received' : 'partial'
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE purchase_orders SET 
        status = ?,
        received_date = ?,
        updated_at = ?
       WHERE id = ?`,
      [newStatus, now, now, req.params.id]
    )
    
    await erpPool.query<ResultSetHeader>(
      `INSERT INTO delivery_receipts (id, purchase_order_id, receipt_number, received_date, received_by, items_verified, discrepancy_notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, FALSE, ?, 'pending', ?, ?)`,
      [uuidv4(), req.params.id, receiptNumber || null, now, req.user!.id, discrepancyNotes || null, now, now]
    )
    
    res.json({ success: true, message: `Items received. Status: ${newStatus}` })
  } catch (error) {
    console.error('Receive items error:', error)
    res.status(500).json({ success: false, error: 'Failed to receive items' })
  }
})

router.post('/:id/hold', async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE purchase_orders SET status = 'on_hold', notes = CONCAT(COALESCE(notes, ''), '\n[ON HOLD] ', ?), updated_at = ?
       WHERE id = ?`,
      [notes || '', new Date(), req.params.id]
    )
    
    res.json({ success: true, message: 'Purchase order put on hold' })
  } catch (error) {
    console.error('Hold PO error:', error)
    res.status(500).json({ success: false, error: 'Failed to put PO on hold' })
  }
})

router.post('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body
    
    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT * FROM purchase_orders WHERE id = ?',
      [req.params.id]
    )
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' })
    }
    
    if (['received', 'cancelled'].includes(existing[0]!.status)) {
      return res.status(400).json({ success: false, error: 'Cannot cancel received or already cancelled POs' })
    }
    
    const now = new Date()
    
    const [items] = await erpPool.query<RowDataPacket[]>(
      'SELECT product_id, quantity_ordered, quantity_received FROM purchase_order_items WHERE purchase_order_id = ?',
      [req.params.id]
    )
    
    for (const item of items) {
      const remaining = item.quantity_ordered - item.quantity_received
      if (remaining > 0) {
        await erpPool.query<ResultSetHeader>(
          `UPDATE inventory SET quantity_on_order = GREATEST(0, quantity_on_order - ?), updated_at = ?
           WHERE product_id = ?`,
          [remaining, now, item.product_id]
        )
      }
    }
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE purchase_orders SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), '\n[CANCELLED] ', ?), updated_at = ?
       WHERE id = ?`,
      [notes || '', now, req.params.id]
    )
    
    res.json({ success: true, message: 'Purchase order cancelled' })
  } catch (error) {
    console.error('Cancel PO error:', error)
    res.status(500).json({ success: false, error: 'Failed to cancel purchase order' })
  }
})

router.post('/:id/file', async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date()
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE purchase_orders SET 
        delivery_receipt_filed = TRUE,
        filed_by = ?,
        filed_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [req.user!.id, now, now, req.params.id]
    )
    
    await erpPool.query<ResultSetHeader>(
      `UPDATE delivery_receipts SET 
        status = 'filed',
        filed_by = ?,
        filed_at = ?,
        updated_at = ?
       WHERE purchase_order_id = ?`,
      [req.user!.id, now, now, req.params.id]
    )
    
    res.json({ success: true, message: 'Delivery receipt filed' })
  } catch (error) {
    console.error('File receipt error:', error)
    res.status(500).json({ success: false, error: 'Failed to file delivery receipt' })
  }
})

export default router
