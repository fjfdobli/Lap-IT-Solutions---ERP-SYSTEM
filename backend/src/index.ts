import express, { type Request, type Response } from 'express'
import { testConnections, closePools } from './database/database'

const app = express()
const PORT = Number(process.env.PORT || 3000)

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Backend is running!' })
})

app.get('/db-status', async (_req: Request, res: Response) => {
  const results = await testConnections()
  res.json({ databases: results })
})

const server = app.listen(PORT, () => {
  console.log(`API endpoints are available at: http://localhost:${PORT}`)
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
