import { useState, useEffect, useCallback } from 'react'
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
import { Progress } from '@/components/ui/progress'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { motion, Variants } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  RefreshCw,
  BarChart3,
  PieChartIcon,
  Activity,
  Zap,
  Award,
  ArrowRight,
  Sparkles,
  Building2,
  Receipt,
  Boxes,
  Truck,
  ArrowLeftRight,
  Calculator,
  RotateCcw,
  Tag,
  MapPin,
  Calendar,
  CreditCard,
  Wallet,
  Layers,
  Store,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 12 },
  },
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₱${(value / 1000000).toFixed(2)}M`
  } else if (value >= 1000) {
    return `₱${(value / 1000).toFixed(1)}K`
  }
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

// Chart configurations
const salesChartConfig = {
  total: { label: 'Sales', color: '#3b82f6' },
  transactions: { label: 'Transactions', color: '#10b981' },
} satisfies ChartConfig

const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16']

interface DashboardData {
  masterData: {
    products: number
    suppliers: number
    customers: number
    classes: number
    departments: number
    branches: number
    locations: number
  }
  sales: {
    total: { count: number; amount: number }
    today: { count: number; amount: number }
    thisWeek: { count: number; amount: number }
    thisMonth: { count: number; amount: number }
  }
  trends: {
    daily: Array<{ date: string; transactions: number; total: number; discount: number }>
    monthly: Array<{ month: string; monthName: string; transactions: number; total: number; discount: number }>
  }
  operations: {
    receiving: { total: number; totalValue?: number; thisMonth: number; pending: number }
    transfers: { out: number; in: number }
    purchaseOrders: { 
      total: number
      totalValue?: number
      pending: number
      pendingValue?: number
      thisMonth?: number
      thisMonthValue?: number
    }
    physicalCount: number
    itemMovements: { total: number; today: number }
    shifts: number
  }
  adjustments: {
    voids: { count: number; amount: number }
    returns: { count: number; amount: number }
    monthVoids: { count: number; amount: number }
  }
  topProducts: Array<{
    ItemCode: string
    productName: string
    totalQty: number
    totalAmount: number
    transactionCount: number
  }>
  recentTransactions: Array<{
    ID: number
    TransNo: string
    DateTrans: string
    GrandTotal: number
    Discount: number
    CashierName: string
    TerminalNo: string
  }>
  recentReceiving: Array<{
    id: number
    RRNo: string
    RRDate: string
    SupplierCode: string
    supplierName: string
    IsPost: number
  }>
  recentPurchaseOrders?: Array<{
    id: number
    xCode: string
    PoDate: string
    SupplierName: string
    POStatus: string
    Amnt_GrandCost: number
    Qty_Total: number
  }>
  salesByPayment: Array<{ PaymentType: string; count: number; total: number }>
  inventoryByClass: Array<{ className: string; productCount: number }>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useDesktopAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [use24Hour, setUse24Hour] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get<DashboardData>('/dashboard/stats')
      // console.log('Dashboard API response:', response)
      if (response.success && response.data) {
        setData(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchDashboardData()
    }
  }, [isAuthenticated, authLoading, fetchDashboardData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="h-12 w-12 text-primary" />
        </motion.div>
        <p className="text-muted-foreground">Loading executive dashboard...</p>
      </div>
    )
  }

  return (
    <motion.div
      className="p-6 space-y-6 max-w-[1920px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Executive Header */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
              {format(currentTime, 'EEEE, MMMM d, yyyy')} •{' '}
              <span 
                onClick={() => setUse24Hour(!use24Hour)} 
                className="cursor-pointer hover:text-white transition-colors"
                title="Click to toggle 12h/24h format"
              >
                {use24Hour 
                  ? format(currentTime, 'HH:mm:ss')
                  : format(currentTime, 'h:mm:ss a')
                }
              </span>
            </p>
            <h1 className="text-3xl font-bold mt-1 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {getGreeting()}, {user?.firstName || 'Executive'}
            </h1>
            <p className="text-slate-400 mt-1">
              POS System Analytics & Business Intelligence Dashboard
            </p>
          </div>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Sales Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-950/50 dark:to-emerald-900/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">Today's Sales</p>
                  <p className="text-2xl font-bold mt-1 text-green-900 dark:text-green-100">
                    {formatCurrency(data?.sales.today.amount || 0)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">{data?.sales.today.count || 0} transactions</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">This Week</p>
                  <p className="text-2xl font-bold mt-1 text-blue-900 dark:text-blue-100">
                    {formatCurrency(data?.sales.thisWeek.amount || 0)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">{data?.sales.thisWeek.count || 0} transactions</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-100/50 dark:from-violet-950/50 dark:to-purple-900/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-violet-700 dark:text-violet-400 uppercase tracking-wide">This Month</p>
                  <p className="text-2xl font-bold mt-1 text-violet-900 dark:text-violet-100">
                    {formatCurrency(data?.sales.thisMonth.amount || 0)}
                  </p>
                  <p className="text-xs text-violet-600 mt-1">{data?.sales.thisMonth.count || 0} transactions</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-950/50 dark:to-orange-900/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">All Time Sales</p>
                  <p className="text-2xl font-bold mt-1 text-amber-900 dark:text-amber-100">
                    {formatCurrency(data?.sales.total.amount || 0)}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">{formatNumber(data?.sales.total.count || 0)} total</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Master Data Overview */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5 text-primary" />
              Master Data Overview
            </CardTitle>
            <CardDescription>Quick access to all system modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 cursor-pointer border border-blue-100 dark:border-blue-900/50 hover:shadow-md transition-all"
                onClick={() => navigate('/products')}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatNumber(data?.masterData.products || 0)}</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 cursor-pointer border border-violet-100 dark:border-violet-900/50 hover:shadow-md transition-all"
                onClick={() => navigate('/suppliers')}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatNumber(data?.masterData.suppliers || 0)}</p>
                    <p className="text-xs text-muted-foreground">Suppliers</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 cursor-pointer border border-cyan-100 dark:border-cyan-900/50 hover:shadow-md transition-all"
                onClick={() => navigate('/customers')}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatNumber(data?.masterData.customers || 0)}</p>
                    <p className="text-xs text-muted-foreground">Customers</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 cursor-pointer border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-all"
                onClick={() => navigate('/classifications')}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Tag className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatNumber(data?.masterData.classes || 0)}</p>
                    <p className="text-xs text-muted-foreground">Categories</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 cursor-pointer border border-purple-100 dark:border-purple-900/50 hover:shadow-md transition-all"
                onClick={() => navigate('/classifications')}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatNumber(data?.masterData.departments || 0)}</p>
                    <p className="text-xs text-muted-foreground">Departments</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-pink-50 dark:bg-pink-950/30 cursor-pointer border border-pink-100 dark:border-pink-900/50 hover:shadow-md transition-all"
                onClick={() => navigate('/classifications')}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatNumber(data?.masterData.branches || 0)}</p>
                    <p className="text-xs text-muted-foreground">Branches</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 cursor-pointer border border-emerald-100 dark:border-emerald-900/50 hover:shadow-md transition-all"
                onClick={() => navigate('/classifications')}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatNumber(data?.masterData.locations || 0)}</p>
                    <p className="text-xs text-muted-foreground">Locations</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Sales Trend */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Monthly Sales Trend
                  </CardTitle>
                  <CardDescription>Revenue over the last 12 months</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={salesChartConfig} className="h-[280px] w-full">
                <AreaChart 
                  data={data?.trends.monthly || []} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthName" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => formatCurrency(v)} />
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-semibold">{payload[0]?.payload?.monthName}</p>
                            <p className="text-sm text-blue-600">Sales: {formatCurrency(payload[0]?.value as number)}</p>
                            <p className="text-xs text-muted-foreground">{payload[0]?.payload?.transactions} transactions</p>
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
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Products by Category */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Products by Category
              </CardTitle>
              <CardDescription>Distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.inventoryByClass || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="productCount"
                      nameKey="className"
                    >
                      {(data?.inventoryByClass || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-2">
                              <p className="font-medium text-sm">{payload[0]?.payload?.className || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{payload[0]?.value} products</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(data?.inventoryByClass || []).slice(0, 6).map((item, index) => (
                  <div key={item.className} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                    <span className="text-xs text-muted-foreground truncate">{item.className || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Operations Overview */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/receiving')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(data?.operations.receiving.total || 0)}</p>
                  <p className="text-xs text-muted-foreground">Direct Receiving</p>
                </div>
              </div>
              {data?.operations.receiving.pending ? (
                <Badge variant="secondary" className="mt-2 text-xs bg-amber-100 text-amber-700">
                  {data.operations.receiving.pending} pending
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/purchase-orders')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(data?.operations.purchaseOrders.total || 0)}</p>
                  <p className="text-xs text-muted-foreground">Purchase Orders</p>
                </div>
              </div>
              {data?.operations.purchaseOrders.pending ? (
                <Badge variant="secondary" className="mt-2 text-xs bg-amber-100 text-amber-700">
                  {data.operations.purchaseOrders.pending} pending
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/transfers')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <ArrowLeftRight className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber((data?.operations.transfers.in || 0) + (data?.operations.transfers.out || 0))}</p>
                  <p className="text-xs text-muted-foreground">Stock Transfers</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">In: {data?.operations.transfers.in || 0}</Badge>
                <Badge variant="outline" className="text-xs">Out: {data?.operations.transfers.out || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/physical-count')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(data?.operations.physicalCount || 0)}</p>
                  <p className="text-xs text-muted-foreground">Physical Counts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/item-movement')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(data?.operations.itemMovements.total || 0)}</p>
                  <p className="text-xs text-muted-foreground">Item Movements</p>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2 text-xs bg-blue-100 text-blue-700">
                {data?.operations.itemMovements.today || 0} today
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/voids-returns')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber((data?.adjustments.voids.count || 0) + (data?.adjustments.returns.count || 0))}</p>
                  <p className="text-xs text-muted-foreground">Voids & Returns</p>
                </div>
              </div>
              <p className="text-xs text-red-600 mt-2">
                {formatCurrency((data?.adjustments.voids.amount || 0) + (data?.adjustments.returns.amount || 0))}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment Types & Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Payment Type */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Sales by Payment Type
              </CardTitle>
              <CardDescription>Revenue breakdown by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              {(data?.salesByPayment && data.salesByPayment.length > 0) ? (
                <div className="space-y-4">
                  {data.salesByPayment.slice(0, 5).map((payment, index) => {
                    const total = data.salesByPayment.reduce((acc, p) => acc + (p.total || 0), 0)
                    const percentage = total > 0 ? ((payment.total || 0) / total) * 100 : 0
                    return (
                      <div key={payment.PaymentType || index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {payment.PaymentType?.toLowerCase().includes('cash') ? (
                              <Wallet className="h-4 w-4 text-green-500" />
                            ) : (
                              <CreditCard className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="font-medium">{payment.PaymentType || 'Unknown'}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(payment.total || 0)}</p>
                            <p className="text-xs text-muted-foreground">{payment.count} transactions</p>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto opacity-30 mb-2" />
                  <p>No payment data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Recent Sales
                  </CardTitle>
                  <CardDescription>Latest POS transactions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/pos-transactions')}>
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.recentTransactions && data.recentTransactions.length > 0) ? (
                data.recentTransactions.slice(0, 5).map((txn) => (
                  <motion.div
                    key={txn.ID}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{txn.TransNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {txn.CashierName} • Terminal {txn.TerminalNo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(txn.GrandTotal || 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {txn.DateTrans ? formatDistanceToNow(new Date(txn.DateTrans), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto opacity-30 mb-2" />
                  <p>No recent transactions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Products, Recent Receiving & Recent POs */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Selling Products */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Top Selling Products
                  </CardTitle>
                  <CardDescription>Best performers this year</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.topProducts && data.topProducts.length > 0) ? (
                data.topProducts.slice(0, 5).map((product, index) => (
                  <motion.div
                    key={product.ItemCode}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.productName || product.ItemCode}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(product.totalQty)} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(product.totalAmount || 0)}</p>
                      <p className="text-xs text-muted-foreground">{product.transactionCount} orders</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto opacity-30 mb-2" />
                  <p>No product data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Receiving */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-teal-500" />
                    Recent Receiving
                  </CardTitle>
                  <CardDescription>Latest goods receipts</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/receiving')}>
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.recentReceiving && data.recentReceiving.length > 0) ? (
                data.recentReceiving.slice(0, 5).map((rr) => (
                  <motion.div
                    key={rr.id}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{rr.RRNo}</p>
                        <Badge variant={rr.IsPost ? 'default' : 'secondary'} className="text-xs">
                          {rr.IsPost ? 'Posted' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {rr.supplierName || rr.SupplierCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {rr.RRDate ? format(new Date(rr.RRDate), 'MMM d, yyyy') : ''}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto opacity-30 mb-2" />
                  <p>No receiving records</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Purchase Orders */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                    Recent Purchase Orders
                  </CardTitle>
                  <CardDescription>Latest PO submissions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/purchase-orders')}>
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.recentPurchaseOrders && data.recentPurchaseOrders.length > 0) ? (
                data.recentPurchaseOrders.slice(0, 5).map((po) => (
                  <motion.div
                    key={po.id}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{po.xCode}</p>
                        <Badge 
                          variant={po.POStatus === 'Posted' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {po.POStatus || 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {po.SupplierName || 'Unknown Supplier'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(po.Amnt_GrandCost)}</p>
                      <p className="text-xs text-muted-foreground">
                        {po.PoDate ? format(new Date(po.PoDate), 'MMM d, yyyy') : ''}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto opacity-30 mb-2" />
                  <p>No purchase orders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Navigate to frequently used modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: 'Products', icon: Package, path: '/products' },
                { label: 'Inventory', icon: Boxes, path: '/inventory' },
                { label: 'POS Sales', icon: Receipt, path: '/pos-transactions' },
                { label: 'Receiving', icon: Truck, path: '/receiving' },
                { label: 'Transfers', icon: ArrowLeftRight, path: '/transfers' },
                { label: 'Customers', icon: Users, path: '/customers' },
                { label: 'Suppliers', icon: Building2, path: '/suppliers' },
                { label: 'Settings', icon: Layers, path: '/settings-ref' },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={() => navigate(action.path)}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
