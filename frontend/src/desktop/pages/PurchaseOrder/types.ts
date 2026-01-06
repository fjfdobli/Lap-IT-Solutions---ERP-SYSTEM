export interface PurchaseOrder {
  id: string
  poCode: string
  title: string
  date: string // YYYY-MM-DD
  supplier: string
  term: string
  remarks: string
  status: "Draft" | "Pending" | "Approved" | "Completed" | "Cancelled"
  lastUpdated: string // MM/DD/YYYY HH:MM:SS AM/PM
}