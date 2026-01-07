import type { PurchaseOrder } from "../../types"

interface HistoryTabProps {
  po: PurchaseOrder
}

export default function HistoryTab({ po }: HistoryTabProps) {
  // Frontend mock for history / audit trail
  const mockHistory = [
    { date: "01/15/2024", action: "PO Created", by: "Staff" },
    { date: "01/16/2024", action: "PO Approved", by: "Sir Jude" },
    { date: "01/17/2024", action: "PO Sent to Supplier", by: "Staff" },
  ]

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground">History for PO: {po.poCode}</p>
      <ul className="list-disc pl-5 space-y-1">
        {mockHistory.map((entry, index) => (
          <li key={index}>
            <strong>{entry.date}</strong> – {entry.action} (<em>{entry.by}</em>)
          </li>
        ))}
      </ul>
    </div>
  )
}

// FUTURE REFACTOR NOTES:
// - Fetch real history from backend once PO actions are stored
// - Consider adding filter by action type or user
// - Implement timeline component for better visual representation
