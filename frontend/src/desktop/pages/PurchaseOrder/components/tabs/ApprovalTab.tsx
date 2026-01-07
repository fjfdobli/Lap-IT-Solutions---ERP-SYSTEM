import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PurchaseOrder } from "../../types"

// Define the shape of props this component expects
interface ApprovalTabProps {
  po: PurchaseOrder
}

export default function ApprovalTab({ po }: ApprovalTabProps) {
  if (po.status !== "Pending") {
    return <p>This PO is already {po.status}</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval</CardTitle>
      </CardHeader>
      <CardContent className="space-x-2">
        <Button>Approve</Button>
        <Button variant="destructive">Reject</Button>
      </CardContent>
    </Card>
  )
}
