// Import the PurchaseOrder type so TypeScript knows
// what "po" should look like
import type { PurchaseOrder } from "../../types"

// Define the shape of props this component expects
// This fixes the "po" and "editable" TypeScript errors
interface GeneralTabProps {
  po: PurchaseOrder
  editable: boolean
}

// Destructure props AND type them using the interface above
export default function GeneralTab({ po, editable }: GeneralTabProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      
      {/* Supplier field (always read-only) */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          Supplier
        </label>
        <input
          value={po.supplier}          // value comes from the PO object
          disabled                     // supplier should never be editable
          className="mt-1 w-full rounded border px-3 py-2 bg-muted"
        />
      </div>

      {/* Term field (editable only when PO is Draft) */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          Term
        </label>
        <input
          value={po.term}              // value comes from the PO object
          disabled={!editable}         // editable controlled by parent
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

    </div>
  )
}
