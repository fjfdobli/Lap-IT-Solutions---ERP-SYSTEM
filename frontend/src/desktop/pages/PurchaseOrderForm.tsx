import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Loader2,
  CalendarIcon,
  ChevronsUpDown,
  Check,
  Search,
  Package,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
}

interface Product {
  id: string
  sku: string
  name: string
  category_name: string | null
  cost_price: number
  selling_price: number
}

interface POItem {
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
  unit_cost: number
}

export default function PurchaseOrderForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | undefined>()
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [items, setItems] = useState<POItem[]>([])
  const [showSupplierSelect, setShowSupplierSelect] = useState(false)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  const loadInitialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        api.getSuppliers(),
        api.getProducts(),
      ])

      if (suppliersRes.success && suppliersRes.data) {
        setSuppliers(suppliersRes.data.suppliers)
      }

      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data.products)
      }

      if (id) {
        const poRes = await api.getPurchaseOrder(id)
        if (poRes.success && poRes.data) {
          setSupplierId(poRes.data.supplier_id)
          setDeliveryMethod(poRes.data.delivery_method as 'delivery' | 'pickup')
          setExpectedDeliveryDate(poRes.data.expected_date ? new Date(poRes.data.expected_date) : undefined)
          setNotes(poRes.data.notes || '')
          setItems(poRes.data.items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.sku,
            quantity: item.quantity_ordered,
            unit_cost: item.unit_cost,
          })))
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  function addProduct(product: Product) {
    if (items.some(item => item.product_id === product.id)) {
      toast.error('Product already added')
      return
    }

    setItems(prev => [...prev, {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_cost: product.cost_price,
    }])
    setShowProductDialog(false)
    setProductSearch('')
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(item => item.product_id !== productId))
  }

  function updateItemQuantity(productId: string, quantity: number) {
    setItems(prev => prev.map(item => 
      item.product_id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    ))
  }

  function updateItemPrice(productId: string, price: number) {
    setItems(prev => prev.map(item => 
      item.product_id === productId ? { ...item, unit_cost: Math.max(0, price) } : item
    ))
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)

  async function handleSave(submitAfterSave = false) {
    if (!supplierId) {
      toast.error('Please select a supplier')
      return
    }
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    setIsSaving(true)
    try {
      const data = {
        supplierId,
        orderDate: new Date().toISOString().split('T')[0], // Today's date
        deliveryMethod,
        expectedDate: expectedDeliveryDate?.toISOString().split('T')[0],
        notes: notes || undefined,
        items: items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          unitCost: item.unit_cost,
        })),
      }

      let response
      if (isEdit) {
        response = await api.updatePurchaseOrder(id!, data)
      } else {
        response = await api.createPurchaseOrder(data)
      }

      if (response.success && response.data) {
        const poId = (response.data as { id: string }).id

        if (submitAfterSave) {
          const submitRes = await api.submitPurchaseOrder(poId)
          if (submitRes.success) {
            toast.success('Purchase order created and submitted for approval')
          } else {
            toast.success('Purchase order saved')
            toast.error('Failed to submit: ' + submitRes.message)
          }
        } else {
          toast.success(isEdit ? 'Purchase order updated' : 'Purchase order created')
        }

        navigate(`/purchase-orders/${poId}`)
      } else {
        toast.error(response.message || 'Failed to save purchase order')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Failed to save purchase order')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedSupplier = suppliers.find(s => s.id === supplierId)
  const filteredProducts = products.filter(p => 
    productSearch === '' ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchase-orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update purchase order details' : 'Create a new purchase order for supplier items'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Save & Submit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier</CardTitle>
              <CardDescription>Select the supplier for this purchase order</CardDescription>
            </CardHeader>
            <CardContent>
              <Popover open={showSupplierSelect} onOpenChange={setShowSupplierSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedSupplier ? selectedSupplier.name : 'Select supplier...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search suppliers..." />
                    <CommandList>
                      <CommandEmpty>No supplier found.</CommandEmpty>
                      <CommandGroup>
                        {suppliers.map((supplier) => (
                          <CommandItem
                            key={supplier.id}
                            value={supplier.name}
                            onSelect={() => {
                              setSupplierId(supplier.id)
                              setShowSupplierSelect(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                supplierId === supplier.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <p className="font-medium">{supplier.name}</p>
                              <p className="text-xs text-muted-foreground">{supplier.contact_person}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedSupplier && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Contact:</span> {selectedSupplier.contact_person}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedSupplier.email}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {selectedSupplier.phone}</p>
                  <p><span className="text-muted-foreground">Address:</span> {selectedSupplier.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>Add products to this purchase order</CardDescription>
              </div>
              <Button onClick={() => setShowProductDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items added yet</p>
                  <p className="text-sm">Click "Add Product" to add items</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="w-[120px]">Quantity</TableHead>
                        <TableHead className="w-[150px]">Unit Price</TableHead>
                        <TableHead className="text-right w-[120px]">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="mr-1">₱</span>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.unit_cost}
                                onChange={(e) => updateItemPrice(item.product_id, parseFloat(e.target.value) || 0)}
                                className="w-28"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₱{(item.quantity * item.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.product_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items</span>
                        <span>{items.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Quantity</span>
                        <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium text-lg">
                        <span>Total</span>
                        <span>₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notes to Supplier</Label>
                <Textarea
                  placeholder="Any special instructions for the supplier..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea
                  placeholder="Internal notes (not visible to supplier)..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Delivery Method</Label>
                <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as 'delivery' | 'pickup')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expectedDeliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expectedDeliveryDate ? format(expectedDeliveryDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expectedDeliveryDate}
                      onSelect={(date) => {
                        setExpectedDeliveryDate(date)
                        setShowDatePicker(false)
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Supplier</span>
                <span className="font-medium">{selectedSupplier?.name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Quantity</span>
                <span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Total Amount</span>
                <span className="font-bold text-lg">₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Search and select products to add to the purchase order
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No products found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => {
                    const isAdded = items.some(item => item.product_id === product.id)
                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors",
                          isAdded && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !isAdded && addProduct(product)}
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{product.sku}</span>
                            <span>•</span>
                            <span>{product.category_name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₱{product.cost_price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-muted-foreground">Cost price</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
