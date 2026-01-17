import { useState, useEffect } from 'react'
import { usePOS } from '../lib/pos-context'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ClipboardList,
  Search,
  RefreshCw,
  User,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditLog {
  ID: number
  DateTrans?: string
  TimeTrans?: string
  UserName?: string
  Action?: string
  Description?: string
  Module?: string
  [key: string]: any
}

export default function AuditTrail() {
  const { currentPOS, posConfig } = usePOS()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  const loadLogs = async (page = 1) => {
    try {
      const response = await api.get<{
        logs: AuditLog[]
        pagination: typeof pagination
      }>(`/multi-pos/mydiner/audit-trail?page=${page}&limit=50`)
      
      if (response.success && response.data) {
        setLogs(response.data.logs)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Failed to load audit trail:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (currentPOS === 'mydiner') {
      loadLogs()
    }
  }, [currentPOS])

  const handleRefresh = () => {
    setRefreshing(true)
    loadLogs(pagination.page)
  }

  const getActionColor = (action?: string) => {
    if (!action) return 'default'
    const lowerAction = action.toLowerCase()
    if (lowerAction.includes('delete') || lowerAction.includes('void') || lowerAction.includes('cancel')) {
      return 'destructive'
    }
    if (lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('new')) {
      return 'default'
    }
    if (lowerAction.includes('update') || lowerAction.includes('edit') || lowerAction.includes('modify')) {
      return 'secondary'
    }
    return 'outline'
  }

  if (currentPOS !== 'mydiner') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <ClipboardList className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Audit Trail</h2>
        <p className="text-muted-foreground">
          This module is only available for IBS MyDiner POS.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  // Filter logs based on search
  const filteredLogs = logs.filter(log => {
    const searchLower = searchQuery.toLowerCase()
    return Object.values(log).some(value => 
      String(value).toLowerCase().includes(searchLower)
    )
  })

  // Get column names from first log entry
  const columns = logs.length > 0 
    ? Object.keys(logs[0]).filter(key => key !== 'ID')
    : ['DateTrans', 'TimeTrans', 'UserName', 'Action', 'Description']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-orange-500" />
            Audit Trail
          </h1>
          <p className="text-muted-foreground mt-1">
            System activity logs from {posConfig?.name}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Audit Logs</p>
                <p className="text-3xl font-bold">{pagination.total.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Viewing Page</p>
                <p className="text-3xl font-bold">{pagination.page} / {pagination.totalPages}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Trail Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>All system activities recorded by the POS (read-only)</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  {columns.slice(0, 6).map(col => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.id}
                      </TableCell>
                      {columns.slice(0, 6).map((col, idx) => (
                        <TableCell key={`${log.id}-${col}-${idx}`} className="text-sm">
                          {col.toLowerCase().includes('action') ? (
                            <Badge variant={getActionColor(log[col])}>
                              {String(log[col] || '-')}
                            </Badge>
                          ) : col.toLowerCase().includes('user') ? (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {String(log[col] || '-')}
                            </span>
                          ) : (
                            String(log[col] || '-')
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total.toLocaleString()} logs)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => loadLogs(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => loadLogs(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        This audit trail is read-only and reflects activities recorded in the POS system.
      </p>
    </div>
  )
}
