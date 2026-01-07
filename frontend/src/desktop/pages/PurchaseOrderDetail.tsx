import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  ArrowLeft,
  Edit,
  Send,
  CheckCircle,
  Package,
  Pause,
  XCircle,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Truck,
  Calendar,
  User,
  FileCheck,
  Download,
  Printer,
  MessageSquare,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface PurchaseOrderItem {
  id: string
  product_id: string
  product_name: string
  sku: string
  unit: string
  quantity_ordered: number
  quantity_received: number
  unit_cost: number
  total_cost: number
  notes: string | null
}

interface PurchaseOrderDetail {
  id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  supplier_email: string | null
  supplier_phone: string | null
  supplier_viber: string | null
  supplier_address: string | null
  status: string
  order_date: string
  expected_date: string | null
  received_date: string | null
  subtotal: number
  tax_amount: number
  total_amount: number
  notes: string | null
  delivery_method: string
  sent_via: string | null
  sent_at: string | null
  approved_by: string | null
  approved_at: string | null
  approval_notes: string | null
  delivery_receipt_filed: boolean
  items: PurchaseOrderItem[]
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  draft: { label: 'Draft', variant: 'secondary', color: 'bg-gray-500' },
  pending_approval: { label: 'Pending Approval', variant: 'outline', color: 'bg-amber-500' },
  approved: { label: 'Approved', variant: 'default', color: 'bg-green-500' },
  sent: { label: 'Sent to Supplier', variant: 'default', color: 'bg-blue-500' },
  partial: { label: 'Partial Received', variant: 'outline', color: 'bg-orange-500' },
  received: { label: 'Received', variant: 'default', color: 'bg-green-600' },
  on_hold: { label: 'On Hold', variant: 'destructive', color: 'bg-red-500' },
  cancelled: { label: 'Cancelled', variant: 'destructive', color: 'bg-red-600' },
  filed: { label: 'Filed', variant: 'secondary', color: 'bg-purple-500' },
}

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showReceiveDialog, setShowReceiveDialog] = useState(false)
  const [showHoldDialog, setShowHoldDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [sendMethod, setSendMethod] = useState<'email' | 'viber' | 'message' | 'other'>('email')
  const [holdReason, setHoldReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [receiveItems, setReceiveItems] = useState<Record<string, number>>({})
  const [deliveryReceiptNumber, setDeliveryReceiptNumber] = useState('')

  const loadPurchaseOrder = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.getPurchaseOrder(id!)
      if (response.success && response.data) {
        setPurchaseOrder(response.data)
        
        const items: Record<string, number> = {}
        response.data.items.forEach(item => {
          items[item.id] = item.quantity_ordered - item.quantity_received
        })
        setReceiveItems(items)
      }
    } catch (error) {
      console.error('Failed to load purchase order:', error)
      toast.error('Failed to load purchase order')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadPurchaseOrder()
    }
  }, [id, loadPurchaseOrder])

  async function handleSubmitForApproval() {
    setActionLoading(true)
    try {
      const response = await api.submitPurchaseOrder(id!)
      if (response.success) {
        toast.success('Purchase order submitted for approval')
        loadPurchaseOrder()
      } else {
        toast.error(response.message || 'Failed to submit')
      }
    } catch (error) {
      toast.error('Failed to submit purchase order')
    } finally {
      setActionLoading(false)
      setShowSubmitDialog(false)
    }
  }

  async function handleApprove() {
    setActionLoading(true)
    try {
      const response = await api.approvePurchaseOrder(id!)
      if (response.success) {
        toast.success('Purchase order approved')
        loadPurchaseOrder()
      } else {
        toast.error(response.message || 'Failed to approve')
      }
    } catch (error) {
      toast.error('Failed to approve purchase order')
    } finally {
      setActionLoading(false)
      setShowApproveDialog(false)
    }
  }

  async function handleSend() {
    setActionLoading(true)
    try {
      const response = await api.sendPurchaseOrder(id!, sendMethod)
      if (response.success) {
        toast.success(`Purchase order sent via ${sendMethod}`)
        loadPurchaseOrder()
      } else {
        toast.error(response.message || 'Failed to send')
      }
    } catch (error) {
      toast.error('Failed to send purchase order')
    } finally {
      setActionLoading(false)
      setShowSendDialog(false)
    }
  }

  async function handleReceive() {
    setActionLoading(true)
    try {
      const items = Object.entries(receiveItems)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, quantity]) => ({ itemId, quantityReceived: quantity }))
      
      if (items.length === 0) {
        toast.error('Please enter quantities to receive')
        setActionLoading(false)
        return
      }

      const response = await api.receivePurchaseOrderItems(id!, {
        items,
        receiptNumber: deliveryReceiptNumber || undefined
      })
      if (response.success) {
        toast.success('Items received into inventory')
        loadPurchaseOrder()
      } else {
        toast.error(response.message || 'Failed to receive items')
      }
    } catch (error) {
      toast.error('Failed to receive items')
    } finally {
      setActionLoading(false)
      setShowReceiveDialog(false)
    }
  }

  async function handleHold() {
    if (!holdReason.trim()) {
      toast.error('Please enter a reason for putting on hold')
      return
    }
    setActionLoading(true)
    try {
      const response = await api.holdPurchaseOrder(id!, holdReason)
      if (response.success) {
        toast.success('Purchase order put on hold')
        loadPurchaseOrder()
      } else {
        toast.error(response.message || 'Failed to put on hold')
      }
    } catch (error) {
      toast.error('Failed to put on hold')
    } finally {
      setActionLoading(false)
      setShowHoldDialog(false)
      setHoldReason('')
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      toast.error('Please enter a reason for cancellation')
      return
    }
    setActionLoading(true)
    try {
      const response = await api.cancelPurchaseOrder(id!, cancelReason)
      if (response.success) {
        toast.success('Purchase order cancelled')
        loadPurchaseOrder()
      } else {
        toast.error(response.message || 'Failed to cancel')
      }
    } catch (error) {
      toast.error('Failed to cancel purchase order')
    } finally {
      setActionLoading(false)
      setShowCancelDialog(false)
      setCancelReason('')
    }
  }

  async function handleFile() {
    setActionLoading(true)
    try {
      const response = await api.filePurchaseOrderReceipt(id!)
      if (response.success) {
        toast.success('Purchase order filed successfully')
        loadPurchaseOrder()
      } else {
        toast.error(response.message || 'Failed to file')
      }
    } catch (error) {
      toast.error('Failed to file purchase order')
    } finally {
      setActionLoading(false)
      setShowFileDialog(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!purchaseOrder) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Purchase order not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/purchase-orders')}>
          Back to Purchase Orders
        </Button>
      </div>
    )
  }

  const po = purchaseOrder
  const statusInfo = statusConfig[po.status] || { label: po.status, variant: 'secondary' as const, color: 'bg-gray-500' }
  const canEdit = po.status === 'draft'
  const canSubmit = po.status === 'draft'
  const canApprove = po.status === 'pending_approval'
  const canSend = po.status === 'approved'
  const canReceive = ['sent', 'partial'].includes(po.status)
  const canHold = ['sent', 'partial'].includes(po.status)
  const canCancel = ['draft', 'pending_approval', 'approved'].includes(po.status)
  const canFile = po.status === 'received'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchase-orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{po.po_number}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              Created on {format(new Date(po.order_date), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => navigate(`/purchase-orders/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {['draft', 'pending_approval', 'approved', 'sent', 'received', 'filed'].map((status, index) => {
              const config = statusConfig[status]
              const isActive = status === po.status
              const isPast = ['draft', 'pending_approval', 'approved', 'sent', 'received', 'filed'].indexOf(po.status) > index
              
              return (
                <div key={status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      isActive ? config.color : isPast ? 'bg-green-500' : 'bg-muted'
                    }`}>
                      {isPast ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <span className="text-xs text-white font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                      {config.label}
                    </span>
                  </div>
                  {index < 5 && (
                    <div className={`h-0.5 w-16 mx-2 ${isPast ? 'bg-green-500' : 'bg-muted'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {(canSubmit || canApprove || canSend || canReceive || canHold || canCancel || canFile) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canSubmit && (
              <Button onClick={() => setShowSubmitDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            )}
            {canApprove && (
              <Button onClick={() => setShowApproveDialog(true)} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            )}
            {canSend && (
              <Button onClick={() => setShowSendDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Send className="mr-2 h-4 w-4" />
                Send to Supplier
              </Button>
            )}
            {canReceive && (
              <Button onClick={() => setShowReceiveDialog(true)} className="bg-green-600 hover:bg-green-700">
                <Package className="mr-2 h-4 w-4" />
                Receive Items
              </Button>
            )}
            {canHold && (
              <Button variant="outline" onClick={() => setShowHoldDialog(true)} className="text-amber-600 border-amber-600 hover:bg-amber-50">
                <Pause className="mr-2 h-4 w-4" />
                Put on Hold
              </Button>
            )}
            {canFile && (
              <Button onClick={() => setShowFileDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                <FileCheck className="mr-2 h-4 w-4" />
                File PO
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty Ordered</TableHead>
                    <TableHead className="text-right">Qty Received</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="text-right">{item.quantity_ordered}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.quantity_received < item.quantity_ordered ? 'text-amber-500' : 'text-green-500'}>
                          {item.quantity_received}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{item.unit_cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₱{item.total_cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₱{po.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>₱{po.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {po.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Notes to Supplier</Label>
                  <p className="mt-1">{po.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Supplier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">{po.supplier_name}</p>
              {po.supplier_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {po.supplier_email}
                </div>
              )}
              {po.supplier_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {po.supplier_phone}
                </div>
              )}
              {po.supplier_address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{po.supplier_address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Method:</span>
                <span className="capitalize font-medium">{po.delivery_method}</span>
              </div>
              {po.expected_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Expected: {format(new Date(po.expected_date), 'MMMM d, yyyy')}</span>
                </div>
              )}
              {po.sent_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <span>Sent via {po.sent_via} on {format(new Date(po.sent_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {po.approved_at && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Approval
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Approved</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(po.approved_at), 'MMMM d, yyyy h:mm a')}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for Approval</AlertDialogTitle>
            <AlertDialogDescription>
              This will submit the purchase order for approval by the Operations Manager. You won't be able to edit it after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitForApproval} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Approving this purchase order will allow it to be sent to the supplier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to Supplier</DialogTitle>
            <DialogDescription>
              Choose how you want to send this purchase order to the supplier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Send Method</Label>
              <Select value={sendMethod} onValueChange={(v) => setSendMethod(v as 'email' | 'viber' | 'message' | 'other')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="viber">
                    <div className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Viber
                    </div>
                  </SelectItem>
                  <SelectItem value="message">
                    <div className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receive Items</DialogTitle>
            <DialogDescription>
              Enter the quantities received for each item. Items will be added to inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Delivery Receipt Number (Optional)</Label>
              <Input
                placeholder="DR-2024-001"
                value={deliveryReceiptNumber}
                onChange={(e) => setDeliveryReceiptNumber(e.target.value)}
              />
            </div>
            <Separator />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Qty to Receive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((item) => {
                  const remaining = item.quantity_ordered - item.quantity_received
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity_ordered}</TableCell>
                      <TableCell className="text-right">{item.quantity_received}</TableCell>
                      <TableCell className="text-right">{remaining}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          max={remaining}
                          value={receiveItems[item.id] || 0}
                          onChange={(e) => setReceiveItems(prev => ({
                            ...prev,
                            [item.id]: Math.min(parseInt(e.target.value) || 0, remaining)
                          }))}
                          className="w-20 ml-auto"
                          disabled={remaining === 0}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleReceive} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Receive Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Put on Hold</DialogTitle>
            <DialogDescription>
              Provide a reason for putting this purchase order on hold.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="e.g., Incomplete delivery, awaiting resolution..."
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleHold} disabled={actionLoading} className="bg-amber-600 hover:bg-amber-700">
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Put on Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Purchase Order</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="e.g., Supplier cannot fulfill order..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showFileDialog} onOpenChange={setShowFileDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>File Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the purchase order as filed and complete. The delivery receipt will be ready for Sir Richard's filing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFile} disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700">
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              File PO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
