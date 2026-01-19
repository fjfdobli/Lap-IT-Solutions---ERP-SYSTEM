import { Router, Response } from 'express'
import { erpPool, posPool, ibsPosPool, myDineInPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket } from 'mysql2'

const router = Router()

function getPool(dbName: string) {
  switch (dbName) {
    case 'erp_database':
      return erpPool
    case 'ibs_pos_new':
      return posPool
    case 'ibs_pos':
      return ibsPosPool
    case 'mydinein':
      return myDineInPool
    default:
      return null
  }
}

router.get('/databases/:dbName/tables', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const dbName = req.params.dbName as string
    const pool = getPool(dbName)
    
    if (!pool) {
      res.status(400).json({ success: false, error: 'Invalid database name' })
      return
    }

    const [tables] = await pool.query<RowDataPacket[]>('SHOW TABLES')
    const tableNames = tables.map((row: any) => Object.values(row)[0])

    res.json({
      success: true,
      data: {
        database: dbName,
        tableCount: tableNames.length,
        tables: tableNames
      }
    })
  } catch (error: any) {
    console.error(`Error listing tables for ${req.params.dbName}:`, error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list tables',
      details: error?.message 
    })
  }
})

router.get('/databases/:dbName/tables/:tableName/structure', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const dbName = req.params.dbName as string
    const tableName = req.params.tableName as string
    const pool = getPool(dbName)
    
    if (!pool) {
      res.status(400).json({ success: false, error: 'Invalid database name' })
      return
    }

    const [columns] = await pool.query<RowDataPacket[]>('DESCRIBE ??', [tableName])

    res.json({
      success: true,
      data: {
        database: dbName,
        tableName,
        columns: columns.map((col: any) => ({
          field: col.Field,
          type: col.Type,
          nullable: col.Null === 'YES',
          key: col.Key,
          default: col.Default
        }))
      }
    })
  } catch (error: any) {
    console.error(`Error getting structure for ${req.params.tableName}:`, error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get table structure',
      details: error?.message 
    })
  }
})

router.get('/databases/:dbName/tables/:tableName/sample', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const dbName = req.params.dbName as string
    const tableName = req.params.tableName as string
    const limit = parseInt(req.query.limit as string) || 10
    const pool = getPool(dbName)
    
    if (!pool) {
      res.status(400).json({ success: false, error: 'Invalid database name' })
      return
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM ?? LIMIT ?', [tableName, limit])
    const [countResult] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM ??', [tableName])
    const total = countResult[0]?.total || 0

    res.json({
      success: true,
      data: {
        database: dbName,
        tableName,
        totalRecords: total,
        sampleSize: rows.length,
        rows
      }
    })
  } catch (error: any) {
    console.error(`Error getting sample from ${req.params.tableName}:`, error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get sample data',
      details: error?.message 
    })
  }
})

router.get('/databases/:dbName/overview', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const dbName = req.params.dbName as string
    const pool = getPool(dbName)
    
    if (!pool) {
      res.status(400).json({ success: false, error: 'Invalid database name' })
      return
    }

    const [tables] = await pool.query<RowDataPacket[]>('SHOW TABLES')
    const tableNames = tables.map((row: any) => Object.values(row)[0] as string)
    const tableStats: Array<{ name: string; rowCount: number }> = []
    
    for (const tableName of tableNames) {
      try {
        const [countResult] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM ??', [tableName])
        tableStats.push({
          name: tableName,
          rowCount: countResult[0]?.count || 0
        })
      } catch {
        tableStats.push({
          name: tableName,
          rowCount: -1 
        })
      }
    }

    tableStats.sort((a, b) => b.rowCount - a.rowCount)

    const categories: Record<string, string[]> = {}
    for (const table of tableStats) {
      const prefix = table.name.split('_')[0] || 'other'
      if (!categories[prefix]) {
        categories[prefix] = []
      }
      categories[prefix].push(table.name)
    }

    res.json({
      success: true,
      data: {
        database: dbName,
        totalTables: tableNames.length,
        totalRows: tableStats.reduce((sum, t) => sum + (t.rowCount > 0 ? t.rowCount : 0), 0),
        tablesByRowCount: tableStats,
        tablesByCategory: categories
      }
    })
  } catch (error: any) {
    console.error(`Error getting overview for ${req.params.dbName}:`, error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get database overview',
      details: error?.message 
    })
  }
})

router.get('/databases/:dbName/product-analysis', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const dbName = req.params.dbName as string
    const pool = getPool(dbName)
    
    if (!pool) {
      res.status(400).json({ success: false, error: 'Invalid database name' })
      return
    }

    const [tables] = await pool.query<RowDataPacket[]>('SHOW TABLES')
    const tableNames = tables.map((row: any) => Object.values(row)[0] as string)

    const productTables = tableNames.filter(t => 
      t.toLowerCase().includes('item') || 
      t.toLowerCase().includes('product') ||
      t.toLowerCase().includes('menu') ||
      t.toLowerCase().includes('food') ||
      t.toLowerCase().includes('inv_ref')
    )

    const categoryTables = tableNames.filter(t => 
      t.toLowerCase().includes('class') || 
      t.toLowerCase().includes('category') ||
      t.toLowerCase().includes('dept') ||
      t.toLowerCase().includes('group')
    )

    const transactionTables = tableNames.filter(t => 
      t.toLowerCase().includes('trans') || 
      t.toLowerCase().includes('order') ||
      t.toLowerCase().includes('sale') ||
      t.toLowerCase().includes('pos_')
    )

    const productSamples: Array<{ table: string; sample: any[] }> = []
    
    for (const tableName of productTables.slice(0, 5)) {
      try {
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM ?? LIMIT 5', 
          [tableName]
        )
        productSamples.push({ table: tableName, sample: rows })
      } catch {
        // Skip if error
      }
    }

    const categorySamples: Array<{ table: string; sample: any[] }> = []
    
    for (const tableName of categoryTables.slice(0, 3)) {
      try {
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM ?? LIMIT 10', 
          [tableName]
        )
        categorySamples.push({ table: tableName, sample: rows })
      } catch {
        // Skip if error
      }
    }

    res.json({
      success: true,
      data: {
        database: dbName,
        analysis: {
          productTables,
          categoryTables,
          transactionTables,
          productSamples,
          categorySamples
        }
      }
    })
  } catch (error: any) {
    console.error(`Error analyzing products for ${req.params.dbName}:`, error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze products',
      details: error?.message 
    })
  }
})

router.get('/test-connections', authenticateToken, async (req: AuthRequest, res: Response) => {
  const results: Array<{ database: string; connected: boolean; error?: string }> = []

  try {
    await erpPool.query('SELECT 1')
    results.push({ database: 'erp_database', connected: true })
  } catch (err: any) {
    results.push({ database: 'erp_database', connected: false, error: err?.message })
  }

  try {
    await posPool.query('SELECT 1')
    results.push({ database: 'ibs_pos_new', connected: true })
  } catch (err: any) {
    results.push({ database: 'ibs_pos_new', connected: false, error: err?.message })
  }

  try {
    await ibsPosPool.query('SELECT 1')
    results.push({ database: 'ibs_pos', connected: true })
  } catch (err: any) {
    results.push({ database: 'ibs_pos', connected: false, error: err?.message })
  }

  try {
    await myDineInPool.query('SELECT 1')
    results.push({ database: 'mydinein', connected: true })
  } catch (err: any) {
    results.push({ database: 'mydinein', connected: false, error: err?.message })
  }

  const allConnected = results.every(r => r.connected)

  res.json({
    success: true,
    data: {
      allConnected,
      connections: results
    }
  })
})





























export default router
