import { Router, Response, Request } from 'express'
import { testConnections } from '../database/database'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    }
  })
})

router.get('/db', async (req: Request, res: Response) => {
  try {
    const results = await testConnections()
    
    const allConnected = results.every(r => r.ok)

    res.json({
      success: true,
      data: {
        status: allConnected ? 'all_connected' : 'partial',
        databases: results.map(r => ({
          name: r.which,
          connected: r.ok,
          error: r.info || null,
        })),
        timestamp: new Date().toISOString(),
      }
    })
  } catch (err) {
    console.error('Health check error:', err)
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      data: {
        status: 'error',
        timestamp: new Date().toISOString(),
      }
    })
  }
})

export default router
