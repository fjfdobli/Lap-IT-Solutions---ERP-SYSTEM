import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PurchaseOrderDialog } from "./components/PurchaseOrderCreateDialog"
import type { PurchaseOrder } from "./types"

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: "1",
    poCode: "PO-2024-001",
    title: "Office Supplies Order",
    date: "2024-01-15",
    supplier: "ABC Supplies Inc.",
    term: "Net 30",
    remarks: "Urgent order",
    status: "Pending",
    lastUpdated: "01/15/2024 10:30:45 AM",
  },
  {
    id: "2",
    poCode: "PO-2024-002",
    title: "Electronics Purchase",
    date: "2024-01-16",
    supplier: "Tech Distributors",
    term: "Net 15",
    remarks: "",
    status: "Approved",
    lastUpdated: "01/16/2024 02:15:20 PM",
  },
]

export default function PurchaseOrderPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)

  const handleEdit = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedPO(null)
    setIsDialogOpen(true)
  }

  const handleSave = (po: PurchaseOrder) => {
    if (selectedPO) {
      setPurchaseOrders(purchaseOrders.map((p) => (p.id === po.id ? po : p)))
    } else {
      setPurchaseOrders([...purchaseOrders, { ...po, id: Date.now().toString() }])
    }
    setIsDialogOpen(false)
    setSelectedPO(null)
  }

  const getStatusVariant = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "Draft":
        return "outline"
      case "Pending":
        return "secondary"
      case "Approved":
        return "default"
      case "Completed":
        return "default"
      case "Cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage and track purchase orders
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No purchase orders found. Click "New Purchase Order" to create one.
                </TableCell>
              </TableRow>
            ) : (
              purchaseOrders.map((po) => (
                <TableRow key={po.id} className="cursor-pointer" onClick={() => handleEdit(po)}>
                  <TableCell className="font-medium">{po.poCode}</TableCell>
                  <TableCell>{po.title}</TableCell>
                  <TableCell>{po.date}</TableCell>
                  <TableCell>{po.supplier}</TableCell>
                  <TableCell>{po.term}</TableCell>
                  <TableCell>{po.remarks || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(po.status)}>{po.status}</Badge>
                  </TableCell>
                  <TableCell>{po.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(po)
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PurchaseOrderDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        purchaseOrder={selectedPO}
        onSave={handleSave}
      />
    </div>
  )
}