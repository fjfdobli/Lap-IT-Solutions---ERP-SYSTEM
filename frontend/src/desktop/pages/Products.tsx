import { useState, useEffect, useCallback } from 'react'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  sku: string
  name: string
  description: string | null
  category_id: string | null
  category_name: string | null
  unit: string
  cost_price: number
  selling_price: number
  reorder_level: number
  quantity_on_hand: number | null
  quantity_reserved: number | null
  quantity_on_order: number | null
  is_active: boolean
}

interface Category {
  id: string
  name: string
  description: string | null
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const [showFormDialog, setShowFormDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    costPrice: 0,
    sellingPrice: 0,
    reorderLevel: 10,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.getProducts({
        search: searchQuery || undefined,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      })
      if (response.success && response.data) {
        setProducts(response.data.products)
        setPagination(prev => ({
          ...prev,
          total: response.data!.pagination.total,
          totalPages: response.data!.pagination.totalPages,
        }))
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, categoryFilter, pagination.page, pagination.limit])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  function openCreateDialog() {
    setSelectedProduct(null)
    setFormData({
      sku: '',
      name: '',
      description: '',
      categoryId: categories[0]?.id || '',
      costPrice: 0,
      sellingPrice: 0,
      reorderLevel: 10,
    })
    setShowFormDialog(true)
  }

  function openEditDialog(product: Product) {
    setSelectedProduct(product)
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      categoryId: product.category_id || '',
      costPrice: product.cost_price,
      sellingPrice: product.selling_price,
      reorderLevel: product.reorder_level,
    })
    setShowFormDialog(true)
  }

  function openDeleteDialog(product: Product) {
    setSelectedProduct(product)
    setShowDeleteDialog(true)
  }

  async function handleSave() {
    if (!formData.sku.trim()) {
      toast.error('SKU is required')
      return
    }
    if (!formData.name.trim()) {
      toast.error('Product name is required')
      return
    }
    if (!formData.categoryId) {
      toast.error('Category is required')
      return
    }

    setIsActionLoading(true)
    try {
      let response
      if (selectedProduct) {
        response = await api.updateProduct(selectedProduct.id, formData)
      } else {
        response = await api.createProduct(formData)
      }

      if (response.success) {
        toast.success(selectedProduct ? 'Product updated' : 'Product created')
        loadProducts()
        setShowFormDialog(false)
      } else {
        toast.error(response.message || 'Failed to save product')
      }
    } catch (error) {
      toast.error('Failed to save product')
    } finally {
      setIsActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!selectedProduct) return

    setIsActionLoading(true)
    try {
      const response = await api.deleteProduct(selectedProduct.id)
      if (response.success) {
        toast.success('Product deleted')
        loadProducts()
        setShowDeleteDialog(false)
      } else {
        toast.error(response.message || 'Failed to delete product')
      }
    } catch (error) {
      toast.error('Failed to delete product')
    } finally {
      setIsActionLoading(false)
    }
  }

  const margin = (product: Product) => {
    if (product.cost_price === 0) return 0
    return ((product.selling_price - product.cost_price) / product.cost_price * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
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
            <Button 
              variant="outline" 
              size="icon"
              onClick={loadProducts}
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
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead>Status</TableHead>
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
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category_name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ₱{product.cost_price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₱{product.selling_price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={Number(margin(product)) > 0 ? 'text-green-500' : 'text-red-500'}>
                        {margin(product)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(product)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
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

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Update product information' : 'Add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  placeholder="PRD-001"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData(prev => ({ ...prev, categoryId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter product description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Selling Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <Input
                type="number"
                min={0}
                placeholder="10"
                value={formData.reorderLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, reorderLevel: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                Low stock alert will trigger when quantity falls below this level
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
              {selectedProduct && (
                <p className="mt-2 text-amber-500">
                  Note: You cannot delete a product that has purchase order items.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isActionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
