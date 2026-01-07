import { Router, Response } from 'express'
import { erpPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket } from 'mysql2'

const router = Router()

router.use(authenticateToken)

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const [pendingPOs] = await erpPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE status IN ('pending_approval', 'approved', 'sent')`
    )
    
    const [todayPOs] = await erpPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total 
       FROM purchase_orders 
       WHERE created_at >= ? AND created_at < ?`,
      [startOfDay, endOfDay]
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
    
    const [totalProducts] = await erpPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM products WHERE is_active = TRUE'
    )
    
    const [inventoryValue] = await erpPool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(i.quantity_on_hand * p.cost_price), 0) as value
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE p.is_active = TRUE`
    )
    
    const [recentTransactions] = await erpPool.query<RowDataPacket[]>(
      `SELECT t.*, p.name as product_name, p.sku, u.first_name, u.last_name
       FROM inventory_transactions t
       JOIN products p ON t.product_id = p.id
       JOIN users u ON t.created_by = u.id
       WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY t.created_at DESC
       LIMIT 10`
    )
    
    const [recentPOs] = await erpPool.query<RowDataPacket[]>(
      `SELECT po.id, po.po_number, po.status, po.total_amount, po.created_at,
              s.name as supplier_name
       FROM purchase_orders po
       JOIN suppliers s ON po.supplier_id = s.id
       ORDER BY po.created_at DESC
       LIMIT 5`
    )
    
    const [lowStockProducts] = await erpPool.query<RowDataPacket[]>(
      `SELECT p.id, p.sku, p.name, p.reorder_level, i.quantity_on_hand
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE p.is_active = TRUE AND i.quantity_on_hand <= p.reorder_level
       ORDER BY i.quantity_on_hand ASC
       LIMIT 10`
    )
    
    res.json({
      success: true,
      data: {
        purchaseOrders: {
          pending: pendingPOs[0]?.count ?? 0,
          todayCount: todayPOs[0]?.count ?? 0,
          todayTotal: todayPOs[0]?.total ?? 0
        },
        inventory: {
          totalProducts: totalProducts[0]?.count ?? 0,
          lowStockCount: lowStockItems[0]?.count ?? 0,
          outOfStockCount: outOfStock[0]?.count ?? 0,
          totalValue: inventoryValue[0]?.value ?? 0
        },
        recentActivity: recentTransactions.map((t: any) => ({
          id: t.id,
          type: t.transaction_type,
          message: `${t.first_name} ${t.last_name} - ${t.transaction_type.replace('_', ' ')} ${t.quantity > 0 ? '+' : ''}${t.quantity} ${t.product_name} (${t.sku})`,
          timestamp: t.created_at
        })),
        recentPurchaseOrders: recentPOs,
        lowStockProducts
      }
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' })
  }
})

export default router
