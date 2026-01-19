import { Router, Response, Request } from 'express'
import { myDineInPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'

const router = Router()

async function safeQuery(query: string, params: any[] = [], fallback: any = []) {
  try {
    const [rows] = await myDineInPool.query(query, params)
    return rows || fallback
  } catch (error) {
    console.error(`Query error: ${error}`)
    return fallback
  }
}

router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  console.log('[MyDiner Reports] Fetching report data...')
  
  try {
    console.log('[MyDiner] Fetching sales data...')
    
    const totalSales = await safeQuery(
      'SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total FROM pos_trans_header',
      [],
      [{ count: 0, total: 0 }]
    )
    
    const todaySales = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total 
       FROM pos_trans_header 
       WHERE DATE(DateTrans) = CURDATE()`,
      [],
      [{ count: 0, total: 0 }]
    )
    
    const weekSales = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total 
       FROM pos_trans_header 
       WHERE YEARWEEK(DateTrans, 1) = YEARWEEK(CURDATE(), 1)`,
      [],
      [{ count: 0, total: 0 }]
    )
    
    const monthSales = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total 
       FROM pos_trans_header 
       WHERE YEAR(DateTrans) = YEAR(CURDATE()) AND MONTH(DateTrans) = MONTH(CURDATE())`,
      [],
      [{ count: 0, total: 0 }]
    )
    
    const salesByServer = await safeQuery(
      `SELECT 
        h.xUser as server,
        COUNT(*) as orderCount,
        COALESCE(SUM(h.NetSales), 0) as totalSales,
        COALESCE(AVG(h.NetSales), 0) as avgOrderValue
       FROM pos_trans_header h
       GROUP BY h.xUser
       ORDER BY totalSales DESC
       LIMIT 20`,
      [],
      []
    )
    
    const salesByPayment = await safeQuery(
      `SELECT 
        p.PaymentType,
        COUNT(DISTINCT p.TRNo_H) as count,
        COALESCE(SUM(p.Amount), 0) as total
       FROM pos_trans_payment p
       GROUP BY p.PaymentType
       ORDER BY total DESC`,
      [],
      []
    )
    
    const hourlySales = await safeQuery(
      `SELECT 
        HOUR(DateTrans) as hour,
        COUNT(*) as orderCount,
        COALESCE(SUM(NetSales), 0) as total
       FROM pos_trans_header
       WHERE DateTrans >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY HOUR(DateTrans)
       ORDER BY hour`,
      [],
      []
    )
    
    console.log('[MyDiner] Fetching menu item performance...')
    
    const topMenuItems = await safeQuery(
      `SELECT 
        d.ItemCode,
        i.ItemName as dishName,
        COALESCE(i.Class, 'Uncategorized') as category,
        SUM(d.Qty) as totalQty,
        COALESCE(SUM(d.Total), 0) as totalSales,
        COUNT(DISTINCT d.TRNo_H) as orderCount,
        COALESCE(AVG(d.Price), 0) as avgPrice
       FROM pos_trans_details d
       LEFT JOIN inv_refitem i ON d.ItemCode = i.ItemCode
       GROUP BY d.ItemCode, i.ItemName, i.Class
       ORDER BY totalSales DESC
       LIMIT 20`,
      [],
      []
    )
    
    const slowMovingItems = await safeQuery(
      `SELECT 
        i.ItemCode,
        i.ItemName as dishName,
        COALESCE(i.Class, 'Uncategorized') as category,
        i.QtyOnHand as stockQty,
        COALESCE(SUM(d.Qty), 0) as soldQty,
        COALESCE(i.Cost, 0) as cost
       FROM inv_refitem i
       LEFT JOIN pos_trans_details d ON i.ItemCode = d.ItemCode
       WHERE i.active = 'True'
       GROUP BY i.ItemCode, i.ItemName, i.Class, i.QtyOnHand, i.Cost
       HAVING soldQty < 5
       ORDER BY soldQty ASC
       LIMIT 20`,
      [],
      []
    )
    
    const menuByCategory = await safeQuery(
      `SELECT 
        COALESCE(i.Class, 'Uncategorized') as category,
        COUNT(DISTINCT d.ItemCode) as itemCount,
        COALESCE(SUM(d.Qty), 0) as totalQtySold,
        COALESCE(SUM(d.Total), 0) as totalSales
       FROM pos_trans_details d
       LEFT JOIN inv_refitem i ON d.ItemCode = i.ItemCode
       GROUP BY i.Class
       ORDER BY totalSales DESC`,
      [],
      []
    )
    
    console.log('[MyDiner] Fetching order analysis data...')

    const avgOrderValue = await safeQuery(
      'SELECT COALESCE(AVG(NetSales), 0) as avg FROM pos_trans_header WHERE NetSales > 0',
      [],
      [{ avg: 0 }]
    )
    
    const dailyOrderTrend = await safeQuery(
      `SELECT 
        DATE(DateTrans) as date,
        COUNT(*) as orderCount,
        COALESCE(SUM(NetSales), 0) as total,
        COALESCE(AVG(NetSales), 0) as avgOrderValue
       FROM pos_trans_header
       WHERE DateTrans >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(DateTrans)
       ORDER BY date`,
      [],
      []
    )
    
    console.log('[MyDiner] Fetching expense data...')
    
    const totalExpenses = await safeQuery(
      'SELECT COUNT(*) as count, COALESCE(SUM(Total), 0) as total FROM pos_expense_header',
      [],
      [{ count: 0, total: 0 }]
    )
    
    const todayExpenses = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(Total), 0) as total 
       FROM pos_expense_header 
       WHERE DATE(xDate) = CURDATE()`,
      [],
      [{ count: 0, total: 0 }]
    )
    
    const monthExpenses = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(Total), 0) as total 
       FROM pos_expense_header 
       WHERE YEAR(xDate) = YEAR(CURDATE()) AND MONTH(xDate) = MONTH(CURDATE())`,
      [],
      [{ count: 0, total: 0 }]
    )
    
    const expensesByCategory = await safeQuery(
      `SELECT 
        d.xName as category,
        COUNT(*) as count,
        COALESCE(SUM(d.Amount), 0) as total
       FROM pos_expense_details d
       GROUP BY d.xName
       ORDER BY total DESC
       LIMIT 20`,
      [],
      []
    )
    
    const recentExpenses = await safeQuery(
      `SELECT 
        h.TranNo,
        h.xDate,
        h.Total,
        h.Remarks
       FROM pos_expense_header h
       ORDER BY h.xDate DESC
       LIMIT 10`,
      [],
      []
    )
    
    console.log('[MyDiner] Fetching inventory data...')
    const totalProducts = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refitem WHERE active = "True"',
      [],
      [{ count: 0 }]
    )
    
    const lowStockItems = await safeQuery(
      `SELECT 
        ItemCode,
        ItemName,
        QtyOnHand,
        COALESCE(Cost, 0) as cost,
        COALESCE(Class, 'N/A') as category
       FROM inv_refitem
       WHERE active = 'True' AND QtyOnHand < 10 AND QtyOnHand > 0
       ORDER BY QtyOnHand ASC
       LIMIT 20`,
      [],
      []
    )
    
    const outOfStockItems = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refitem WHERE active = "True" AND QtyOnHand = 0',
      [],
      [{ count: 0 }]
    )
    
    const inventoryValue = await safeQuery(
      'SELECT COALESCE(SUM(QtyOnHand * Cost), 0) as total FROM inv_refitem WHERE active = "True"',
      [],
      [{ total: 0 }]
    )
    
    const inventoryByCategory = await safeQuery(
      `SELECT 
        COALESCE(Class, 'Uncategorized') as category,
        COUNT(*) as itemCount,
        COALESCE(SUM(QtyOnHand), 0) as totalQty,
        COALESCE(SUM(QtyOnHand * Cost), 0) as totalValue
       FROM inv_refitem
       WHERE active = 'True'
       GROUP BY Class
       ORDER BY totalValue DESC`,
      [],
      []
    )
    
    console.log('[MyDiner] Fetching server performance data...')
    
    const serverList = await safeQuery(
      `SELECT 
        WaiterCode,
        WaiterName,
        Active
       FROM inv_refwaiter
       WHERE Active = 'True'
       ORDER BY WaiterName`,
      [],
      []
    )
    
    console.log('[MyDiner] Fetching customer data...')
    
    const totalCustomers = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refcustomer',
      [],
      [{ count: 0 }]
    )
    
    const topCustomers = await safeQuery(
      `SELECT 
        h.CustCode,
        c.CustName,
        COUNT(*) as visitCount,
        COALESCE(SUM(h.NetSales), 0) as totalSpent,
        COALESCE(AVG(h.NetSales), 0) as avgSpent
       FROM pos_trans_header h
       LEFT JOIN inv_refcustomer c ON h.CustCode = c.CustCode
       WHERE h.CustCode IS NOT NULL AND h.CustCode != ''
       GROUP BY h.CustCode, c.CustName
       ORDER BY totalSpent DESC
       LIMIT 20`,
      [],
      []
    )
    
    console.log('[MyDiner] Fetching master data...')
    
    const totalSuppliers = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refsupplier',
      [],
      [{ count: 0 }]
    )
    
    const totalCategories = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refclass',
      [],
      [{ count: 0 }]
    )
    
    console.log('[MyDiner] Compiling report data...')
    
    res.json({
      success: true,
      data: {
        posType: 'mydiner',
        posName: 'IBS MyDiner POS (Restaurant)',
        
        masterData: {
          products: totalProducts[0]?.count || 0,
          customers: totalCustomers[0]?.count || 0,
          suppliers: totalSuppliers[0]?.count || 0,
          categories: totalCategories[0]?.count || 0,
          servers: serverList.length || 0,
        },
        
        sales: {
          total: { count: totalSales[0]?.count || 0, amount: parseFloat(totalSales[0]?.total) || 0 },
          today: { count: todaySales[0]?.count || 0, amount: parseFloat(todaySales[0]?.total) || 0 },
          thisWeek: { count: weekSales[0]?.count || 0, amount: parseFloat(weekSales[0]?.total) || 0 },
          thisMonth: { count: monthSales[0]?.count || 0, amount: parseFloat(monthSales[0]?.total) || 0 },
          avgOrderValue: parseFloat(avgOrderValue[0]?.avg) || 0,
        },
        
        salesByServer: salesByServer.map((row: any) => ({
          server: row.server || 'Unknown',
          orderCount: parseInt(row.orderCount) || 0,
          totalSales: parseFloat(row.totalSales) || 0,
          avgOrderValue: parseFloat(row.avgOrderValue) || 0,
        })),
        
        salesByPayment: salesByPayment.map((row: any) => ({
          paymentType: row.PaymentType || 'Unknown',
          count: parseInt(row.count) || 0,
          total: parseFloat(row.total) || 0,
        })),
        
        hourlySales: hourlySales.map((row: any) => ({
          hour: parseInt(row.hour),
          orderCount: parseInt(row.orderCount) || 0,
          total: parseFloat(row.total) || 0,
        })),
        
        topMenuItems: topMenuItems.map((row: any) => ({
          itemCode: row.ItemCode,
          dishName: row.dishName || 'Unknown Dish',
          category: row.category,
          totalQty: parseFloat(row.totalQty) || 0,
          totalSales: parseFloat(row.totalSales) || 0,
          orderCount: parseInt(row.orderCount) || 0,
          avgPrice: parseFloat(row.avgPrice) || 0,
        })),
        
        slowMovingItems: slowMovingItems.map((row: any) => ({
          itemCode: row.ItemCode,
          dishName: row.dishName || 'Unknown Dish',
          category: row.category,
          stockQty: parseFloat(row.stockQty) || 0,
          soldQty: parseFloat(row.soldQty) || 0,
          cost: parseFloat(row.cost) || 0,
        })),
        
        menuByCategory: menuByCategory.map((row: any) => ({
          category: row.category,
          itemCount: parseInt(row.itemCount) || 0,
          totalQtySold: parseFloat(row.totalQtySold) || 0,
          totalSales: parseFloat(row.totalSales) || 0,
        })),
        
        dailyOrderTrend: dailyOrderTrend.map((row: any) => ({
          date: row.date,
          orderCount: parseInt(row.orderCount) || 0,
          total: parseFloat(row.total) || 0,
          avgOrderValue: parseFloat(row.avgOrderValue) || 0,
        })),
        
        expenses: {
          total: { count: totalExpenses[0]?.count || 0, amount: parseFloat(totalExpenses[0]?.total) || 0 },
          today: { count: todayExpenses[0]?.count || 0, amount: parseFloat(todayExpenses[0]?.total) || 0 },
          thisMonth: { count: monthExpenses[0]?.count || 0, amount: parseFloat(monthExpenses[0]?.total) || 0 },
        },
        
        expensesByCategory: expensesByCategory.map((row: any) => ({
          category: row.category || 'Unknown',
          count: parseInt(row.count) || 0,
          total: parseFloat(row.total) || 0,
        })),
        
        recentExpenses: recentExpenses.map((row: any) => ({
          tranNo: row.TranNo,
          date: row.xDate,
          total: parseFloat(row.Total) || 0,
          remarks: row.Remarks || '',
        })),
        
        inventory: {
          totalProducts: totalProducts[0]?.count || 0,
          lowStock: lowStockItems.length,
          outOfStock: outOfStockItems[0]?.count || 0,
          totalValue: parseFloat(inventoryValue[0]?.total) || 0,
        },
        
        lowStockItems: lowStockItems.map((row: any) => ({
          itemCode: row.ItemCode,
          itemName: row.ItemName,
          qtyOnHand: parseFloat(row.QtyOnHand) || 0,
          cost: parseFloat(row.cost) || 0,
          category: row.category,
        })),
        
        inventoryByCategory: inventoryByCategory.map((row: any) => ({
          category: row.category,
          itemCount: parseInt(row.itemCount) || 0,
          totalQty: parseFloat(row.totalQty) || 0,
          totalValue: parseFloat(row.totalValue) || 0,
        })),
        
        servers: serverList.map((row: any) => ({
          waiterCode: row.WaiterCode,
          waiterName: row.WaiterName,
          active: row.Active,
        })),
        
        customers: {
          total: totalCustomers[0]?.count || 0,
        },
        
        topCustomers: topCustomers.map((row: any) => ({
          custCode: row.CustCode,
          custName: row.CustName || 'Unknown Customer',
          visitCount: parseInt(row.visitCount) || 0,
          totalSpent: parseFloat(row.totalSpent) || 0,
          avgSpent: parseFloat(row.avgSpent) || 0,
        })),
      }
    })
    
  } catch (error: any) {
    console.error('[MyDiner Reports] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MyDiner report data',
      details: error?.message
    })
  }
})

export default router
