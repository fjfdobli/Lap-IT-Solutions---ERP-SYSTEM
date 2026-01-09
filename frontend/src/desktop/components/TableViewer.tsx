import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Download,
  RefreshCw,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Database,
  Loader2,
  FileSpreadsheet,
  Filter,
  LayoutGrid,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

// Business-friendly column name mappings
const columnLabelMap: Record<string, string> = {
  // Common fields
  id: 'ID',
  itemcode: 'Item Code',
  itemdesc: 'Item Description',
  barcode: 'Barcode',
  qty: 'Quantity',
  quantity: 'Quantity',
  quantity_on_hand: 'Stock on Hand',
  qtyonhand: 'Stock on Hand',
  reorder_level: 'Reorder Level',
  unitcost: 'Unit Cost',
  unit_cost: 'Unit Cost',
  unitprice: 'Unit Price',
  unit_price: 'Unit Price',
  srp: 'Selling Price (SRP)',
  sellingprice: 'Selling Price',
  costprice: 'Cost Price',
  suppcode: 'Supplier Code',
  suppname: 'Supplier Name',
  supplier_name: 'Supplier Name',
  category: 'Category',
  categorycode: 'Category Code',
  categorydesc: 'Category',
  subcategory: 'Sub-Category',
  brand: 'Brand',
  brandcode: 'Brand Code',
  branddesc: 'Brand',
  unitcode: 'Unit Code',
  unitdesc: 'Unit of Measure',
  uom: 'Unit of Measure',
  status: 'Status',
  isactive: 'Active Status',
  active: 'Active',
  remarks: 'Remarks',
  notes: 'Notes',
  description: 'Description',
  created_at: 'Created Date',
  updated_at: 'Last Updated',
  createdate: 'Created Date',
  modifydate: 'Last Modified',
  createdby: 'Created By',
  modifiedby: 'Modified By',
  user: 'User',
  username: 'Username',
  transdate: 'Transaction Date',
  transno: 'Transaction No.',
  transtype: 'Transaction Type',
  docno: 'Document No.',
  refno: 'Reference No.',
  amount: 'Amount',
  total: 'Total',
  totalamount: 'Total Amount',
  discount: 'Discount',
  discountamt: 'Discount Amount',
  tax: 'Tax',
  taxamt: 'Tax Amount',
  netamount: 'Net Amount',
  grossamount: 'Gross Amount',
  location: 'Location',
  locationcode: 'Location Code',
  locationdesc: 'Location',
  warehouse: 'Warehouse',
  warehousecode: 'Warehouse Code',
  warehousedesc: 'Warehouse',
  // Customer fields
  custcode: 'Customer Code',
  custname: 'Customer Name',
  customer_name: 'Customer Name',
  address: 'Address',
  contact: 'Contact No.',
  contactno: 'Contact No.',
  email: 'Email',
  phone: 'Phone',
  mobile: 'Mobile',
  // Transaction fields
  invoiceno: 'Invoice No.',
  receiptno: 'Receipt No.',
  cashier: 'Cashier',
  terminal: 'Terminal',
  shift: 'Shift',
  payment: 'Payment',
  paymenttype: 'Payment Type',
  cash: 'Cash',
  change: 'Change',
  // PO fields
  po_number: 'PO Number',
  pono: 'PO Number',
  podate: 'PO Date',
  expected_date: 'Expected Date',
  received_date: 'Received Date',
  // Misc
  effectivedate: 'Effective Date',
  expirydate: 'Expiry Date',
  batchno: 'Batch No.',
  serialno: 'Serial No.',
  picture: 'Image',
  imagepath: 'Image Path',
  conversion: 'Conversion Factor',
  multiplier: 'Multiplier',
}

interface Column {
  field: string
  type: string
  nullable: boolean
  key: string
  default: string | number | null
}

interface TableStructure {
  tableName: string
  displayName: string
  description: string
  category: string
  primaryKey?: string
  columns: Column[]
}

interface TableDataResponse {
  tableName: string
  displayName: string
  rows: Record<string, unknown>[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface TableViewerProps {
  tableName: string
  title?: string
  description?: string
}

// Helper function to get business-friendly column labels
const getColumnLabel = (fieldName: string): string => {
  const lowered = fieldName.toLowerCase()
  if (columnLabelMap[lowered]) {
    return columnLabelMap[lowered]
  }
  // Convert snake_case or camelCase to Title Case
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

export function TableViewer({ tableName, title, description }: TableViewerProps) {
  const [structure, setStructure] = useState<TableStructure | null>(null)
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch table structure
  const fetchStructure = useCallback(async () => {
    try {
      const response = await api.get<TableStructure>(`/pos-tables/tables/${tableName}/structure`)
      if (response.success && response.data) {
        setStructure(response.data)
      }
    } catch (err) {
      console.error('Error fetching structure:', err)
    }
  }, [tableName])

  // Fetch table data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(sortBy && { sortBy, sortOrder }),
      })
      
      const response = await api.get<TableDataResponse>(`/pos-tables/tables/${tableName}/data?${params}`)
      if (response.success && response.data) {
        setData(response.data.rows)
        setTotal(response.data.pagination.total)
        setTotalPages(response.data.pagination.totalPages)
      } else {
        setError(response.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError('Failed to fetch data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [tableName, page, limit, debouncedSearch, sortBy, sortOrder])

  useEffect(() => {
    fetchStructure()
  }, [fetchStructure])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(column)
      setSortOrder('ASC')
    }
  }

  // Handle export
  const handleExport = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('access_token')
      const params = new URLSearchParams({
        ...(debouncedSearch && { search: debouncedSearch }),
      })
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pos-tables/tables/${tableName}/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${structure?.displayName || tableName}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  // View record details
  const handleViewRecord = (record: Record<string, unknown>) => {
    setSelectedRecord(record)
    setViewDialogOpen(true)
  }

  // Format cell value for display
  const formatCellValue = (value: unknown, columnType: string): string => {
    if (value === null || value === undefined) return '-'
    if (columnType.includes('date') && value) {
      try {
        return new Date(value as string).toLocaleDateString()
      } catch {
        return String(value)
      }
    }
    if (columnType.includes('decimal') || columnType.includes('float')) {
      const num = parseFloat(value as string)
      return isNaN(num) ? String(value) : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
  }

  // Visible columns (limit for better UX)
  const visibleColumns = structure?.columns.slice(0, 8) || []
  const hasMoreColumns = (structure?.columns.length || 0) > 8

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {title || structure?.displayName || tableName}
                </CardTitle>
                <CardDescription className="mt-1">
                  {description || structure?.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm px-3 py-1 bg-primary/10 text-primary">
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                {total.toLocaleString()} records
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1) }}>
                <SelectTrigger className="w-[120px] bg-background">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                  <SelectItem value="200">200 rows</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className="bg-background">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="relative overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[60px] sticky left-0 bg-muted/50 font-semibold text-xs uppercase tracking-wider">#</TableHead>
                  {visibleColumns.map((col) => (
                    <TableHead
                      key={col.field}
                      className="cursor-pointer hover:bg-muted/80 whitespace-nowrap font-semibold text-xs uppercase tracking-wider transition-colors"
                      onClick={() => handleSort(col.field)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{getColumnLabel(col.field)}</span>
                        {sortBy === col.field ? (
                          sortOrder === 'ASC' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {hasMoreColumns && (
                    <TableHead className="text-center text-muted-foreground text-xs">
                      +{(structure?.columns.length || 0) - 8} more fields
                    </TableHead>
                  )}
                  <TableHead className="w-[80px] sticky right-0 bg-muted/50 text-xs uppercase tracking-wider font-semibold">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      {visibleColumns.map((col) => (
                        <TableCell key={col.field}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                      {hasMoreColumns && <TableCell><Skeleton className="h-4 w-8" /></TableCell>}
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 3} className="text-center py-16">
                      <Database className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">No records found</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search criteria</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, idx) => (
                    <TableRow key={idx} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground sticky left-0 bg-background group-hover:bg-muted/30 transition-colors">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                      {visibleColumns.map((col) => (
                        <TableCell key={col.field} className="max-w-[200px] truncate">
                          {formatCellValue(row[col.field], col.type)}
                        </TableCell>
                      ))}
                      {hasMoreColumns && (
                        <TableCell className="text-center text-muted-foreground">
                          ...
                        </TableCell>
                      )}
                      <TableCell className="sticky right-0 bg-background">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewRecord(row)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {data.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
          {Math.min(page * limit, total)} of {total.toLocaleString()} records
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(1)}
            disabled={page === 1 || loading}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || loading}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Record Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-5 w-5 text-primary" />
              Record Details
            </DialogTitle>
            <DialogDescription>
              {title || structure?.displayName} - Complete information
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-1">
              {selectedRecord && structure?.columns.map((col, index) => (
                <div 
                  key={col.field} 
                  className={cn(
                    "grid grid-cols-3 gap-4 py-3 px-4 rounded-lg transition-colors",
                    index % 2 === 0 ? "bg-muted/30" : ""
                  )}
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {getColumnLabel(col.field)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm break-all text-muted-foreground">
                      {formatCellValue(selectedRecord[col.field], col.type) || '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
