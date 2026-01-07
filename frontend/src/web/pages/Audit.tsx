import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  RefreshCw,
  Loader2,
  Download,
  Filter,
  Calendar,
  Clock,
  FileText,
  User,
  Shield,
  Settings,
  Trash2,
  Edit,
  Plus,
  LogIn,
  LogOut,
  Key,
  Eye,
  CheckCircle2,
  XCircle,
  Activity,
  Database,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userEmail: string
  userName: string
  action: string
  entityType: string
  entityId: string | null
  oldValues: string | null
  newValues: string | null
  ipAddress: string | null
  userAgent: string | null
}

interface AuditFilters {
  search: string
  action: string
  entityType: string
  dateRange: string
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  login: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  logout: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  password_change: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  invite: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
}

const actionIcons: Record<string, React.ElementType> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  login: LogIn,
  logout: LogOut,
  password_change: Key,
  invite: User,
}

const entityIcons: Record<string, React.ElementType> = {
  user: User,
  role: Shield,
  device: Monitor,
  session: Key,
  settings: Settings,
}

export default function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    action: 'all',
    entityType: 'all',
    dateRange: '7',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const itemsPerPage = 20

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const endDate = new Date().toISOString()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(filters.dateRange))
      
      const response = await api.getAuditLogs({
        search: filters.search || undefined,
        action: filters.action !== 'all' ? filters.action : undefined,
        entityType: filters.entityType !== 'all' ? filters.entityType : undefined,
        startDate: startDate.toISOString(),
        endDate,
        page: currentPage,
        limit: itemsPerPage,
      })
      
      if (response.success && response.data) {
        setLogs(response.data.logs.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          userId: log.userId,
          userEmail: log.userEmail || '',
          userName: log.userName,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          oldValues: log.details ? JSON.stringify(log.details) : null,
          newValues: null,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
        })))
        setTotalPages(response.data.pagination.totalPages)
        setTotalLogs(response.data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentPage])

  useEffect(() => {
    loadAuditLogs()
  }, [loadAuditLogs])

  const handleExport = async () => {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(filters.dateRange))
      
      const blob = await api.exportAuditLogs({
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export audit logs:', error)
    }
  }

  const stats = {
    total: totalLogs,
    creates: logs.filter(l => l.action === 'create').length,
    updates: logs.filter(l => l.action === 'update').length,
    deletes: logs.filter(l => l.action === 'delete').length,
  }

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity
    return Icon
  }

  const getEntityIcon = (entityType: string) => {
    const Icon = entityIcons[entityType] || Database
    return Icon
  }

  const formatAction = (action: string) => {
    return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatEntity = (entityType: string) => {
    return entityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const parseJSON = (str: string | null) => {
    if (!str) return null
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and changes for compliance and security
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAuditLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.creates}</p>
                <p className="text-sm text-muted-foreground">Creates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.updates}</p>
                <p className="text-sm text-muted-foreground">Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.deletes}</p>
                <p className="text-sm text-muted-foreground">Deletes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, or entity..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select 
                value={filters.action} 
                onValueChange={(v) => setFilters(f => ({ ...f, action: v }))}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="password_change">Password Change</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filters.entityType} 
                onValueChange={(v) => setFilters(f => ({ ...f, entityType: v }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="device">Device</SelectItem>
                  <SelectItem value="session">Session</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filters.dateRange} 
                onValueChange={(v) => setFilters(f => ({ ...f, dateRange: v }))}
              >
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 Hours</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">
                {filters.search || filters.action !== 'all' || filters.entityType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'System activities will appear here'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const ActionIcon = getActionIcon(log.action)
                  const EntityIcon = getEntityIcon(log.entityType)
                  
                  return (
                    <TableRow key={log.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(log.timestamp), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), 'HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {log.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{log.userName}</p>
                            <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('font-medium', actionColors[log.action] || 'bg-gray-100')}>
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EntityIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatEntity(log.entityType)}</span>
                          {log.entityId && (
                            <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
                              {log.entityId.substring(0, 8)}...
                            </code>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setSelectedLog(log)
                            setShowDetailDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalLogs)} of {totalLogs} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i
                    if (pageNum > totalPages) pageNum = totalPages - 4 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="w-8"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Audit Log Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this activity
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedLog.userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{selectedLog.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.userEmail}</p>
                </div>
                <Badge className={cn('text-sm', actionColors[selectedLog.action])}>
                  {formatAction(selectedLog.action)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedLog.timestamp), 'PPpp')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Entity Type</p>
                  <p className="text-sm font-medium">{formatEntity(selectedLog.entityType)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Entity ID</p>
                  <code className="text-sm font-mono">{selectedLog.entityId || 'N/A'}</code>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <code className="text-sm font-mono">{selectedLog.ipAddress || 'N/A'}</code>
                </div>
              </div>

              {(selectedLog.oldValues || selectedLog.newValues) && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Changes</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedLog.oldValues && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          Previous Values
                        </p>
                        <pre className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs overflow-auto max-h-40">
                          {JSON.stringify(parseJSON(selectedLog.oldValues), null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.newValues && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          New Values
                        </p>
                        <pre className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs overflow-auto max-h-40">
                          {JSON.stringify(parseJSON(selectedLog.newValues), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedLog.userAgent && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">User Agent</p>
                  <code className="block p-3 bg-muted rounded-lg text-xs break-all">
                    {selectedLog.userAgent}
                  </code>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
