import { v4 as uuidv4 } from 'uuid'
import { erpPool } from '../database/database'
import { RowDataPacket } from 'mysql2'

type NotificationType = 'info' | 'warning' | 'error' | 'success'
type NotificationSource = 'web' | 'desktop' | 'system'

interface CreateNotificationParams {
  userId?: string
  title: string
  message: string
  type?: NotificationType
  source?: NotificationSource
}

/**
 * Create a notification for a specific user
 */
export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  source = 'system'
}: CreateNotificationParams): Promise<string | null> {
  try {
    const id = uuidv4()
    await erpPool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, source, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [id, userId, title, message, type, source]
    )
    return id
  } catch (err) {
    console.error('Failed to create notification:', err)
    return null
  }
}

/**
 * Create notifications for all super admins
 */
export async function notifySuperAdmins(
  title: string,
  message: string,
  type: NotificationType = 'info',
  source: NotificationSource = 'system',
  excludeUserId?: string
): Promise<void> {
  try {
    const [admins] = await erpPool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE user_type = "super_admin" AND is_active = TRUE'
    )

    for (const admin of admins) {
      if (excludeUserId && admin.id === excludeUserId) continue
      await createNotification({
        userId: admin.id,
        title,
        message,
        type,
        source
      })
    }
  } catch (err) {
    console.error('Failed to notify super admins:', err)
  }
}

/**
 * Create notification for user activity (new user, status change, etc.)
 */
export async function notifyUserActivity(
  actionUserId: string,
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated',
  targetUserName: string,
  targetUserType: string
): Promise<void> {
  const actionMessages = {
    created: `New ${targetUserType} user "${targetUserName}" has been created`,
    updated: `User "${targetUserName}" profile has been updated`,
    deleted: `User "${targetUserName}" has been deleted`,
    activated: `User "${targetUserName}" has been activated`,
    deactivated: `User "${targetUserName}" has been deactivated`,
  }

  await notifySuperAdmins(
    'User Activity',
    actionMessages[action],
    action === 'deleted' || action === 'deactivated' ? 'warning' : 'info',
    'web',
    actionUserId
  )
}

/**
 * Create notification for device activity
 */
export async function notifyDeviceActivity(
  actionUserId: string,
  action: 'connected' | 'disconnected' | 'registered' | 'removed',
  deviceName: string
): Promise<void> {
  const actionMessages = {
    connected: `Device "${deviceName}" is now online`,
    disconnected: `Device "${deviceName}" has gone offline`,
    registered: `New device "${deviceName}" has been registered`,
    removed: `Device "${deviceName}" has been removed`,
  }

  await notifySuperAdmins(
    'Device Activity',
    actionMessages[action],
    action === 'disconnected' || action === 'removed' ? 'warning' : 'success',
    'desktop',
    actionUserId
  )
}

/**
 * Create notification for role changes
 */
export async function notifyRoleChange(
  actionUserId: string,
  action: 'assigned' | 'removed' | 'created' | 'updated' | 'deleted',
  roleName: string,
  targetUserName?: string
): Promise<void> {
  let title = 'Role Update'
  let message = ''

  switch (action) {
    case 'assigned':
      message = `Role "${roleName}" has been assigned to ${targetUserName}`
      break
    case 'removed':
      message = `Role "${roleName}" has been removed from ${targetUserName}`
      break
    case 'created':
      message = `New role "${roleName}" has been created`
      break
    case 'updated':
      message = `Role "${roleName}" has been updated`
      break
    case 'deleted':
      message = `Role "${roleName}" has been deleted`
      break
  }

  await notifySuperAdmins(
    title,
    message,
    action === 'deleted' || action === 'removed' ? 'warning' : 'info',
    'web',
    actionUserId
  )
}

/**
 * Create notification for security events
 */
export async function notifySecurityEvent(
  userId: string,
  event: 'login' | 'logout' | 'password_change' | 'failed_login',
  details?: string
): Promise<void> {
  const eventMessages = {
    login: 'New login to your account',
    logout: 'You logged out from a session',
    password_change: 'Your password has been changed',
    failed_login: 'Failed login attempt detected',
  }

  await createNotification({
    userId,
    title: 'Security Alert',
    message: details || eventMessages[event],
    type: event === 'failed_login' ? 'warning' : 'info',
    source: 'system'
  })
}

export default {
  createNotification,
  notifySuperAdmins,
  notifyUserActivity,
  notifyDeviceActivity,
  notifyRoleChange,
  notifySecurityEvent,
}
