import express, { type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { testConnections, closePools } from './database/database'
import { config } from './config'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import roleRoutes from './routes/roles'
import permissionRoutes from './routes/permissions'
import healthRoutes from './routes/health'
import deviceRoutes from './routes/devices'
import auditRoutes from './routes/audit'
import notificationRoutes from './routes/notifications'
import settingsRoutes from './routes/settings'
import dashboardRoutes from './routes/dashboard'
import suppliersRoutes from './routes/suppliers'
import productsRoutes from './routes/products'
import inventoryRoutes from './routes/inventory'
import purchaseOrdersRoutes from './routes/purchase-orders'
import posDataRoutes from './routes/pos-data'
import posTablesRoutes from './routes/pos-tables'
import dbExplorerRoutes from './routes/db-explorer'
import multiPosRoutes from './routes/multi-pos'
import r5ReportsRoutes from './routes/r5-reports'
import mydinerReportsRoutes from './routes/mydiner-reports'
import { startPOSMonitor, stopPOSMonitor } from './services/pos-monitor'

const app = express()

app.use(helmet())
app.use(cors(config.cors))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Lap IT Solutions ERP API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
      permissions: '/api/permissions',
      health: '/api/health',
      devices: '/api/devices',
      audit: '/api/audit',
      notifications: '/api/notifications',
      settings: '/api/settings',
      dashboard: '/api/dashboard',
      suppliers: '/api/suppliers',
      products: '/api/products',
      inventory: '/api/inventory',
      purchaseOrders: '/api/purchase-orders',
      posData: '/api/pos-data',
      dbExplorer: '/api/db-explorer',
      multiPos: '/api/multi-pos',
      r5Reports: '/api/r5-reports',
      mydinerReports: '/api/mydiner-reports',
    }
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/suppliers', suppliersRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/purchase-orders', purchaseOrdersRoutes)
app.use('/api/pos-data', posDataRoutes)
app.use('/api/pos-tables', posTablesRoutes)
app.use('/api/db-explorer', dbExplorerRoutes)
app.use('/api/multi-pos', multiPosRoutes)
app.use('/api/r5-reports', r5ReportsRoutes)
app.use('/api/mydiner-reports', mydinerReportsRoutes)

app.get('/db-status', async (_req: Request, res: Response) => {
  const results = await testConnections()
  res.json({ databases: results })
})

const server = app.listen(config.port, () => {
  console.log(`Server running at: http://localhost:${config.port}`)
  console.log(`API endpoints available at: http://localhost:${config.port}/api\n`)
})

;(async () => {
  try {
    const results = await testConnections()
    let allConnected = true
    results.forEach(r => {
      if (r.ok) {
        console.log(`Database connected successfully: ${r.which}`)
      } else {
        console.error(`Database connection failed: ${r.which} — ${r.info ?? 'unknown error'}`)
        allConnected = false
      }
    })
    
    if (allConnected) {
      startPOSMonitor(15000) 
    }
  } catch (err) {
    console.error('Error testing DB connections on startup', err)
  }
})()

async function shutdown() {
  console.log('Shutting down server...')
  stopPOSMonitor()
  server.close(async () => {
    try {
      await closePools()
      console.log('DB pools closed')
    } catch (err) {
      console.warn('Error closing DB pools', err)
    }
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
