import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

export const erpPool = mysql.createPool({
  host: process.env.ERP_DB_HOST || 'localhost',
  port: Number(process.env.ERP_DB_PORT || 3306),
  user: process.env.ERP_DB_USER || 'ibs',  
  password: process.env.ERP_DB_PASSWORD || 'worldwide',
  database: process.env.ERP_DB_NAME || 'erp_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export const posPool = mysql.createPool({
  host: process.env.POS_DB_HOST || 'localhost',
  port: Number(process.env.POS_DB_PORT || 3306),
  user: process.env.POS_DB_USER || 'ibs',
  password: process.env.POS_DB_PASSWORD || 'worldwide',
  database: process.env.POS_DB_NAME || 'ibs_pos_new',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
})

export async function testConnections() {
  const results: { which: string; ok: boolean; info?: string }[] = []
  try {
    const [row] = await erpPool.query('SELECT 1 as ok')
    results.push({ which: 'erp_database', ok: true })
  } catch (err: any) {
    results.push({ which: 'erp_database', ok: false, info: String(err?.message || err) })
  }

  try {
    const [row] = await posPool.query('SELECT 1 as ok')
    results.push({ which: 'ibs_pos_new', ok: true })
  } catch (err: any) {
    results.push({ which: 'ibs_pos_new', ok: false, info: String(err?.message || err) })
  }

  return results
}

export async function closePools() {
  await Promise.all([erpPool.end(), posPool.end()])
}
