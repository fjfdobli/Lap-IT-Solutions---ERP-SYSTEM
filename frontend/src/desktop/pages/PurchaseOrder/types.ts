export type POStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Completed"
  | "Cancelled"
  | "Sent"
  | "Partially Received"

export interface PurchaseOrderItem {
  id: string
  name: string
  orderedQty: number
  receivedQty: number
  unit: string
}

export interface PurchaseOrder {
  id: string
  poCode: string
  title: string
  date: string // YYYY-MM-DD
  supplier: string
  term: string
  remarks: string
  status: POStatus
  lastUpdated: string // MM/DD/YYYY HH:MM:SS AM/PM

  // --- frontend-only for now ---
  items?: PurchaseOrderItem[]
}
