import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PurchaseOrder, PurchaseOrderItem } from "../../types"

// Props interface
interface ItemsTabProps {
  po: PurchaseOrder
  editable: boolean
  onUpdateItems?: (items: PurchaseOrderItem[]) => void // Pass updates to parent
}

export default function ItemsTab({ po, editable, onUpdateItems }: ItemsTabProps) {
  // Empty state placeholder
  if (!po.items?.length) {
    return <p className="text-muted-foreground">No items added.</p>
  }

  // Handle changes to received quantities
  const handleChange = (id: string, value: number) => {
    if (!po.items) return
    const updated = po.items.map(item =>
      item.id === id ? { ...item, receivedQty: value } : item
    )

    // Important: Call parent to update the state in PurchaseOrderDetail
    onUpdateItems?.(updated)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Ordered</TableHead>
          <TableHead>Received</TableHead>
          <TableHead>Unit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {po.items.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.orderedQty}</TableCell>
            <TableCell>
              {editable ? (
                <input
                  type="number"
                  value={item.receivedQty}
                  onChange={e => handleChange(item.id, parseInt(e.target.value) || 0)}
                  className="w-20 border rounded px-2 py-1"
                  min={0}
                  max={item.orderedQty}
                />
              ) : (
                item.receivedQty
              )}
            </TableCell>
            <TableCell>{item.unit}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// FUTURE REFACTOR NOTES:
// - Integrate with backend API to save receivedQty
// - Consider moving input to a modal for bulk updates
// - Add validation to prevent receivedQty > orderedQty
