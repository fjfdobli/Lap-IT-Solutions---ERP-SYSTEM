import { Button } from "@/components/ui/button"
import type { PurchaseOrder } from "../../types"

interface AttachmentsTabProps {
  po: PurchaseOrder
}

export default function AttachmentsTab({ po }: AttachmentsTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Attachments for PO: {po.poCode}</p>

      {/* Placeholder: integrate real file upload API later */}
      <Button>Upload File</Button>
      <Button variant="outline">View Existing Files</Button>
    </div>
  )
}

// FUTURE REFACTOR NOTES:
// - Integrate file storage API (S3, local server, etc.)
// - Add preview, delete, and download functionality
// - Consider drag-and-drop upload component for better UX
