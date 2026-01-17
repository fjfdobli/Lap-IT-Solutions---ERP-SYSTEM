import { Router, Response } from 'express'
import { posPool, ibsPosPool, myDineInPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket } from 'mysql2'
import { Pool } from 'mysql2/promise'

const router = Router()

// POS type to pool mapping with database names for debugging
const POS_POOL_MAP: Record<string, { pool: Pool; dbName: string }> = {
  oasis: { pool: posPool, dbName: 'ibs_pos_new' },
  r5: { pool: ibsPosPool, dbName: 'ibs_pos' },
  mydiner: { pool: myDineInPool, dbName: 'mydinein' }
}

// Get pool by POS type
function getPool(posType: string): Pool | null {
  return POS_POOL_MAP[posType]?.pool || null
}

function getDbName(posType: string): string {
  return POS_POOL_MAP[posType]?.dbName || 'unknown'
}

// Helper to safely query with error handling
async function safeQuery(pool: Pool, query: string, params: any[] = []): Promise<any> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(query, params)
    return rows
  } catch (error: any) {
    console.error('Query error:', error?.message || error)
    console.error('Failed query:', query.substring(0, 200))
    console.error('Query params:', params)
    return null
  }
}

// Schema configuration for different POS systems
const SCHEMA_CONFIG: Record<string, {
  salesTable: string
  salesAmountCol: string
  salesDateCol: string
  salesTransNoCol: string
  salesStatusCol: string
  salesCashierCol: string
  receivingTable: string
  receivingNoCol: string
  receivingDateCol: string
  receivingAmountCol: string
  receivingStatusCol: string
  receivingSupplierCol: string
}> = {
  oasis: {
    salesTable: 'pos_trans_header_main',
    salesAmountCol: 'NetSales',
    salesDateCol: 'DateTrans',
    salesTransNoCol: 'TRNo_H',
    salesStatusCol: 'POstatus',
    salesCashierCol: 'xUser',
    receivingTable: 'mod_rr_1',
    receivingNoCol: 'xCode',
    receivingDateCol: 'RRDate',
    receivingAmountCol: 'Amnt_GrandCost',
    receivingStatusCol: 'POstatus',
    receivingSupplierCol: 'SupplierCode'
  },
  r5: {
    salesTable: 'pos_trans_header_main',
    salesAmountCol: 'NetSales',
    salesDateCol: 'DateTrans',
    salesTransNoCol: 'TRNo_H',
    salesStatusCol: 'POstatus',
    salesCashierCol: 'xUser',
    receivingTable: 'mod_rr_1',
    receivingNoCol: 'xCode',
    receivingDateCol: 'RRDate',
    receivingAmountCol: 'Amnt_GrandCost',
    receivingStatusCol: 'POstatus',
    receivingSupplierCol: 'SupplierCode'
  },
  mydiner: {
    salesTable: 'pos_trans_header_main1',
    salesAmountCol: 'NetSales',
    salesDateCol: 'DateTrans',
    salesTransNoCol: 'TRNo_H',
    salesStatusCol: 'POstatus',
    salesCashierCol: 'xUser',
    receivingTable: 'mod_rr_1',
    receivingNoCol: 'xCode',
    receivingDateCol: 'RRDate',
    receivingAmountCol: 'Amnt_GrandCost',
    receivingStatusCol: 'POstatus',
    receivingSupplierCol: 'SupplierCode'
  }
}

// Get dashboard stats for a specific POS
router.get('/stats/:posType', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const posType = req.params.posType as string
    const pool = getPool(posType)
    const schema = SCHEMA_CONFIG[posType]

    if (!pool || !schema) {
      res.status(400).json({ success: false, error: 'Invalid POS type' })
      return
    }

    // Get today's date in format used by POS
    const today = new Date()
    const todayStr = today.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    })

    // Common stats for all POS types
    const productCount = await safeQuery(pool, 'SELECT COUNT(*) as count FROM inv_refitem WHERE active = "True"')
    const customerCount = await safeQuery(pool, 'SELECT COUNT(*) as count FROM inv_refcustomer')
    
    // Try different transaction table names using schema config
    let transactionCount = await safeQuery(pool, `SELECT COUNT(*) as count FROM ${schema.salesTable}`)
    if (!transactionCount || transactionCount[0]?.count === undefined) {
      transactionCount = await safeQuery(pool, 'SELECT COUNT(*) as count FROM pos_trans_header_main')
    }
    if (!transactionCount || transactionCount[0]?.count === undefined) {
      transactionCount = await safeQuery(pool, 'SELECT COUNT(*) as count FROM pos_trans_header_main1')
    }

    // Get total sales using schema-specific column
    console.log(`[${posType}] Querying total sales from ${schema.salesTable}.${schema.salesAmountCol}`)
    let totalSales = await safeQuery(pool, `SELECT COALESCE(SUM(${schema.salesAmountCol}), 0) as total FROM ${schema.salesTable}`)
    console.log(`[${posType}] Total sales result:`, totalSales)
    
    if (!totalSales || totalSales[0]?.total === undefined || totalSales[0]?.total === null) {
      console.log(`[${posType}] Fallback: trying pos_trans_header.Total`)
      // Fallback: try common column names
      totalSales = await safeQuery(pool, 'SELECT COALESCE(SUM(Total), 0) as total FROM pos_trans_header')
    }
    if (!totalSales || totalSales[0]?.total === undefined || totalSales[0]?.total === null) {
      console.log(`[${posType}] Fallback: trying pos_trans_header_main.NetAmount`)
      totalSales = await safeQuery(pool, 'SELECT COALESCE(SUM(NetAmount), 0) as total FROM pos_trans_header_main')
    }
    
    console.log(`[${posType}] Final total sales value:`, parseFloat(totalSales?.[0]?.total) || 0)

    // Get today's sales
    let todaySales = await safeQuery(pool, 
      `SELECT COALESCE(SUM(${schema.salesAmountCol}), 0) as total FROM ${schema.salesTable} WHERE ${schema.salesDateCol} LIKE ?`,
      [`%${todayStr}%`]
    )
    if (!todaySales || todaySales[0]?.total === undefined) {
      todaySales = [{ total: 0 }]
    }

    // Get receiving count
    const receivingCount = await safeQuery(pool, `SELECT COUNT(*) as count FROM ${schema.receivingTable}`)
    console.log(`[${posType}] Receiving count result:`, receivingCount?.[0]?.count || 0)

    // Get today's receiving
    const todayReceiving = await safeQuery(pool, 
      `SELECT COUNT(*) as count FROM ${schema.receivingTable} WHERE ${schema.receivingDateCol} LIKE ?`,
      [`%${todayStr}%`]
    )

    // Get item movement count
    const movementCount = await safeQuery(pool, 'SELECT COUNT(*) as count FROM pro_itemmovement')

    // Get void count
    let voidCount = await safeQuery(pool, 'SELECT COUNT(*) as count FROM pos_void_header')
    console.log(`[${posType}] Void count result:`, voidCount?.[0]?.count || 0)
    
    // Get shift count
    const shiftCount = await safeQuery(pool, 'SELECT COUNT(*) as count FROM pos_close_shift')

    // POS-specific stats
    let additionalStats: any = {}

    if (posType === 'mydiner') {
      // Restaurant-specific stats
      const tableCount = await safeQuery(pool, 'SELECT COUNT(*) as count FROM inv_reftable')
      const occupiedTables = await safeQuery(pool, 'SELECT COUNT(*) as count FROM inv_reftable WHERE xStatus = "Occupied"')
      const expenseCount = await safeQuery(pool, 'SELECT COUNT(*) as count FROM pos_expense_header')
      const todayExpenses = await safeQuery(pool,
        'SELECT COALESCE(SUM(TotalAmount), 0) as total FROM pos_expense_header WHERE DateTrans LIKE ?',
        [`%${todayStr}%`]
      )
      const waiterCount = await safeQuery(pool, 'SELECT COUNT(*) as count FROM inv_refwaiter')
      
      additionalStats = {
        tables: {
          total: tableCount?.[0]?.count || 0,
          occupied: occupiedTables?.[0]?.count || 0,
          vacant: (tableCount?.[0]?.count || 0) - (occupiedTables?.[0]?.count || 0)
        },
        expenses: {
          total: expenseCount?.[0]?.count || 0,
          todayTotal: parseFloat(todayExpenses?.[0]?.total) || 0
        },
        waiters: waiterCount?.[0]?.count || 0
      }
    }

    // Get recent transactions using schema-specific columns
    let recentTransactions = await safeQuery(pool,
      `SELECT ${schema.salesTransNoCol} as TempNo, ${schema.salesDateCol} as DateTrans, 
              ${schema.salesAmountCol} as NetAmount, ${schema.salesStatusCol} as xStatus, 
              ${schema.salesCashierCol} as CashierName 
       FROM ${schema.salesTable} 
       ORDER BY ID DESC LIMIT 5`
    )
    if (!recentTransactions || recentTransactions.length === 0) {
      // Fallback to generic select
      recentTransactions = await safeQuery(pool, `SELECT * FROM ${schema.salesTable} ORDER BY ID DESC LIMIT 5`)
    }

    // Get recent receiving using schema-specific columns
    let recentReceiving = await safeQuery(pool,
      `SELECT ${schema.receivingNoCol} as RRNo, ${schema.receivingDateCol} as RRDate, 
              ${schema.receivingSupplierCol} as SupplierCode, ${schema.receivingAmountCol} as TotalAmount, 
              ${schema.receivingStatusCol} as xStatus 
       FROM ${schema.receivingTable} 
       ORDER BY id DESC LIMIT 5`
    )
    if (!recentReceiving || recentReceiving.length === 0) {
      // Fallback to generic select
      recentReceiving = await safeQuery(pool, `SELECT * FROM ${schema.receivingTable} ORDER BY id DESC LIMIT 5`)
    }

    // Get last 7 days of sales data for charts - simplified without date parsing
    let dailySalesData = await safeQuery(pool,
      `SELECT 
        ${schema.salesDateCol} as sale_date,
        COALESCE(SUM(${schema.salesAmountCol}), 0) as daily_sales,
        COUNT(*) as daily_transactions
      FROM ${schema.salesTable}
      WHERE ${schema.salesDateCol} IS NOT NULL 
        AND ${schema.salesDateCol} != ''
      GROUP BY ${schema.salesDateCol}
      ORDER BY id DESC
      LIMIT 7`
    )

    // Format daily sales data
    const dailySales = (dailySalesData || []).reverse().map((row: any) => ({
      date: row.sale_date,
      sales: parseFloat(row.daily_sales) || 0,
      transactions: parseInt(row.daily_transactions) || 0
    }))

    // Get top product categories - use Class column (correct case)
    // For R5 which has no Class data, use ItemType as fallback
    let categorySalesData = await safeQuery(pool,
      `SELECT 
        COALESCE(Class, 'Uncategorized') as category_name,
        COUNT(xcode) as product_count
      FROM inv_refitem
      WHERE active = 'True' AND Class IS NOT NULL AND Class != ''
      GROUP BY Class
      ORDER BY product_count DESC
      LIMIT 6`
    )
    
    console.log(`[${posType}] Category data result:`, categorySalesData?.length || 0, 'categories')
    
    // If no Class data (like R5), try ItemType
    if (!categorySalesData || categorySalesData.length === 0) {
      console.log(`[${posType}] No Class data, trying ItemType fallback`)
      categorySalesData = await safeQuery(pool,
        `SELECT 
          COALESCE(ItemType, 'Standard') as category_name,
          COUNT(xcode) as product_count
        FROM inv_refitem
        WHERE active = 'True'
        GROUP BY ItemType
        ORDER BY product_count DESC
        LIMIT 6`
      )
    }

    // Format category data - use product count as value
    const categorySales = (categorySalesData || []).map((row: any) => ({
      name: row.category_name || 'Other',
      value: parseInt(row.product_count) || 0,
      productCount: parseInt(row.product_count) || 0
    }))

    res.json({
      success: true,
      data: {
        posType,
        stats: {
          products: productCount?.[0]?.count || 0,
          customers: customerCount?.[0]?.count || 0,
          transactions: transactionCount?.[0]?.count || 0,
          totalSales: parseFloat(totalSales?.[0]?.total) || 0,
          todaySales: parseFloat(todaySales?.[0]?.total) || 0,
          receiving: receivingCount?.[0]?.count || 0,
          todayReceiving: todayReceiving?.[0]?.count || 0,
          movements: movementCount?.[0]?.count || 0,
          voids: voidCount?.[0]?.count || 0,
          shifts: shiftCount?.[0]?.count || 0,
          ...additionalStats
        },
        dailySales,
        categorySales,
        recent: {
          transactions: recentTransactions || [],
          receiving: recentReceiving || []
        }
      }
    })
  } catch (error: any) {
    console.error('Error getting POS stats:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get POS stats',
      details: error?.message 
    })
  }
})

// Get overview stats for all POS systems
router.get('/overview', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const results: Array<{
      posType: string
      name: string
      connected: boolean
      stats?: any
      error?: string
    }> = []

    const posTypes = [
      { type: 'oasis', name: 'IBS OASIS', pool: posPool },
      { type: 'r5', name: 'IBS R5', pool: ibsPosPool },
      { type: 'mydiner', name: 'IBS MyDiner', pool: myDineInPool }
    ]

    for (const pos of posTypes) {
      const schema = SCHEMA_CONFIG[pos.type]
      try {
        // Test connection
        await pos.pool.query('SELECT 1')

        // Get basic stats
        const productCount = await safeQuery(pos.pool, 'SELECT COUNT(*) as count FROM inv_refitem WHERE active = "True"')
        
        // Use schema-specific table
        let transactionCount = await safeQuery(pos.pool, `SELECT COUNT(*) as count FROM ${schema.salesTable}`)
        if (!transactionCount || transactionCount[0]?.count === undefined) {
          transactionCount = await safeQuery(pos.pool, 'SELECT COUNT(*) as count FROM pos_trans_header_main')
        }
        if (!transactionCount || transactionCount[0]?.count === undefined) {
          transactionCount = await safeQuery(pos.pool, 'SELECT COUNT(*) as count FROM pos_trans_header')
        }

        // Use schema-specific column
        let totalSales = await safeQuery(pos.pool, `SELECT COALESCE(SUM(${schema.salesAmountCol}), 0) as total FROM ${schema.salesTable}`)
        if (!totalSales || totalSales[0]?.total === undefined || totalSales[0]?.total === null) {
          totalSales = await safeQuery(pos.pool, 'SELECT COALESCE(SUM(Total), 0) as total FROM pos_trans_header')
        }
        if (!totalSales || totalSales[0]?.total === undefined || totalSales[0]?.total === null) {
          totalSales = await safeQuery(pos.pool, 'SELECT COALESCE(SUM(NetAmount), 0) as total FROM pos_trans_header_main')
        }

        const receivingCount = await safeQuery(pos.pool, `SELECT COUNT(*) as count FROM ${schema.receivingTable}`)

        results.push({
          posType: pos.type,
          name: pos.name,
          connected: true,
          stats: {
            products: productCount?.[0]?.count || 0,
            transactions: transactionCount?.[0]?.count || 0,
            totalSales: parseFloat(totalSales?.[0]?.total) || 0,
            receiving: receivingCount?.[0]?.count || 0
          }
        })
      } catch (error: any) {
        results.push({
          posType: pos.type,
          name: pos.name,
          connected: false,
          error: error?.message || 'Connection failed'
        })
      }
    }

    res.json({
      success: true,
      data: results
    })
  } catch (error: any) {
    console.error('Error getting overview:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get overview',
      details: error?.message 
    })
  }
})

// Get table data for any POS
router.get('/:posType/tables/:tableName/data', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const posType = req.params.posType as string
    const tableName = req.params.tableName as string
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const search = req.query.search as string || ''
    const sortBy = req.query.sortBy as string
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    const pool = getPool(posType)
    if (!pool) {
      res.status(400).json({ success: false, error: 'Invalid POS type' })
      return
    }

    const offset = (page - 1) * limit

    // Get columns for search
    const [columns] = await pool.query<RowDataPacket[]>('DESCRIBE ??', [tableName])

    // Build search condition
    let whereClause = ''
    const searchParams: any[] = []
    
    if (search) {
      const searchConditions = columns
        .filter((col: any) => col.Type.includes('varchar') || col.Type.includes('text'))
        .map(() => `?? LIKE ?`)
      
      if (searchConditions.length > 0) {
        whereClause = 'WHERE ' + searchConditions.join(' OR ')
        columns
          .filter((col: any) => col.Type.includes('varchar') || col.Type.includes('text'))
          .forEach((col: any) => {
            searchParams.push(col.Field, `%${search}%`)
          })
      }
    }

    // Determine sort column
    const validColumns = columns.map((col: any) => col.Field)
    let orderByColumn = sortBy && validColumns.includes(sortBy) ? sortBy : validColumns[0]

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ?? ${whereClause}`
    const [countResult] = await pool.query<RowDataPacket[]>(countQuery, [tableName, ...searchParams])
    const total = countResult[0]?.total ?? 0

    // Get data with pagination
    const dataQuery = `SELECT * FROM ?? ${whereClause} ORDER BY ?? ${sortOrder} LIMIT ? OFFSET ?`
    const [rows] = await pool.query<RowDataPacket[]>(
      dataQuery,
      [tableName, ...searchParams, orderByColumn, limit, offset]
    )

    res.json({
      success: true,
      data: {
        tableName,
        rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error: any) {
    console.error('Error getting table data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get table data',
      details: error?.message 
    })
  }
})

// MyDiner specific: Get restaurant tables
router.get('/mydiner/restaurant-tables', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const [tables] = await myDineInPool.query<RowDataPacket[]>(
      `SELECT id, xCode, Xname, xStatus, NoGuest, xType, AmountDue, 
              KitchenStat, WaiterName, StartTime, Assignment
       FROM inv_reftable 
       ORDER BY xCode`
    )

    const summary = {
      total: tables.length,
      vacant: tables.filter((t: any) => t.xStatus === 'Vacant').length,
      occupied: tables.filter((t: any) => t.xStatus === 'Occupied').length
    }

    res.json({
      success: true,
      data: {
        tables,
        summary
      }
    })
  } catch (error: any) {
    console.error('Error getting restaurant tables:', error)
    res.status(500).json({ success: false, error: 'Failed to get restaurant tables' })
  }
})

// MyDiner specific: Get expenses
router.get('/mydiner/expenses', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const offset = (page - 1) * limit

    const [expenses] = await myDineInPool.query<RowDataPacket[]>(
      `SELECT h.ID, h.TranNo_H, h.MachineNo, h.Total, h.DateTrans, h.TimeTrans, 
              h.xUser, h.BatchNo, h.Remarks,
              d.xCode, d.xName as ExpenseName, d.Amount as ItemAmount
       FROM pos_expense_header h
       LEFT JOIN pos_expense_details d ON h.TranNo_H = d.TranNo_D
       ORDER BY h.ID DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    const [countResult] = await myDineInPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM pos_expense_header'
    )
    const total = countResult[0]?.total || 0

    // Get today's total
    const today = new Date().toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    })
    const [todayTotal] = await myDineInPool.query<RowDataPacket[]>(
      'SELECT COALESCE(SUM(Total), 0) as total FROM pos_expense_header WHERE DateTrans LIKE ?',
      [`%${today}%`]
    )

    res.json({
      success: true,
      data: {
        expenses,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        todayTotal: parseFloat(todayTotal[0]?.total) || 0
      }
    })
  } catch (error: any) {
    console.error('Error getting expenses:', error)
    res.status(500).json({ success: false, error: 'Failed to get expenses' })
  }
})

// MyDiner specific: Get audit trail
router.get('/mydiner/audit-trail', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const offset = (page - 1) * limit

    const [logs] = await myDineInPool.query<RowDataPacket[]>(
      `SELECT * FROM pos_audit_trail ORDER BY ID DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    const [countResult] = await myDineInPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM pos_audit_trail'
    )
    const total = countResult[0]?.total || 0

    res.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    })
  } catch (error: any) {
    console.error('Error getting audit trail:', error)
    res.status(500).json({ success: false, error: 'Failed to get audit trail' })
  }
})

// MyDiner specific: Get suspended orders
router.get('/mydiner/suspended-orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const [orders] = await myDineInPool.query<RowDataPacket[]>(
      `SELECT h.*, 
              (SELECT COUNT(*) FROM pos_suspend_details d WHERE d.TempNo = h.TempNo) as itemCount
       FROM pos_suspend_header h
       ORDER BY h.ID DESC`
    )

    res.json({
      success: true,
      data: { orders }
    })
  } catch (error: any) {
    console.error('Error getting suspended orders:', error)
    res.status(500).json({ success: false, error: 'Failed to get suspended orders' })
  }
})

// Debug endpoint: Check raw sales data for a specific POS
router.get('/debug/sales-check/:posType', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { posType } = req.params as { posType: POSType }
    const pool = getPool(posType)
    const schema = SCHEMA_CONFIG[posType]

    if (!pool || !schema) {
      res.status(400).json({ success: false, error: 'Invalid POS type' })
      return
    }

    // Check table existence
    const tables = await safeQuery(pool, 'SHOW TABLES')
    
    // Get sample records from sales table
    const sampleSales = await safeQuery(pool, `SELECT * FROM ${schema.salesTable} LIMIT 5`)
    
    // Try to sum the sales column
    const totalQuery = `SELECT COALESCE(SUM(${schema.salesAmountCol}), 0) as total, COUNT(*) as count FROM ${schema.salesTable}`
    console.log('Executing total query:', totalQuery)
    const totalResult = await safeQuery(pool, totalQuery)
    
    // Get column info
    const columns = await safeQuery(pool, `DESCRIBE ${schema.salesTable}`)

    res.json({
      success: true,
      data: {
        posType,
        salesTable: schema.salesTable,
        salesAmountCol: schema.salesAmountCol,
        allTables: tables,
        sampleSales,
        totalResult,
        columns
      }
    })
  } catch (error: any) {
    console.error('Debug sales check error:', error)
    res.status(500).json({ 
      success: false, 
      error: error?.message 
    })
  }
})

// Debug endpoint: Verify data from each POS is different
router.get('/debug/verify-data', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const results: any = {}

    for (const [posType, config] of Object.entries(POS_POOL_MAP)) {
      try {
        // Get database name to confirm correct connection
        const [dbResult] = await config.pool.query<RowDataPacket[]>('SELECT DATABASE() as dbName')
        
        // Get sample product names to verify different data
        const [products] = await config.pool.query<RowDataPacket[]>(
          'SELECT ItemCode, ItemDesc FROM inv_refitem LIMIT 5'
        )
        
        // Get product count
        const [countResult] = await config.pool.query<RowDataPacket[]>(
          'SELECT COUNT(*) as count FROM inv_refitem'
        )

        // Get sample classes (inv_refcategory doesn't exist)
        const [categories] = await config.pool.query<RowDataPacket[]>(
          'SELECT DISTINCT Class as CategoryCode, Class as CategoryDesc FROM inv_refitem WHERE Class IS NOT NULL AND Class != "" LIMIT 5'
        )

        results[posType] = {
          expectedDb: config.dbName,
          actualDb: dbResult[0]?.dbName,
          productCount: countResult[0]?.count,
          sampleProducts: products.map((p: any) => ({ code: p.ItemCode, desc: p.ItemDesc })),
          sampleCategories: categories.map((c: any) => ({ code: c.CategoryCode, desc: c.CategoryDesc })),
          connected: true
        }
      } catch (error: any) {
        results[posType] = {
          expectedDb: config.dbName,
          connected: false,
          error: error?.message
        }
      }
    }

    res.json({
      success: true,
      message: 'Data verification results - check if products/categories are different per POS',
      data: results
    })
  } catch (error: any) {
    console.error('Debug verification error:', error)
    res.status(500).json({ success: false, error: error?.message })
  }
})

export default router
