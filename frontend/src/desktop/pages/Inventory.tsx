import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreHorizontal,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
  ClipboardCheck,
  History,
  DollarSign,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface InventoryItem {
  id: string
  product_id: string
  sku: string
  product_name: string
  unit: string
  category_name: string | null
  quantity_on_hand: number
  quantity_reserved: number
  quantity_on_order: number
  reorder_level: number
  cost_price: number
  selling_price: number
}

interface InventoryStats {
  totalProducts: number
  totalValue: number
  lowStockItems: number
  outOfStock: number
}

interface InventoryTransaction {
  id: string
  transaction_type: string
  quantity: number
  quantity_before: number
  quantity_after: number
  notes: string | null
  created_at: string
  first_name: string
  last_name: string
}

export default function Inventory() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState(searchParams.get('lowStock') === 'true' ? 'low' : 'all')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [showCountDialog, setShowCountDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [countQuantity, setCountQuantity] = useState(0)
  const [countNotes, setCountNotes] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [invResponse, statsResponse] = await Promise.all([
        api.getInventory({
          search: searchQuery || undefined,
          categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
          lowStock: stockFilter === 'low' ? true : stockFilter === 'out' ? undefined : undefined,
          page: pagination.page,
          limit: pagination.limit,
        }),
        api.getInventoryStats(),
      ])

      if (invResponse.success && invResponse.data) {
        let items = invResponse.data.inventory
        if (stockFilter === 'out') {
          items = items.filter(item => item.quantity_on_hand === 0)
        }
        setInventory(items)
        setPagination(prev => ({
          ...prev,
          total: invResponse.data!.pagination.total,
          totalPages: invResponse.data!.pagination.totalPages,
        }))
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, categoryFilter, stockFilter, pagination.page, pagination.limit])

  useEffect(() => {
    loadData()
    loadCategories()
  }, [loadData])

  async function loadCategories() {
    try {
      const response = await api.getCategories()
      if (response.success && response.data) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  async function loadTransactions(productId: string) {
    try {
      const response = await api.getInventoryTransactions(productId)
      if (response.success && response.data) {
        setTransactions(response.data.transactions)
      }
    } catch (error) {
      console.error('Failed to load transactions:', error)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    loadData()
  }

  function openAdjustDialog(item: InventoryItem) {
    setSelectedItem(item)
    setAdjustmentQuantity(0)
    setAdjustmentReason('')
    setShowAdjustDialog(true)
  }

  function openCountDialog(item: InventoryItem) {
    setSelectedItem(item)
    setCountQuantity(item.quantity_on_hand)
    setCountNotes('')
    setShowCountDialog(true)
  }

  async function openHistoryDialog(item: InventoryItem) {
    setSelectedItem(item)
    setShowHistoryDialog(true)
    await loadTransactions(item.product_id)
  }

  async function handleAdjust() {
    if (!selectedItem || adjustmentQuantity === 0) {
      toast.error('Please enter a quantity to adjust')
      return
    }
    if (!adjustmentReason.trim()) {
      toast.error('Please enter a reason for adjustment')
      return
    }

    setIsActionLoading(true)
    try {
      const response = await api.adjustInventory(selectedItem.product_id, {
        adjustment: adjustmentQuantity,
        notes: adjustmentReason,
      })
      if (response.success) {
        toast.success('Inventory adjusted successfully')
        loadData()
        setShowAdjustDialog(false)
      } else {
        toast.error(response.message || 'Failed to adjust inventory')
      }
    } catch (error) {
      toast.error('Failed to adjust inventory')
    } finally {
      setIsActionLoading(false)
    }
  }

  async function handleCount() {
    if (!selectedItem) return
    if (countQuantity < 0) {
      toast.error('Quantity cannot be negative')
      return
    }

    setIsActionLoading(true)
    try {
      const response = await api.updateInventoryCount(selectedItem.product_id, {
        actualCount: countQuantity,
        notes: countNotes || undefined,
      })
      if (response.success) {
        toast.success('Physical count recorded')
        loadData()
        setShowCountDialog(false)
      } else {
        toast.error(response.message || 'Failed to record count')
      }
    } catch (error) {
      toast.error('Failed to record count')
    } finally {
      setIsActionLoading(false)
    }
  }

  function getStockStatus(item: InventoryItem) {
    if (item.quantity_on_hand === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (item.quantity_on_hand <= item.reorder_level) {
      return <Badge variant="outline" className="text-amber-500 border-amber-500">Low Stock</Badge>
    }
    return <Badge variant="secondary">In Stock</Badge>
  }

  function getTransactionIcon(type: string) {
    switch (type) {
      case 'purchase_receive':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'sale':
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      case 'adjustment':
        return <BarChart3 className="h-4 w-4 text-amber-500" />
      case 'count':
        return <ClipboardCheck className="h-4 w-4 text-purple-500" />
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Track and manage product stock levels
          </p>
        </div>
        <Button onClick={() => navigate('/products/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    ₱{stats.totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${stockFilter === 'low' ? 'ring-2 ring-amber-500' : ''}`}
            onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-amber-500">{stats.lowStockItems}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${stockFilter === 'out' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-500">{stats.outOfStock}</p>
                </div>
                <Package className="h-8 w-8 text-red-500" />
              </div>
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
                  placeholder="Search by product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
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
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Reorder Level</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.category_name || '-'}</TableCell>
                    <TableCell>{getStockStatus(item)}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={item.quantity_on_hand <= item.reorder_level ? 'text-amber-500' : ''}>
                        {item.quantity_on_hand}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.quantity_reserved}</TableCell>
                    <TableCell className="text-right">{item.quantity_on_hand - item.quantity_reserved}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.reorder_level}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₱{(item.quantity_on_hand * item.cost_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAdjustDialog(item)}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Adjust Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openCountDialog(item)}>
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Physical Count
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openHistoryDialog(item)}>
                            <History className="mr-2 h-4 w-4" />
                            View History
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
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

      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Adjust stock quantity for {selectedItem?.product_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Current Quantity</span>
              <span className="text-2xl font-bold">{selectedItem?.quantity_on_hand}</span>
            </div>
            <div className="space-y-2">
              <Label>Adjustment</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustmentQuantity(prev => prev - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustmentQuantity(prev => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                New quantity: {(selectedItem?.quantity_on_hand || 0) + adjustmentQuantity}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Reason for Adjustment</Label>
              <Textarea
                placeholder="e.g., Damaged goods, Inventory correction..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleAdjust} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCountDialog} onOpenChange={setShowCountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Physical Count</DialogTitle>
            <DialogDescription>
              Record actual count for {selectedItem?.product_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">System Quantity</span>
              <span className="text-2xl font-bold">{selectedItem?.quantity_on_hand}</span>
            </div>
            <div className="space-y-2">
              <Label>Actual Count</Label>
              <Input
                type="number"
                min={0}
                value={countQuantity}
                onChange={(e) => setCountQuantity(parseInt(e.target.value) || 0)}
              />
              {countQuantity !== selectedItem?.quantity_on_hand && (
                <p className={`text-xs ${countQuantity < (selectedItem?.quantity_on_hand || 0) ? 'text-red-500' : 'text-green-500'}`}>
                  Variance: {countQuantity - (selectedItem?.quantity_on_hand || 0)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Any notes about this count..."
                value={countNotes}
                onChange={(e) => setCountNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCountDialog(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleCount} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Count
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              Stock movement history for {selectedItem?.product_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="max-h-[400px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transaction history
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {getTransactionIcon(tx.transaction_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                          <span className={`text-sm font-medium ${tx.quantity >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.quantity >= 0 ? '+' : ''}{tx.quantity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tx.quantity_before} → {tx.quantity_after}
                        </p>
                        {tx.notes && (
                          <p className="text-sm mt-1">{tx.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {tx.first_name} {tx.last_name} • {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
