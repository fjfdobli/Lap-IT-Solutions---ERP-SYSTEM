import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Trash2,
  Edit,
  Key,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users as UsersIcon,
  UserPlus,
  Copy,
  Filter,
  Download,
  RefreshCw,
  Shield,
  Clock,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Monitor,
  Globe,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: string
  isActive: boolean
  emailVerified: boolean
  lastLogin: string | null
  createdAt: string
  createdBy: string | null
}

export default function Users() {
  const [activeTab, setActiveTab] = useState<'desktop' | 'superadmin'>('desktop')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCreateSuperAdminDialog, setShowCreateSuperAdminDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteUserType, setInviteUserType] = useState('admin')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ success: boolean; message: string; token?: string } | null>(null)
  const [createEmail, setCreateEmail] = useState('')
  const [createFirstName, setCreateFirstName] = useState('')
  const [createLastName, setCreateLastName] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [createUserType, setCreateUserType] = useState('admin')
  const [createStatus, setCreateStatus] = useState<'active' | 'inactive'>('active')
  const [createRoleIds, setCreateRoleIds] = useState<string[]>([])
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: string; name: string }>>([])
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [saEmail, setSaEmail] = useState('')
  const [saFirstName, setSaFirstName] = useState('')
  const [saLastName, setSaLastName] = useState('')
  const [saPassword, setSaPassword] = useState('')
  const [showSaPassword, setShowSaPassword] = useState(false)
  const [saStatus, setSaStatus] = useState<'active' | 'inactive'>('active')
  const [isCreatingSa, setIsCreatingSa] = useState(false)
  const [saError, setSaError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editUserType, setEditUserType] = useState('')
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active')
  const [isUpdating, setIsUpdating] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null)
  const [showManageRolesDialog, setShowManageRolesDialog] = useState(false)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [isUpdatingRoles, setIsUpdatingRoles] = useState(false)
  const [manageRolesError, setManageRolesError] = useState<string | null>(null)

  const loadUsers = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const params: { page: number; limit: number; search?: string; userType?: string } = { page, limit: 100 }
      if (searchQuery) params.search = searchQuery

      const response = await api.getUsers(params)
      if (response.success && response.data) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  const loadRoles = useCallback(async () => {
    try {
      const response = await api.getRoles()
      if (response.success && response.data) {
        setAvailableRoles(response.data.map(r => ({ id: r.id, name: r.name })))
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }, [])

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [loadUsers, loadRoles])

  async function handleInvite() {
    if (!inviteEmail) return
    setIsInviting(true)
    setInviteResult(null)

    try {
      const response = await api.invite(inviteEmail, inviteUserType)
      if (response.success && response.data) {
        setInviteResult({
          success: true,
          message: `Invitation created for ${inviteEmail}`,
          token: response.data.token,
        })
      } else {
        setInviteResult({
          success: false,
          message: response.error || 'Failed to send invitation',
        })
      }
    } catch {
      setInviteResult({
        success: false,
        message: 'An unexpected error occurred',
      })
    } finally {
      setIsInviting(false)
    }
  }

  async function handleCreateDesktopUser() {
    if (!createEmail || !createFirstName || !createLastName || !createPassword) {
      setCreateError('All fields are required')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const response = await api.createUser({
        email: createEmail,
        firstName: createFirstName,
        lastName: createLastName,
        password: createPassword,
        userType: createUserType,
        isActive: createStatus === 'active',
        roleIds: createRoleIds.length > 0 ? createRoleIds : undefined,
      })

      if (response.success) {
        setShowCreateDialog(false)
        setCreateEmail('')
        setCreateFirstName('')
        setCreateLastName('')
        setCreatePassword('')
        setCreateUserType('admin')
        setCreateStatus('active')
        setCreateRoleIds([])
        loadUsers()
      } else {
        setCreateError(response.error || 'Failed to create user')
      }
    } catch {
      setCreateError('An unexpected error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleCreateSuperAdmin() {
    if (!saEmail || !saFirstName || !saLastName || !saPassword) {
      setSaError('All fields are required')
      return
    }

    if (saPassword.length < 8) {
      setSaError('Password must be at least 8 characters')
      return
    }

    setIsCreatingSa(true)
    setSaError(null)

    try {
      const response = await api.createUser({
        email: saEmail,
        firstName: saFirstName,
        lastName: saLastName,
        password: saPassword,
        userType: 'super_admin',
        isActive: saStatus === 'active',
      })

      if (response.success) {
        setShowCreateSuperAdminDialog(false)
        setSaEmail('')
        setSaFirstName('')
        setSaLastName('')
        setSaPassword('')
        setSaStatus('active')
        loadUsers()
      } else {
        setSaError(response.error || 'Failed to create super admin')
      }
    } catch {
      setSaError('An unexpected error occurred')
    } finally {
      setIsCreatingSa(false)
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return
    setIsDeleting(true)

    try {
      const response = await api.deleteUser(selectedUser.id)
      if (response.success) {
        setShowDeleteDialog(false)
        setSelectedUser(null)
        loadUsers()
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  function openEditDialog(user: User) {
    setSelectedUser(user)
    setEditFirstName(user.firstName)
    setEditLastName(user.lastName)
    setEditUserType(user.userType)
    setEditStatus(user.isActive ? 'active' : 'inactive')
    setEditError(null)
    setShowEditDialog(true)
  }

  async function handleUpdateUser() {
    if (!selectedUser) return
    if (!editFirstName || !editLastName) {
      setEditError('First name and last name are required')
      return
    }

    setIsUpdating(true)
    setEditError(null)

    try {
      const response = await api.updateUser(selectedUser.id, {
        firstName: editFirstName,
        lastName: editLastName,
        userType: editUserType,
        isActive: editStatus === 'active',
      })

      if (response.success) {
        setShowEditDialog(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        setEditError(response.error || 'Failed to update user')
      }
    } catch {
      setEditError('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  function openResetPasswordDialog(user: User) {
    setSelectedUser(user)
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setResetPasswordError(null)
    setShowResetPasswordDialog(true)
  }

  async function handleResetPassword() {
    if (!selectedUser) return
    if (!newPassword) {
      setResetPasswordError('Password is required')
      return
    }
    if (newPassword.length < 8) {
      setResetPasswordError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setResetPasswordError('Passwords do not match')
      return
    }

    setIsResettingPassword(true)
    setResetPasswordError(null)

    try {
      const response = await api.resetUserPassword(selectedUser.id, newPassword)

      if (response.success) {
        setShowResetPasswordDialog(false)
        setSelectedUser(null)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setResetPasswordError(response.error || 'Failed to reset password')
      }
    } catch {
      setResetPasswordError('An unexpected error occurred')
    } finally {
      setIsResettingPassword(false)
    }
  }

  async function openManageRolesDialog(user: User) {
    setSelectedUser(user)
    setManageRolesError(null)
    setShowManageRolesDialog(true)
    
    try {
      const response = await api.getUser(user.id)
      if (response.success && response.data) {
        setSelectedRoleIds(response.data.roles.map(r => r.id))
      }
    } catch (error) {
      console.error('Failed to load user roles:', error)
    }
  }

  async function handleUpdateRoles() {
    if (!selectedUser) return

    setIsUpdatingRoles(true)
    setManageRolesError(null)

    try {
      const response = await api.updateUser(selectedUser.id, {
        roleIds: selectedRoleIds,
      })

      if (response.success) {
        setShowManageRolesDialog(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        setManageRolesError(response.error || 'Failed to update roles')
      }
    } catch {
      setManageRolesError('An unexpected error occurred')
    } finally {
      setIsUpdatingRoles(false)
    }
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/register?token=${token}`
    navigator.clipboard.writeText(link)
  }

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'manager':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const desktopUsers = users.filter(u => u.userType === 'admin' || u.userType === 'manager')
  const superAdminUsers = users.filter(u => u.userType === 'super_admin')
  
  const filterUsers = (userList: User[]) => {
    let filtered = userList
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => statusFilter === 'active' ? u.isActive : !u.isActive)
    }
    if (userTypeFilter !== 'all' && activeTab === 'desktop') {
      filtered = filtered.filter(u => u.userType === userTypeFilter)
    }
    return filtered
  }

  const filteredDesktopUsers = filterUsers(desktopUsers)
  const filteredSuperAdminUsers = filterUsers(superAdminUsers)

  const stats = {
    totalDesktop: desktopUsers.length,
    activeDesktop: desktopUsers.filter(u => u.isActive).length,
    totalSuperAdmins: superAdminUsers.length,
    activeSuperAdmins: superAdminUsers.filter(u => u.isActive).length,
  }

  function handleExportUsers() {
    const usersToExport = activeTab === 'desktop' ? filteredDesktopUsers : filteredSuperAdminUsers
    if (usersToExport.length === 0) return

    const headers = ['Email', 'First Name', 'Last Name', 'User Type', 'Status', 'Email Verified', 'Last Login', 'Created At']
    const csvContent = [
      headers.join(','),
      ...usersToExport.map(user => [
        `"${user.email}"`,
        `"${user.firstName}"`,
        `"${user.lastName}"`,
        `"${user.userType}"`,
        user.isActive ? 'Active' : 'Inactive',
        user.emailVerified ? 'Yes' : 'No',
        user.lastLogin ? format(new Date(user.lastLogin), 'yyyy-MM-dd HH:mm:ss') : 'Never',
        format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeTab === 'desktop' ? 'desktop-users' : 'super-admins'}-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const renderUserTable = (userList: User[]) => (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : userList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : activeTab === 'desktop' ? 'Create your first desktop user' : 'Create your first super admin'}
            </p>
            <Button onClick={() => activeTab === 'desktop' ? setShowCreateDialog(true) : setShowCreateSuperAdminDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {activeTab === 'desktop' ? 'Create Desktop User' : 'Create Super Admin'}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[300px]">User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userList.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn(
                          "font-medium",
                          user.userType === 'super_admin' 
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                            : "bg-primary/10 text-primary"
                        )}>
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn('font-medium', getUserTypeColor(user.userType))}>
                      {user.userType === 'super_admin' ? 'Super Admin' : 
                       user.userType === 'admin' ? 'Admin' : 'Manager'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'h-2 w-2 rounded-full',
                        user.isActive ? 'bg-green-500' : 'bg-gray-300'
                      )} />
                      <span className={cn(
                        'text-sm',
                        user.isActive ? 'text-green-600' : 'text-muted-foreground'
                      )}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
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
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        {activeTab === 'desktop' && (
                          <DropdownMenuItem onClick={() => openManageRolesDialog(user)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Manage Roles
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage desktop users and web portal super admins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadUsers()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'desktop' | 'superadmin')}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="desktop" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Desktop Users
          </TabsTrigger>
          <TabsTrigger value="superadmin" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Super Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="desktop" className="space-y-6">
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                Desktop ERP Users
              </CardTitle>
              <CardDescription>
                These accounts are for the Desktop ERP application only. They cannot access this web portal.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UsersIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalDesktop}</p>
                    <p className="text-sm text-muted-foreground">Total Desktop Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeDesktop}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <UserX className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalDesktop - stats.activeDesktop}</p>
                    <p className="text-sm text-muted-foreground">Inactive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Desktop User
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowInviteDialog(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User Directly
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {renderUserTable(filteredDesktopUsers)}
        </TabsContent>

        <TabsContent value="superadmin" className="space-y-6">
          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Web Portal Super Admins
              </CardTitle>
              <CardDescription>
                These accounts have access to this web portal only. They can manage the entire system, view reports, and configure settings.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalSuperAdmins}</p>
                    <p className="text-sm text-muted-foreground">Total Super Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeSuperAdmins}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <UserX className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalSuperAdmins - stats.activeSuperAdmins}</p>
                    <p className="text-sm text-muted-foreground">Inactive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowCreateSuperAdminDialog(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Super Admin
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {renderUserTable(filteredSuperAdminUsers)}
        </TabsContent>
      </Tabs>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Invite Desktop User
            </DialogTitle>
            <DialogDescription>
              Send an invitation link for a new desktop ERP user
            </DialogDescription>
          </DialogHeader>

          {inviteResult ? (
            <div className="space-y-4">
              <Alert variant={inviteResult.success ? 'default' : 'destructive'}>
                {inviteResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{inviteResult.message}</AlertDescription>
              </Alert>

              {inviteResult.success && inviteResult.token && (
                <div className="space-y-2">
                  <Label>Invitation Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}/register?token=${inviteResult.token}`}
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyInviteLink(inviteResult.token!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link with the invited user. It expires in 7 days.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInviteResult(null)
                    setInviteEmail('')
                  }}
                >
                  Invite Another
                </Button>
                <Button onClick={() => {
                  setShowInviteDialog(false)
                  setInviteResult(null)
                  setInviteEmail('')
                }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="user@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteUserType">User Type</Label>
                <Select value={inviteUserType} onValueChange={setInviteUserType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admins have full desktop access, Managers have limited permissions
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
                  {isInviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              Create Desktop User
            </DialogTitle>
            <DialogDescription>
              Create a new account for the Desktop ERP application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="createFirstName">First Name</Label>
                <Input
                  id="createFirstName"
                  value={createFirstName}
                  onChange={(e) => setCreateFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createLastName">Last Name</Label>
                <Input
                  id="createLastName"
                  value={createLastName}
                  onChange={(e) => setCreateLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createEmail">Email Address</Label>
              <Input
                id="createEmail"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="john.doe@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="createPassword">Password</Label>
              <div className="relative">
                <Input
                  id="createPassword"
                  type={showCreatePassword ? 'text' : 'password'}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="createUserType">User Type</Label>
                <Select value={createUserType} onValueChange={setCreateUserType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="createStatus">Status</Label>
                <Select value={createStatus} onValueChange={(v) => setCreateStatus(v as 'active' | 'inactive')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <span className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        Active
                      </span>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <span className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-red-600" />
                        Inactive
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createRole">Assign Role (Optional)</Label>
              <Select 
                value={createRoleIds[0] || 'none'} 
                onValueChange={(v) => setCreateRoleIds(v && v !== 'none' ? [v] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No role</SelectItem>
                  {availableRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {role.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDesktopUser} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Desktop User
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateSuperAdminDialog} onOpenChange={setShowCreateSuperAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Create Super Admin
            </DialogTitle>
            <DialogDescription>
              Create a new account for the Web Portal with full administrative access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {saError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{saError}</AlertDescription>
              </Alert>
            )}

            <Alert className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/50">
              <Globe className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 dark:text-purple-200">
                This account will have access to the web portal only and can manage the entire system.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="saFirstName">First Name</Label>
                <Input
                  id="saFirstName"
                  value={saFirstName}
                  onChange={(e) => setSaFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saLastName">Last Name</Label>
                <Input
                  id="saLastName"
                  value={saLastName}
                  onChange={(e) => setSaLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saEmail">Email Address</Label>
              <Input
                id="saEmail"
                type="email"
                value={saEmail}
                onChange={(e) => setSaEmail(e.target.value)}
                placeholder="admin@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saPassword">Password</Label>
              <div className="relative">
                <Input
                  id="saPassword"
                  type={showSaPassword ? 'text' : 'password'}
                  value={saPassword}
                  onChange={(e) => setSaPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSaPassword(!showSaPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSaPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saStatus">Status</Label>
              <Select value={saStatus} onValueChange={(v) => setSaStatus(v as 'active' | 'inactive')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      Active
                    </span>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <span className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-red-600" />
                      Inactive
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateSuperAdminDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSuperAdmin} disabled={isCreatingSa} className="bg-purple-600 hover:bg-purple-700">
                {isCreatingSa && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Super Admin
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editUserType">User Type</Label>
                <Select value={editUserType} onValueChange={setEditUserType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedUser?.userType === 'super_admin' ? (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as 'active' | 'inactive')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <span className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        Active
                      </span>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <span className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-red-600" />
                        Inactive
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {resetPasswordError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resetPasswordError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={isResettingPassword} className="bg-orange-600 hover:bg-orange-700">
                {isResettingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reset Password
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showManageRolesDialog} onOpenChange={setShowManageRolesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Manage Roles
            </DialogTitle>
            <DialogDescription>
              Assign roles to {selectedUser?.firstName} {selectedUser?.lastName} for Desktop ERP access control
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {manageRolesError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{manageRolesError}</AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
              <Monitor className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Roles assigned here will be enforced in the Desktop ERP application.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Available Roles</Label>
              {availableRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No roles available. Create roles in the Roles & Permissions section.
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                  {availableRoles.map(role => (
                    <label
                      key={role.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="userRole"
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={() => {
                          setSelectedRoleIds([role.id])
                        }}
                        className="h-4 w-4 border-gray-300"
                      />
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {role.name}
                      </span>
                    </label>
                  ))}
                  <label
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer border-t mt-2 pt-3"
                  >
                    <input
                      type="radio"
                      name="userRole"
                      checked={selectedRoleIds.length === 0}
                      onChange={() => {
                        setSelectedRoleIds([])
                      }}
                      className="h-4 w-4 border-gray-300"
                    />
                    <span className="flex items-center gap-2 text-muted-foreground">
                      No role assigned
                    </span>
                  </label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowManageRolesDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRoles} disabled={isUpdatingRoles}>
                {isUpdatingRoles && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Roles
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

