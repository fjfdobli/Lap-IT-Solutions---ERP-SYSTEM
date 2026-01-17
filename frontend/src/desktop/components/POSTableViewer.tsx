import { useState, useEffect, useCallback } from 'react'
import { usePOS } from '../lib/pos-context'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  AlertCircle,
  MoreHorizontal,
  Copy,
  FileText,
  Printer,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// Business-friendly column name mappings
const columnLabelMap: Record<string, string> = {
  id: 'ID',
  itemcode: 'Item Code',
  itemdesc: 'Item Description',
  barcode: 'Barcode',
  qty: 'Quantity',
  quantity: 'Quantity',
  qtyonhand: 'Stock on Hand',
  unitcost: 'Unit Cost',
  unitprice: 'Unit Price',
  srp: 'Selling Price (SRP)',
  sellingprice: 'Selling Price',
  suppcode: 'Supplier Code',
  suppname: 'Supplier Name',
  categorydesc: 'Category',
  categorycode: 'Category Code',
  branddesc: 'Brand',
  unitdesc: 'Unit of Measure',
  status: 'Status',
  isactive: 'Active Status',
  active: 'Active',
  remarks: 'Remarks',
  createdate: 'Created Date',
  datecreate: 'Created Date',
  modifydate: 'Last Modified',
  datemodi: 'Last Modified',
  transdate: 'Transaction Date',
  transno: 'Transaction No.',
  docno: 'Document No.',
  amount: 'Amount',
  total: 'Total',
  totalamount: 'Total Amount',
  netamount: 'Net Amount',
  locationdesc: 'Location',
  locationcode: 'Location Code',
  custcode: 'Customer Code',
  custname: 'Customer Name',
  address: 'Address',
  contactno: 'Contact No.',
  invoiceno: 'Invoice No.',
  cashier: 'Cashier',
  terminal: 'Terminal',
  paymenttype: 'Payment Type',
  class: 'Classification',
  dept: 'Department',
  deptcode: 'Dept Code',
  deptdesc: 'Department',
  // Restaurant fields
  xcode: 'Code',
  xname: 'Name',
  xstatus: 'Status',
  noguest: 'No. of Guests',
  xtype: 'Type',
  amountdue: 'Amount Due',
  kitchenstat: 'Kitchen Status',
  waitername: 'Waiter Name',
  starttime: 'Start Time',
  assignment: 'Assignment',
  expensename: 'Expense Name',
  datetrans: 'Date',
  tempno: 'Transaction No.',
  cashiername: 'Cashier',
  terminalno: 'Terminal',
  itemtype: 'Item Type',
  createby: 'Created By',
  modiby: 'Modified By',
}

interface Column {
  field: string
  type: string
}

interface POSTableViewerProps {
  tableName: string
  title?: string
  description?: string
  icon?: React.ReactNode
}

// Helper function to get business-friendly column labels
const getColumnLabel = (fieldName: string): string => {
  const lowered = fieldName.toLowerCase()
  if (columnLabelMap[lowered]) {
    return columnLabelMap[lowered]
  }
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

export function POSTableViewer({ 
  tableName, 
  title, 
  description, 
  icon,
}: POSTableViewerProps) {
  const { currentPOS, posConfig } = usePOS()
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<Column[]>([])
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
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch table data from the selected POS
  const fetchData = useCallback(async () => {
    if (!currentPOS) {
      setError('Please select a POS system first')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(sortBy && { sortBy, sortOrder }),
      })
      
      const response = await api.get<{
        tableName: string
        rows: Record<string, unknown>[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>(`/multi-pos/${currentPOS}/tables/${tableName}/data?${params}`)
      
      if (response.success && response.data) {
        setData(response.data.rows)
        setTotal(response.data.pagination.total)
        setTotalPages(response.data.pagination.totalPages)
        
        // Extract columns from the first row
        if (response.data.rows.length > 0) {
          const cols = Object.keys(response.data.rows[0]).map(key => ({
            field: key,
            type: typeof response.data.rows[0][key] === 'number' ? 'decimal' : 'varchar'
          }))
          setColumns(cols)
        }
      } else {
        setError(response.error || 'Failed to fetch data')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPOS, tableName, page, limit, debouncedSearch, sortBy, sortOrder])

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
      // Create CSV from current data
      if (data.length > 0 && columns.length > 0) {
        const headers = columns.map(c => getColumnLabel(c.field))
        const rows = data.map(row => 
          columns.map(c => String(row[c.field] ?? '').replace(/,/g, ';'))
        )
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${posConfig?.name || 'POS'}_${tableName}_${new Date().toISOString().split('T')[0]}.csv`
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
  const formatCellValue = (value: unknown, columnName: string): string => {
    if (value === null || value === undefined) return '—'
    
    const lowerName = columnName.toLowerCase()
    
    // Date formatting
    if (lowerName.includes('date') || lowerName.includes('time')) {
      try {
        const date = new Date(value as string)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        }
      } catch {
        return String(value)
      }
    }
    
    // Currency/Amount formatting
    if (lowerName.includes('amount') || lowerName.includes('cost') || lowerName.includes('price') || lowerName.includes('srp') || lowerName.includes('total')) {
      const num = parseFloat(value as string)
      if (!isNaN(num)) {
        return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }
    }
    
    // Quantity formatting
    if (lowerName.includes('qty') || lowerName.includes('quantity')) {
      const num = parseFloat(value as string)
      if (!isNaN(num)) {
        return num.toLocaleString()
      }
    }
    
    // Boolean formatting
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    
    // Active status formatting
    if (lowerName === 'active' || lowerName === 'isactive') {
      const strVal = String(value).toLowerCase()
      if (strVal === 'true' || strVal === '1' || strVal === 'yes') return 'Active'
      if (strVal === 'false' || strVal === '0' || strVal === 'no') return 'Inactive'
    }
    
    return String(value)
  }

  // Get status badge color
  const getStatusColor = (value: string) => {
    const lowerVal = value.toLowerCase()
    if (lowerVal === 'active' || lowerVal === 'true' || lowerVal === 'posted' || lowerVal === 'completed') {
      return 'status-success'
    }
    if (lowerVal === 'inactive' || lowerVal === 'false' || lowerVal === 'cancelled' || lowerVal === 'void') {
      return 'status-error'
    }
    if (lowerVal === 'pending' || lowerVal === 'draft' || lowerVal === 'open') {
      return 'status-warning'
    }
    return 'status-neutral'
  }

  // Visible columns (limit for better UX)
  const visibleColumns = columns.slice(0, 8)
  const hasMoreColumns = columns.length > 8

  if (!currentPOS) {
    return (
      <Card className="border border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mb-4">
            <AlertCircle className="h-7 w-7 text-amber-600" />
          </div>
          <p className="text-lg font-semibold">No POS System Selected</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please select a POS system from the sidebar to view data
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error && !loading) {
    return (
      <Card className="border border-dashed border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-14 w-14 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4">
            <Database className="h-7 w-7 text-red-600" />
          </div>
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side - Title and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  currentPOS === 'oasis' && "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
                  currentPOS === 'r5' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
                  currentPOS === 'mydiner' && "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
                )}>
                  {icon || <FileSpreadsheet className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{title || tableName}</h3>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-muted/40 border-0 focus-visible:bg-background focus-visible:ring-1"
                />
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-2.5 py-1 bg-muted/60">
                <LayoutGrid className="h-3 w-3 mr-1.5" />
                {total.toLocaleString()} records
              </Badge>
              
              <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1) }}>
                <SelectTrigger className="w-[100px] h-9 text-xs bg-muted/40 border-0">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                  <SelectItem value="200">200 rows</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchData} 
                disabled={loading}
                className="h-9 px-3"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport} 
                disabled={exporting || data.length === 0}
                className="h-9 px-3"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="relative overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                <TableHead className="w-[50px] font-semibold text-xs uppercase tracking-wider text-muted-foreground sticky left-0 bg-muted/50 z-10">
                  #
                </TableHead>
                {visibleColumns.map((col) => (
                  <TableHead
                    key={col.field}
                    className="cursor-pointer hover:bg-muted/80 whitespace-nowrap font-semibold text-xs uppercase tracking-wider text-muted-foreground transition-colors select-none"
                    onClick={() => handleSort(col.field)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{getColumnLabel(col.field)}</span>
                      {sortBy === col.field ? (
                        sortOrder === 'ASC' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-20" />
                      )}
                    </div>
                  </TableHead>
                ))}
                {hasMoreColumns && (
                  <TableHead className="text-center text-xs text-muted-foreground font-normal">
                    +{columns.length - 8} more
                  </TableHead>
                )}
                <TableHead className="w-[60px] sticky right-0 bg-muted/50 z-10 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/30">
                    <TableCell className="sticky left-0 bg-background"><Skeleton className="h-4 w-6" /></TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.field}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                    {hasMoreColumns && <TableCell><Skeleton className="h-4 w-6" /></TableCell>}
                    <TableCell className="sticky right-0 bg-background"><Skeleton className="h-7 w-7" /></TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 3} className="h-[300px]">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                        <Database className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium text-muted-foreground">No records found</p>
                      <p className="text-sm text-muted-foreground/70 mt-0.5">Try adjusting your search criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => (
                  <TableRow 
                    key={idx} 
                    className="group border-b border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground sticky left-0 bg-background group-hover:bg-muted/30 transition-colors">
                      {(page - 1) * limit + idx + 1}
                    </TableCell>
                    {visibleColumns.map((col) => {
                      const value = formatCellValue(row[col.field], col.field)
                      const lowerField = col.field.toLowerCase()
                      const isStatus = lowerField === 'active' || lowerField === 'isactive' || lowerField === 'xstatus' || lowerField === 'status' || lowerField === 'postatus'
                      
                      return (
                        <TableCell key={col.field} className="max-w-[200px] text-sm">
                          {isStatus ? (
                            <span className={cn(
                              "status-badge",
                              getStatusColor(value)
                            )}>
                              {value}
                            </span>
                          ) : (
                            <span className="truncate block" title={value}>
                              {value}
                            </span>
                          )}
                        </TableCell>
                      )
                    })}
                    {hasMoreColumns && (
                      <TableCell className="text-center text-muted-foreground text-xs">
                        ···
                      </TableCell>
                    )}
                    <TableCell className="sticky right-0 bg-background group-hover:bg-muted/30 transition-colors">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewRecord(row)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(JSON.stringify(row, null, 2))}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{data.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
          <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{' '}
          <span className="font-medium text-foreground">{total.toLocaleString()}</span> records
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(1)}
            disabled={page === 1 || loading}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm text-muted-foreground">Page</span>
            <span className="text-sm font-medium w-8 text-center">{page}</span>
            <span className="text-sm text-muted-foreground">of {totalPages || 1}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || totalPages === 0 || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || totalPages === 0 || loading}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Record Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center",
                currentPOS === 'oasis' && "bg-blue-100 text-blue-600",
                currentPOS === 'r5' && "bg-emerald-100 text-emerald-600",
                currentPOS === 'mydiner' && "bg-orange-100 text-orange-600"
              )}>
                <Eye className="h-4 w-4" />
              </div>
              Record Details
            </DialogTitle>
            <DialogDescription>
              {title || tableName} • {posConfig?.name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-0.5">
              {selectedRecord && columns.map((col, index) => (
                <div 
                  key={col.field} 
                  className={cn(
                    "grid grid-cols-3 gap-4 py-3 px-3 rounded-lg transition-colors",
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
                      {formatCellValue(selectedRecord[col.field], col.field)}
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
