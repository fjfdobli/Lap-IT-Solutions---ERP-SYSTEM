import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  Loader2,
  RefreshCw,
  Database,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  viber: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

interface POSSupplier {
  id: number
  code: string
  name: string
  term: string
  contact: string
  phone: string
  address: string
  account_number: string
  fax: string
  email: string
  notes: string
  active: string
  tin: string
}

export default function Suppliers() {
  const [activeTab, setActiveTab] = useState('erp')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  
  const [posSuppliers, setPosSuppliers] = useState<POSSupplier[]>([])
  const [isPosLoading, setIsPosLoading] = useState(true)
  const [posSearchQuery, setPosSearchQuery] = useState('')
  const [posPagination, setPosPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const [showFormDialog, setShowFormDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.getSuppliers({
        search: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      })
      if (response.success && response.data) {
        setSuppliers(response.data.suppliers)
        setPagination(prev => ({
          ...prev,
          total: response.data!.pagination.total,
          totalPages: response.data!.pagination.totalPages,
        }))
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, pagination.page, pagination.limit])

  const loadPosSuppliers = useCallback(async () => {
    setIsPosLoading(true)
    try {
      const response = await api.getPosSuppliers({
        search: posSearchQuery || undefined,
        page: posPagination.page,
        limit: posPagination.limit,
      })
      if (response.success && response.data) {
        setPosSuppliers(response.data.suppliers)
        setPosPagination(prev => ({
          ...prev,
          total: response.data!.pagination.total,
          totalPages: response.data!.pagination.totalPages,
        }))
      }
    } catch (error) {
      console.error('Failed to load POS suppliers:', error)
    } finally {
      setIsPosLoading(false)
    }
  }, [posSearchQuery, posPagination.page, posPagination.limit])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  useEffect(() => {
    if (activeTab === 'pos') {
      loadPosSuppliers()
    }
  }, [activeTab, loadPosSuppliers])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  function openCreateDialog() {
    setSelectedSupplier(null)
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    })
    setShowFormDialog(true)
  }

  function openEditDialog(supplier: Supplier) {
    setSelectedSupplier(supplier)
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    })
    setShowFormDialog(true)
  }

  function openDeleteDialog(supplier: Supplier) {
    setSelectedSupplier(supplier)
    setShowDeleteDialog(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error('Supplier name is required')
      return
    }

    setIsActionLoading(true)
    try {
      let response
      if (selectedSupplier) {
        response = await api.updateSupplier(selectedSupplier.id, formData)
      } else {
        response = await api.createSupplier(formData)
      }

      if (response.success) {
        toast.success(selectedSupplier ? 'Supplier updated' : 'Supplier created')
        loadSuppliers()
        setShowFormDialog(false)
      } else {
        toast.error(response.message || 'Failed to save supplier')
      }
    } catch (error) {
      toast.error('Failed to save supplier')
    } finally {
      setIsActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!selectedSupplier) return

    setIsActionLoading(true)
    try {
      const response = await api.deleteSupplier(selectedSupplier.id)
      if (response.success) {
        toast.success('Supplier deleted')
        loadSuppliers()
        setShowDeleteDialog(false)
      } else {
        toast.error(response.message || 'Failed to delete supplier')
      }
    } catch (error) {
      toast.error('Failed to delete supplier')
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your suppliers and vendors
          </p>
        </div>
        {activeTab === 'erp' && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="erp" className="gap-2">
            <Building2 className="h-4 w-4" />
            ERP Suppliers
          </TabsTrigger>
          <TabsTrigger value="pos" className="gap-2">
            <Database className="h-4 w-4" />
            POS Suppliers (Legacy)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="erp" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search suppliers..."
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
                  onClick={loadSuppliers}
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

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No suppliers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{supplier.name}</p>
                              {supplier.address && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{supplier.address}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{supplier.contact_person || '-'}</TableCell>
                        <TableCell>{supplier.email || '-'}</TableCell>
                        <TableCell>{supplier.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                            {supplier.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(supplier)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} suppliers
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
        </TabsContent>

        <TabsContent value="pos" className="space-y-4">
          {/* Info Banner */}
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Legacy POS Data (Read-Only)</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    These suppliers are from the existing ibs_pos_new database. To add new suppliers, use the "ERP Suppliers" tab.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <form onSubmit={(e) => { e.preventDefault(); setPosPagination(prev => ({ ...prev, page: 1 })) }} className="flex-1 flex gap-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search POS suppliers..."
                      value={posSearchQuery}
                      onChange={(e) => setPosSearchQuery(e.target.value)}
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
                  onClick={loadPosSuppliers}
                  disabled={isPosLoading}
                >
                  {isPosLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                inv_refsupplier
              </CardTitle>
              <CardDescription>
                Supplier records from the legacy POS system
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>TIN</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPosLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : posSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No POS suppliers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    posSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-mono text-xs">{supplier.id}</TableCell>
                        <TableCell className="font-mono text-xs">{supplier.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                              <Database className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="font-medium">{supplier.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{supplier.contact || '-'}</TableCell>
                        <TableCell>{supplier.phone || '-'}</TableCell>
                        <TableCell>{supplier.email || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{supplier.tin || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.active === 'True' ? 'default' : 'secondary'}>
                            {supplier.active === 'True' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {posPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((posPagination.page - 1) * posPagination.limit) + 1} to {Math.min(posPagination.page * posPagination.limit, posPagination.total)} of {posPagination.total} suppliers
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={posPagination.page <= 1}
                  onClick={() => setPosPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={posPagination.page >= posPagination.totalPages}
                  onClick={() => setPosPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
            <DialogDescription>
              {selectedSupplier ? 'Update supplier information' : 'Add a new supplier to your list'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Supplier Name *</Label>
              <Input
                placeholder="Enter supplier name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input
                placeholder="Enter contact person"
                value={formData.contactPerson}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+63 XXX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                placeholder="Enter address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedSupplier ? 'Save Changes' : 'Add Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSupplier?.name}"? This action cannot be undone.
              {selectedSupplier && (
                <p className="mt-2 text-amber-500">
                  Note: You cannot delete a supplier that has purchase orders.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isActionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
