import { posPool, erpPool } from '../database/database'
import { RowDataPacket } from 'mysql2'
import { v4 as uuidv4 } from 'uuid'

interface POSSnapshot {
  transactionCount: number
  lastTransactionId: number | null
  lastTransactionDate: string | null
  todaySalesAmount: number
  todaySalesCount: number
  receivingCount: number
  lastReceivingId: number | null
  poCount: number
  lastPOId: number | null
  voidCount: number
  lastVoidId: string | null  // Changed to string since no ID column
  returnCount: number
  lastReturnId: number | null
  transferOutCount: number
  lastTransferOutId: number | null
  transferInCount: number
  lastTransferInId: number | null
  physicalCountCount: number
  lastPhysicalCountId: number | null
  lowStockItems: number
}

// In-memory cache for last snapshot
let lastSnapshot: POSSnapshot | null = null
let isMonitoring = false
let monitorInterval: NodeJS.Timeout | null = null

// Helper function to safely query POS database
async function safePosQuery<T>(query: string, defaultValue: T): Promise<T> {
  try {
    const [result] = await posPool.query<RowDataPacket[]>(query)
    return (result[0] || defaultValue) as T
  } catch (error) {
    console.warn(`POS Monitor query failed: ${query.substring(0, 50)}...`)
    return defaultValue
  }
}

// Create notification for all active users
async function createNotificationForAllUsers(
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  source: string
) {
  try {
    // Get all active users
    const [users] = await erpPool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE status = "active"'
    )

    for (const user of users) {
      const id = uuidv4()
      await erpPool.query(
        `INSERT INTO notifications (id, user_id, title, message, type, source, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())`,
        [id, user.id, title, message, type, source]
      )
    }

    console.log(`[POS Monitor] Notification sent to ${users.length} users: ${title}`)
  } catch (error) {
    console.error('[POS Monitor] Failed to create notifications:', error)
  }
}

// Get current POS snapshot
async function getCurrentSnapshot(): Promise<POSSnapshot> {
  const [transCount, todaySales, receivingCount, poCount, voidCount, returnCount, 
         transferOutCount, transferInCount, phyCountCount, lowStock] = await Promise.all([
    // Transaction count and last ID
    safePosQuery<{ count: number; lastId: number | null; lastDate: string | null }>(
      `SELECT COUNT(*) as count, MAX(ID) as lastId, MAX(DateTrans) as lastDate FROM pos_trans_header`,
      { count: 0, lastId: null, lastDate: null }
    ),
    // Today's sales
    safePosQuery<{ count: number; amount: number }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(NetSales), 0) as amount 
       FROM pos_trans_header WHERE DATE(DateTrans) = CURDATE()`,
      { count: 0, amount: 0 }
    ),
    // Receiving count
    safePosQuery<{ count: number; lastId: number | null }>(
      `SELECT COUNT(*) as count, MAX(id) as lastId FROM mod_rr_1`,
      { count: 0, lastId: null }
    ),
    // PO count
    safePosQuery<{ count: number; lastId: number | null }>(
      `SELECT COUNT(*) as count, MAX(id) as lastId FROM mod_po_1`,
      { count: 0, lastId: null }
    ),
    // Void count - use TRNo_H as unique identifier since no ID column
    safePosQuery<{ count: number; lastId: string | null }>(
      `SELECT COUNT(*) as count, MAX(TRNo_H) as lastId FROM pos_void_header`,
      { count: 0, lastId: null }
    ),
    // Return count
    safePosQuery<{ count: number; lastId: number | null }>(
      `SELECT COUNT(*) as count, MAX(ID) as lastId FROM pos_return_header`,
      { count: 0, lastId: null }
    ),
    // Transfer Out count
    safePosQuery<{ count: number; lastId: number | null }>(
      `SELECT COUNT(*) as count, MAX(id) as lastId FROM mod_transferout_1`,
      { count: 0, lastId: null }
    ),
    // Transfer In count
    safePosQuery<{ count: number; lastId: number | null }>(
      `SELECT COUNT(*) as count, MAX(id) as lastId FROM mod_transferin_1`,
      { count: 0, lastId: null }
    ),
    // Physical Count count
    safePosQuery<{ count: number; lastId: number | null }>(
      `SELECT COUNT(*) as count, MAX(id) as lastId FROM mod_phy_1`,
      { count: 0, lastId: null }
    ),
    // Low stock items (items with 0 or negative QtyOnHand)
    safePosQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM inv_refitem WHERE COALESCE(QtyOnHand, 0) <= 0 AND active = 1`,
      { count: 0 }
    )
  ])

  return {
    transactionCount: transCount.count,
    lastTransactionId: transCount.lastId,
    lastTransactionDate: transCount.lastDate,
    todaySalesAmount: todaySales.amount,
    todaySalesCount: todaySales.count,
    receivingCount: receivingCount.count,
    lastReceivingId: receivingCount.lastId,
    poCount: poCount.count,
    lastPOId: poCount.lastId,
    voidCount: voidCount.count,
    lastVoidId: voidCount.lastId,
    returnCount: returnCount.count,
    lastReturnId: returnCount.lastId,
    transferOutCount: transferOutCount.count,
    lastTransferOutId: transferOutCount.lastId,
    transferInCount: transferInCount.count,
    lastTransferInId: transferInCount.lastId,
    physicalCountCount: phyCountCount.count,
    lastPhysicalCountId: phyCountCount.lastId,
    lowStockItems: lowStock.count
  }
}

// Get details of new transactions
async function getNewTransactionDetails(lastId: number): Promise<Array<{ TRNo_H: string; NetSales: number; xUser: string }>> {
  try {
    const [rows] = await posPool.query<RowDataPacket[]>(
      `SELECT TRNo_H, NetSales, xUser FROM pos_trans_header WHERE ID > ? ORDER BY ID DESC LIMIT 5`,
      [lastId]
    )
    return rows as Array<{ TRNo_H: string; NetSales: number; xUser: string }>
  } catch {
    return []
  }
}

// Get details of new receiving
async function getNewReceivingDetails(lastId: number): Promise<Array<{ xCode: string; SupplierName: string; Amnt_GrandCost: number }>> {
  try {
    const [rows] = await posPool.query<RowDataPacket[]>(
      `SELECT xCode, SupplierName, Amnt_GrandCost FROM mod_rr_1 WHERE id > ? ORDER BY id DESC LIMIT 5`,
      [lastId]
    )
    return rows as Array<{ xCode: string; SupplierName: string; Amnt_GrandCost: number }>
  } catch {
    return []
  }
}

// Get details of new POs
async function getNewPODetails(lastId: number): Promise<Array<{ xCode: string; SupplierName: string; Amnt_GrandCost: number }>> {
  try {
    const [rows] = await posPool.query<RowDataPacket[]>(
      `SELECT xCode, SupplierName, Amnt_GrandCost FROM mod_po_1 WHERE id > ? ORDER BY id DESC LIMIT 5`,
      [lastId]
    )
    return rows as Array<{ xCode: string; SupplierName: string; Amnt_GrandCost: number }>
  } catch {
    return []
  }
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount)
}

// Check for changes and create notifications
async function checkForChanges() {
  const currentSnapshot = await getCurrentSnapshot()

  if (!lastSnapshot) {
    lastSnapshot = currentSnapshot
    // console.log('[POS Monitor] Initial snapshot captured')
    return
  }

  // Check for new transactions
  if (currentSnapshot.lastTransactionId && lastSnapshot.lastTransactionId && 
      currentSnapshot.lastTransactionId > lastSnapshot.lastTransactionId) {
    const newCount = currentSnapshot.transactionCount - lastSnapshot.transactionCount
    const newTransactions = await getNewTransactionDetails(lastSnapshot.lastTransactionId)
    
    if (newTransactions.length > 0) {
      const totalAmount = newTransactions.reduce((sum, t) => sum + Number(t.NetSales || 0), 0)
      await createNotificationForAllUsers(
        `${newCount} New Sale${newCount > 1 ? 's' : ''} Recorded`,
        `${newCount} new transaction${newCount > 1 ? 's' : ''} totaling ${formatCurrency(totalAmount)}. Latest: ${newTransactions[0]?.TRNo_H || 'N/A'} by ${newTransactions[0]?.xUser || 'Unknown'}`,
        'success',
        'pos_sales'
      )
    }
  }

  // Check for new receiving
  if (currentSnapshot.lastReceivingId && lastSnapshot.lastReceivingId && 
      currentSnapshot.lastReceivingId > lastSnapshot.lastReceivingId) {
    const newCount = currentSnapshot.receivingCount - lastSnapshot.receivingCount
    const newReceiving = await getNewReceivingDetails(lastSnapshot.lastReceivingId)
    
    if (newReceiving.length > 0) {
      const totalAmount = newReceiving.reduce((sum, r) => sum + Number(r.Amnt_GrandCost || 0), 0)
      await createNotificationForAllUsers(
        `${newCount} New Receiving Report${newCount > 1 ? 's' : ''}`,
        `${newCount} receiving report${newCount > 1 ? 's' : ''} worth ${formatCurrency(totalAmount)} from ${newReceiving[0]?.SupplierName || 'Unknown Supplier'}`,
        'info',
        'pos_receiving'
      )
    }
  }

  // Check for new Purchase Orders
  if (currentSnapshot.lastPOId && lastSnapshot.lastPOId && 
      currentSnapshot.lastPOId > lastSnapshot.lastPOId) {
    const newCount = currentSnapshot.poCount - lastSnapshot.poCount
    const newPOs = await getNewPODetails(lastSnapshot.lastPOId)
    
    if (newPOs.length > 0) {
      const totalAmount = newPOs.reduce((sum, po) => sum + Number(po.Amnt_GrandCost || 0), 0)
      await createNotificationForAllUsers(
        `${newCount} New Purchase Order${newCount > 1 ? 's' : ''}`,
        `${newCount} PO${newCount > 1 ? 's' : ''} created worth ${formatCurrency(totalAmount)}. Latest: ${newPOs[0]?.xCode || 'N/A'} for ${newPOs[0]?.SupplierName || 'Unknown'}`,
        'info',
        'pos_purchase_orders'
      )
    }
  }

  // Check for new voids (compare by count since no numeric ID)
  if (currentSnapshot.voidCount > lastSnapshot.voidCount) {
    const newCount = currentSnapshot.voidCount - lastSnapshot.voidCount
    await createNotificationForAllUsers(
      `${newCount} Transaction${newCount > 1 ? 's' : ''} Voided`,
      `${newCount} transaction${newCount > 1 ? 's have' : ' has'} been voided. Please review in Voids & Returns module.`,
      'warning',
      'pos_voids'
    )
  }

  // Check for new returns
  if (currentSnapshot.lastReturnId && lastSnapshot.lastReturnId && 
      currentSnapshot.lastReturnId > lastSnapshot.lastReturnId) {
    const newCount = currentSnapshot.returnCount - lastSnapshot.returnCount
    await createNotificationForAllUsers(
      `${newCount} New Return${newCount > 1 ? 's' : ''}`,
      `${newCount} return${newCount > 1 ? 's have' : ' has'} been processed. Review in Voids & Returns module.`,
      'warning',
      'pos_returns'
    )
  }

  // Check for new transfer out
  if (currentSnapshot.lastTransferOutId && lastSnapshot.lastTransferOutId && 
      currentSnapshot.lastTransferOutId > lastSnapshot.lastTransferOutId) {
    const newCount = currentSnapshot.transferOutCount - lastSnapshot.transferOutCount
    await createNotificationForAllUsers(
      `${newCount} New Transfer Out`,
      `${newCount} outgoing transfer${newCount > 1 ? 's' : ''} recorded. Check Transfers module for details.`,
      'info',
      'pos_transfer_out'
    )
  }

  // Check for new transfer in
  if (currentSnapshot.lastTransferInId && lastSnapshot.lastTransferInId && 
      currentSnapshot.lastTransferInId > lastSnapshot.lastTransferInId) {
    const newCount = currentSnapshot.transferInCount - lastSnapshot.transferInCount
    await createNotificationForAllUsers(
      `${newCount} New Transfer In`,
      `${newCount} incoming transfer${newCount > 1 ? 's' : ''} received. Check Transfers module for details.`,
      'success',
      'pos_transfer_in'
    )
  }

  // Check for new physical count
  if (currentSnapshot.lastPhysicalCountId && lastSnapshot.lastPhysicalCountId && 
      currentSnapshot.lastPhysicalCountId > lastSnapshot.lastPhysicalCountId) {
    const newCount = currentSnapshot.physicalCountCount - lastSnapshot.physicalCountCount
    await createNotificationForAllUsers(
      `${newCount} New Physical Count`,
      `${newCount} physical count${newCount > 1 ? 's' : ''} recorded. Review inventory adjustments.`,
      'info',
      'pos_physical_count'
    )
  }

  // Check for low stock alert (if increased significantly)
  if (currentSnapshot.lowStockItems > lastSnapshot.lowStockItems) {
    const increase = currentSnapshot.lowStockItems - lastSnapshot.lowStockItems
    if (increase >= 5) {
      await createNotificationForAllUsers(
        'Low Stock Alert',
        `${currentSnapshot.lowStockItems} items are now out of stock or low. Review inventory levels.`,
        'error',
        'pos_low_stock'
      )
    }
  }

  // Update last snapshot
  lastSnapshot = currentSnapshot
}

// Start monitoring
export function startPOSMonitor(intervalMs: number = 15000) {
  if (isMonitoring) {
    console.log('[POS Monitor] Already running')
    return
  }

  isMonitoring = true
  // console.log(`[POS Monitor] Starting... (checking every ${intervalMs / 1000}s)`)

  // Initial check
  checkForChanges().catch(err => console.error('[POS Monitor] Initial check error:', err))

  // Set up interval
  monitorInterval = setInterval(() => {
    checkForChanges().catch(err => console.error('[POS Monitor] Check error:', err))
  }, intervalMs)
}

// Stop monitoring
export function stopPOSMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
  }
  isMonitoring = false
  console.log('[POS Monitor] Stopped')
}

// Get current monitoring status
export function getMonitorStatus() {
  return {
    isRunning: isMonitoring,
    lastSnapshot,
    lastCheckTime: lastSnapshot ? new Date().toISOString() : null
  }
}

// Manual trigger for checking changes
export async function triggerCheck() {
  await checkForChanges()
  return { success: true, snapshot: lastSnapshot }
}

// Get POS activity summary for notification endpoint
export async function getPOSActivitySummary() {
  const snapshot = await getCurrentSnapshot()
  return {
    todaySales: {
      count: snapshot.todaySalesCount,
      amount: snapshot.todaySalesAmount
    },
    totalTransactions: snapshot.transactionCount,
    pendingReceiving: snapshot.receivingCount,
    pendingPOs: snapshot.poCount,
    voids: snapshot.voidCount,
    returns: snapshot.returnCount,
    lowStockItems: snapshot.lowStockItems
  }
}
