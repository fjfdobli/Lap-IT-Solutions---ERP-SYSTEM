import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Inventory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">
          Manage your inventory items and stock levels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Inventory module is coming soon. This page will allow you to manage your inventory items, track stock levels, and view inventory reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Features will include:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Add, edit, and delete inventory items</li>
            <li>Track stock levels and quantities</li>
            <li>View inventory reports and analytics</li>
            <li>Manage product categories and classifications</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}