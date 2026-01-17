import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePOS } from '../lib/pos-context'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreHorizontal,
  Eye,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  ClipboardCheck,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  Boxes,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea as DialogScrollArea } from '@/components/ui/scroll-area'
import { format, formatDistanceToNow } from 'date-fns'
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
} from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// Chart config
const chartConfig = {
  total: { label: 'Amount', color: '#3b82f6' },
  count: { label: 'Orders', color: '#10b981' },
} satisfies ChartConfig

interface POHeader {
  id: number
  xCode: string
  PoDate: string | null
  POdateTime: string
  DRDate: string | null
  Xname: string
  SupplierID: string
  SupplierName: string
  SupplierCode: string
  Information: string
  Terms: string
  Remarks: string
  POStatus: string
  Qty_Total: number
  Amnt_Subcost: number
  Amnt_Shipping: number
  Amnt_TRDiscount: number
  Amnt_ItemDiscount: number
  Amnt_GrandCost: number
  DateCreate: string
  CreateBy: string
  ForceClose: string
}

interface POStats {
  total: { count: number; amount: number }
  thisMonth: { count: number; amount: number }
  thisYear: { count: number; amount: number }
  byStatus: Record<string, { count: number; total: number }>
  topSuppliers: Array<{ SupplierName: string; SupplierCode: string; poCount: number; totalAmount: number }>
  recent: Array<{ id: number; xCode: string; PoDate: string; SupplierName: string; POStatus: string; Amnt_GrandCost: number; Qty_Total: number }>
  monthlyTrend: Array<{ month: string; monthName: string; count: number; total: number }>
}

interface PhyHeader {
  id: number
  xCode: string
  Xname: string
  DatesTart: string | null
  DateEnd: string | null
  CheckBy: string
  Approve: string
  Remarks: string
  ExQty: number
  ExAmnt: number
  OQty: number
  OAmnt: number
  UQty: number
  UAmnt: number
  PerOQty: string
  PerUQty: string
  PerOAmnt: string
  PerUAmnt: string
  POStatus: string
  DateCreate: string
  CreateBy: string
  title: string
}

interface PhyStats {
  total: { count: number; totalAmount: number; overAmount: number; underAmount: number }
  thisYear: number
  itemsCounted: number
  totalAdjustments: number
  byStatus: Record<string, number>
  recent: Array<{
    id: number
    xCode: string
    Xname: string
    DatesTart: string | null
    DateEnd: string | null
    POStatus: string
    CheckBy: string
    ExQty: number
    ExAmnt: number
    OQty: number
    OAmnt: number
    UQty: number
    UAmnt: number
  }>
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  'Posted': { label: 'Posted', color: 'text-green-600', bgColor: 'bg-green-100', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  'Pending': { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: <Clock className="h-3.5 w-3.5" /> },
  'Cancelled': { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100', icon: <XCircle className="h-3.5 w-3.5" /> },
  'ForceClose': { label: 'Force Closed', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <XCircle className="h-3.5 w-3.5" /> },
  'Closed': { label: 'Closed', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  'Open': { label: 'Open', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: <Clock className="h-3.5 w-3.5" /> },
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatCompactNumber(value: number): string {
  if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `₱${(value / 1000).toFixed(1)}K`
  return formatCurrency(value)
}

export default function PurchaseOrders() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentPOS, posConfig } = usePOS()
  
  // Tab state
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'purchase-orders')
  
  // Purchase Orders and Physical Count are OASIS-only
  if (currentPOS && currentPOS !== 'oasis') {
    return (
      <motion.div
        className="p-8 space-y-8 max-w-[1800px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">Purchase Orders Not Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                This module is only available for IBS OASIS POS.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }
  
  if (!currentPOS) {
    return (
      <motion.div
        className="p-8 space-y-8 max-w-[1800px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="h-16 w-16 text-amber-500/50 mb-4" />
              <p className="text-lg font-medium">No POS System Selected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please select IBS OASIS from the sidebar to view Purchase Orders
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }
  
  // PO States
  const [purchaseOrders, setPurchaseOrders] = useState<POHeader[]>([])
  const [stats, setStats] = useState<POStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  })

  // PO Detail Dialog State
  const [selectedPO, setSelectedPO] = useState<POHeader | null>(null)
  const [poDetailItems, setPODetailItems] = useState<any[]>([])
  const [poDetailLoading, setPODetailLoading] = useState(false)
  const [showPODetail, setShowPODetail] = useState(false)

  // Physical Count States
  const [physicalCounts, setPhysicalCounts] = useState<PhyHeader[]>([])
  const [phyStats, setPhyStats] = useState<PhyStats | null>(null)
  const [phyLoading, setPhyLoading] = useState(true)
  const [phyStatsLoading, setPhyStatsLoading] = useState(true)
  const [phySearchQuery, setPhySearchQuery] = useState('')
  const [phyStatusFilter, setPhyStatusFilter] = useState('all')
  const [phyPagination, setPhyPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  })

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await api.getPosPoStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to load PO stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadPurchaseOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.getPosPoHeaders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      })

      if (response.success && response.data) {
        setPurchaseOrders(response.data.records)
        setPagination(prev => ({
          ...prev,
          total: response.data!.pagination.total,
          totalPages: response.data!.pagination.totalPages,
        }))
      }
    } catch (error) {
      console.error('Failed to load purchase orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchQuery, pagination.page, pagination.limit])

  // Physical Count loaders
  const loadPhyStats = useCallback(async () => {
    setPhyStatsLoading(true)
    try {
      const response = await api.getPosPhyStats()
      if (response.success && response.data) {
        setPhyStats(response.data)
      }
    } catch (error) {
      console.error('Failed to load Physical Count stats:', error)
    } finally {
      setPhyStatsLoading(false)
    }
  }, [])

  const loadPhysicalCounts = useCallback(async () => {
    setPhyLoading(true)
    try {
      const response = await api.getPosPhyHeaders({
        status: phyStatusFilter !== 'all' ? phyStatusFilter : undefined,
        search: phySearchQuery || undefined,
        page: phyPagination.page,
        limit: phyPagination.limit,
      })

      if (response.success && response.data) {
        setPhysicalCounts(response.data.records)
        setPhyPagination(prev => ({
          ...prev,
          total: response.data!.pagination.total,
          totalPages: response.data!.pagination.totalPages,
        }))
      }
    } catch (error) {
      console.error('Failed to load physical counts:', error)
    } finally {
      setPhyLoading(false)
    }
  }, [phyStatusFilter, phySearchQuery, phyPagination.page, phyPagination.limit])

  // Load PO Detail from POS database
  const loadPODetail = useCallback(async (po: POHeader) => {
    setSelectedPO(po)
    setShowPODetail(true)
    setPODetailLoading(true)
    setPODetailItems([])
    
    try {
      const response = await api.get<{ header: any; items: any[] }>(`/pos-data/purchase-orders/${po.xCode}`)
      if (response.success && response.data) {
        setPODetailItems(response.data.items || [])
      }
    } catch (error) {
      console.error('Failed to load PO details:', error)
    } finally {
      setPODetailLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadPhyStats()
  }, [loadStats, loadPhyStats])

  useEffect(() => {
    loadPurchaseOrders()
  }, [loadPurchaseOrders])

  useEffect(() => {
    loadPhysicalCounts()
  }, [loadPhysicalCounts])

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

  function handlePhySearch(e: React.FormEvent) {
    e.preventDefault()
    setPhyPagination(prev => ({ ...prev, page: 1 }))
  }

  function handlePhyStatusFilter(status: string) {
    setPhyStatusFilter(status)
    setPhyPagination(prev => ({ ...prev, page: 1 }))
  }

  function getStatusBadge(status: string) {
    const config = statusConfig[status] || { label: status || 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: null }
    return (
      <Badge variant="outline" className={`gap-1.5 ${config.color} ${config.bgColor} border-0`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const handleRefresh = () => {
    if (activeTab === 'purchase-orders') {
      loadStats()
      loadPurchaseOrders()
    } else {
      loadPhyStats()
      loadPhysicalCounts()
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchParams(params => {
      params.set('tab', tab)
      return params
    })
  }

  // Get status counts from stats
  const postedCount = stats?.byStatus['Posted']?.count || 0
  const pendingCount = stats?.byStatus['Pending']?.count || stats?.byStatus['']?.count || 0
  const cancelledCount = stats?.byStatus['Cancelled']?.count || 0

  // Get physical count status counts
  const phyClosedCount = phyStats?.byStatus['Closed'] || 0
  const phyOpenCount = phyStats?.byStatus['Open'] || phyStats?.byStatus[''] || 0

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-1"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Procurement & Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage purchase orders and physical inventory counts
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || statsLoading || phyLoading || phyStatsLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${(isLoading || statsLoading || phyLoading || phyStatsLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="purchase-orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="physical-count" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Physical Count
          </TabsTrigger>
        </TabsList>

        {/* Purchase Orders Tab */}
        <TabsContent value="purchase-orders" className="space-y-6">
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total POs */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Purchase Orders</p>
                <p className="text-3xl font-bold mt-1">
                  {statsLoading ? '...' : (stats?.total.count || 0).toLocaleString()}
                </p>
                <p className="text-blue-100 text-sm mt-1">
                  {statsLoading ? '' : formatCompactNumber(stats?.total.amount || 0)}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold mt-1">
                  {statsLoading ? '...' : (stats?.thisMonth.count || 0).toLocaleString()}
                </p>
                <p className="text-emerald-100 text-sm mt-1">
                  {statsLoading ? '' : formatCompactNumber(stats?.thisMonth.amount || 0)}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <CalendarDays className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Year */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">This Year</p>
                <p className="text-3xl font-bold mt-1">
                  {statsLoading ? '...' : (stats?.thisYear.count || 0).toLocaleString()}
                </p>
                <p className="text-violet-100 text-sm mt-1">
                  {statsLoading ? '' : formatCompactNumber(stats?.thisYear.amount || 0)}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average PO Value */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Average PO Value</p>
                <p className="text-3xl font-bold mt-1">
                  {statsLoading ? '...' : formatCompactNumber(stats?.total.count ? (stats.total.amount / stats.total.count) : 0)}
                </p>
                <p className="text-amber-100 text-sm mt-1">per order</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts and Top Suppliers Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Trend Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Purchase Order Trend
              </CardTitle>
              <CardDescription>Monthly PO value over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <AreaChart data={stats?.monthlyTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPO" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="monthName" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => formatCompactNumber(v)} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-semibold">{payload[0]?.payload?.monthName}</p>
                              <p className="text-sm text-blue-600">Value: {formatCurrency(payload[0]?.value as number)}</p>
                              <p className="text-xs text-muted-foreground">{payload[0]?.payload?.count} orders</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPO)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Suppliers */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Top Suppliers
              </CardTitle>
              <CardDescription>By purchase order value</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(stats?.topSuppliers || []).slice(0, 5).map((supplier, index) => (
                    <div key={supplier.SupplierCode} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white
                        ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-gray-300'}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{supplier.SupplierName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{supplier.poCount} orders</p>
                      </div>
                      <p className="font-semibold text-sm">{formatCompactNumber(supplier.totalAmount)}</p>
                    </div>
                  ))}
                  {(!stats?.topSuppliers || stats.topSuppliers.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">
                      No supplier data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Status Filter Cards */}
      <motion.div variants={itemVariants} className="grid gap-3 md:grid-cols-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'all' ? 'ring-2 ring-primary shadow-md' : 'border-0 shadow-sm'}`}
          onClick={() => handleStatusFilter('all')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total.count || 0}</p>
              <p className="text-xs text-muted-foreground">All Orders</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'Posted' ? 'ring-2 ring-primary shadow-md' : 'border-0 shadow-sm'}`}
          onClick={() => handleStatusFilter('Posted')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{postedCount}</p>
              <p className="text-xs text-muted-foreground">Posted</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'Pending' ? 'ring-2 ring-primary shadow-md' : 'border-0 shadow-sm'}`}
          onClick={() => handleStatusFilter('Pending')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'Cancelled' ? 'ring-2 ring-primary shadow-md' : 'border-0 shadow-sm'}`}
          onClick={() => handleStatusFilter('Cancelled')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Purchase Order List
                </CardTitle>
                <CardDescription>
                  {statusFilter !== 'all' ? `Showing ${statusFilter} orders` : 'All purchase orders from POS system'}
                </CardDescription>
              </div>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search PO #, supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button type="submit" variant="secondary" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
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
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Package className="h-10 w-10 opacity-50" />
                          <p>No purchase orders found</p>
                          {statusFilter !== 'all' && (
                            <Button variant="link" size="sm" onClick={() => handleStatusFilter('all')}>
                              Clear filter
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseOrders.map((po) => (
                      <TableRow 
                        key={po.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => loadPODetail(po)}
                      >
                        <TableCell>
                          <div className="font-medium text-primary">{po.xCode}</div>
                          {po.Xname && <div className="text-xs text-muted-foreground">{po.Xname}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{po.SupplierName || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{po.SupplierCode}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(po.POStatus)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{po.Qty_Total} items</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">{formatCurrency(po.Amnt_GrandCost)}</span>
                        </TableCell>
                        <TableCell>
                          {po.PoDate ? (
                            <div>
                              <div className="text-sm">{format(new Date(po.PoDate), 'MMM d, yyyy')}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(po.PoDate), { addSuffix: true })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {po.CreateBy || '—'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); loadPODetail(po) }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
        </TabsContent>

        {/* Physical Count Tab */}
        <TabsContent value="physical-count" className="space-y-6">
          {/* Physical Count Stats Cards */}
          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Physical Counts */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">Total Physical Counts</p>
                    <p className="text-3xl font-bold mt-1">
                      {phyStatsLoading ? '...' : (phyStats?.total.count || 0).toLocaleString()}
                    </p>
                    <p className="text-indigo-100 text-sm mt-1">
                      {phyStatsLoading ? '' : `${phyStats?.itemsCounted?.toLocaleString() || 0} items counted`}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Over Qty */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Over Amount</p>
                    <p className="text-3xl font-bold mt-1">
                      {phyStatsLoading ? '...' : formatCompactNumber(phyStats?.total.overAmount || 0)}
                    </p>
                    <p className="text-emerald-100 text-sm mt-1">surplus inventory</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <ArrowUpCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Under Qty */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-rose-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rose-100 text-sm font-medium">Under Amount</p>
                    <p className="text-3xl font-bold mt-1">
                      {phyStatsLoading ? '...' : formatCompactNumber(phyStats?.total.underAmount || 0)}
                    </p>
                    <p className="text-rose-100 text-sm mt-1">shortage inventory</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <ArrowDownCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Adjustments */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Total Adjustments</p>
                    <p className="text-3xl font-bold mt-1">
                      {phyStatsLoading ? '...' : (phyStats?.totalAdjustments || 0).toLocaleString()}
                    </p>
                    <p className="text-amber-100 text-sm mt-1">qty adjusted</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Physical Counts and Status Filter */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Physical Counts */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="border-0 shadow-lg h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Recent Physical Counts
                  </CardTitle>
                  <CardDescription>Latest inventory count sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  {phyStatsLoading ? (
                    <div className="h-[250px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(phyStats?.recent || []).slice(0, 5).map((phy) => (
                        <div 
                          key={phy.id} 
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => navigate(`/physical-count?xCode=${phy.xCode}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100">
                              <Boxes className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{phy.xCode}</p>
                              <p className="text-xs text-muted-foreground">{phy.Xname}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(phy.POStatus)}
                            <p className="text-xs text-muted-foreground mt-1">
                              {phy.DatesTart ? format(new Date(phy.DatesTart), 'MMM d, yyyy') : '—'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(!phyStats?.recent || phyStats.recent.length === 0) && (
                        <div className="text-center text-muted-foreground py-8">
                          No physical counts found
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Status Summary */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Count Status
                  </CardTitle>
                  <CardDescription>Physical count by status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${phyStatusFilter === 'all' ? 'ring-2 ring-primary bg-muted' : 'bg-muted/50'}`}
                    onClick={() => handlePhyStatusFilter('all')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="font-medium">All Counts</p>
                    </div>
                    <p className="text-2xl font-bold">{phyStats?.total.count || 0}</p>
                  </div>
                  <div 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${phyStatusFilter === 'Closed' ? 'ring-2 ring-primary bg-muted' : 'bg-muted/50'}`}
                    onClick={() => handlePhyStatusFilter('Closed')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="font-medium">Closed</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{phyClosedCount}</p>
                  </div>
                  <div 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${phyStatusFilter === 'Open' ? 'ring-2 ring-primary bg-muted' : 'bg-muted/50'}`}
                    onClick={() => handlePhyStatusFilter('Open')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="font-medium">Open</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{phyOpenCount}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Physical Count Table */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      Physical Count List
                    </CardTitle>
                    <CardDescription>
                      {phyStatusFilter !== 'all' ? `Showing ${phyStatusFilter} counts` : 'All physical inventory counts'}
                    </CardDescription>
                  </div>
                  <form onSubmit={handlePhySearch} className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search code, name..."
                        value={phySearchQuery}
                        onChange={(e) => setPhySearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Button type="submit" variant="secondary" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Over Amt</TableHead>
                        <TableHead className="text-right">Under Amt</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Checked By</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {phyLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : physicalCounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <ClipboardCheck className="h-10 w-10 opacity-50" />
                              <p>No physical counts found</p>
                              {phyStatusFilter !== 'all' && (
                                <Button variant="link" size="sm" onClick={() => handlePhyStatusFilter('all')}>
                                  Clear filter
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        physicalCounts.map((phy) => (
                          <TableRow 
                            key={phy.id} 
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigate(`/physical-count?xCode=${phy.xCode}`)}
                          >
                            <TableCell>
                              <div className="font-medium text-primary">{phy.xCode}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{phy.Xname || phy.title || '—'}</div>
                            </TableCell>
                            <TableCell>{getStatusBadge(phy.POStatus)}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-emerald-600">{formatCurrency(phy.OAmnt)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-rose-600">{formatCurrency(phy.UAmnt)}</span>
                            </TableCell>
                            <TableCell>
                              {phy.DatesTart ? (
                                <div>
                                  <div className="text-sm">{format(new Date(phy.DatesTart), 'MMM d, yyyy')}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(phy.DatesTart), { addSuffix: true })}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {phy.CheckBy || '—'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/physical-count?xCode=${phy.xCode}`) }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
              
              {/* Pagination */}
              {phyPagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((phyPagination.page - 1) * phyPagination.limit) + 1} to {Math.min(phyPagination.page * phyPagination.limit, phyPagination.total)} of {phyPagination.total} counts
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={phyPagination.page <= 1 || phyLoading}
                      onClick={() => setPhyPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={phyPagination.page >= phyPagination.totalPages || phyLoading}
                      onClick={() => setPhyPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* PO Detail Dialog */}
      <Dialog open={showPODetail} onOpenChange={setShowPODetail}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Purchase Order Details - {selectedPO?.xCode}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPO && (
            <DialogScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">PO Number</p>
                    <p className="font-semibold">{selectedPO.xCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Supplier</p>
                    <p className="font-semibold">{selectedPO.SupplierName || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{selectedPO.SupplierCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Status</p>
                    {getStatusBadge(selectedPO.POStatus)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">PO Date</p>
                    <p className="font-medium">{selectedPO.PoDate ? format(new Date(selectedPO.PoDate), 'MMM d, yyyy') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">DR Date</p>
                    <p className="font-medium">{selectedPO.DRDate ? format(new Date(selectedPO.DRDate), 'MMM d, yyyy') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Created By</p>
                    <p className="font-medium">{selectedPO.CreateBy || 'N/A'}</p>
                  </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Qty Total</p>
                    <p className="text-xl font-bold">{selectedPO.Qty_Total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Subtotal</p>
                    <p className="text-lg font-semibold">{formatCurrency(selectedPO.Amnt_Subcost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Discount</p>
                    <p className="text-lg font-semibold text-red-600">-{formatCurrency((selectedPO.Amnt_TRDiscount || 0) + (selectedPO.Amnt_ItemDiscount || 0))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Grand Total</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(selectedPO.Amnt_GrandCost)}</p>
                  </div>
                </div>

                {/* Remarks */}
                {(selectedPO.Remarks || selectedPO.Information) && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Remarks / Notes</p>
                    <p className="text-sm bg-muted/30 p-3 rounded">{selectedPO.Remarks || selectedPO.Information}</p>
                  </div>
                )}

                {/* Items Table */}
                <div>
                  <p className="text-sm font-semibold mb-2">Line Items</p>
                  {poDetailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : poDetailItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto opacity-30 mb-2" />
                      <p>No line items found</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Code</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Cost</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {poDetailItems.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-sm">{item.ItemCode}</TableCell>
                              <TableCell>{item.ItemName}</TableCell>
                              <TableCell className="text-right">{item.Qty_Order || item.TotQty}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.Amnt_Cost || 0)}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(item.Grand_Total || item.Amnt_totalCost || 0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </DialogScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
