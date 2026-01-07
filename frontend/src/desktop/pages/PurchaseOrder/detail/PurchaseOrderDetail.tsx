import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import GeneralTab from "../components/tabs/GeneralTab"
import ItemsTab from "../components/tabs/ItemsTab"
import ApprovalTab from "../components/tabs/ApprovalTab"
import ReceivingTab from "../components/tabs/ReceivingTab"
import AttachmentsTab from "../components/tabs/AttachmentsTab"
import HistoryTab from "../components/tabs/HistoryTab"

import type { PurchaseOrder } from "../types"

export default function PurchaseOrderDetail() {
  // frontend mock for now
  const po: PurchaseOrder = {
    id: "1",
    poCode: "PO-2024-001",
    title: "Office Supplies Order",
    date: "2024-01-15",
    supplier: "ABC Supplies Inc.",
    term: "Net 30",
    remarks: "Urgent order",
    status: "Pending",
    lastUpdated: "01/15/2024 10:30:45 AM",
  }

  const isEditable = po.status === "Draft"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{po.poCode}</h1>
          <p className="text-muted-foreground">{po.title}</p>
        </div>

        <Badge>{po.status}</Badge>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
          <TabsTrigger value="receiving">Receiving</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab po={po} editable={isEditable} />
        </TabsContent>

        <TabsContent value="items">
          <ItemsTab po={po} editable={isEditable} />
        </TabsContent>

        <TabsContent value="approval">
          <ApprovalTab po={po} />
        </TabsContent>

        <TabsContent value="receiving">
          <ReceivingTab po={po} />
        </TabsContent>

        <TabsContent value="attachments">
          <AttachmentsTab po={po} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab po={po} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
