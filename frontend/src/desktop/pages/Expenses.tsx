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
  Receipt,
  DollarSign,
  Search,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Expense {
  ID: number
  TempNo: string
  DateTrans: string
  TotalAmount: string
  CashierName: string
  ExpenseName?: string
  ItemAmount?: string
}

export default function Expenses() {
  const { currentPOS, posConfig } = usePOS()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [todayTotal, setTodayTotal] = useState(0)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const loadExpenses = async (page = 1) => {
    try {
      const response = await api.get<{
        expenses: Expense[]
        pagination: typeof pagination
        todayTotal: number
      }>(`/multi-pos/mydiner/expenses?page=${page}&limit=20`)
      
      if (response.success && response.data) {
        setExpenses(response.data.expenses)
        setPagination(response.data.pagination)
        setTodayTotal(response.data.todayTotal)
      }
    } catch (error) {
      console.error('Failed to load expenses:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (currentPOS === 'mydiner') {
      loadExpenses()
    }
  }, [currentPOS])

  const handleRefresh = () => {
    setRefreshing(true)
    loadExpenses(pagination.page)
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(num || 0)
  }

  if (currentPOS !== 'mydiner') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <Receipt className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Expense Tracking</h2>
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
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  // Filter expenses based on search
  const filteredExpenses = expenses.filter(expense => 
    expense.TempNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.ExpenseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.CashierName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8 text-orange-500" />
            Expense Records
          </h1>
          <p className="text-muted-foreground mt-1">
            Track restaurant expenses from {posConfig?.name}
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold">{pagination.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Today's Expenses</p>
                <p className="text-3xl font-bold text-orange-700">{formatCurrency(todayTotal)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average per Record</p>
                <p className="text-3xl font-bold">
                  {pagination.total > 0 
                    ? formatCurrency(expenses.reduce((sum, e) => sum + (parseFloat(e.TotalAmount) || 0), 0) / Math.min(expenses.length, 20))
                    : '₱0'
                  }
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Expense History</CardTitle>
              <CardDescription>All recorded expenses (read-only from POS)</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expense Type</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.ID}>
                      <TableCell className="font-mono text-sm">
                        {expense.TempNo}
                      </TableCell>
                      <TableCell>{expense.DateTrans}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {expense.ExpenseName || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.CashierName}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        {formatCurrency(expense.TotalAmount)}
                      </TableCell>
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => loadExpenses(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => loadExpenses(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
