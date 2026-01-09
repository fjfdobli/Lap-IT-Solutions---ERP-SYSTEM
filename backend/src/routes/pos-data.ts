import { Router, Response } from 'express'
import { posPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket } from 'mysql2'

const router = Router()

router.use(authenticateToken)

router.get('/purchase-orders/headers', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, page = '1', limit = '50' } = req.query

    let query = `
      SELECT 
        id, xCode, PoDate, POdateTime, DRDate, Xname, 
        SupplierID, SupplierName, SupplierCode, Information, 
        Terms, Remarks, POStatus, Qty_Total, 
        Amnt_Subcost, Amnt_Shipping, Amnt_TRDiscount, 
        Amnt_ItemDiscount, Amnt_GrandCost, 
        DateCreate, CreateBy, DateModi, ModiBy, ForceClose
      FROM mod_po_1
      WHERE 1=1
    `
    const params: any[] = []

    if (search) {
      query += ' AND (xCode LIKE ? OR Xname LIKE ? OR SupplierName LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    if (status) {
      query += ' AND POStatus = ?'
      params.push(status)
    }

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await posPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY PoDate DESC, id DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [records] = await posPool.query<RowDataPacket[]>(query, params)

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching POS PO headers:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch POS purchase order headers' })
  }
})

// POS Purchase Order Stats
router.get('/purchase-orders/stats', async (req: AuthRequest, res: Response) => {
  try {
    // Total POs
    const [totalResult] = await posPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count, COALESCE(SUM(Amnt_GrandCost), 0) as total FROM mod_po_1'
    )
    
    // By Status
    const [statusResult] = await posPool.query<RowDataPacket[]>(
      `SELECT POStatus, COUNT(*) as count, COALESCE(SUM(Amnt_GrandCost), 0) as total 
       FROM mod_po_1 
       GROUP BY POStatus`
    )
    
    // This Month
    const [thisMonthResult] = await posPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count, COALESCE(SUM(Amnt_GrandCost), 0) as total 
       FROM mod_po_1 
       WHERE YEAR(PoDate) = YEAR(CURDATE()) AND MONTH(PoDate) = MONTH(CURDATE())`
    )
    
    // This Year
    const [thisYearResult] = await posPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count, COALESCE(SUM(Amnt_GrandCost), 0) as total 
       FROM mod_po_1 
       WHERE YEAR(PoDate) = YEAR(CURDATE())`
    )
    
    // Top Suppliers by PO Count
    const [topSuppliersResult] = await posPool.query<RowDataPacket[]>(
      `SELECT SupplierName, SupplierCode, COUNT(*) as poCount, COALESCE(SUM(Amnt_GrandCost), 0) as totalAmount
       FROM mod_po_1
       WHERE SupplierName IS NOT NULL AND SupplierName != ''
       GROUP BY SupplierName, SupplierCode
       ORDER BY totalAmount DESC
       LIMIT 5`
    )
    
    // Recent POs
    const [recentResult] = await posPool.query<RowDataPacket[]>(
      `SELECT id, xCode, PoDate, SupplierName, POStatus, Amnt_GrandCost, Qty_Total
       FROM mod_po_1
       ORDER BY PoDate DESC, id DESC
       LIMIT 5`
    )
    
    // Monthly Trend (last 12 months)
    const [monthlyTrendResult] = await posPool.query<RowDataPacket[]>(
      `SELECT 
         DATE_FORMAT(PoDate, '%Y-%m') as month,
         DATE_FORMAT(PoDate, '%b') as monthName,
         COUNT(*) as count,
         COALESCE(SUM(Amnt_GrandCost), 0) as total
       FROM mod_po_1
       WHERE PoDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(PoDate, '%Y-%m'), DATE_FORMAT(PoDate, '%b')
       ORDER BY month ASC`
    )
    
    // Build status counts
    const statusCounts: Record<string, { count: number; total: number }> = {}
    for (const row of statusResult) {
      const status = row.POStatus || 'Unknown'
      statusCounts[status] = { count: row.count, total: row.total }
    }

    res.json({
      success: true,
      data: {
        total: {
          count: totalResult[0]?.count || 0,
          amount: totalResult[0]?.total || 0
        },
        thisMonth: {
          count: thisMonthResult[0]?.count || 0,
          amount: thisMonthResult[0]?.total || 0
        },
        thisYear: {
          count: thisYearResult[0]?.count || 0,
          amount: thisYearResult[0]?.total || 0
        },
        byStatus: statusCounts,
        topSuppliers: topSuppliersResult,
        recent: recentResult,
        monthlyTrend: monthlyTrendResult
      }
    })
  } catch (error) {
    console.error('Error fetching POS PO stats:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch POS purchase order stats' })
  }
})

// Single PO Detail
router.get('/purchase-orders/:xCode', async (req: AuthRequest, res: Response) => {
  try {
    const { xCode } = req.params
    
    // Get header
    const [headerResult] = await posPool.query<RowDataPacket[]>(
      `SELECT * FROM mod_po_1 WHERE xCode = ?`,
      [xCode]
    )
    
    if (!headerResult.length) {
      res.status(404).json({ success: false, message: 'Purchase order not found' })
      return
    }
    
    // Get items
    const [itemsResult] = await posPool.query<RowDataPacket[]>(
      `SELECT * FROM mod_po_2 WHERE xCode = ? ORDER BY id`,
      [xCode]
    )
    
    res.json({
      success: true,
      data: {
        header: headerResult[0],
        items: itemsResult
      }
    })
  } catch (error) {
    console.error('Error fetching POS PO detail:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch purchase order detail' })
  }
})

router.get('/purchase-orders/items', async (req: AuthRequest, res: Response) => {
  try {
    const { xCode, search, page = '1', limit = '100' } = req.query

    let query = `
      SELECT 
        id, xCode, PoDate, Xname, POStatus,
        SupplierID, SupplierName, SupplierCode,
        ItemName, ItemCode, Qty_Com, Qty_Order, Qty_Free,
        Amnt_Cost, Amnt_totalCost, Amnt_Percentage, Amnt_Value,
        Grand_Total, ForceClose, UOM, EQ, TotQty, ItemRemarks
      FROM mod_po_2
      WHERE 1=1
    `
    const params: any[] = []

    if (xCode) {
      query += ' AND xCode = ?'
      params.push(xCode)
    }

    if (search) {
      query += ' AND (xCode LIKE ? OR ItemName LIKE ? OR ItemCode LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await posPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY id ASC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [records] = await posPool.query<RowDataPacket[]>(query, params)

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching POS PO items:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch POS purchase order items' })
  }
})

router.get('/physical-inventory/headers', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, page = '1', limit = '50' } = req.query

    let query = `
      SELECT 
        id, xCode, Xname, DatesTart, DateEnd,
        CheckBy, Approve, Remarks,
        ExQty, ExAmnt, OQty, OAmnt, UQty, UAmnt,
        PerOQty, PerUQty, PerOAmnt, PerUAmnt,
        POStatus, DateCreate, CreateBy, DateModi, ModiBy, title
      FROM mod_phy_1
      WHERE 1=1
    `
    const params: any[] = []

    if (search) {
      query += ' AND (xCode LIKE ? OR Xname LIKE ? OR title LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    if (status) {
      query += ' AND POStatus = ?'
      params.push(status)
    }

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await posPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY DatesTart DESC, id DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [records] = await posPool.query<RowDataPacket[]>(query, params)

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching physical inventory headers:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch physical inventory headers' })
  }
})

router.get('/physical-inventory/items', async (req: AuthRequest, res: Response) => {
  try {
    const { xCode, search, page = '1', limit = '100' } = req.query

    let query = `
      SELECT 
        id, PhyDate, Xname, ItemName, ItemCode,
        Class, Dept, Location, SysQty, AdjQty, AdjPer, Cost, title
      FROM mod_phy_2
      WHERE 1=1
    `
    const params: any[] = []

    if (xCode) {
      query += ' AND xCode = ?'
      params.push(xCode)
    }

    if (search) {
      query += ' AND (xCode LIKE ? OR ItemName LIKE ? OR ItemCode LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await posPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY id ASC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [records] = await posPool.query<RowDataPacket[]>(query, params)

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching physical inventory items:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch physical inventory items' })
  }
})

router.get('/suppliers', async (req: AuthRequest, res: Response) => {
  try {
    const { search, active, page = '1', limit = '50' } = req.query

    let query = `
      SELECT 
        Id as id, Xcode as code, Xname as name, term, contact,
        tel as phone, address, acctNo as account_number, fax, email, notes,
        DateCreate as created_at, CreateBy as created_by,
        DateModi as updated_at, ModiBy as updated_by,
        active, Tin as tin, InputVAT as input_vat
      FROM inv_refsupplier
      WHERE 1=1
    `
    const params: any[] = []

    if (search) {
      query += ' AND (Xcode LIKE ? OR Xname LIKE ? OR contact LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    if (active !== undefined) {
      query += ' AND active = ?'
      params.push(active === 'true' ? 'True' : 'False')
    }

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await posPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY Xname ASC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [suppliers] = await posPool.query<RowDataPacket[]>(query, params)

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
    console.error('Error fetching POS suppliers:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch POS suppliers' })
  }
})

// ==================== Physical Count Endpoints ====================

// Physical Count Headers List
router.get('/physical-count/headers', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, page = '1', limit = '50' } = req.query

    let query = `
      SELECT 
        id, xCode, Xname, DatesTart, DateEnd, CheckBy, Approve,
        Remarks, ExQty, ExAmnt, OQty, OAmnt, UQty, UAmnt,
        PerOQty, PerUQty, PerOAmnt, PerUAmnt, POStatus,
        DateCreate, CreateBy, DateModi, ModiBy, title
      FROM mod_phy_1
      WHERE 1=1
    `
    const params: any[] = []

    if (search) {
      query += ' AND (xCode LIKE ? OR Xname LIKE ? OR title LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    if (status) {
      query += ' AND POStatus = ?'
      params.push(status)
    }

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await posPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY DatesTart DESC, id DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [records] = await posPool.query<RowDataPacket[]>(query, params)

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching Physical Count headers:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch physical count headers' })
  }
})

// Physical Count Stats
router.get('/physical-count/stats', async (req: AuthRequest, res: Response) => {
  try {
    // Total Physical Counts
    const [totalResult] = await posPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count, 
              COALESCE(SUM(ExAmnt), 0) as totalAmount,
              COALESCE(SUM(OAmnt), 0) as overAmount,
              COALESCE(SUM(UAmnt), 0) as underAmount
       FROM mod_phy_1`
    )
    
    // By Status
    const [statusResult] = await posPool.query<RowDataPacket[]>(
      `SELECT POStatus, COUNT(*) as count 
       FROM mod_phy_1 
       GROUP BY POStatus`
    )
    
    // This Year
    const [thisYearResult] = await posPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count 
       FROM mod_phy_1 
       WHERE YEAR(DatesTart) = YEAR(CURDATE())`
    )
    
    // Total Items Counted
    const [itemsResult] = await posPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count,
              COALESCE(SUM(ABS(AdjQty)), 0) as totalAdjustments
       FROM mod_phy_2`
    )
    
    // Recent Physical Counts
    const [recentResult] = await posPool.query<RowDataPacket[]>(
      `SELECT id, xCode, Xname, DatesTart, DateEnd, POStatus, CheckBy, 
              ExQty, ExAmnt, OQty, OAmnt, UQty, UAmnt
       FROM mod_phy_1
       ORDER BY DatesTart DESC, id DESC
       LIMIT 5`
    )
    
    // Build status counts
    const statusCounts: Record<string, number> = {}
    for (const row of statusResult) {
      const status = row.POStatus || 'Unknown'
      statusCounts[status] = row.count
    }

    res.json({
      success: true,
      data: {
        total: {
          count: totalResult[0]?.count || 0,
          totalAmount: totalResult[0]?.totalAmount || 0,
          overAmount: totalResult[0]?.overAmount || 0,
          underAmount: totalResult[0]?.underAmount || 0
        },
        thisYear: thisYearResult[0]?.count || 0,
        itemsCounted: itemsResult[0]?.count || 0,
        totalAdjustments: itemsResult[0]?.totalAdjustments || 0,
        byStatus: statusCounts,
        recent: recentResult
      }
    })
  } catch (error) {
    console.error('Error fetching Physical Count stats:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch physical count stats' })
  }
})

// Single Physical Count Detail with Items
router.get('/physical-count/:xCode', async (req: AuthRequest, res: Response) => {
  try {
    const { xCode } = req.params
    
    // Get header
    const [headerResult] = await posPool.query<RowDataPacket[]>(
      `SELECT * FROM mod_phy_1 WHERE xCode = ?`,
      [xCode]
    )
    
    if (!headerResult.length) {
      res.status(404).json({ success: false, message: 'Physical count not found' })
      return
    }
    
    // Get items
    const [itemsResult] = await posPool.query<RowDataPacket[]>(
      `SELECT * FROM mod_phy_2 WHERE xCode = ? ORDER BY id`,
      [xCode]
    )
    
    res.json({
      success: true,
      data: {
        header: headerResult[0],
        items: itemsResult
      }
    })
  } catch (error) {
    console.error('Error fetching Physical Count detail:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch physical count detail' })
  }
})

// Physical Count Items List
router.get('/physical-count/items', async (req: AuthRequest, res: Response) => {
  try {
    const { xCode, search, page = '1', limit = '100' } = req.query

    let query = `
      SELECT 
        id, xCode, PhyDate, Xname, ItemName, ItemCode, Class, Dept, Location,
        SysQty, UserQty, AdjQty, AdjPer, Cost, title
      FROM mod_phy_2
      WHERE 1=1
    `
    const params: any[] = []

    if (xCode) {
      query += ' AND xCode = ?'
      params.push(xCode)
    }

    if (search) {
      query += ' AND (ItemCode LIKE ? OR ItemName LIKE ? OR Class LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult] = await posPool.query<RowDataPacket[]>(countQuery, params)
    const total = countResult[0]?.total || 0
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    query += ' ORDER BY id ASC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const [records] = await posPool.query<RowDataPacket[]>(query, params)

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching Physical Count items:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch physical count items' })
  }
})

// ==================== General Stats ====================

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [poStats] = await posPool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_pos,
        COUNT(CASE WHEN POStatus = 'Open' THEN 1 END) as open_pos,
        COUNT(CASE WHEN POStatus = 'Closed' THEN 1 END) as closed_pos,
        SUM(Amnt_GrandCost) as total_amount
      FROM mod_po_1
    `)

    const [phyStats] = await posPool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_counts,
        COUNT(CASE WHEN POStatus = 'Open' THEN 1 END) as open_counts,
        COUNT(CASE WHEN POStatus = 'Closed' THEN 1 END) as closed_counts
      FROM mod_phy_1
    `)

    const [supplierStats] = await posPool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_suppliers,
        COUNT(CASE WHEN active = 'True' THEN 1 END) as active_suppliers
      FROM inv_refsupplier
    `)

    res.json({
      success: true,
      data: {
        purchaseOrders: poStats[0] || {},
        physicalInventory: phyStats[0] || {},
        suppliers: supplierStats[0] || {}
      }
    })
  } catch (error) {
    console.error('Error fetching POS stats:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch POS stats' })
  }
})

export default router
