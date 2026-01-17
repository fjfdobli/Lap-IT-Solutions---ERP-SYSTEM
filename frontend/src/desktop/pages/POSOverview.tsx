import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePOS, POSType } from '../lib/pos-context'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Package,
  Receipt,
  DollarSign,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Wifi,
  WifiOff,
  Truck
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface POSStats {
  posType: string
  name: string
  connected: boolean
  stats?: {
    products: number
    transactions: number
    totalSales: number
    receiving: number
  }
  error?: string
}

export default function POSOverview() {
  const navigate = useNavigate()
  const { setCurrentPOS, allConfigs } = usePOS()
  const [posStats, setPosStats] = useState<POSStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadOverview = async () => {
    try {
      const response = await api.get('/multi-pos/overview')
      if (response.success && response.data) {
        setPosStats(response.data)
      }
    } catch (error) {
      console.error('Failed to load POS overview:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadOverview()
    // Refresh every 30 seconds
    const interval = setInterval(loadOverview, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadOverview()
  }

  const handleSelectPOS = (posType: POSType) => {
    setCurrentPOS(posType)
    navigate('/')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-PH').format(value)
  }

  // Calculate totals
  const totalSales = posStats.reduce((sum, pos) => sum + (pos.stats?.totalSales || 0), 0)
  const totalTransactions = posStats.reduce((sum, pos) => sum + (pos.stats?.transactions || 0), 0)
  const totalProducts = posStats.reduce((sum, pos) => sum + (pos.stats?.products || 0), 0)
  const connectedCount = posStats.filter(pos => pos.connected).length

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">POS Systems Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor all deployed POS systems in real-time
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-fit"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Wifi className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">{connectedCount} / 3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{formatNumber(totalTransactions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{formatNumber(totalProducts)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* POS Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {(['oasis', 'r5', 'mydiner'] as POSType[]).map(posType => {
          const config = allConfigs[posType]
          const stats = posStats.find(p => p.posType === posType)
          const Icon = config.icon

          return (
            <Card 
              key={posType}
              className={cn(
                "relative overflow-hidden transition-all hover:shadow-lg cursor-pointer group",
                stats?.connected ? "border-2" : "border-2 border-dashed opacity-60",
                stats?.connected && config.borderColor
              )}
              onClick={() => stats?.connected && handleSelectPOS(posType)}
            >
              {/* Color bar */}
              <div className={cn("absolute top-0 left-0 right-0 h-1", config.bgColor)} />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center",
                      config.lightBg
                    )}>
                      <Icon className={cn("h-6 w-6", config.textColor)} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={stats?.connected ? "default" : "destructive"}
                    className={cn(
                      "text-xs",
                      stats?.connected && config.bgColor
                    )}
                  >
                    {stats?.connected ? (
                      <><Wifi className="h-3 w-3 mr-1" /> Online</>
                    ) : (
                      <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                    )}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {stats?.connected && stats.stats ? (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Package className="h-3 w-3" /> Products
                        </p>
                        <p className="text-xl font-semibold">
                          {formatNumber(stats.stats.products)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Receipt className="h-3 w-3" /> Transactions
                        </p>
                        <p className="text-xl font-semibold">
                          {formatNumber(stats.stats.transactions)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Total Sales
                        </p>
                        <p className="text-xl font-semibold text-green-600">
                          {formatCurrency(stats.stats.totalSales)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Truck className="h-3 w-3" /> Receiving
                        </p>
                        <p className="text-xl font-semibold">
                          {formatNumber(stats.stats.receiving)}
                        </p>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Button 
                      className={cn("w-full group-hover:translate-x-0", config.bgColor)}
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <WifiOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Connection unavailable</p>
                    <p className="text-xs mt-1">{stats?.error || 'Unable to connect to database'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sales Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Distribution
          </CardTitle>
          <CardDescription>Compare total sales across all POS systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(['oasis', 'r5', 'mydiner'] as POSType[]).map(posType => {
              const config = allConfigs[posType]
              const stats = posStats.find(p => p.posType === posType)
              const sales = stats?.stats?.totalSales || 0
              const percentage = totalSales > 0 ? (sales / totalSales) * 100 : 0
              const Icon = config.icon

              return (
                <div key={posType} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", config.textColor)} />
                      <span className="font-medium">{config.name}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(sales)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all", config.bgColor)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
