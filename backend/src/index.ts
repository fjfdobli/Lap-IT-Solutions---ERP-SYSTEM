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
    results.forEach(r => {
      if (r.ok) {
        console.log(`Database connected successfully: ${r.which}`)
      } else {
        console.error(`Database connection failed: ${r.which} — ${r.info ?? 'unknown error'}`)
      }
    })
  } catch (err) {
    console.error('Error testing DB connections on startup', err)
  }
})()

async function shutdown() {
  console.log('Shutting down server...')
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
