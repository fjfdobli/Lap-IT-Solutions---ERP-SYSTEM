import { Router, Response } from 'express'
import { erpPool } from '../database/database'
import { authenticateToken, requireSuperAdmin } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket } from 'mysql2'

const router = Router()

router.use(authenticateToken)
router.get('/', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [permissions] = await erpPool.query<RowDataPacket[]>(
      `SELECT id, module, action, description, created_at
       FROM permissions
       ORDER BY module, action`
    )

    const grouped = permissions.reduce((acc: Record<string, any[]>, p) => {
      if (!acc[p.module]) {
        acc[p.module] = []
      }
      acc[p.module]!.push({
        id: p.id,
        action: p.action,
        description: p.description,
      })
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        permissions: permissions.map(p => ({
          id: p.id,
          module: p.module,
          action: p.action,
          description: p.description,
        })),
        grouped,
        modules: Object.keys(grouped),
      }
    })
  } catch (err) {
    console.error('List permissions error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/modules', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [modules] = await erpPool.query<RowDataPacket[]>(
      `SELECT DISTINCT module FROM permissions ORDER BY module`
    )

    res.json({
      success: true,
      data: modules.map(m => m.module)
    })
  } catch (err) {
    console.error('List modules error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
