import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SupplierSearchDialog } from "./SupplierSearchDialog"
import type { PurchaseOrder } from "../types"

interface PurchaseOrderFormData {
  poNumber: string
  title: string
  supplierCode: string
  supplierName: string
  supplierTerm: string
  poDate: string
  dateRequest: string
  term: string
  remarks: string
  shipping: string
}

interface POItem {
  code: string
  defaultQty: number
}

interface Product {
  itemName: string
  itemNo: string
  barcode: string
  class: string
  department: string
  tax: string
  active: boolean
  cost: number
  availableQty: number
}

const mockProducts: Product[] = [
  {
    itemName: "Laptop Dell XPS 15",
    itemNo: "IT-001",
    barcode: "1234567890123",
    class: "Electronics",
    department: "IT",
    tax: "10%",
    active: true,
    cost: 1500.00,
    availableQty: 5,
  },
  {
    itemName: "Office Chair",
    itemNo: "OF-001",
    barcode: "1234567890124",
    class: "Furniture",
    department: "Office",
    tax: "10%",
    active: true,
    cost: 250.00,
    availableQty: 12,
  },
  {
    itemName: "Printer Paper A4",
    itemNo: "OF-002",
    barcode: "1234567890125",
    class: "Supplies",
    department: "Office",
    tax: "10%",
    active: true,
    cost: 15.00,
    availableQty: 100,
  },
]

interface PurchaseOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrder: PurchaseOrder | null
  onSave: (po: PurchaseOrder) => void
}

export function PurchaseOrderDialog({
  open,
  onOpenChange,
  purchaseOrder,
  onSave,
}: PurchaseOrderDialogProps) {
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [poItems, setPoItems] = useState<POItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PurchaseOrderFormData>()

  const watchedData = watch()

  // Calculate summary
  const totalPurchaseQty = poItems.reduce((sum, item) => sum + item.defaultQty, 0)
  const purchaseAmount = poItems.reduce((sum, item) => {
    const product = mockProducts.find(p => p.itemNo === item.code)
    return sum + (product ? product.cost * item.defaultQty : 0)
  }, 0)
  const shippingAmount = parseFloat(watchedData.shipping || "0")
  const transactionAmount = purchaseAmount + shippingAmount
  const itemDiscount = 0 // Can be calculated based on business rules
  const totalPOAmount = transactionAmount - itemDiscount

  useEffect(() => {
    if (purchaseOrder) {
      reset({
        poNumber: purchaseOrder.poCode,
        title: purchaseOrder.title,
        supplierCode: "",
        supplierName: purchaseOrder.supplier,
        supplierTerm: purchaseOrder.term,
        poDate: purchaseOrder.date,
        dateRequest: purchaseOrder.date,
        term: purchaseOrder.term,
        remarks: purchaseOrder.remarks,
        shipping: "0",
      })
    } else {
      reset({
        poNumber: "",
        title: "",
        supplierCode: "",
        supplierName: "",
        supplierTerm: "",
        poDate: new Date().toISOString().split("T")[0],
        dateRequest: new Date().toISOString().split("T")[0],
        term: "",
        remarks: "",
        shipping: "0",
      })
      setPoItems([])
    }
  }, [purchaseOrder, reset])

  const handleSupplierSelect = (supplier: {
    name: string
    code: string
    term: string
    telephone: string
    address: string
    active: boolean
  }) => {
    setValue("supplierCode", supplier.code)
    setValue("supplierName", supplier.name)
    setValue("supplierTerm", supplier.term)
    setIsSupplierDialogOpen(false)
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    const existingItem = poItems.find(item => item.code === product.itemNo)
    if (existingItem) {
      setPoItems(poItems.map(item =>
        item.code === product.itemNo
          ? { ...item, defaultQty: item.defaultQty + 1 }
          : item
      ))
    } else {
      setPoItems([...poItems, { code: product.itemNo, defaultQty: 1 }])
    }
  }

  const handleRemoveItem = (code: string) => {
    setPoItems(poItems.filter(item => item.code !== code))
  }

  const handleQtyChange = (code: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(code)
    } else {
      setPoItems(poItems.map(item =>
        item.code === code ? { ...item, defaultQty: qty } : item
      ))
    }
  }

  const formatDateTime = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${month}/${day}/${year} ${String(displayHours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`
  }

  const onSubmit = (data: PurchaseOrderFormData) => {
    const now = new Date()
    const po: PurchaseOrder = {
      id: purchaseOrder?.id || Date.now().toString(),
      poCode: data.poNumber || `PO-${now.getFullYear()}-${String(poItems.length + 1).padStart(3, "0")}`,
      title: data.title,
      date: data.poDate,
      supplier: data.supplierName,
      term: data.term,
      remarks: data.remarks,
      status: purchaseOrder?.status || "Draft",
      lastUpdated: formatDateTime(now),
    }
    onSave(po)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {purchaseOrder ? "Edit Purchase Order" : "New Purchase Order"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General Information</TabsTrigger>
                <TabsTrigger value="items">Add Item</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poNumber">PO Number</Label>
                    <Input
                      id="poNumber"
                      {...register("poNumber", { required: "PO Number is required" })}
                    />
                    {errors.poNumber && (
                      <p className="text-sm text-destructive">{errors.poNumber.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      {...register("title", { required: "Title is required" })}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplierCode">Supplier Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="supplierCode"
                        {...register("supplierCode")}
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSupplierDialogOpen(true)}
                      >
                        Search Supplier
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierName">Supplier Name</Label>
                    <Input
                      id="supplierName"
                      {...register("supplierName")}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poDate">PO Date</Label>
                    <Input
                      id="poDate"
                      type="date"
                      {...register("poDate", { required: "PO Date is required" })}
                    />
                    {errors.poDate && (
                      <p className="text-sm text-destructive">{errors.poDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateRequest">Date Request</Label>
                    <Input
                      id="dateRequest"
                      type="date"
                      {...register("dateRequest")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="term">Term</Label>
                    <Input
                      id="term"
                      {...register("term")}
                      placeholder="e.g., Net 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping">Shipping Amount</Label>
                    <Input
                      id="shipping"
                      type="number"
                      step="0.01"
                      {...register("shipping")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    {...register("remarks")}
                    rows={3}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Summary Computation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Purchase Qty:</span>
                        <span className="font-medium">{totalPurchaseQty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Purchase Amount:</span>
                        <span className="font-medium">${purchaseAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping Amount:</span>
                        <span className="font-medium">${shippingAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transaction Amount:</span>
                        <span className="font-medium">${transactionAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Item Discount:</span>
                        <span className="font-medium">${itemDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-semibold">Total PO Amount:</span>
                        <span className="font-bold text-lg">${totalPOAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items" className="space-y-4 mt-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Product Listing</h3>
                  <div className="rounded-md border max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Item No.</TableHead>
                          <TableHead>Barcode</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Tax</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Available Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockProducts.map((product) => (
                          <TableRow
                            key={product.itemNo}
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => handleProductClick(product)}
                          >
                            <TableCell className="font-medium">{product.itemName}</TableCell>
                            <TableCell>{product.itemNo}</TableCell>
                            <TableCell>{product.barcode}</TableCell>
                            <TableCell>{product.class}</TableCell>
                            <TableCell>{product.department}</TableCell>
                            <TableCell>{product.tax}</TableCell>
                            <TableCell>{product.active ? "Yes" : "No"}</TableCell>
                            <TableCell>${product.cost.toFixed(2)}</TableCell>
                            <TableCell>{product.availableQty}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">PO Selected Items</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Default Qty</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No items selected. Click on a product above to add it.
                            </TableCell>
                          </TableRow>
                        ) : (
                          poItems.map((item) => {
                            const product = mockProducts.find(p => p.itemNo === item.code)
                            return (
                              <TableRow key={item.code}>
                                <TableCell className="font-medium">{item.code}</TableCell>
                                <TableCell>{product?.itemName || "-"}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.defaultQty}
                                    onChange={(e) =>
                                      handleQtyChange(item.code, parseInt(e.target.value) || 1)
                                    }
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveItem(item.code)}
                                  >
                                    Remove
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SupplierSearchDialog
        open={isSupplierDialogOpen}
        onOpenChange={setIsSupplierDialogOpen}
        onSelect={handleSupplierSelect}
      />
    </>
  )
}