import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CompactClock } from '@/components/ui/real-time-clock'
import { 
  Users, 
  Shield, 
  Monitor, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight,
  UserPlus,
  Settings,
  Database,
  Server,
  Zap,
  AlertTriangle,
  RefreshCw,
  FileText,
  HelpCircle,
  LogIn,
  UserCog,
  Key,
  Trash2,
  Edit,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface DbStatus {
  name: string
  connected: boolean
  error: string | null
}

interface Stats {
  totalUsers: number
  desktopUsers: number
  superAdmins: number
  activeUsers: number
  inactiveUsers: number
  totalRoles: number
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  dbStatus: DbStatus[]
}

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entityType: string
  timestamp: string
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'LOGIN':
    case 'LOGOUT':
      return LogIn
    case 'CREATE':
      return Plus
    case 'UPDATE':
      return Edit
    case 'DELETE':
      return Trash2
    case 'PASSWORD_RESET':
      return Key
    default:
      return Activity
  }
}

const getActionColor = (action: string) => {
  switch (action) {
    case 'LOGIN':
      return 'text-green-600'
    case 'LOGOUT':
      return 'text-orange-600'
    case 'CREATE':
      return 'text-blue-600'
    case 'UPDATE':
      return 'text-amber-600'
    case 'DELETE':
      return 'text-red-600'
    default:
      return 'text-muted-foreground'
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadStats = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const [usersRes, rolesRes, healthRes, devicesRes, auditRes] = await Promise.all([
        api.getUsers({ limit: 100 }),
        api.getRoles(),
        api.getDbHealth(),
        api.getDevices({ limit: 100 }),
        api.getAuditLogs({ limit: 5 }),
      ])

      const users = usersRes.data?.users || []
      const devices = devicesRes.data?.devices || []
      
      const desktopUsers = users.filter(u => u.userType === 'admin' || u.userType === 'manager')
      const superAdmins = users.filter(u => u.userType === 'super_admin')

      setStats({
        totalUsers: users.length,
        desktopUsers: desktopUsers.length,
        superAdmins: superAdmins.length,
        activeUsers: users.filter(u => u.isActive).length,
        inactiveUsers: users.filter(u => !u.isActive).length,
        totalRoles: rolesRes.data?.length || 0,
        totalDevices: devicesRes.data?.pagination.total || 0,
        onlineDevices: devices.filter(d => d.status === 'online').length,
        offlineDevices: devices.filter(d => d.status === 'offline').length,
        dbStatus: healthRes.data?.databases || [],
      })

      setRecentActivity(auditRes.data?.logs || [])
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    // Auto-refresh every 10 seconds for real-time device detection
    const interval = setInterval(() => loadStats(), 10000)
    return () => clearInterval(interval)
  }, [loadStats])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const statCards = [
    {
      title: 'Desktop Users',
      value: stats?.desktopUsers || 0,
      change: `Admin & Manager`,
      changeType: 'neutral' as const,
      description: 'for ERP application',
      icon: Monitor,
      gradient: 'from-blue-500 to-blue-600',
      href: '/users',
    },
    {
      title: 'Super Admins',
      value: stats?.superAdmins || 0,
      change: 'Web Portal',
      changeType: 'neutral' as const,
      description: 'system administrators',
      icon: Shield,
      gradient: 'from-purple-500 to-purple-600',
      href: '/users',
    },
    {
      title: 'Online Devices',
      value: `${stats?.onlineDevices || 0}/${stats?.totalDevices || 0}`,
      change: stats?.onlineDevices ? `${stats.onlineDevices} online` : 'none online',
      changeType: stats?.onlineDevices ? 'positive' as const : 'neutral' as const,
      description: 'desktop clients connected',
      icon: Users,
      gradient: 'from-violet-500 to-violet-600',
      href: '/devices',
    },
    {
      title: 'System Health',
      value: stats?.dbStatus.every(db => db.connected) ? 100 : 50,
      isPercentage: true,
      change: stats?.dbStatus.every(db => db.connected) ? 'Operational' : 'Issues',
      changeType: stats?.dbStatus.every(db => db.connected) ? 'positive' as const : 'neutral' as const,
      description: 'all systems',
      icon: Activity,
      gradient: 'from-amber-500 to-orange-500',
      href: '/health',
    },
  ]

  const quickActions = [
    {
      title: 'Invite User',
      description: 'Send an invitation to a new team member',
      icon: UserPlus,
      onClick: () => navigate('/users'),
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: 'Manage Roles',
      description: 'Configure desktop access permissions',
      icon: Shield,
      onClick: () => navigate('/roles'),
      color: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      title: 'View Devices',
      description: 'Monitor connected desktop clients',
      icon: Monitor,
      onClick: () => navigate('/devices'),
      color: 'bg-violet-500/10 text-violet-500',
    },
    {
      title: 'Audit Logs',
      description: 'View system activity history',
      icon: FileText,
      onClick: () => navigate('/audit'),
      color: 'bg-orange-500/10 text-orange-500',
    },
    {
      title: 'System Health',
      description: 'Check database connections',
      icon: Activity,
      onClick: () => navigate('/health'),
      color: 'bg-red-500/10 text-red-500',
    },
    {
      title: 'Settings',
      description: 'Configure system preferences',
      icon: Settings,
      onClick: () => navigate('/settings'),
      color: 'bg-slate-500/10 text-slate-500',
    },
    {
      title: 'Help & Support',
      description: 'Get assistance and FAQs',
      icon: HelpCircle,
      onClick: () => navigate('/help'),
      color: 'bg-cyan-500/10 text-cyan-500',
    },
    {
      title: 'My Account',
      description: 'Manage your profile settings',
      icon: UserCog,
      onClick: () => navigate('/settings'),
      color: 'bg-pink-500/10 text-pink-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your ERP system today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CompactClock />
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStats(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/users')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className="card-interactive group"
            onClick={() => navigate(stat.href)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg',
                  stat.gradient
                )}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  stat.changeType === 'positive' && 'text-green-600',
                  stat.changeType === 'neutral' && 'text-muted-foreground'
                )}>
                  {stat.changeType === 'positive' && <ArrowUpRight className="h-4 w-4" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  {isLoading ? (
                    <span className="inline-block h-8 w-16 skeleton rounded" />
                  ) : (
                    <>
                      {stat.value}
                      {stat.isPercentage && '%'}
                    </>
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.title}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.description}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Database Connections
              </CardTitle>
              <CardDescription>
                Real-time status of your database infrastructure
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/health')}>
              View Details
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                    <div className="h-10 w-10 skeleton rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 skeleton rounded" />
                      <div className="h-3 w-24 skeleton rounded" />
                    </div>
                    <div className="h-6 w-20 skeleton rounded-full" />
                  </div>
                ))
              ) : stats?.dbStatus.length ? (
                stats.dbStatus.map((db) => (
                  <div
                    key={db.name}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                      db.connected ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                    )}
                  >
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center',
                      db.connected ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    )}>
                      {db.connected ? (
                        <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{db.name}</p>
                      <p className={cn(
                        'text-sm',
                        db.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {db.connected ? 'Connected and operational' : db.error || 'Connection failed'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {db.connected && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3" />
                          <span>12ms</span>
                        </div>
                      )}
                      <Badge variant={db.connected ? 'default' : 'destructive'} className={cn(
                        db.connected && 'bg-green-600 hover:bg-green-700'
                      )}>
                        {db.connected ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Online
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Offline
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No database connections configured</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions in your system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-8 w-8 skeleton rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 skeleton rounded" />
                      <div className="h-3 w-24 skeleton rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const ActionIcon = getActionIcon(activity.action)
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center bg-muted flex-shrink-0'
                      )}>
                        <ActionIcon className={cn('h-4 w-4', getActionColor(activity.action))} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.userName} {activity.action.toLowerCase().replace('_', ' ')} {activity.entityType.toLowerCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">Activity will appear here as you use the system</p>
              </div>
            )}
            <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('/audit')}>
              View all activity
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks at your fingertips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.onClick}
                className={cn(
                  'flex flex-col items-center text-center p-6 rounded-xl border-2 border-dashed',
                  'hover:border-primary hover:bg-accent/50 transition-all duration-200',
                  'group'
                )}
              >
                <div className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center mb-3',
                  action.color
                )}>
                  <action.icon className="h-6 w-6" />
                </div>
                <p className="font-semibold group-hover:text-primary transition-colors">
                  {action.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-interactive cursor-pointer" onClick={() => navigate('/users')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>User Summary</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-3 border-b">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.desktopUsers || 0}</div>
                <div className="text-xs text-muted-foreground">Desktop Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats?.superAdmins || 0}</div>
                <div className="text-xs text-muted-foreground">Super Admins</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Users</span>
                <span className="font-medium text-green-600">{stats?.activeUsers || 0}</span>
              </div>
              <Progress value={stats?.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100) : 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Inactive Users</span>
                <span className="font-medium text-orange-600">{stats?.inactiveUsers || 0}</span>
              </div>
              <Progress value={stats?.totalUsers ? ((stats.inactiveUsers / stats.totalUsers) * 100) : 0} className="h-2 [&>div]:bg-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive cursor-pointer" onClick={() => navigate('/devices')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>System Overview</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 pb-3 border-b mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats?.totalRoles || 0}</div>
                <div className="text-xs text-muted-foreground">Active Roles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.totalDevices || 0}</div>
                <div className="text-xs text-muted-foreground">Total Devices</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.onlineDevices || 0}</div>
                <div className="text-xs text-muted-foreground">Devices Online</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats?.offlineDevices || 0}</div>
                <div className="text-xs text-muted-foreground">Devices Offline</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
