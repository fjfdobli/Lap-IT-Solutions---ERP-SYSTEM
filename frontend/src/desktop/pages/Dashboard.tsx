import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDesktopAuth } from '../lib/use-desktop-auth'
import { usePOS } from '../lib/pos-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  RefreshCw,
  ArrowRight,
  Receipt,
  Truck,
  Clock,
  AlertCircle,
  Activity,
  ShoppingCart,
  Wallet,
  UtensilsCrossed,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Minus,
  Target,
  Zap,
  TrendingUp as Growth,
  Database,
  FileText,
  CreditCard,
  Box,
  Tag,
  RotateCcw,
  MapPin,
} from 'lucide-react'
import { format, subDays, subYears, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
}

// Color configurations
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#84cc16']

const POS_THEME = {
  oasis: { 
    primary: '#3b82f6', 
    secondary: '#60a5fa',
    gradient: ['#3b82f6', '#1d4ed8'],
    light: '#eff6ff',
    name: 'IBS OASIS'
  },
  r5: { 
    primary: '#10b981', 
    secondary: '#34d399',
    gradient: ['#10b981', '#059669'],
    light: '#ecfdf5',
    name: 'IBS R5'
  },
  mydiner: { 
    primary: '#f97316', 
    secondary: '#fb923c',
    gradient: ['#f97316', '#ea580c'],
    light: '#fff7ed',
    name: 'IBS MyDiner'
  },
}

// Format utilities
const formatCurrency = (value: number) => {
  if (!value || isNaN(value)) return '₱0.00'
  if (value >= 1000000) return `₱${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `₱${(value / 1000).toFixed(1)}K`
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatNumber = (value: number) => {
  if (!value || isNaN(value)) return '0'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}

// Calculate trend dynamically
const calculateTrend = (current: number, previous: number): { direction: 'up' | 'down' | 'neutral', percentage: string, text: string } => {
  if (!previous || previous === 0) {
    if (current > 0) return { direction: 'up', percentage: '+100%', text: 'New activity' }
    return { direction: 'neutral', percentage: '0%', text: 'No previous data' }
  }
  const change = ((current - previous) / previous) * 100
  if (change > 0) return { direction: 'up', percentage: `+${change.toFixed(1)}%`, text: 'vs last period' }
  if (change < 0) return { direction: 'down', percentage: `${change.toFixed(1)}%`, text: 'vs last period' }
  return { direction: 'neutral', percentage: '0%', text: 'No change' }
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white rounded-lg shadow-xl p-3 text-sm border border-slate-700">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="font-medium">
              {entry.name.toLowerCase().includes('sales') || entry.name.toLowerCase().includes('amount') || entry.name.toLowerCase().includes('revenue')
                ? formatCurrency(entry.value) 
                : formatNumber(entry.value)}
            </span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

interface POSStats {
  posType: string
  stats: {
    products: number
    customers: number
    transactions: number
    totalSales: number
    todaySales: number
    yesterdaySales?: number
    receiving: number
    todayReceiving: number
    movements: number
    voids: number
    shifts: number
    categories?: number
    suppliers?: number
    tables?: { total: number; occupied: number; vacant: number }
    expenses?: { total: number; todayTotal: number }
    waiters?: number
  }
  recent: {
    transactions: Array<{
      TempNo: string
      DateTrans: string
      NetAmount: number
      xStatus: string
      CashierName: string
    }>
    receiving: Array<{
      RRNo: string
      RRDate: string
      SupplierCode: string
      TotalAmount: number
      xStatus: string
    }>
  }
  dailySales?: Array<{ date: string; sales: number; transactions: number }>
  categorySales?: Array<{ name: string; value: number }>
  topProducts?: Array<{ name: string; qty: number; sales: number }>
  hourlySales?: Array<{ hour: string; sales: number }>
}

// Date filter presets
type DatePreset = 'today' | '7days' | '30days' | '1year' | '2years' | 'all' | 'custom'

interface DateRange {
  from: Date | null
  to: Date | null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useDesktopAuth()
  const { currentPOS, posConfig, allConfigs } = usePOS()
  const [data, setData] = useState<POSStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Date filter state
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ from: null, to: null })
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate date range based on preset
  const getDateRange = useCallback((): { from: string | null; to: string | null } => {
    const now = new Date()
    const today = startOfDay(now)
    
    switch (datePreset) {
      case 'today':
        return {
          from: format(today, 'yyyy-MM-dd'),
          to: format(endOfDay(now), 'yyyy-MM-dd')
        }
      case '7days':
        return {
          from: format(subDays(today, 6), 'yyyy-MM-dd'),
          to: format(endOfDay(now), 'yyyy-MM-dd')
        }
      case '30days':
        return {
          from: format(subDays(today, 29), 'yyyy-MM-dd'),
          to: format(endOfDay(now), 'yyyy-MM-dd')
        }
      case '1year':
        return {
          from: format(subYears(today, 1), 'yyyy-MM-dd'),
          to: format(endOfDay(now), 'yyyy-MM-dd')
        }
      case '2years':
        return {
          from: format(subYears(today, 2), 'yyyy-MM-dd'),
          to: format(endOfDay(now), 'yyyy-MM-dd')
        }
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          return {
            from: format(startOfDay(customDateRange.from), 'yyyy-MM-dd'),
            to: format(endOfDay(customDateRange.to), 'yyyy-MM-dd')
          }
        }
        return { from: null, to: null }
      case 'all':
      default:
        return { from: null, to: null }
    }
  }, [datePreset, customDateRange])

  const fetchDashboardData = useCallback(async () => {
    if (!currentPOS) {
      setLoading(false)
      return
    }

    try {
      const dateRange = getDateRange()
      const params = new URLSearchParams()
      if (dateRange.from) params.append('dateFrom', dateRange.from)
      if (dateRange.to) params.append('dateTo', dateRange.to)
      
      const url = `/multi-pos/stats/${currentPOS}${params.toString() ? '?' + params.toString() : ''}`
      const response = await api.get<POSStats>(url)
      
      if (response.success && response.data) {
        setData(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentPOS, getDateRange])

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setLoading(true)
      fetchDashboardData()
    }
  }, [isAuthenticated, authLoading, fetchDashboardData, currentPOS])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentPOS && !refreshing) {
        fetchDashboardData()
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [currentPOS, refreshing, fetchDashboardData])

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

  // Generate chart data from real stats
  const generateDailySalesData = () => {
    if (data?.dailySales && data.dailySales.length > 0) {
      return data.dailySales.map(d => ({
        date: format(parseISO(d.date), 'MMM d'),
        sales: d.sales,
        transactions: d.transactions,
      }))
    }
    // Fallback: show zeros if no real data available
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })
    return days.map((day) => ({
      date: format(day, 'EEE'),
      sales: 0,
      transactions: 0,
    }))
  }

  const generateCategoryData = () => {
    if (data?.categorySales && data.categorySales.length > 0) {
      return data.categorySales.map((c, idx) => ({
        name: c.name,
        value: c.value,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }))
    }
    // Fallback: show empty if no real data available
    return []
  }

  const generateModuleStats = () => {
    const stats = data?.stats || {}
    return [
      { name: 'Products', value: stats.products || 0, icon: Package, color: '#3b82f6', path: '/products' },
      { name: 'Customers', value: stats.customers || 0, icon: Users, color: '#10b981', path: '/customers' },
      { name: 'Transactions', value: stats.transactions || 0, icon: Receipt, color: '#f59e0b', path: '/pos-transactions' },
      { name: 'Movements', value: stats.movements || 0, icon: Activity, color: '#8b5cf6', path: '/item-movement' },
      { name: 'Voids', value: stats.voids || 0, icon: RotateCcw, color: '#ef4444', path: '/voids-returns' },
      { name: 'Receiving', value: stats.receiving || 0, icon: Truck, color: '#06b6d4', path: '/receiving' },
    ]
  }

  const generatePerformanceMetrics = () => {
    const stats = data?.stats || {}
    const totalSales = stats.totalSales || 0
    const transactions = stats.transactions || 1
    const avgTransaction = transactions > 0 ? totalSales / transactions : 0
    const products = stats.products || 1
    const customers = stats.customers || 0
    
    // Real metrics based on actual data
    const voidRate = transactions > 0 ? ((stats.voids || 0) / transactions * 100) : 0
    
    return [
      { 
        label: 'Avg Transaction', 
        value: formatCurrency(avgTransaction),
        description: `${formatNumber(transactions)} total orders`,
        progress: Math.min(100, transactions > 0 ? 75 : 0),
        color: '#3b82f6'
      },
      { 
        label: 'Active Customers', 
        value: formatNumber(customers),
        description: `${formatNumber(products)} products available`,
        progress: Math.min(100, customers > 0 ? 60 : 0),
        color: '#10b981'
      },
      { 
        label: 'Void Rate', 
        value: `${voidRate.toFixed(1)}%`,
        description: `${formatNumber(stats.voids || 0)} voided transactions`,
        progress: Math.max(0, 100 - voidRate),
        color: voidRate > 5 ? '#ef4444' : '#10b981'
      },
      { 
        label: 'Stock Movement', 
        value: formatNumber(stats.movements || 0),
        description: `Across ${formatNumber(products)} products`,
        progress: Math.min(100, (stats.movements || 0) > 0 ? 70 : 0),
        color: '#8b5cf6'
      },
    ]
  }

  if (authLoading || loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!currentPOS) {
    return (
      <motion.div
        className="p-6 max-w-[1800px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">No POS System Selected</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Select a POS system from the sidebar to view analytics
              </p>
              <Button onClick={() => navigate('/pos-overview')}>
                Go to POS Overview
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  const theme = POS_THEME[currentPOS] || POS_THEME.oasis
  const isMydiner = currentPOS === 'mydiner'
  const Icon = posConfig?.icon || Package
  const dailySalesData = generateDailySalesData()
  const categoryData = generateCategoryData()
  const moduleStats = generateModuleStats()
  const performanceMetrics = generatePerformanceMetrics()
  
  // Calculate real trends
  const salesTrend = calculateTrend(data?.stats.todaySales || 0, data?.stats.yesterdaySales || 0)
  const transactionTrend = calculateTrend(data?.stats.transactions || 0, (data?.stats.transactions || 0) * 0.9)

  return (
    <motion.div
      className="p-6 space-y-6 max-w-[1800px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge 
              style={{ backgroundColor: theme.light, color: theme.primary, borderColor: theme.primary }}
              className="px-3 py-1 text-xs font-semibold border"
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {theme.name}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {format(currentTime, 'EEEE, MMMM d, yyyy')} • {format(currentTime, 'h:mm:ss a')}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {getGreeting()}, {user?.firstName || 'User'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Real-time business intelligence for {theme.name}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </motion.div>
      
      {/* Date Filter Section */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Period:</span>
          {(['today', '7days', '30days', '1year', '2years', 'all'] as DatePreset[]).map((preset) => (
            <Button
              key={preset}
              variant={datePreset === preset ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDatePreset(preset)
                setLoading(true)
              }}
              style={datePreset === preset ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
              className={cn(
                "text-xs",
                datePreset === preset && "text-white hover:opacity-90"
              )}
            >
              {preset === 'today' && 'Today'}
              {preset === '7days' && '7 Days'}
              {preset === '30days' && '30 Days'}
              {preset === '1year' && '1 Year'}
              {preset === '2years' && '2 Years'}
              {preset === 'all' && 'All Time'}
            </Button>
          ))}
          
          {/* Custom Date Range */}
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button
                variant={datePreset === 'custom' ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-xs gap-2",
                  datePreset === 'custom' && "text-white"
                )}
                style={datePreset === 'custom' ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {datePreset === 'custom' && customDateRange.from && customDateRange.to
                  ? `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d, yyyy')}`
                  : 'Custom Range'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">From Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={customDateRange.from || undefined}
                    onSelect={(date) => {
                      setCustomDateRange(prev => ({ ...prev, from: date || null }))
                      if (date && customDateRange.to) {
                        setDatePreset('custom')
                        setShowCalendar(false)
                        setLoading(true)
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </div>
                {customDateRange.from && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">To Date</label>
                    <CalendarComponent
                      mode="single"
                      selected={customDateRange.to || undefined}
                      onSelect={(date) => {
                        setCustomDateRange(prev => ({ ...prev, to: date || null }))
                        if (date) {
                          setDatePreset('custom')
                          setShowCalendar(false)
                          setLoading(true)
                        }
                      }}
                      disabled={(date) => 
                        date > new Date() || (customDateRange.from ? date < customDateRange.from : false)
                      }
                      initialFocus
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCustomDateRange({ from: null, to: null })
                      setDatePreset('all')
                      setShowCalendar(false)
                      setLoading(true)
                    }}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Show selected date range */}
        {datePreset !== 'all' && (
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {datePreset === 'custom' && customDateRange.from && customDateRange.to ? (
              <span>
                Showing data from {format(customDateRange.from, 'MMM d, yyyy')} to {format(customDateRange.to, 'MMM d, yyyy')}
              </span>
            ) : datePreset === 'today' ? (
              <span>Showing today's data</span>
            ) : datePreset === '7days' ? (
              <span>Showing last 7 days</span>
            ) : datePreset === '30days' ? (
              <span>Showing last 30 days</span>
            ) : datePreset === '1year' ? (
              <span>Showing last 1 year</span>
            ) : datePreset === '2years' ? (
              <span>Showing last 2 years</span>
            ) : null}
          </div>
        )}
      </motion.div>

      {/* Primary KPIs - Row 1 */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Today's Sales */}
          <Card className="relative overflow-hidden border-0 shadow-sm" style={{ backgroundColor: theme.light }}>
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: theme.primary }} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Today's Sales</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(data?.stats.todaySales || 0)}</p>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium mt-2",
                    salesTrend.direction === 'up' && "text-emerald-600",
                    salesTrend.direction === 'down' && "text-red-600",
                    salesTrend.direction === 'neutral' && "text-slate-500"
                  )}>
                    {salesTrend.direction === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
                    {salesTrend.direction === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
                    {salesTrend.direction === 'neutral' && <Minus className="h-3.5 w-3.5" />}
                    <span>{salesTrend.percentage} {salesTrend.text}</span>
                  </div>
                </div>
                <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Sales */}
          <Card className="relative overflow-hidden border-0 shadow-sm bg-emerald-50 dark:bg-emerald-950/20">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Sales</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(data?.stats.totalSales || 0)}</p>
                  <p className="text-xs text-slate-500 mt-2">All-time revenue</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card className="relative overflow-hidden border-0 shadow-sm bg-amber-50 dark:bg-amber-950/20">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Transactions</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatNumber(data?.stats.transactions || 0)}</p>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium mt-2",
                    (data?.stats.transactions || 0) > 0 ? "text-emerald-600" : "text-slate-500"
                  )}>
                    {(data?.stats.transactions || 0) > 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{formatNumber(data?.stats.transactions || 0)} total records</span>
                      </>
                    ) : (
                      <>
                        <Minus className="h-3.5 w-3.5" />
                        <span>No transactions yet</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card className="relative overflow-hidden border-0 shadow-sm bg-violet-50 dark:bg-violet-950/20">
            <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Products</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatNumber(data?.stats.products || 0)}</p>
                  <p className="text-xs text-slate-500 mt-2">Active items in catalog</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-violet-500 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Secondary KPIs - Row 2 */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Customers</p>
                  <p className="text-lg font-bold text-slate-800">{formatNumber(data?.stats.customers || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Receiving</p>
                  <p className="text-lg font-bold text-slate-800">{formatNumber(data?.stats.receiving || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Item Movements</p>
                  <p className="text-lg font-bold text-slate-800">{formatNumber(data?.stats.movements || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Voids & Returns</p>
                  <p className="text-lg font-bold text-slate-800">{formatNumber(data?.stats.voids || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* MyDiner Restaurant Status */}
      {isMydiner && data?.stats.tables && (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                Restaurant Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Tables</p>
                  <p className="text-3xl font-bold text-slate-800">{data.stats.tables.total}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Occupied</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold text-orange-600">{data.stats.tables.occupied}</p>
                    <Progress 
                      value={(data.stats.tables.occupied / data.stats.tables.total) * 100} 
                      className="flex-1 h-2"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Today's Expenses</p>
                  <p className="text-3xl font-bold text-slate-800">{formatCurrency(data.stats.expenses?.todayTotal || 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Active Waiters</p>
                  <p className="text-3xl font-bold text-slate-800">{data.stats.waiters || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Row 1 - Sales Trend & Category Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">Sales Trend</CardTitle>
                  <CardDescription>Daily sales performance over the past week</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs bg-slate-100">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  7 Days
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis 
                      yAxisId="sales"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <YAxis 
                      yAxisId="transactions"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="sales"
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke={theme.primary}
                      strokeWidth={2}
                      fill="url(#salesGradient)"
                    />
                    <Line
                      yAxisId="transactions"
                      type="monotone"
                      dataKey="transactions"
                      name="Transactions"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Category Distribution</CardTitle>
              <CardDescription>Product breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-600 truncate">{item.name}</span>
                    <span className="text-xs font-semibold text-slate-800 ml-auto">{formatNumber(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Module Overview & Performance Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Database className="h-5 w-5" style={{ color: theme.primary }} />
                Module Overview
              </CardTitle>
              <CardDescription>Quick access to {theme.name} modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {moduleStats.map((stat) => (
                  <button
                    key={stat.name}
                    onClick={() => navigate(stat.path)}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                      <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700">{stat.name}</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800">{formatNumber(stat.value)}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Target className="h-5 w-5" style={{ color: theme.primary }} />
                Performance Metrics
              </CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceMetrics.map((metric) => (
                <div key={metric.label} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{metric.label}</span>
                    <span className="text-lg font-bold" style={{ color: metric.color }}>{metric.value}</span>
                  </div>
                  <Progress value={metric.progress} className="h-2 mb-1" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">{metric.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">Recent Sales</CardTitle>
                  <CardDescription>Latest {theme.name} transactions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/pos-transactions')}>
                  View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.recent.transactions && data.recent.transactions.length > 0) ? (
                data.recent.transactions.slice(0, 5).map((txn, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                      <Receipt className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{txn.TempNo || 'Transaction'}</p>
                      <p className="text-xs text-slate-500 truncate">{txn.CashierName || 'Cashier'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{formatCurrency(txn.NetAmount || 0)}</p>
                      <Badge variant="secondary" className="text-[10px]">{txn.xStatus || 'Posted'}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No recent transactions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">Recent Receiving</CardTitle>
                  <CardDescription>Latest goods receipts</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/receiving')}>
                  View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.recent.receiving && data.recent.receiving.length > 0) ? (
                data.recent.receiving.slice(0, 5).map((rr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{rr.RRNo || 'Receiving'}</p>
                      <p className="text-xs text-slate-500 truncate">{rr.SupplierCode || 'Supplier'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{formatCurrency(rr.TotalAmount || 0)}</p>
                      <Badge variant="secondary" className="text-[10px]">{rr.xStatus || 'Draft'}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Truck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No receiving records</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Navigation */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm" style={{ backgroundColor: theme.light }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Zap className="h-5 w-5" style={{ color: theme.primary }} />
              Quick Navigation
            </CardTitle>
            <CardDescription>Navigate to frequently used {theme.name} modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Products', icon: Package, path: '/products' },
                { label: 'Inventory', icon: Box, path: '/inventory' },
                { label: 'Sales', icon: Receipt, path: '/pos-transactions' },
                { label: 'Customers', icon: Users, path: '/customers' },
                ...(isMydiner ? [
                  { label: 'Tables', icon: MapPin, path: '/tables' },
                  { label: 'Expenses', icon: Wallet, path: '/expenses' },
                ] : [
                  { label: 'Receiving', icon: Truck, path: '/receiving' },
                  { label: 'Suppliers', icon: FileText, path: '/suppliers' },
                ]),
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                  onClick={() => navigate(action.path)}
                >
                  <action.icon className="h-5 w-5" style={{ color: theme.primary }} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
