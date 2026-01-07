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
