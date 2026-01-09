import { Router, Response } from 'express'
import { posPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket } from 'mysql2'

const router = Router()

const TABLE_CONFIG: Record<string, {
  displayName: string
  category: string
  description: string
  primaryKey?: string
  defaultSort?: string
  sortOrder?: 'ASC' | 'DESC'
}> = {
  // Products
  'inv_refitem': {
    displayName: 'Products',
    category: 'Products',
    description: 'Product/Item master list',
    primaryKey: 'xCode',
    defaultSort: 'Xname',
    sortOrder: 'ASC'
  },
  'inv_refitemsrp': {
    displayName: 'Product SRP',
    category: 'Products',
    description: 'Product suggested retail prices',
    primaryKey: 'id'
  },
  'inv_refitemcost': {
    displayName: 'Product Costs',
    category: 'Products',
    description: 'Product cost history',
    primaryKey: 'id'
  },
  'inv_refitempicture': {
    displayName: 'Product Pictures',
    category: 'Products',
    description: 'Product images',
    primaryKey: 'id'
  },
  'inv_refitemunits': {
    displayName: 'Product Units',
    category: 'Products',
    description: 'Product unit of measure',
    primaryKey: 'id'
  },

  // Suppliers
  'inv_refsupplier': {
    displayName: 'Suppliers',
    category: 'Suppliers',
    description: 'Supplier/Vendor master list',
    primaryKey: 'Xcode',
    defaultSort: 'Xname',
    sortOrder: 'ASC'
  },
  'inv_refitemsupplier': {
    displayName: 'Item Suppliers',
    category: 'Suppliers',
    description: 'Item-supplier relationships',
    primaryKey: 'id'
  },

  // Customers
  'inv_refcustomer': {
    displayName: 'Customers',
    category: 'Customers',
    description: 'Customer master list',
    primaryKey: 'xCode',
    defaultSort: 'Xname',
    sortOrder: 'ASC'
  },
  'inv_refcustomer_points': {
    displayName: 'Customer Points',
    category: 'Customers',
    description: 'Customer loyalty points history',
    primaryKey: 'id'
  },

  // Classifications
  'inv_refclass': {
    displayName: 'Classes',
    category: 'Classifications',
    description: 'Product classes',
    primaryKey: 'xCode',
    defaultSort: 'Xname'
  },
  'inv_refdepartment': {
    displayName: 'Departments',
    category: 'Classifications',
    description: 'Departments',
    primaryKey: 'id',
    defaultSort: 'Xname'
  },
  'inv_reflocation': {
    displayName: 'Locations',
    category: 'Classifications',
    description: 'Warehouse/Store locations',
    primaryKey: 'xCode',
    defaultSort: 'Xname'
  },
  'inv_refbranch': {
    displayName: 'Branches',
    category: 'Classifications',
    description: 'Branch locations',
    primaryKey: 'id',
    defaultSort: 'Xname'
  },
  'inv_refcolour': {
    displayName: 'Colors',
    category: 'Classifications',
    description: 'Product colors',
    primaryKey: 'xCode'
  },
  'inv_refsize': {
    displayName: 'Sizes',
    category: 'Classifications',
    description: 'Product sizes',
    primaryKey: 'xCode'
  },
  'inv_refgender': {
    displayName: 'Genders',
    category: 'Classifications',
    description: 'Gender categories',
    primaryKey: 'xCode'
  },
  'inv_refseason': {
    displayName: 'Seasons',
    category: 'Classifications',
    description: 'Seasonal categories',
    primaryKey: 'xCode'
  },

  // Purchase Orders
  'mod_po_1': {
    displayName: 'Purchase Orders',
    category: 'Purchase Orders',
    description: 'Purchase order headers',
    primaryKey: 'id',
    defaultSort: 'PoDate',
    sortOrder: 'DESC'
  },
  'mod_po_2': {
    displayName: 'PO Line Items',
    category: 'Purchase Orders',
    description: 'Purchase order details/line items',
    primaryKey: 'id'
  },

  // Receiving
  'mod_rr_1': {
    displayName: 'Receiving Reports',
    category: 'Receiving',
    description: 'Goods receipt headers',
    primaryKey: 'id',
    defaultSort: 'RRDate',
    sortOrder: 'DESC'
  },
  'mod_rr_2': {
    displayName: 'RR Line Items',
    category: 'Receiving',
    description: 'Receiving report details/line items',
    primaryKey: 'id'
  },

  // Transfers
  'mod_transferin_1': {
    displayName: 'Transfer In',
    category: 'Transfers',
    description: 'Incoming transfer headers',
    primaryKey: 'id',
    defaultSort: 'TrDate',
    sortOrder: 'DESC'
  },
  'mod_transferin_2': {
    displayName: 'Transfer In Items',
    category: 'Transfers',
    description: 'Incoming transfer line items',
    primaryKey: 'id'
  },
  'mod_transferout_1': {
    displayName: 'Transfer Out',
    category: 'Transfers',
    description: 'Outgoing transfer headers',
    primaryKey: 'id',
    defaultSort: 'TrDate',
    sortOrder: 'DESC'
  },
  'mod_transferout_2': {
    displayName: 'Transfer Out Items',
    category: 'Transfers',
    description: 'Outgoing transfer line items',
    primaryKey: 'id'
  },

  // Physical Count
  'mod_phy_1': {
    displayName: 'Physical Count',
    category: 'Physical Count',
    description: 'Physical inventory count headers',
    primaryKey: 'id',
    defaultSort: 'DatesTart',
    sortOrder: 'DESC'
  },
  'mod_phy_2': {
    displayName: 'Physical Count Items',
    category: 'Physical Count',
    description: 'Physical count line items',
    primaryKey: 'id'
  },

  // POS Transactions
  'pos_trans_header': {
    displayName: 'Sales Transactions',
    category: 'POS Transactions',
    description: 'POS transaction headers',
    primaryKey: 'ID',
    defaultSort: 'DateTrans',
    sortOrder: 'DESC'
  },
  'pos_trans_details': {
    displayName: 'Sales Items',
    category: 'POS Transactions',
    description: 'POS transaction line items',
    primaryKey: 'ID'
  },
  'pos_trans_payment': {
    displayName: 'Payment Records',
    category: 'POS Transactions',
    description: 'Payment details for transactions',
    primaryKey: 'ID'
  },
  'pos_close_shift': {
    displayName: 'Shift Reports',
    category: 'POS Transactions',
    description: 'Cashier shift close reports',
    primaryKey: 'ID',
    defaultSort: 'DateTrans',
    sortOrder: 'DESC'
  },

  // Voids & Returns
  'pos_void_header': {
    displayName: 'Voided Transactions',
    category: 'Voids & Returns',
    description: 'Voided transaction headers',
    defaultSort: 'DateTrans',
    sortOrder: 'DESC'
  },
  'pos_void_details': {
    displayName: 'Voided Items',
    category: 'Voids & Returns',
    description: 'Voided transaction line items'
  },
  'pos_return_header': {
    displayName: 'Sales Returns',
    category: 'Voids & Returns',
    description: 'Sales return headers',
    primaryKey: 'ID',
    defaultSort: 'DateTrans',
    sortOrder: 'DESC'
  },
  'pos_return_details': {
    displayName: 'Return Items',
    category: 'Voids & Returns',
    description: 'Sales return line items'
  },

  // Item Movement
  'pro_itemmovement': {
    displayName: 'Item Movement',
    category: 'Item Movement',
    description: 'Stock movement audit trail',
    primaryKey: 'ID',
    defaultSort: 'SysDateT',
    sortOrder: 'DESC'
  },

  // Settings/References
  'inv_refdiscount': {
    displayName: 'Discounts',
    category: 'Settings',
    description: 'Discount types and values',
    primaryKey: 'xCode'
  },
  'inv_reftax': {
    displayName: 'Tax Rates',
    category: 'Settings',
    description: 'Tax configuration',
    primaryKey: 'id'
  },
  'inv_refpayment': {
    displayName: 'Payment Methods',
    category: 'Settings',
    description: 'Payment types',
    primaryKey: 'id'
  },
  'inv_refcreditcard': {
    displayName: 'Credit Cards',
    category: 'Settings',
    description: 'Accepted credit cards',
    primaryKey: 'id'
  },
  'inv_refexpense': {
    displayName: 'Expense Types',
    category: 'Settings',
    description: 'Expense categories',
    primaryKey: 'id'
  },
  'inv_refsalesman': {
    displayName: 'Salesmen',
    category: 'Settings',
    description: 'Sales personnel',
    primaryKey: 'xCode'
  },
  'sys_setup': {
    displayName: 'System Setup',
    category: 'Settings',
    description: 'POS system configuration',
    primaryKey: 'ID'
  }
}

// Get list of all available tables with their configurations
router.get('/tables', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Group tables by category
    const categories: Record<string, Array<{
      tableName: string
      displayName: string
      description: string
    }>> = {}

    for (const [tableName, config] of Object.entries(TABLE_CONFIG)) {
      const category = config.category
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category]!.push({
        tableName,
        displayName: config.displayName,
        description: config.description
      })
    }

    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error getting tables:', error)
    res.status(500).json({ success: false, error: 'Failed to get tables' })
  }
})

// Get table structure (columns)
router.get('/tables/:tableName/structure', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tableName = req.params.tableName as string

    // Validate table name is in our config
    if (!tableName || !TABLE_CONFIG[tableName]) {
      res.status(400).json({ success: false, error: 'Table not found or not accessible' })
      return
    }

    const [columns] = await posPool.query<RowDataPacket[]>(
      'DESCRIBE ??',
      [tableName]
    )

    const config = TABLE_CONFIG[tableName]

    res.json({
      success: true,
      data: {
        tableName,
        displayName: config.displayName,
        description: config.description,
        category: config.category,
        primaryKey: config.primaryKey,
        columns: columns.map((col: any) => ({
          field: col.Field,
          type: col.Type,
          nullable: col.Null === 'YES',
          key: col.Key,
          default: col.Default
        }))
      }
    })
  } catch (error) {
    console.error('Error getting table structure:', error)
    res.status(500).json({ success: false, error: 'Failed to get table structure' })
  }
})

// Get table data with pagination, search, and sorting
router.get('/tables/:tableName/data', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tableName = req.params.tableName as string
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const search = req.query.search as string || ''
    const sortBy = req.query.sortBy as string
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    // Validate table name
    if (!tableName || !TABLE_CONFIG[tableName]) {
      res.status(400).json({ success: false, error: 'Table not found or not accessible' })
      return
    }

    const config = TABLE_CONFIG[tableName]
    const offset = (page - 1) * limit

    // Get columns for search
    const [columns] = await posPool.query<RowDataPacket[]>(
      'DESCRIBE ??',
      [tableName]
    )

    // Build search condition
    let whereClause = ''
    const searchParams: any[] = []
    
    if (search) {
      const searchConditions = columns
        .filter((col: any) => col.Type.includes('varchar') || col.Type.includes('text'))
        .map((col: any) => `?? LIKE ?`)
      
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
    let orderByColumn = config.defaultSort || config.primaryKey || validColumns[0]
    let orderByDirection = config.sortOrder || 'ASC'
    
    if (sortBy && validColumns.includes(sortBy)) {
      orderByColumn = sortBy
      orderByDirection = sortOrder
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ?? ${whereClause}`
    const [countResult] = await posPool.query<RowDataPacket[]>(
      countQuery,
      [tableName, ...searchParams]
    )
    const total = countResult[0]?.total ?? 0

    // Get data with pagination
    const dataQuery = `SELECT * FROM ?? ${whereClause} ORDER BY ?? ${orderByDirection} LIMIT ? OFFSET ?`
    const [rows] = await posPool.query<RowDataPacket[]>(
      dataQuery,
      [tableName, ...searchParams, orderByColumn, limit, offset]
    )

    res.json({
      success: true,
      data: {
        tableName,
        displayName: config.displayName,
        rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error getting table data:', error)
    res.status(500).json({ success: false, error: 'Failed to get table data' })
  }
})

// Get a single record by primary key
router.get('/tables/:tableName/record/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tableName = req.params.tableName as string
    const id = req.params.id as string

    if (!tableName || !TABLE_CONFIG[tableName]) {
      res.status(400).json({ success: false, error: 'Table not found or not accessible' })
      return
    }

    const config = TABLE_CONFIG[tableName]
    if (!config.primaryKey) {
      res.status(400).json({ success: false, error: 'Table does not have a defined primary key' })
      return
    }

    const [rows] = await posPool.query<RowDataPacket[]>(
      'SELECT * FROM ?? WHERE ?? = ?',
      [tableName, config.primaryKey, id]
    )

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Record not found' })
      return
    }

    res.json({
      success: true,
      data: rows[0]
    })
  } catch (error) {
    console.error('Error getting record:', error)
    res.status(500).json({ success: false, error: 'Failed to get record' })
  }
})

// Export table data as CSV (for future use)
router.get('/tables/:tableName/export', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tableName = req.params.tableName as string
    const search = req.query.search as string || ''

    if (!tableName || !TABLE_CONFIG[tableName]) {
      res.status(400).json({ success: false, error: 'Table not found or not accessible' })
      return
    }

    const config = TABLE_CONFIG[tableName]

    // Get all data (with optional search filter)
    const [columns] = await posPool.query<RowDataPacket[]>('DESCRIBE ??', [tableName])
    
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

    const [rows] = await posPool.query<RowDataPacket[]>(
      `SELECT * FROM ?? ${whereClause}`,
      [tableName, ...searchParams]
    )

    // Convert to CSV
    if (rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${tableName}.csv"`)
      res.send('')
      return
    }

    const firstRow = rows[0]
    const headers = firstRow ? Object.keys(firstRow) : []
    const csvRows = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(h => {
          const val = row[h]
          if (val === null || val === undefined) return ''
          const str = String(val)
          // Escape quotes and wrap in quotes if contains comma or quote
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }).join(',')
      )
    ]

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${config.displayName.replace(/\s+/g, '_')}.csv"`)
    res.send(csvRows.join('\n'))
  } catch (error) {
    console.error('Error exporting table:', error)
    res.status(500).json({ success: false, error: 'Failed to export table' })
  }
})

export default router
