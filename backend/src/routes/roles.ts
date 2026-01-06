import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { erpPool } from '../database/database'
import { authenticateToken, requireSuperAdmin } from '../middleware/auth'
import { AuthRequest } from '../types'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { notifyRoleChange } from '../utils/notifications'

const router = Router()

router.use(authenticateToken)

router.get('/', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [roles] = await erpPool.query<RowDataPacket[]>(
      `SELECT r.*, 
              creator.first_name as creator_first_name, 
              creator.last_name as creator_last_name,
              (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) as user_count
       FROM roles r
       LEFT JOIN users creator ON r.created_by = creator.id
       ORDER BY r.is_system_role DESC, r.name ASC`
    )

    res.json({
      success: true,
      data: roles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isSystemRole: r.is_system_role,
        userCount: r.user_count,
        createdAt: r.created_at,
        createdBy: r.creator_first_name ? `${r.creator_first_name} ${r.creator_last_name}` : null,
      }))
    })
  } catch (err) {
    console.error('List roles error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const [roles] = await erpPool.query<RowDataPacket[]>(
      `SELECT r.*, 
              creator.first_name as creator_first_name, 
              creator.last_name as creator_last_name
       FROM roles r
       LEFT JOIN users creator ON r.created_by = creator.id
       WHERE r.id = ?`,
      [id]
    )

    if (roles.length === 0) {
      res.status(404).json({ success: false, error: 'Role not found' })
      return
    }

    const role = roles[0]!

    const [permissions] = await erpPool.query<RowDataPacket[]>(
      `SELECT p.id, p.module, p.action, p.description
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?
       ORDER BY p.module, p.action`,
      [id]
    )

    const [users] = await erpPool.query<RowDataPacket[]>(
      `SELECT u.id, u.email, u.first_name, u.last_name
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE ur.role_id = ?`,
      [id]
    )

    res.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystemRole: role.is_system_role,
        createdAt: role.created_at,
        updatedAt: role.updated_at,
        createdBy: role.creator_first_name ? `${role.creator_first_name} ${role.creator_last_name}` : null,
        permissions: permissions.map(p => ({
          id: p.id,
          module: p.module,
          action: p.action,
          description: p.description,
        })),
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          fullName: `${u.first_name} ${u.last_name}`,
        })),
      }
    })
  } catch (err) {
    console.error('Get role error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, permissionIds } = req.body

    if (!name) {
      res.status(400).json({ success: false, error: 'Role name required' })
      return
    }

    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT id FROM roles WHERE name = ?',
      [name]
    )

    if (existing.length > 0) {
      res.status(400).json({ success: false, error: 'Role name already exists' })
      return
    }

    const roleId = uuidv4()
    const now = new Date()

    await erpPool.query(
      `INSERT INTO roles (id, name, description, created_at, updated_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [roleId, name, description || null, now, now, req.user!.userId]
    )

    if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
      const permValues = permissionIds.map(permId => [roleId, permId, now])
      await erpPool.query(
        `INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES ?`,
        [permValues]
      )
    }

    // Send notification for new role creation
    await notifyRoleChange(req.user!.userId, 'created', name)

    res.status(201).json({
      success: true,
      data: {
        id: roleId,
        name,
        description,
      }
    })
  } catch (err) {
    console.error('Create role error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.put('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, permissionIds } = req.body

    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT id, is_system_role FROM roles WHERE id = ?',
      [id]
    )

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Role not found' })
      return
    }

    const existingRole = existing[0]!
    if (existingRole.is_system_role && name && name !== existingRole.name) {
      res.status(400).json({ success: false, error: 'Cannot rename system roles' })
      return
    }

    if (name) {
      const [nameCheck] = await erpPool.query<RowDataPacket[]>(
        'SELECT id FROM roles WHERE name = ? AND id != ?',
        [name, id]
      )

      if (nameCheck.length > 0) {
        res.status(400).json({ success: false, error: 'Role name already exists' })
        return
      }
    }

    const updates: string[] = []
    const params: any[] = []

    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }

    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }

    if (updates.length > 0) {
      params.push(id)
      await erpPool.query(
        `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`,
        params
      )
    }

    if (permissionIds !== undefined && Array.isArray(permissionIds)) {
      await erpPool.query('DELETE FROM role_permissions WHERE role_id = ?', [id])
      
      if (permissionIds.length > 0) {
        const permValues = permissionIds.map(permId => [id, permId])
        await erpPool.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ?`,
          [permValues]
        )
      }
    }

    // Send notification for role update
    const [roleInfo] = await erpPool.query<RowDataPacket[]>(
      'SELECT name FROM roles WHERE id = ?',
      [id]
    )
    if (roleInfo.length > 0) {
      await notifyRoleChange(req.user!.userId, 'updated', roleInfo[0]!.name)
    }

    res.json({ success: true, message: 'Role updated successfully' })
  } catch (err) {
    console.error('Update role error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.delete('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const [existing] = await erpPool.query<RowDataPacket[]>(
      'SELECT name, is_system_role FROM roles WHERE id = ?',
      [id]
    )

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Role not found' })
      return
    }

    const role = existing[0]!
    if (role.is_system_role) {
      res.status(400).json({ success: false, error: 'Cannot delete system roles' })
      return
    }

    await erpPool.query('DELETE FROM roles WHERE id = ?', [id])

    // Send notification for role deletion
    await notifyRoleChange(req.user!.userId, 'deleted', role.name)

    res.json({ success: true, message: 'Role deleted successfully' })
  } catch (err) {
    console.error('Delete role error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
