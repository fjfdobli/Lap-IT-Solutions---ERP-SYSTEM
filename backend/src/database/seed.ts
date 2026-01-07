import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import { erpPool } from './database'

async function seed() {
  console.log('Seeding database...')

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    const superAdminId = uuidv4()
    const superAdminEmail = 'admin@lapitsolutions.com'
    const superAdminPassword = 'Admin@123'
    const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 10)

    const [existingSuperAdmin] = await erpPool.query(
      'SELECT id FROM users WHERE email = ?',
      [superAdminEmail]
    )

    if (Array.isArray(existingSuperAdmin) && existingSuperAdmin.length > 0) {
      console.log('Super admin user already exists')
    } else {
      await erpPool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, user_type, is_active, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [superAdminId, superAdminEmail, superAdminPasswordHash, 'Super', 'Admin', 'super_admin', true, true, now, now]
      )
      console.log('Created Super Admin: admin@lapitsolutions.com / Admin@123')
    }

    const adminId = uuidv4()
    const adminEmail = 'desktop.admin@lapitsolutions.com'
    const adminPassword = 'Desktop@123'
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10)

    const [existingAdmin] = await erpPool.query(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    )

    if (Array.isArray(existingAdmin) && existingAdmin.length > 0) {
      console.log('Desktop admin user already exists')
    } else {
      await erpPool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, user_type, is_active, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [adminId, adminEmail, adminPasswordHash, 'Desktop', 'Admin', 'admin', true, true, now, now]
      )
      console.log('Created Desktop Admin: desktop.admin@lapitsolutions.com / Desktop@123')
    }

    const managerId = uuidv4()
    const managerEmail = 'manager@lapitsolutions.com'
    const managerPassword = 'Manager@123'
    const managerPasswordHash = await bcrypt.hash(managerPassword, 10)

    const [existingManager] = await erpPool.query(
      'SELECT id FROM users WHERE email = ?',
      [managerEmail]
    )

    if (Array.isArray(existingManager) && existingManager.length > 0) {
      console.log('Manager user already exists')
    } else {
      await erpPool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, user_type, is_active, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [managerId, managerEmail, managerPasswordHash, 'Store', 'Manager', 'manager', true, true, now, now]
      )
      console.log('Created Manager: manager@lapitsolutions.com / Manager@123')
    }

    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

seed()
