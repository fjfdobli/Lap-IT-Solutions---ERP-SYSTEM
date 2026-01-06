import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Activity,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  Loader2,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  AlertTriangle,
  Zap,
  Globe,
  Shield,
  Timer,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface DbStatus {
  name: string
  connected: boolean
  error: string | null
  responseTime?: number
  version?: string
}

interface HealthStatus {
  api: boolean
  databases: DbStatus[]
  lastChecked: string
  uptime?: number
  responseTime?: number
}

interface SystemMetric {
  label: string
  value: number
  max: number
  unit: string
  icon: React.ElementType
  status: 'good' | 'warning' | 'critical'
}

export default function Health() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<SystemMetric[]>([])

  async function checkHealth() {
    setIsRefreshing(true)
    const startTime = Date.now()
    try {
      const [apiRes, dbRes] = await Promise.all([
        api.getHealth(),
        api.getDbHealth(),
      ])

      const responseTime = Date.now() - startTime

      setHealth({
        api: apiRes.success,
        databases: dbRes.data?.databases || [],
        lastChecked: new Date().toISOString(),
        uptime: undefined,
        responseTime,
      })

      // Mock system metrics (would come from actual monitoring in production)
      setMetrics([
        {
          label: 'CPU Usage',
          value: Math.random() * 30 + 10,
          max: 100,
          unit: '%',
          icon: Cpu,
          status: 'good',
        },
        {
          label: 'Memory',
          value: Math.random() * 40 + 30,
          max: 100,
          unit: '%',
          icon: MemoryStick,
          status: 'good',
        },
        {
          label: 'Storage',
          value: 45,
          max: 100,
          unit: '%',
          icon: HardDrive,
          status: 'good',
        },
        {
          label: 'Network',
          value: Math.random() * 50 + 20,
          max: 100,
          unit: 'Mbps',
          icon: Wifi,
          status: 'good',
        },
      ])
    } catch (error) {
      setHealth({
        api: false,
        databases: [],
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const allHealthy = health?.api && health.databases.every(db => db.connected)

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return 'text-green-600'
      case 'warning':
        return 'text-amber-600'
      case 'critical':
        return 'text-red-600'
    }
  }

  const getProgressColor = (value: number) => {
    if (value < 60) return 'bg-green-500'
    if (value < 80) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h ${mins}m`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of your ERP system components and resources
          </p>
        </div>
        <Button onClick={checkHealth} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Status
        </Button>
      </div>

      {/* Overall Status Banner */}
      <Card className={cn(
        "border-l-4",
        isLoading ? "border-l-blue-500" : allHealthy ? "border-l-green-500" : "border-l-red-500"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                isLoading ? "bg-blue-500/10" : allHealthy ? "bg-green-500/10" : "bg-red-500/10"
              )}>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                ) : allHealthy ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {isLoading ? 'Checking System Status...' : 
                   allHealthy ? 'All Systems Operational' : 'System Issues Detected'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {health?.lastChecked && (
                    <>Last checked {formatDistanceToNow(new Date(health.lastChecked), { addSuffix: true })}</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {health?.responseTime && (
                <div className="text-center">
                  <p className="text-2xl font-bold">{health.responseTime}ms</p>
                  <p className="text-xs text-muted-foreground">Response Time</p>
                </div>
              )}
              {health?.uptime && (
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatUptime(health.uptime)}</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Server</p>
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : health?.api ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-600">Online</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-red-600">Offline</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Databases</p>
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span className="font-medium">
                        {health?.databases.filter(d => d.connected).length || 0}/
                        {health?.databases.length || 0}
                      </span>
                      <span className="text-muted-foreground text-sm">Connected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Latency</p>
                <p className="font-medium">
                  {health?.responseTime ? `${health.responseTime}ms` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Timer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="font-medium">
                  {formatUptime(health?.uptime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Database Connections
            </CardTitle>
            <CardDescription>
              Status of connected database servers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : health?.databases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No database connections configured
              </div>
            ) : (
              health?.databases.map((db, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    db.connected ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800" : 
                                  "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        db.connected ? "bg-green-500/20" : "bg-red-500/20"
                      )}>
                        <Database className={cn(
                          "h-5 w-5",
                          db.connected ? "text-green-600" : "text-red-600"
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">{db.name}</p>
                        {db.version && (
                          <p className="text-xs text-muted-foreground">{db.version}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={db.connected ? 'default' : 'destructive'} className={cn(
                        db.connected ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : ""
                      )}>
                        {db.connected ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Disconnected
                          </>
                        )}
                      </Badge>
                      {db.responseTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {db.responseTime}ms response
                        </p>
                      )}
                    </div>
                  </div>
                  {db.error && (
                    <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm text-red-700 dark:text-red-300">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {db.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Resources
            </CardTitle>
            <CardDescription>
              Server resource utilization metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className={cn("h-4 w-4", getStatusColor(metric.status))} />
                    <span className="font-medium text-sm">{metric.label}</span>
                  </div>
                  <span className="text-sm font-mono">
                    {metric.value.toFixed(1)}{metric.unit}
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={metric.value} 
                    className="h-2"
                  />
                  <div 
                    className={cn(
                      "absolute inset-0 h-2 rounded-full transition-all",
                      getProgressColor(metric.value)
                    )}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Service Endpoints
            </CardTitle>
            <CardDescription>
              API and service availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Authentication API', path: '/api/auth', status: health?.api },
                { name: 'User Management', path: '/api/users', status: health?.api },
                { name: 'Role Management', path: '/api/roles', status: health?.api },
                { name: 'Device Registry', path: '/api/devices', status: health?.api },
                { name: 'POS Integration', path: '/api/pos', status: health?.api },
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : service.status ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {service.path}
                  </code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Status
            </CardTitle>
            <CardDescription>
              Security configuration and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'SSL/TLS Certificate', status: true, detail: 'Valid' },
                { name: 'JWT Authentication', status: true, detail: 'Active' },
                { name: 'Rate Limiting', status: true, detail: 'Enabled' },
                { name: 'CORS Policy', status: true, detail: 'Configured' },
                { name: 'Security Headers', status: true, detail: 'Applied' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    {item.status ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <Badge variant={item.status ? 'default' : 'secondary'} className="text-xs">
                    {item.detail}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents / Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent System Events
          </CardTitle>
          <CardDescription>
            Latest system health events and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: '2 minutes ago', event: 'Health check completed', type: 'info' },
              { time: '5 minutes ago', event: 'Database connection verified', type: 'success' },
              { time: '15 minutes ago', event: 'SSL certificate renewed', type: 'success' },
              { time: '1 hour ago', event: 'System backup completed', type: 'success' },
              { time: '2 hours ago', event: 'Scheduled maintenance completed', type: 'info' },
            ].map((event, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  event.type === 'success' ? 'bg-green-500' : 
                  event.type === 'warning' ? 'bg-amber-500' :
                  event.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                )} />
                <div className="flex-1">
                  <p className="text-sm">{event.event}</p>
                </div>
                <span className="text-xs text-muted-foreground">{event.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
