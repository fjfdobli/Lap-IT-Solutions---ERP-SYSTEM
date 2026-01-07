// Import UI components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Import the PurchaseOrder type
import type { PurchaseOrder } from "../../types"

// Define props for this tab
// We need the PO object and optionally callbacks for receiving actions
interface ReceivingTabProps {
  po: PurchaseOrder
  // Callback functions can be passed from parent to handle actions
  onConfirmReceiving?: () => void
  onHold?: () => void
}

// Type the component props using the interface above
export default function ReceivingTab({ po, onConfirmReceiving, onHold }: ReceivingTabProps) {

  // Only show the tab if PO is Sent or Partially Received
  // Otherwise, receiving should not be available yet
  if (!["Sent", "Partially Received"].includes(po.status)) {
    return (
      <p className="text-muted-foreground">
        Receiving is not available at this stage. Current status: <strong>{po.status}</strong>
      </p>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receiving</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Placeholder text: later we can render table with items */}
        <p>Ordered Quantity vs Received Quantity</p>

        {/* Buttons for confirming receiving or putting PO on hold */}
        <div className="space-x-2">
          <Button onClick={onConfirmReceiving}>
            Confirm Receiving
          </Button>
          <Button variant="outline" onClick={onHold}>
            Put on Hold (Incomplete)
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
