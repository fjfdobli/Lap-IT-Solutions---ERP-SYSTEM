import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  Package,
  Pause,
  FileCheck,
} from 'lucide-react'
import { format } from 'date-fns'

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  supplier_email: string | null
  status: string
  order_date: string
  expected_date: string | null
  total_amount: number
  item_count: number
  created_at: string
  creator_first_name: string
  creator_last_name: string
  approver_first_name: string | null
  approver_last_name: string | null
}

interface POStats {
  pendingApproval: number
  approved: number
  sent: number
  partial: number
  onHold: number
  thisMonth: { count: number; total: number }
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: <Edit className="h-3 w-3" /> },
  pending_approval: { label: 'Pending Approval', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  approved: { label: 'Approved', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  sent: { label: 'Sent to Supplier', variant: 'default', icon: <Send className="h-3 w-3" /> },
  partial: { label: 'Partial Received', variant: 'outline', icon: <Package className="h-3 w-3" /> },
  received: { label: 'Received', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  on_hold: { label: 'On Hold', variant: 'destructive', icon: <Pause className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  filed: { label: 'Filed', variant: 'secondary', icon: <FileCheck className="h-3 w-3" /> },
}

export default function PurchaseOrders() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [stats, setStats] = useState<POStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [posResponse, statsResponse] = await Promise.all([
        api.getPurchaseOrders({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
          page: pagination.page,
          limit: pagination.limit,
        }),
        api.getPurchaseOrderStats(),
      ])

      if (posResponse.success && posResponse.data) {
        setPurchaseOrders(posResponse.data.purchaseOrders)
        setPagination(prev => ({
          ...prev,
          total: posResponse.data!.pagination.total,
          totalPages: posResponse.data!.pagination.totalPages,
        }))
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Failed to load purchase orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchQuery, pagination.page, pagination.limit])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  function handleStatusFilter(status: string) {
    setStatusFilter(status)
    setPagination(prev => ({ ...prev, page: 1 }))
    setSearchParams(params => {
      if (status === 'all') {
        params.delete('status')
      } else {
        params.set('status', status)
      }
      return params
    })
  }

  function getStatusBadge(status: string) {
    const config = statusConfig[status] || { label: status, variant: 'secondary' as const, icon: null }
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const totalCount = stats ? (stats.pendingApproval + stats.approved + stats.sent + stats.partial + stats.onHold) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage and track purchase orders from suppliers
          </p>
        </div>
        <Button onClick={() => navigate('/purchase-orders/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create PO
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleStatusFilter('all')}
          >
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Total Active</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'pending_approval' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleStatusFilter('pending_approval')}
          >
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-amber-500">{stats.pendingApproval}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'approved' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleStatusFilter('approved')}
          >
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'sent' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleStatusFilter('sent')}
          >
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-500">{stats.sent}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'partial' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleStatusFilter('partial')}
          >
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.partial}</p>
              <p className="text-xs text-muted-foreground">Partial</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'on_hold' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleStatusFilter('on_hold')}
          >
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-red-500">{stats.onHold}</p>
              <p className="text-xs text-muted-foreground">On Hold</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by PO number or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <Button 
              variant="outline" 
              size="icon"
              onClick={loadData}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No purchase orders found
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((po) => (
                  <TableRow 
                    key={po.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    <TableCell className="font-medium">{po.po_number}</TableCell>
                    <TableCell>{po.supplier_name}</TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell>{po.item_count} items</TableCell>
                    <TableCell className="text-right font-medium">
                      ₱{po.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(po.order_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {po.creator_first_name} {po.creator_last_name}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/purchase-orders/${po.id}`) }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {po.status === 'draft' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/purchase-orders/${po.id}/edit`) }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/purchase-orders/${po.id}?print=true`) }}>
                            <FileText className="mr-2 h-4 w-4" />
                            Print / PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} purchase orders
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
