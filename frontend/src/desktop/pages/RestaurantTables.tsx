import { useState, useEffect } from 'react'
import { usePOS } from '../lib/pos-context'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  UtensilsCrossed,
  Users,
  Clock,
  RefreshCw,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RestaurantTable {
  id: number
  xCode: string
  Xname: string
  xStatus: string
  NoGuest: string
  xType: string
  AmountDue: string
  KitchenStat: string
  WaiterName: string
  StartTime: string
  Assignment: string
}

export default function RestaurantTables() {
  const { currentPOS, posConfig } = usePOS()
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState({ total: 0, vacant: 0, occupied: 0 })

  const loadTables = async () => {
    try {
      const response = await api.get<{
        tables: RestaurantTable[]
        summary: { total: number; vacant: number; occupied: number }
      }>('/multi-pos/mydiner/restaurant-tables')
      
      if (response.success && response.data) {
        setTables(response.data.tables)
        setSummary(response.data.summary)
      }
    } catch (error) {
      console.error('Failed to load tables:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (currentPOS === 'mydiner') {
      loadTables()
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadTables, 30000)
      return () => clearInterval(interval)
    }
  }, [currentPOS])

  const handleRefresh = () => {
    setRefreshing(true)
    loadTables()
  }

  if (currentPOS !== 'mydiner') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <UtensilsCrossed className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Restaurant Tables</h2>
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
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-6 lg:grid-cols-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-32" />
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8 text-orange-500" />
            Restaurant Tables
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time table status for {posConfig?.name}
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tables</p>
                <p className="text-3xl font-bold">{summary.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <UtensilsCrossed className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Vacant</p>
                <p className="text-3xl font-bold text-green-700">{summary.vacant}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl">🟢</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Occupied</p>
                <p className="text-3xl font-bold text-red-700">{summary.occupied}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-2xl">🔴</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-3xl font-bold">
                  {summary.total > 0 ? Math.round((summary.occupied / summary.total) * 100) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Table Layout</CardTitle>
          <CardDescription>Click on a table to view details (read-only)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {tables.map(table => {
              const isOccupied = table.xStatus === 'Occupied'
              const guests = parseInt(table.NoGuest) || 0
              const amount = parseFloat(table.AmountDue) || 0

              return (
                <div
                  key={table.id}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md",
                    isOccupied 
                      ? "bg-red-50 border-red-300 hover:border-red-400" 
                      : "bg-green-50 border-green-300 hover:border-green-400"
                  )}
                >
                  {/* Table Number */}
                  <div className="text-center mb-2">
                    <span className="text-2xl font-bold">{table.Xname}</span>
                  </div>

                  {/* Status Badge */}
                  <Badge 
                    variant={isOccupied ? "destructive" : "default"}
                    className={cn(
                      "w-full justify-center text-xs",
                      !isOccupied && "bg-green-500 hover:bg-green-600"
                    )}
                  >
                    {table.xStatus}
                  </Badge>

                  {/* Occupied Details */}
                  {isOccupied && (
                    <div className="mt-2 space-y-1 text-xs text-center">
                      {guests > 0 && (
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{guests} guests</span>
                        </div>
                      )}
                      {amount > 0 && (
                        <div className="font-medium text-red-600">
                          ₱{amount.toLocaleString()}
                        </div>
                      )}
                      {table.WaiterName && table.WaiterName !== 'N/A' && (
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{table.WaiterName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-500" />
          <span>Vacant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-500" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Auto-refreshes every 30 seconds</span>
        </div>
      </div>
    </div>
  )
}
