import { useState } from "react"
import { Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Supplier {
  name: string
  code: string
  term: string
  telephone: string
  address: string
  active: boolean
  information?: string
}

const mockSuppliers: Supplier[] = [
  {
    name: "ABC Supplies Inc.",
    code: "SUP-001",
    term: "Net 30",
    telephone: "+1-555-0101",
    address: "123 Business St, City, State 12345",
    active: true,
    information: "Primary office supplies supplier",
  },
  {
    name: "Tech Distributors",
    code: "SUP-002",
    term: "Net 15",
    telephone: "+1-555-0102",
    address: "456 Tech Ave, City, State 12345",
    active: true,
    information: "Electronics and IT equipment",
  },
  {
    name: "Furniture Plus",
    code: "SUP-003",
    term: "Net 30",
    telephone: "+1-555-0103",
    address: "789 Furniture Blvd, City, State 12345",
    active: true,
    information: "Office furniture and accessories",
  },
]

interface SupplierSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (supplier: Supplier) => void
}

export function SupplierSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: SupplierSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const filteredSuppliers = mockSuppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
  }

  const handleConfirm = () => {
    if (selectedSupplier) {
      onSelect(selectedSupplier)
      setSelectedSupplier(null)
      setSearchTerm("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Supplier</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by supplier name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-md border max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Telephone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No suppliers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow
                      key={supplier.code}
                      className={`cursor-pointer ${
                        selectedSupplier?.code === supplier.code ? "bg-accent" : ""
                      }`}
                      onClick={() => handleSelect(supplier)}
                    >
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.code}</TableCell>
                      <TableCell>{supplier.term}</TableCell>
                      <TableCell>{supplier.telephone}</TableCell>
                      <TableCell>{supplier.address}</TableCell>
                      <TableCell>
                        <Badge variant={supplier.active ? "default" : "secondary"}>
                          {supplier.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {selectedSupplier && (
            <div className="rounded-md border p-4 bg-muted/50">
              <h4 className="font-semibold mb-2">Selected Supplier Information</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {selectedSupplier.name}</p>
                <p><strong>Code:</strong> {selectedSupplier.code}</p>
                <p><strong>Term:</strong> {selectedSupplier.term}</p>
                <p><strong>Telephone:</strong> {selectedSupplier.telephone}</p>
                <p><strong>Address:</strong> {selectedSupplier.address}</p>
                {selectedSupplier.information && (
                  <p><strong>Information:</strong> {selectedSupplier.information}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedSupplier}>
              Select Supplier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}