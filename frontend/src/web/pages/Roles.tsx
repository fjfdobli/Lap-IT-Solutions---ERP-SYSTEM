import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Shield,
  Users,
  Loader2,
  AlertCircle,
  Lock,
  Search,
  RefreshCw,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Eye,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Role {
  id: string
  name: string
  description: string | null
  isSystemRole: boolean
  userCount: number
  createdAt: string
  createdBy: string | null
}

interface GroupedPermissions {
  [module: string]: Array<{
    id: string
    action: string
    description: string | null
  }>
}

const moduleIcons: Record<string, string> = {
  users: '👤',
  roles: '🛡️',
  devices: '💻',
  pos: '🏪',
  inventory: '📦',
  reports: '📊',
  settings: '⚙️',
  audit: '📋',
}

const moduleDescriptions: Record<string, string> = {
  users: 'Manage system users and their access',
  roles: 'Configure roles and permissions',
  devices: 'Desktop client device management',
  pos: 'Point of sale operations',
  inventory: 'Stock and inventory control',
  reports: 'Analytics and reporting',
  settings: 'System configuration',
  audit: 'Activity logs and audit trails',
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingRole, setViewingRole] = useState<Role | null>(null)
  const [viewingPermissions, setViewingPermissions] = useState<string[]>([])

  async function loadData() {
    setIsLoading(true)
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.getRoles(),
        api.getPermissions(),
      ])

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data)
      }

      if (permsRes.success && permsRes.data) {
        setGroupedPermissions(permsRes.data.grouped)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreateRole() {
    if (!createName) {
      setCreateError('Role name is required')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const response = await api.createRole({
        name: createName,
        description: createDescription || undefined,
        permissionIds: selectedPermissions,
      })

      if (response.success) {
        setShowCreateDialog(false)
        setCreateName('')
        setCreateDescription('')
        setSelectedPermissions([])
        loadData()
      } else {
        setCreateError(response.error || 'Failed to create role')
      }
    } catch {
      setCreateError('An unexpected error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleEditRole(role: Role) {
    setEditingRole(role)
    setEditName(role.name)
    setEditDescription(role.description || '')
    
    try {
      const response = await api.getRole(role.id)
      if (response.success && response.data) {
        setEditPermissions(response.data.permissions.map((p: { id: string }) => p.id))
      }
    } catch (error) {
      console.error('Failed to load role details:', error)
    }
    
    setShowEditDialog(true)
  }

  async function handleViewRole(role: Role) {
    setViewingRole(role)
    try {
      const response = await api.getRole(role.id)
      if (response.success && response.data) {
        setViewingPermissions(response.data.permissions.map((p: { id: string }) => p.id))
      }
    } catch (error) {
      console.error('Failed to load role details:', error)
    }
    setShowViewDialog(true)
  }

  async function handleUpdateRole() {
    if (!editingRole || !editName) {
      setEditError('Role name is required')
      return
    }

    setIsUpdating(true)
    setEditError(null)

    try {
      const response = await api.updateRole(editingRole.id, {
        name: editName,
        description: editDescription || undefined,
        permissionIds: editPermissions,
      })

      if (response.success) {
        setShowEditDialog(false)
        setEditingRole(null)
        loadData()
      } else {
        setEditError(response.error || 'Failed to update role')
      }
    } catch {
      setEditError('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDeleteRole() {
    if (!selectedRole) return
    setIsDeleting(true)

    try {
      const response = await api.deleteRole(selectedRole.id)
      if (response.success) {
        setShowDeleteDialog(false)
        setSelectedRole(null)
        loadData()
      }
    } catch (error) {
      console.error('Failed to delete role:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  function togglePermission(permId: string, list: string[], setList: (p: string[]) => void) {
    if (list.includes(permId)) {
      setList(list.filter(id => id !== permId))
    } else {
      setList([...list, permId])
    }
  }

  function toggleModulePermissions(module: string, list: string[], setList: (p: string[]) => void) {
    const modulePerms = groupedPermissions[module]?.map(p => p.id) || []
    const allSelected = modulePerms.every(id => list.includes(id))

    if (allSelected) {
      setList(list.filter(id => !modulePerms.includes(id)))
    } else {
      setList([...new Set([...list, ...modulePerms])])
    }
  }

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: roles.length,
    system: roles.filter(r => r.isSystemRole).length,
    custom: roles.filter(r => !r.isSystemRole).length,
  }

  const totalPermissions = Object.values(groupedPermissions).flat().length

  const PermissionSelector = ({
    selected,
    onToggle,
    onToggleModule,
    readOnly = false,
  }: {
    selected: string[]
    onToggle: (id: string) => void
    onToggleModule: (module: string) => void
    readOnly?: boolean
  }) => (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([module, perms]) => {
          const modulePermIds = perms.map(p => p.id)
          const allSelected = modulePermIds.every(id => selected.includes(id))
          const someSelected = modulePermIds.some(id => selected.includes(id))
          const selectedCount = perms.filter(p => selected.includes(p.id)).length
          const percentage = (selectedCount / perms.length) * 100

          return (
            <Card key={module} className="overflow-hidden">
              <CardHeader className="p-4 pb-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {!readOnly && (
                      <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={() => onToggleModule(module)}
                      />
                    )}
                    <span className="text-xl">{moduleIcons[module] || '📁'}</span>
                    <div>
                      <CardTitle className="text-sm font-semibold capitalize">
                        {module.replace('_', ' ')}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {moduleDescriptions[module] || 'Module permissions'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={allSelected ? 'default' : someSelected ? 'secondary' : 'outline'}>
                    {selectedCount}/{perms.length}
                  </Badge>
                </div>
                <Progress value={percentage} className="h-1 mt-2" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {perms.map((perm) => (
                    <div 
                      key={perm.id} 
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                        selected.includes(perm.id) 
                          ? "bg-primary/5 border-primary/20" 
                          : "bg-background hover:bg-muted/50",
                        readOnly && "cursor-default"
                      )}
                    >
                      {!readOnly ? (
                        <Checkbox
                          checked={selected.includes(perm.id)}
                          onCheckedChange={() => onToggle(perm.id)}
                        />
                      ) : (
                        <div className={cn(
                          "h-4 w-4 rounded flex items-center justify-center",
                          selected.includes(perm.id) 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        )}>
                          {selected.includes(perm.id) && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                      )}
                      <span className="text-sm capitalize font-medium">
                        {perm.action}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </ScrollArea>
  )

  const getRoleIcon = (role: Role) => {
    if (role.isSystemRole) return <Lock className="h-5 w-5 text-amber-500" />
    return <Shield className="h-5 w-5 text-primary" />
  }

  const getRoleColor = (role: Role) => {
    if (role.isSystemRole) return 'border-l-4 border-l-amber-500'
    return 'border-l-4 border-l-primary'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Configure roles and assign permissions for desktop application users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.system}</p>
                <p className="text-sm text-muted-foreground">System Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.custom}</p>
                <p className="text-sm text-muted-foreground">Custom Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPermissions}</p>
                <p className="text-sm text-muted-foreground">Permissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRoles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No roles found' : 'No roles defined yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first role'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Role
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoles.map((role) => (
            <Card key={role.id} className={cn("group transition-shadow hover:shadow-md", getRoleColor(role))}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      {getRoleIcon(role)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{role.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-1">
                        {role.description || 'No description provided'}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewRole(role)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditRole(role)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {!role.isSystemRole && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedRole(role)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{role.userCount} users</span>
                    </div>
                    {role.isSystemRole && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        <Lock className="h-3 w-3 mr-1" />
                        System
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Created {formatDistanceToNow(new Date(role.createdAt), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Create New Role
            </DialogTitle>
            <DialogDescription>
              Create a role with specific permissions for desktop application users
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Role Details</TabsTrigger>
              <TabsTrigger value="permissions">
                Permissions
                {selectedPermissions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedPermissions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 py-4">
              {createError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="create-name">Role Name</Label>
                <Input
                  id="create-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g., Sales Manager"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Describe what this role is used for..."
                  rows={3}
                />
              </div>
            </TabsContent>
            <TabsContent value="permissions" className="py-4">
              <PermissionSelector
                selected={selectedPermissions}
                onToggle={(id) => togglePermission(id, selectedPermissions, setSelectedPermissions)}
                onToggleModule={(module) => toggleModulePermissions(module, selectedPermissions, setSelectedPermissions)}
              />
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Role
            </DialogTitle>
            <DialogDescription>
              Update role details and permissions
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Role Details</TabsTrigger>
              <TabsTrigger value="permissions">
                Permissions
                {editPermissions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {editPermissions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 py-4">
              {editError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={editingRole?.isSystemRole}
                />
                {editingRole?.isSystemRole && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    System role names cannot be changed
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>
            <TabsContent value="permissions" className="py-4">
              <PermissionSelector
                selected={editPermissions}
                onToggle={(id) => togglePermission(id, editPermissions, setEditPermissions)}
                onToggleModule={(module) => toggleModulePermissions(module, editPermissions, setEditPermissions)}
              />
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Permissions Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {viewingRole?.name} - Permissions
            </DialogTitle>
            <DialogDescription>
              {viewingRole?.description || 'View all permissions assigned to this role'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Total Permissions Assigned</span>
              <Badge>{viewingPermissions.length} of {totalPermissions}</Badge>
            </div>
            <PermissionSelector
              selected={viewingPermissions}
              onToggle={() => {}}
              onToggleModule={() => {}}
              readOnly
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowViewDialog(false)
              if (viewingRole) handleEditRole(viewingRole)
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"? 
              {selectedRole && selectedRole.userCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  Warning: {selectedRole.userCount} user(s) are currently assigned to this role.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
