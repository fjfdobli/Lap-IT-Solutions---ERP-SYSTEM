import { Router, Response, Request } from 'express'
import { ibsPosPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Helper function for safe queries with fallback
async function safeQuery(query: string, params: any[] = [], fallback: any = []) {
  try {
    const [rows] = await ibsPosPool.query(query, params)
    return rows || fallback
  } catch (error) {
    console.error(`Query error: ${error}`)
    return fallback
  }
}

// Get R5 Report Data
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  console.log('[R5 Reports] Fetching report data...')
  
  try {
    // ===== 1. SALES DATA =====
    console.log('[R5] Fetching sales data...')
    
    // Total Sales (all time)
    const totalSales = await safeQuery(
      'SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total FROM pos_trans_header',
      [],
      [{ count: 0, total: 0 }]
    )
    
    // Today's Sales
    const todaySales = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total 
       FROM pos_trans_header 
       WHERE DATE(DateTrans) = CURDATE()`,
      [],
      [{ count: 0, total: 0 }]
    )
    
    // This Week's Sales
    const weekSales = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total 
       FROM pos_trans_header 
       WHERE YEARWEEK(DateTrans, 1) = YEARWEEK(CURDATE(), 1)`,
      [],
      [{ count: 0, total: 0 }]
    )
    
    // This Month's Sales
    const monthSales = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as total 
       FROM pos_trans_header 
       WHERE YEAR(DateTrans) = YEAR(CURDATE()) AND MONTH(DateTrans) = MONTH(CURDATE())`,
      [],
      [{ count: 0, total: 0 }]
    )
    
    // Sales by Payment Type
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
    
    // Hourly Sales (Last 24 hours)
    const hourlySales = await safeQuery(
      `SELECT 
        HOUR(DateTrans) as hour,
        COUNT(*) as count,
        COALESCE(SUM(NetSales), 0) as total
       FROM pos_trans_header
       WHERE DateTrans >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY HOUR(DateTrans)
       ORDER BY hour`,
      [],
      []
    )
    
    // Sales by Cashier
    const salesByCashier = await safeQuery(
      `SELECT 
        xUser as cashier,
        COUNT(*) as count,
        COALESCE(SUM(NetSales), 0) as total
       FROM pos_trans_header
       GROUP BY xUser
       ORDER BY total DESC
       LIMIT 10`,
      [],
      []
    )
    
    // ===== 2. PRODUCT PERFORMANCE DATA =====
    console.log('[R5] Fetching product performance data...')
    
    // Top Selling Products
    const topProducts = await safeQuery(
      `SELECT 
        d.ItemCode,
        i.ItemName as productName,
        SUM(d.Qty) as totalQty,
        COALESCE(SUM(d.Total), 0) as totalAmount,
        COUNT(DISTINCT d.TRNo_H) as transactionCount
       FROM pos_trans_details d
       LEFT JOIN inv_refitem i ON d.ItemCode = i.ItemCode
       GROUP BY d.ItemCode, i.ItemName
       ORDER BY totalAmount DESC
       LIMIT 20`,
      [],
      []
    )
    
    // Slow Moving Products (Low sales, high inventory)
    const slowMovingProducts = await safeQuery(
      `SELECT 
        i.ItemCode,
        i.ItemName as productName,
        i.QtyOnHand as stockQty,
        COALESCE(SUM(d.Qty), 0) as soldQty,
        COALESCE(i.Cost, 0) as cost
       FROM inv_refitem i
       LEFT JOIN pos_trans_details d ON i.ItemCode = d.ItemCode
       WHERE i.QtyOnHand > 0 AND i.active = 'True'
       GROUP BY i.ItemCode, i.ItemName, i.QtyOnHand, i.Cost
       HAVING soldQty < 5
       ORDER BY i.QtyOnHand DESC
       LIMIT 20`,
      [],
      []
    )
    
    // Products by Category
    const productsByCategory = await safeQuery(
      `SELECT 
        COALESCE(Class, 'Uncategorized') as category,
        COUNT(*) as productCount,
        COALESCE(SUM(QtyOnHand), 0) as totalStock
       FROM inv_refitem
       WHERE active = 'True'
       GROUP BY Class
       ORDER BY productCount DESC`,
      [],
      []
    )
    
    // ===== 3. INVENTORY DATA =====
    console.log('[R5] Fetching inventory data...')
    
    // Total Products
    const totalProducts = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refitem WHERE active = "True"',
      [],
      [{ count: 0 }]
    )
    
    // Low Stock Items (QtyOnHand < 10)
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
    
    // Out of Stock Items
    const outOfStockItems = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refitem WHERE active = "True" AND QtyOnHand = 0',
      [],
      [{ count: 0 }]
    )
    
    // Total Inventory Value
    const inventoryValue = await safeQuery(
      'SELECT COALESCE(SUM(QtyOnHand * Cost), 0) as total FROM inv_refitem WHERE active = "True"',
      [],
      [{ total: 0 }]
    )
    
    // Inventory by Class
    const inventoryByClass = await safeQuery(
      `SELECT 
        COALESCE(Class, 'Uncategorized') as className,
        COUNT(*) as productCount,
        COALESCE(SUM(QtyOnHand), 0) as totalQty,
        COALESCE(SUM(QtyOnHand * Cost), 0) as totalValue
       FROM inv_refitem
       WHERE active = 'True'
       GROUP BY Class
       ORDER BY totalValue DESC`,
      [],
      []
    )
    
    // ===== 4. CUSTOMER DATA =====
    console.log('[R5] Fetching customer data...')
    
    // Total Customers
    const totalCustomers = await safeQuery(
      'SELECT COUNT(*) as count FROM inv_refcustomer',
      [],
      [{ count: 0 }]
    )
    
    // Top Customers (by transaction count and amount)
    const topCustomers = await safeQuery(
      `SELECT 
        h.CustCode,
        c.CustName,
        COUNT(*) as transactionCount,
        COALESCE(SUM(h.NetSales), 0) as totalAmount
       FROM pos_trans_header h
       LEFT JOIN inv_refcustomer c ON h.CustCode = c.CustCode
       WHERE h.CustCode IS NOT NULL AND h.CustCode != ''
       GROUP BY h.CustCode, c.CustName
       ORDER BY totalAmount DESC
       LIMIT 20`,
      [],
      []
    )
    
    // AR Aging (Accounts Receivable)
    const arAging = await safeQuery(
      `SELECT 
        c.CustCode,
        c.CustName,
        COALESCE(c.ARBalance, 0) as balance,
        c.CreditLimit
       FROM inv_refcustomer c
       WHERE COALESCE(c.ARBalance, 0) > 0
       ORDER BY c.ARBalance DESC
       LIMIT 20`,
      [],
      []
    )
    
    // Total AR Balance
    const totalAR = await safeQuery(
      'SELECT COALESCE(SUM(ARBalance), 0) as total FROM inv_refcustomer WHERE ARBalance > 0',
      [],
      [{ total: 0 }]
    )
    
    // ===== 5. DAILY CASH REPORT DATA =====
    console.log('[R5] Fetching daily cash report data...')
    
    // Today's Cash Sales
    const todayCashSales = await safeQuery(
      `SELECT COALESCE(SUM(p.Amount), 0) as total
       FROM pos_trans_payment p
       JOIN pos_trans_header h ON p.TRNo_H = h.TRNo_H
       WHERE DATE(h.DateTrans) = CURDATE() AND p.PaymentType = 'Cash'`,
      [],
      [{ total: 0 }]
    )
    
    // Today's Credit Sales
    const todayCreditSales = await safeQuery(
      `SELECT COALESCE(SUM(p.Amount), 0) as total
       FROM pos_trans_payment p
       JOIN pos_trans_header h ON p.TRNo_H = h.TRNo_H
       WHERE DATE(h.DateTrans) = CURDATE() AND p.PaymentType IN ('Credit', 'AR')`,
      [],
      [{ total: 0 }]
    )
    
    // Today's Card Sales
    const todayCardSales = await safeQuery(
      `SELECT COALESCE(SUM(p.Amount), 0) as total
       FROM pos_trans_payment p
       JOIN pos_trans_header h ON p.TRNo_H = h.TRNo_H
       WHERE DATE(h.DateTrans) = CURDATE() AND p.PaymentType IN ('Card', 'Credit Card')`,
      [],
      [{ total: 0 }]
    )
    
    // Daily Sales Trend (Last 30 days)
    const dailySalesTrend = await safeQuery(
      `SELECT 
        DATE(DateTrans) as date,
        COUNT(*) as count,
        COALESCE(SUM(NetSales), 0) as total
       FROM pos_trans_header
       WHERE DateTrans >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(DateTrans)
       ORDER BY date`,
      [],
      []
    )
    
    // ===== 6. MASTER DATA =====
    console.log('[R5] Fetching master data...')
    
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
    
    // ===== COMPILE RESPONSE =====
    console.log('[R5] Compiling report data...')
    
    res.json({
      success: true,
      data: {
        posType: 'r5',
        posName: 'IBS R5 (Sari-sari Store)',
        
        // Master Data
        masterData: {
          products: totalProducts[0]?.count || 0,
          customers: totalCustomers[0]?.count || 0,
          suppliers: totalSuppliers[0]?.count || 0,
          categories: totalCategories[0]?.count || 0,
        },
        
        // Sales Performance
        sales: {
          total: { count: totalSales[0]?.count || 0, amount: parseFloat(totalSales[0]?.total) || 0 },
          today: { count: todaySales[0]?.count || 0, amount: parseFloat(todaySales[0]?.total) || 0 },
          thisWeek: { count: weekSales[0]?.count || 0, amount: parseFloat(weekSales[0]?.total) || 0 },
          thisMonth: { count: monthSales[0]?.count || 0, amount: parseFloat(monthSales[0]?.total) || 0 },
        },
        
        salesByPayment: salesByPayment.map((row: any) => ({
          paymentType: row.PaymentType || 'Unknown',
          count: parseInt(row.count) || 0,
          total: parseFloat(row.total) || 0,
        })),
        
        hourlySales: hourlySales.map((row: any) => ({
          hour: parseInt(row.hour),
          count: parseInt(row.count) || 0,
          total: parseFloat(row.total) || 0,
        })),
        
        salesByCashier: salesByCashier.map((row: any) => ({
          cashier: row.cashier || 'Unknown',
          count: parseInt(row.count) || 0,
          total: parseFloat(row.total) || 0,
        })),
        
        // Product Performance
        topProducts: topProducts.map((row: any) => ({
          itemCode: row.ItemCode,
          productName: row.productName || 'Unknown Product',
          totalQty: parseFloat(row.totalQty) || 0,
          totalAmount: parseFloat(row.totalAmount) || 0,
          transactionCount: parseInt(row.transactionCount) || 0,
        })),
        
        slowMovingProducts: slowMovingProducts.map((row: any) => ({
          itemCode: row.ItemCode,
          productName: row.productName || 'Unknown Product',
          stockQty: parseFloat(row.stockQty) || 0,
          soldQty: parseFloat(row.soldQty) || 0,
          cost: parseFloat(row.cost) || 0,
        })),
        
        productsByCategory: productsByCategory.map((row: any) => ({
          category: row.category,
          productCount: parseInt(row.productCount) || 0,
          totalStock: parseFloat(row.totalStock) || 0,
        })),
        
        // Inventory
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
        
        inventoryByClass: inventoryByClass.map((row: any) => ({
          className: row.className,
          productCount: parseInt(row.productCount) || 0,
          totalQty: parseFloat(row.totalQty) || 0,
          totalValue: parseFloat(row.totalValue) || 0,
        })),
        
        // Customers
        customers: {
          total: totalCustomers[0]?.count || 0,
          totalAR: parseFloat(totalAR[0]?.total) || 0,
        },
        
        topCustomers: topCustomers.map((row: any) => ({
          custCode: row.CustCode,
          custName: row.CustName || 'Unknown Customer',
          transactionCount: parseInt(row.transactionCount) || 0,
          totalAmount: parseFloat(row.totalAmount) || 0,
        })),
        
        arAging: arAging.map((row: any) => ({
          custCode: row.CustCode,
          custName: row.CustName || 'Unknown Customer',
          balance: parseFloat(row.balance) || 0,
          creditLimit: parseFloat(row.CreditLimit) || 0,
        })),
        
        // Daily Cash Report
        dailyCash: {
          cash: parseFloat(todayCashSales[0]?.total) || 0,
          credit: parseFloat(todayCreditSales[0]?.total) || 0,
          card: parseFloat(todayCardSales[0]?.total) || 0,
          total: parseFloat(todaySales[0]?.total) || 0,
        },
        
        dailySalesTrend: dailySalesTrend.map((row: any) => ({
          date: row.date,
          count: parseInt(row.count) || 0,
          total: parseFloat(row.total) || 0,
        })),
      }
    })
    
  } catch (error: any) {
    console.error('[R5 Reports] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch R5 report data',
      details: error?.message
    })
  }
})

// =======================
// GET SALES REPORT
// =======================
router.get('/sales', authenticateToken, async (req: Request, res: Response) => {
  console.log('[R5 Reports] Fetching sales report data...')

  const { from, to, reportType } = req.query

  // Validate date parameters
  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: 'Date range parameters are required (from and to in YYYY-MM-DD format)',
    })
  }

  try {
    const fromDate = from as string
    const toDate = to as string
    const isSingleDate = fromDate === toDate

    let data: any = {}

    if (isSingleDate) {
      // ===== SINGLE DATE REPORT =====
      // ===== 1. ITEM DETAILS =====
      const itemsQuery = `
        SELECT
          d.TRNo_D    AS receiptNo,
          d.DateTrans AS date,
          d.ItemName  AS itemName,
          d.CustName  AS custName,
          d.Qty       AS qty,
          d.Price     AS price,
          d.Total     AS total
        FROM pos_trans_details d
        WHERE DATE(d.DateTrans) = ?
        ORDER BY d.TRNo_D;
      `

      // ===== 2. TOTALS =====
      const totalsQuery = `
        SELECT
          SUM(NetSales - Tax) AS netOfVat,
          SUM(Tax)            AS vat,
          SUM(NetSales)       AS grossSales
        FROM pos_trans_header
        WHERE DATE(DateTrans) = ?;
      `

      const [items, totalsResult] = await Promise.all([
        safeQuery(itemsQuery, [fromDate]),
        safeQuery(totalsQuery, [fromDate], [
          { netOfVat: 0, vat: 0, grossSales: 0 },
        ]),
      ])

      const totals = totalsResult[0]

      data = {
        reportType: 'Daily Sales Report',
        dateRange: { from: fromDate, to: toDate },
        columns: ['Receipt No.', 'Date', 'Item', 'Customer', 'Qty Sold', 'Price', 'Total'],
        items: items.map((item: any) => ({
          receipt_no: item.receiptNo,
          date: item.date,
          item: item.itemName,
          customer: item.custName || 'Walk-in',
          qty: Number(item.qty) || 0,
          price: Number(item.price) || 0,
          total: Number(item.total) || 0,
        })),
        totals: {
          netOfVat: Number(totals.netOfVat) || 0,
          vat: Number(totals.vat) || 0,
          grossSales: Number(totals.grossSales) || 0,
        },
      }
    } else {
      // ===== DATE RANGE REPORT =====
      const dateRangeQuery = `
        SELECT
          DATE(d.DateTrans) AS date,
          SUM(d.Total)      AS total
        FROM pos_trans_details d
        WHERE DATE(d.DateTrans) BETWEEN ? AND ?
        GROUP BY DATE(d.DateTrans)
        ORDER BY DATE(d.DateTrans);
      `

      const dateRangeData = await safeQuery(dateRangeQuery, [fromDate, toDate])

      data = {
        reportType: 'Sales Report',
        dateRange: { from: fromDate, to: toDate },
        columns: ['Date', 'Total'],
        items: dateRangeData.map((item: any) => ({
          date: item.date,
          total: Number(item.total) || 0,
        })),
        totals: {
          totalSales: dateRangeData.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0),
        },
      }
    }

    res.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('[R5 Reports] Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch R5 sales report data',
      details: error?.message,
    })
  }
})

// =======================
// GET MONTHLY SALES REPORT
// =======================
router.get('/sales/monthly', authenticateToken, async (req: Request, res: Response) => {
  console.log('[R5 Reports] Fetching monthly sales report data...')

  const { year } = req.query

  if (!year) {
    return res.status(400).json({
      success: false,
      message: 'Year parameter is required (YYYY format)',
    })
  }

  try {
    const monthlyQuery = `
      SELECT
        YEAR(DateTrans)  AS salesYear,
        MONTH(DateTrans) AS salesMonth,
        DATE_FORMAT(DateTrans, '%Y-%m') AS monthLabel,
        SUM(NetSales)  AS monthlyTotal
      FROM pos_trans_header
      WHERE YEAR(DateTrans) = ?
      GROUP BY YEAR(DateTrans), MONTH(DateTrans)
      ORDER BY YEAR(DateTrans), MONTH(DateTrans);
    `

    const monthlyData = await safeQuery(monthlyQuery, [year])

    const data = {
      reportType: 'Monthly Sales Report',
      year,
      columns: ['Month', 'Total'],
      items: monthlyData.map((item: any) => ({
        month: item.monthLabel || `Month ${item.salesMonth}`,
        total: Number(item.monthlyTotal) || 0,
      })),
      totals: {
        totalSales: monthlyData.reduce((sum: number, item: any) => sum + Number(item.monthlyTotal || 0), 0),
      },
    }

    res.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('[R5 Reports] Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch R5 monthly sales report data',
      details: error?.message,
    })
  }
})

export default router
