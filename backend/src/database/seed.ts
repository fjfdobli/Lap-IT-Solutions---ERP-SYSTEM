import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import { erpPool } from '../database/database'

async function seed() {
  console.log('Seeding database...')

  try {
    const userId = uuidv4()
    const email = 'admin@lapitsolutions.com'
    const password = 'Admin@123' 
    const passwordHash = await bcrypt.hash(password, 10)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    const [existing] = await erpPool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (Array.isArray(existing) && existing.length > 0) {
      console.log('Super admin user already exists')
    } else {
      await erpPool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, user_type, is_active, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, email, passwordHash, 'Super', 'Admin', 'super_admin', true, true, now, now]
      )
    }

    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

seed()
