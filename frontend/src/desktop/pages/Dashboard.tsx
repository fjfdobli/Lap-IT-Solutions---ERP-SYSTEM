import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDesktopAuth } from '../lib/use-desktop-auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CompactClock } from '@/components/ui/real-time-clock'
import {
  ShoppingCart,
  Package,
  Receipt,
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronRight,
  Activity,
  AlertTriangle,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface DashboardStats {
  purchaseOrders: {
    pending: number
    todayCount: number
    todayTotal: number
  }
  inventory: {
    totalProducts: number
    lowStockCount: number
    outOfStockCount: number
    totalValue: number
  }
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
  }>
  recentPurchaseOrders: Array<{
    id: string
    po_number: string
    status: string
    total_amount: number
    created_at: string
    supplier_name: string
  }>
  lowStockProducts: Array<{
    id: string
    sku: string
    name: string
    reorder_level: number
    quantity_on_hand: number
  }>
}

export default function DesktopDashboard() {
  const { user } = useDesktopAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadDashboardData()
    
    // Update every second for real-time display
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  async function loadDashboardData() {
    setIsLoading(true)
    try {
      const response = await api.getDashboardStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'purchase_receive':
        return <ShoppingCart className="h-4 w-4 text-green-500" />
      case 'sale':
        return <Receipt className="h-4 w-4 text-blue-500" />
      case 'adjustment':
      case 'count':
        return <Package className="h-4 w-4 text-amber-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      pending_approval: { variant: 'outline', label: 'Pending Approval' },
      approved: { variant: 'default', label: 'Approved' },
      sent: { variant: 'default', label: 'Sent' },
      partial: { variant: 'outline', label: 'Partial' },
      received: { variant: 'default', label: 'Received' },
      on_hold: { variant: 'destructive', label: 'On Hold' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    }
    const config = variants[status] || { variant: 'secondary' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM d, yyyy')} • <span className="font-mono tabular-nums">{format(currentTime, 'h:mm:ss a')}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CompactClock />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold mt-1">
                  ₱{(stats?.inventory.totalValue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">{stats?.inventory.totalProducts || 0} products</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending POs</p>
                <p className="text-2xl font-bold mt-1">{stats?.purchaseOrders.pending || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Awaiting action</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold mt-1">{stats?.inventory.lowStockCount || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span className="text-amber-500">Needs attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold mt-1">{stats?.inventory.outOfStockCount || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs">
              <span className="text-red-500">Requires restock</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest inventory transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border hover:bg-muted/80 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" onClick={() => navigate('/purchase-orders/new')}>
              <ShoppingCart className="mr-3 h-4 w-4" />
              Create Purchase Order
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/inventory')}>
              <Package className="mr-3 h-4 w-4" />
              View Inventory
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/purchase-orders')}>
              <Receipt className="mr-3 h-4 w-4" />
              View Purchase Orders
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/reports')}>
              <FileText className="mr-3 h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent POs & Low Stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Purchase Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Purchase Orders</CardTitle>
              <CardDescription>Latest PO activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/purchase-orders')}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(!stats?.recentPurchaseOrders || stats.recentPurchaseOrders.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">No purchase orders yet</p>
              ) : (
                stats.recentPurchaseOrders.map((po) => (
                  <div
                    key={po.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{po.po_number}</p>
                      <p className="text-xs text-muted-foreground">{po.supplier_name}</p>
                    </div>
                    <div className="text-right space-y-1">
                      {getStatusBadge(po.status)}
                      <p className="text-xs text-muted-foreground">
                        ₱{po.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>Items below reorder level</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/inventory?lowStock=true')}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(!stats?.lowStockProducts || stats.lowStockProducts.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">No low stock items</p>
              ) : (
                stats.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/inventory/${product.id}`)}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${product.quantity_on_hand === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                        {product.quantity_on_hand} / {product.reorder_level}
                      </p>
                      <p className="text-xs text-muted-foreground">in stock</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
