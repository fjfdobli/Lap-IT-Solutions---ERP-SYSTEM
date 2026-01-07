import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Search,
  Loader2,
  RefreshCw,
  Database,
  ShoppingCart,
  Package,
  ClipboardList,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'

interface PoHeader {
  id: number
  xCode: string
  PoDate: string | null
  Xname: string
  SupplierName: string
  POStatus: string
  Qty_Total: number
  Amnt_GrandCost: number
  CreateBy: string
  ForceClose: string
}

interface PoItem {
  id: number
  xCode: string
  PoDate: string | null
  ItemName: string
  ItemCode: string
  Qty_Order: number
  Qty_Free: number
  Amnt_Cost: number
  Amnt_totalCost: number
  UOM: string
  SupplierName: string
}

interface PhyHeader {
  id: number
  xCode: string
  Xname: string
  DatesTart: string | null
  DateEnd: string | null
  CheckBy: string
  Approve: string
  POStatus: string
  ExQty: number
  ExAmnt: number
  OQty: number
  OAmnt: number
  UQty: number
  UAmnt: number
  title: string
}

interface PhyItem {
  id: number
  PhyDate: string | null
  Xname: string
  ItemName: string
  ItemCode: string
  Class: string
  Dept: string
  Location: string
  SysQty: number
  AdjQty: number
  AdjPer: number
  Cost: number
  title: string
}

function StatusBadge({ status }: { status: string }) {
  const variant = status?.toLowerCase() === 'open' ? 'outline' : 
                  status?.toLowerCase() === 'closed' ? 'default' : 'secondary'
  return <Badge variant={variant}>{status || 'Unknown'}</Badge>
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '₱0.00'
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export default function POSDataViewer() {
  const [activeTab, setActiveTab] = useState('po-headers')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [poHeaders, setPoHeaders] = useState<PoHeader[]>([])
  const [poItems, setPoItems] = useState<PoItem[]>([])
  const [phyHeaders, setPhyHeaders] = useState<PhyHeader[]>([])
  const [phyItems, setPhyItems] = useState<PhyItem[]>([])
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        search: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      }

      switch (activeTab) {
        case 'po-headers': {
          const response = await api.getPosPoHeaders(params)
          if (response.success && response.data) {
            setPoHeaders(response.data.records)
            setPagination(prev => ({
              ...prev,
              total: response.data!.pagination.total,
              totalPages: response.data!.pagination.totalPages,
            }))
          }
          break
        }
        case 'po-items': {
          const response = await api.getPosPoItems(params)
          if (response.success && response.data) {
            setPoItems(response.data.records)
            setPagination(prev => ({
              ...prev,
              total: response.data!.pagination.total,
              totalPages: response.data!.pagination.totalPages,
            }))
          }
          break
        }
        case 'phy-headers': {
          const response = await api.getPosPhyHeaders(params)
          if (response.success && response.data) {
            setPhyHeaders(response.data.records)
            setPagination(prev => ({
              ...prev,
              total: response.data!.pagination.total,
              totalPages: response.data!.pagination.totalPages,
            }))
          }
          break
        }
        case 'phy-items': {
          const response = await api.getPosPhyItems(params)
          if (response.success && response.data) {
            setPhyItems(response.data.records)
            setPagination(prev => ({
              ...prev,
              total: response.data!.pagination.total,
              totalPages: response.data!.pagination.totalPages,
            }))
          }
          break
        }
      }
    } catch (error) {
      console.error('Failed to load POS data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, searchQuery, pagination.page, pagination.limit])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
    setSearchQuery('')
  }, [activeTab])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    loadData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6" />
            POS Data Viewer
          </h1>
          <p className="text-muted-foreground">
            Read-only access to ibs_pos_new database (Legacy POS System)
          </p>
        </div>
        <Badge variant="outline" className="gap-1 px-3 py-1">
          <AlertCircle className="h-3 w-3" />
          Read-Only
        </Badge>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> This data is from the existing POS system (ibs_pos_new database). 
            It is read-only and reflects historical records from the company's legacy system. 
            For new transactions, use the ERP modules.
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="po-headers" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">mod_po_1</span>
            <span className="sm:hidden">PO Headers</span>
          </TabsTrigger>
          <TabsTrigger value="po-items" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">mod_po_2</span>
            <span className="sm:hidden">PO Items</span>
          </TabsTrigger>
          <TabsTrigger value="phy-headers" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">mod_phy_1</span>
            <span className="sm:hidden">Phy Headers</span>
          </TabsTrigger>
          <TabsTrigger value="phy-items" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">mod_phy_2</span>
            <span className="sm:hidden">Phy Items</span>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
              </form>
              <Button 
                variant="outline" 
                size="icon"
                onClick={loadData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="po-headers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Headers (mod_po_1)</CardTitle>
              <CardDescription>
                PO header records from legacy POS system containing supplier and order information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>PO Code</TableHead>
                    <TableHead>PO Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Grand Cost</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : poHeaders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    poHeaders.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">{row.id}</TableCell>
                        <TableCell className="font-medium">{row.xCode}</TableCell>
                        <TableCell>{formatDate(row.PoDate)}</TableCell>
                        <TableCell>{row.Xname}</TableCell>
                        <TableCell>{row.SupplierName}</TableCell>
                        <TableCell><StatusBadge status={row.POStatus} /></TableCell>
                        <TableCell className="text-right">{row.Qty_Total?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.Amnt_GrandCost)}</TableCell>
                        <TableCell className="text-muted-foreground">{row.CreateBy}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="po-items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Items (mod_po_2)</CardTitle>
              <CardDescription>
                PO line items with product details, quantities, and costs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>PO Code</TableHead>
                    <TableHead>PO Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead className="text-right">Order Qty</TableHead>
                    <TableHead className="text-right">Free Qty</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : poItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    poItems.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">{row.id}</TableCell>
                        <TableCell className="font-medium">{row.xCode}</TableCell>
                        <TableCell>{formatDate(row.PoDate)}</TableCell>
                        <TableCell>{row.SupplierName}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.ItemName}</TableCell>
                        <TableCell className="font-mono text-xs">{row.ItemCode}</TableCell>
                        <TableCell className="text-right">{row.Qty_Order?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-right">{row.Qty_Free?.toLocaleString() || 0}</TableCell>
                        <TableCell>{row.UOM}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.Amnt_Cost)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.Amnt_totalCost)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phy-headers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Physical Inventory Headers (mod_phy_1)</CardTitle>
              <CardDescription>
                Physical count sessions with summary quantities and amounts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Checked By</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead className="text-right">Exp Qty</TableHead>
                    <TableHead className="text-right">Over Qty</TableHead>
                    <TableHead className="text-right">Under Qty</TableHead>
                    <TableHead>Title</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : phyHeaders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-32 text-center text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    phyHeaders.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">{row.id}</TableCell>
                        <TableCell className="font-medium">{row.xCode}</TableCell>
                        <TableCell>{row.Xname}</TableCell>
                        <TableCell>{formatDate(row.DatesTart)}</TableCell>
                        <TableCell>{formatDate(row.DateEnd)}</TableCell>
                        <TableCell><StatusBadge status={row.POStatus} /></TableCell>
                        <TableCell>{row.CheckBy}</TableCell>
                        <TableCell>{row.Approve}</TableCell>
                        <TableCell className="text-right">{row.ExQty?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-right text-green-600">{row.OQty?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-right text-red-600">{row.UQty?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-muted-foreground">{row.title}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phy-items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Physical Inventory Items (mod_phy_2)</CardTitle>
              <CardDescription>
                Physical count line items with item details, system quantities, and adjustments (selected columns)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Phy Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Sys Qty</TableHead>
                    <TableHead className="text-right">Adj Qty</TableHead>
                    <TableHead className="text-right">Adj %</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Title</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={13} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : phyItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="h-32 text-center text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    phyItems.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">{row.id}</TableCell>
                        <TableCell>{formatDate(row.PhyDate)}</TableCell>
                        <TableCell>{row.Xname}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{row.ItemName}</TableCell>
                        <TableCell className="font-mono text-xs">{row.ItemCode}</TableCell>
                        <TableCell>{row.Class}</TableCell>
                        <TableCell>{row.Dept}</TableCell>
                        <TableCell>{row.Location}</TableCell>
                        <TableCell className="text-right">{Number(row.SysQty || 0).toLocaleString()}</TableCell>
                        <TableCell className={`text-right ${Number(row.AdjQty) > 0 ? 'text-green-600' : Number(row.AdjQty) < 0 ? 'text-red-600' : ''}`}>
                          {Number(row.AdjQty || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">{Number(row.AdjPer || 0).toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(row.Cost || 0))}</TableCell>
                        <TableCell className="text-muted-foreground">{row.title}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
