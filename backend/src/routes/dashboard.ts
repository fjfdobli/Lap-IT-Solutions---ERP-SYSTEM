import { Router, Response } from 'express'
import { posPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket } from 'mysql2'

const router = Router()

// Safe query helper that returns default value if query fails
async function safeQuery(
  query: string,
  defaultValue: Record<string, unknown>[] = []
): Promise<Record<string, unknown>[]> {
  try {
    const [result] = await posPool.query<RowDataPacket[]>(query)
    return result as Record<string, unknown>[]
  } catch (error: unknown) {
    const mysqlError = error as { code?: string; errno?: number; message?: string }
    console.warn(`Query failed: ${mysqlError.message} | Query: ${query.substring(0, 80)}...`)
    return defaultValue
  }
}

router.use(authenticateToken)

router.get('/stats', async (req: AuthRequest, res: Response) => {
  console.log('Dashboard stats endpoint hit')
  
  try {
    // ===== Master Data Stats =====
    
    // Total Products
    const totalProducts = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refitem',
      [{ count: 0 }]
    )
    
    // Total Suppliers
    const totalSuppliers = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refsupplier',
      [{ count: 0 }]
    )
    
    // Total Customers
    const totalCustomers = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refcustomer',
      [{ count: 0 }]
    )
    
    // Total Categories/Classes
    const totalClasses = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refclass',
      [{ count: 0 }]
    )
    
    // Total Departments
    const totalDepartments = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refdepartment',
      [{ count: 0 }]
    )
    
    // Total Branches
    const totalBranches = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refbranch',
      [{ count: 0 }]
    )
    
    // Total Locations
    const totalLocations = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_reflocation',
      [{ count: 0 }]
    )
    
    // ===== POS Transactions Stats (using correct column names) =====
    
    // Total Sales Transactions (all time) - Using NetSales instead of GrandTotal
    const totalTransactions = await safeQuery(
      'SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total FROM pos_trans_header',
      [{ count: 0, total: 0 }]
    )
    
    // Today's Sales
    const todaySales = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total 
       FROM pos_trans_header 
       WHERE DATE(DateTrans) = CURDATE()`,
      [{ count: 0, total: 0 }]
    )
    
    // This Week's Sales
    const weekSales = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total 
       FROM pos_trans_header 
       WHERE YEARWEEK(DateTrans, 1) = YEARWEEK(CURDATE(), 1)`,
      [{ count: 0, total: 0 }]
    )
    
    // This Month's Sales
    const monthSales = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total 
       FROM pos_trans_header 
       WHERE YEAR(DateTrans) = YEAR(CURDATE()) AND MONTH(DateTrans) = MONTH(CURDATE())`,
      [{ count: 0, total: 0 }]
    )
    
    // Daily Sales Trend (last 30 days) - Using DiscAmount instead of Discount
    const dailySalesTrend = await safeQuery(
      `SELECT 
         DATE(DateTrans) as date,
         COUNT(*) as transactions,
         COALESCE(SUM(NetSales), 0) as total,
         COALESCE(SUM(DiscAmount), 0) as discount
       FROM pos_trans_header 
       WHERE DateTrans >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(DateTrans)
       ORDER BY date ASC`,
      []
    )
    
    // Monthly Sales Trend (last 12 months) - raw data from DB
    const monthlySalesRaw = await safeQuery(
      `SELECT 
         DATE_FORMAT(DateTrans, '%Y-%m') as month,
         DATE_FORMAT(DateTrans, '%b') as monthName,
         COUNT(*) as transactions,
         COALESCE(SUM(NetSales), 0) as total,
         COALESCE(SUM(DiscAmount), 0) as discount
       FROM pos_trans_header 
       WHERE DateTrans >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(DateTrans, '%Y-%m'), DATE_FORMAT(DateTrans, '%b')
       ORDER BY month ASC`,
      []
    )
    
    // Fill in all 12 months with zeros for months without data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlySalesTrend: Array<{ month: string; monthName: string; transactions: number; total: number; discount: number }> = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthName = monthNames[d.getMonth()] as string
      
      const existing = monthlySalesRaw.find((m: Record<string, unknown>) => m.month === monthKey)
      if (existing) {
        monthlySalesTrend.push({
          month: monthKey,
          monthName: monthName,
          transactions: Number(existing.transactions) || 0,
          total: Number(existing.total) || 0,
          discount: Number(existing.discount) || 0,
        })
      } else {
        monthlySalesTrend.push({
          month: monthKey,
          monthName: monthName,
          transactions: 0,
          total: 0,
          discount: 0,
        })
      }
    }
    
    // ===== Receiving Stats (using POstatus instead of IsPost) =====
    
    // Total Receiving Reports
    const totalReceiving = await safeQuery(
      'SELECT COUNT(*) as count, COALESCE(SUM(Amnt_GrandCost), 0) as total FROM mod_rr_1',
      [{ count: 0, total: 0 }]
    )
    
    // This Month's Receiving
    const monthReceiving = await safeQuery(
      `SELECT COUNT(*) as count 
       FROM mod_rr_1 
       WHERE YEAR(RRDate) = YEAR(CURDATE()) AND MONTH(RRDate) = MONTH(CURDATE())`,
      [{ count: 0 }]
    )
    
    // Pending Receiving (POstatus not complete)
    const pendingReceiving = await safeQuery(
      `SELECT COUNT(*) as count FROM mod_rr_1 WHERE POstatus = 'Pending' OR POstatus IS NULL OR POstatus = ''`,
      [{ count: 0 }]
    )
    
    // ===== Transfers Stats =====
    
    // Total Transfer Out
    const totalTransferOut = await safeQuery(
      'SELECT COUNT(*) as count FROM mod_transferout_1',
      [{ count: 0 }]
    )
    
    // Total Transfer In
    const totalTransferIn = await safeQuery(
      'SELECT COUNT(*) as count FROM mod_transferin_1',
      [{ count: 0 }]
    )
    
    // ===== Voids & Returns Stats (using NetSales) =====
    
    // Total Voided Transactions
    const totalVoids = await safeQuery(
      'SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total FROM pos_void_header',
      [{ count: 0, total: 0 }]
    )
    
    // Total Returns
    const totalReturns = await safeQuery(
      'SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total FROM pos_return_header',
      [{ count: 0, total: 0 }]
    )
    
    // This Month's Voids
    const monthVoids = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total 
       FROM pos_void_header 
       WHERE YEAR(DateTrans) = YEAR(CURDATE()) AND MONTH(DateTrans) = MONTH(CURDATE())`,
      [{ count: 0, total: 0 }]
    )
    
    // ===== Purchase Orders Stats (using POStatus) =====
    
    // Total POs with value
    const totalPOs = await safeQuery(
      'SELECT COUNT(*) as count, COALESCE(SUM(Amnt_GrandCost), 0) as total FROM mod_po_1',
      [{ count: 0, total: 0 }]
    )
    
    // Pending POs
    const pendingPOs = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(Amnt_GrandCost), 0) as total FROM mod_po_1 WHERE POStatus = 'Pending' OR POStatus IS NULL OR POStatus = ''`,
      [{ count: 0, total: 0 }]
    )
    
    // This Month POs
    const thisMonthPOs = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(Amnt_GrandCost), 0) as total 
       FROM mod_po_1 
       WHERE YEAR(PoDate) = YEAR(CURDATE()) AND MONTH(PoDate) = MONTH(CURDATE())`,
      [{ count: 0, total: 0 }]
    )
    
    // Recent POs
    const recentPOs = await safeQuery(
      `SELECT id, xCode, PoDate, SupplierName, POStatus, Amnt_GrandCost, Qty_Total
       FROM mod_po_1
       ORDER BY PoDate DESC, id DESC
       LIMIT 5`,
      []
    )
    
    // ===== Physical Count Stats =====
    
    // Total Physical Counts
    const totalPhyCounts = await safeQuery(
      'SELECT COUNT(*) as count FROM mod_phy_1',
      [{ count: 0 }]
    )
    
    // ===== Item Movement Stats =====
    
    // Total Item Movements
    const totalMovements = await safeQuery(
      'SELECT COUNT(*) as count FROM pro_itemmovement',
      [{ count: 0 }]
    )
    
    // Recent Movements (today)
    const recentMovements = await safeQuery(
      `SELECT COUNT(*) as count FROM pro_itemmovement 
       WHERE DATE(SysDateT) = CURDATE()`,
      [{ count: 0 }]
    )
    
    // ===== Top Selling Products (using Total instead of Amount) =====
    // Get top products from last 12 months instead of just current year
    const topProducts = await safeQuery(
      `SELECT 
         d.ItemCode,
         d.ItemName as productName,
         SUM(d.Qty) as totalQty,
         SUM(d.Total) as totalAmount,
         COUNT(*) as transactionCount
       FROM pos_trans_details d
       WHERE d.DateTrans >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY d.ItemCode, d.ItemName
       ORDER BY totalAmount DESC
       LIMIT 10`,
      []
    )
    
    // ===== Recent Transactions (using correct column names) =====
    const recentTransactions = await safeQuery(
      `SELECT 
         h.ID,
         h.TRNo_H as TransNo,
         h.DateTrans,
         h.NetSales as GrandTotal,
         h.DiscAmount as Discount,
         h.xUser as CashierName,
         h.MachineNo as TerminalNo
       FROM pos_trans_header h
       ORDER BY h.DateTrans DESC, h.ID DESC
       LIMIT 10`,
      []
    )
    
    // ===== Recent Receiving (using xCode as RRNo, SupplierName) =====
    const recentReceivingList = await safeQuery(
      `SELECT 
         r.id,
         r.xCode as RRNo,
         r.RRDate,
         r.SupplierCode,
         r.SupplierName as supplierName,
         r.POstatus as IsPost,
         r.Amnt_GrandCost as totalCost
       FROM mod_rr_1 r
       ORDER BY r.RRDate DESC, r.id DESC
       LIMIT 10`,
      []
    )
    
    // ===== Sales by Payment Type =====
    const salesByPayment = await safeQuery(
      `SELECT 
         p.PaymentType,
         COUNT(*) as count,
         COALESCE(SUM(p.Amount), 0) as total
       FROM pos_trans_payment p
       GROUP BY p.PaymentType
       ORDER BY total DESC`,
      []
    )
    
    // ===== Shifts/Cashier Stats =====
    const shiftStats = await safeQuery(
      `SELECT COUNT(*) as count FROM pos_close_shift`,
      [{ count: 0 }]
    )
    
    // ===== Inventory Distribution by Class (using Class instead of ClassCode) =====
    const inventoryByClass = await safeQuery(
      `SELECT 
         c.Xname as className,
         COUNT(i.xCode) as productCount
       FROM inv_refclass c
       LEFT JOIN inv_refitem i ON c.xCode = i.Class
       GROUP BY c.xCode, c.Xname
       ORDER BY productCount DESC
       LIMIT 8`,
      []
    )

    console.log('Dashboard stats fetched successfully')

    res.json({
      success: true,
      data: {
        // Master Data Counts
        masterData: {
          products: totalProducts[0]?.count ?? 0,
          suppliers: totalSuppliers[0]?.count ?? 0,
          customers: totalCustomers[0]?.count ?? 0,
          classes: totalClasses[0]?.count ?? 0,
          departments: totalDepartments[0]?.count ?? 0,
          branches: totalBranches[0]?.count ?? 0,
          locations: totalLocations[0]?.count ?? 0,
        },
        
        // Sales Summary
        sales: {
          total: {
            count: totalTransactions[0]?.count ?? 0,
            amount: totalTransactions[0]?.total ?? 0,
          },
          today: {
            count: todaySales[0]?.count ?? 0,
            amount: todaySales[0]?.total ?? 0,
          },
          thisWeek: {
            count: weekSales[0]?.count ?? 0,
            amount: weekSales[0]?.total ?? 0,
          },
          thisMonth: {
            count: monthSales[0]?.count ?? 0,
            amount: monthSales[0]?.total ?? 0,
          },
        },
        
        // Trends
        trends: {
          daily: dailySalesTrend,
          monthly: monthlySalesTrend,
        },
        
        // Operations
        operations: {
          receiving: {
            total: totalReceiving[0]?.count ?? 0,
            totalValue: totalReceiving[0]?.total ?? 0,
            thisMonth: monthReceiving[0]?.count ?? 0,
            pending: pendingReceiving[0]?.count ?? 0,
          },
          transfers: {
            out: totalTransferOut[0]?.count ?? 0,
            in: totalTransferIn[0]?.count ?? 0,
          },
          purchaseOrders: {
            total: totalPOs[0]?.count ?? 0,
            totalValue: totalPOs[0]?.total ?? 0,
            pending: pendingPOs[0]?.count ?? 0,
            pendingValue: pendingPOs[0]?.total ?? 0,
            thisMonth: thisMonthPOs[0]?.count ?? 0,
            thisMonthValue: thisMonthPOs[0]?.total ?? 0,
          },
          physicalCount: totalPhyCounts[0]?.count ?? 0,
          itemMovements: {
            total: totalMovements[0]?.count ?? 0,
            today: recentMovements[0]?.count ?? 0,
          },
          shifts: shiftStats[0]?.count ?? 0,
        },
        
        // Adjustments
        adjustments: {
          voids: {
            count: totalVoids[0]?.count ?? 0,
            amount: totalVoids[0]?.total ?? 0,
          },
          returns: {
            count: totalReturns[0]?.count ?? 0,
            amount: totalReturns[0]?.total ?? 0,
          },
          monthVoids: {
            count: monthVoids[0]?.count ?? 0,
            amount: monthVoids[0]?.total ?? 0,
          },
        },
        
        // Lists
        topProducts,
        recentTransactions,
        recentReceiving: recentReceivingList,
        recentPurchaseOrders: recentPOs,
        salesByPayment,
        inventoryByClass,
      }
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard stats', 
      details: error instanceof Error ? error.message : String(error) 
    })
  }
})

export default router
