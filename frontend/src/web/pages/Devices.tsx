import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Monitor,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
  Power,
  PowerOff,
  HardDrive,
  Settings,
  Download,
  Activity,
  Signal,
  MapPin,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Device {
  id: string
  deviceName: string
  deviceId: string
  status: 'online' | 'offline' | 'disabled'
  lastSeen: string | null
  ipAddress: string | null
  osVersion: string | null
  appVersion: string | null
  createdAt: string
  updatedAt: string
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const loadDevices = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.getDevices()
      if (response.success && response.data) {
        setDevices(response.data.devices)
      }
    } catch (error) {
      console.error('Failed to load devices:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDevices()
    const interval = setInterval(loadDevices, 30000)
    return () => clearInterval(interval)
  }, [loadDevices])

  async function handleToggleDeviceStatus(device: Device) {
    try {
      const newStatus = device.status === 'disabled' ? 'offline' : 'disabled'
      await api.updateDevice(device.id, { status: newStatus })
      loadDevices()
    } catch (error) {
      console.error('Failed to update device:', error)
    }
  }

  async function handleDeleteDevice() {
    if (!selectedDevice) return
    setIsDeleting(true)

    try {
      await api.deleteDevice(selectedDevice.id)
      setShowDeleteDialog(false)
      setSelectedDevice(null)
      loadDevices()
    } catch (error) {
      console.error('Failed to delete device:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.deviceId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'online' && device.status === 'online') ||
                         (statusFilter === 'offline' && device.status === 'offline') ||
                         (statusFilter === 'disabled' && device.status === 'disabled')
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    disabled: devices.filter(d => d.status === 'disabled').length,
  }

  function handleExportDevices() {
    if (filteredDevices.length === 0) return

    const headers = ['Device Name', 'Device ID', 'Status', 'IP Address', 'OS Version', 'App Version', 'Last Seen', 'Created At']
    const csvContent = [
      headers.join(','),
      ...filteredDevices.map(device => [
        `"${device.deviceName}"`,
        `"${device.deviceId}"`,
        device.status,
        device.ipAddress || 'N/A',
        device.osVersion || 'N/A',
        device.appVersion || 'N/A',
        device.lastSeen ? format(new Date(device.lastSeen), 'yyyy-MM-dd HH:mm:ss') : 'Never',
        format(new Date(device.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `devices-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getDeviceIcon = () => {
    return <Monitor className="h-5 w-5" />
  }

  const getStatusBadge = (device: Device) => {
    if (device.status === 'disabled') {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <PowerOff className="h-3 w-3 mr-1" />
          Disabled
        </Badge>
      )
    }
    if (device.status === 'online') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          <Wifi className="h-3 w-3 mr-1" />
          Online
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Device Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage connected desktop ERP clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadDevices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportDevices}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Signal className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.online}</p>
                <p className="text-sm text-muted-foreground">Online Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <WifiOff className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.offline}</p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <PowerOff className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.disabled}</p>
                <p className="text-sm text-muted-foreground">Disabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by device name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
                <TabsList>
                  <TabsTrigger value="grid" className="px-3">
                    <HardDrive className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="table" className="px-3">
                    <Activity className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDevices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No devices found' : 'No Devices Connected'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Desktop ERP clients will appear here once they are registered and connected to the system.'
              }
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((device) => (
            <Card 
              key={device.id} 
              className={cn(
                "group transition-all hover:shadow-md",
                device.status === 'online' && "border-l-4 border-l-green-500",
                device.status === 'offline' && "border-l-4 border-l-amber-500",
                device.status === 'disabled' && "border-l-4 border-l-gray-300 opacity-75"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      device.status === 'online' ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                    )}>
                      {getDeviceIcon()}
                    </div>
                    <div>
                      <CardTitle className="text-base">{device.deviceName}</CardTitle>
                      <CardDescription className="text-xs font-mono">
                        {device.deviceId.substring(0, 8)}...
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
                      <DropdownMenuItem onClick={() => {
                        setSelectedDevice(device)
                        setShowDetailDialog(true)
                      }}>
                        <Info className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleDeviceStatus(device)}>
                        {device.status !== 'disabled' ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            Enable
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelectedDevice(device)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Device
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  {getStatusBadge(device)}
                  {device.status === 'online' && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {device.lastSeen 
                        ? `Last seen ${formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}`
                        : 'Never connected'
                      }
                    </span>
                  </div>
                  {device.ipAddress && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="font-mono text-xs">{device.ipAddress}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={device.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center",
                          device.status === 'online' ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                        )}>
                          {getDeviceIcon()}
                        </div>
                        <div>
                          <p className="font-medium">{device.deviceName}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {device.deviceId.substring(0, 12)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(device)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.lastSeen 
                        ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {device.ipAddress || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(device.createdAt), 'MMM d, yyyy')}
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedDevice(device)
                            setShowDetailDialog(true)
                          }}>
                            <Info className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleDeviceStatus(device)}>
                            {device.status !== 'disabled' ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedDevice(device)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Device Registration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Device Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Automatic Registration</h4>
            <p className="text-sm text-muted-foreground">
              Desktop clients automatically register when they first connect to the ERP system.
              Each device receives a unique identifier for tracking and management.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Device Management</h4>
            <p className="text-sm text-muted-foreground">
              Disable devices to prevent access, or remove them entirely. 
              Online status is updated in real-time as clients connect and disconnect.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Device Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Device Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this device
            </DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center",
                  selectedDevice.status === 'online' 
                    ? "bg-green-500/10 text-green-600" 
                    : "bg-background text-muted-foreground"
                )}>
                  {getDeviceIcon()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedDevice.deviceName}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{selectedDevice.deviceId}</p>
                </div>
                {getStatusBadge(selectedDevice)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    {selectedDevice.status !== 'disabled' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {selectedDevice.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Connection</p>
                  <div className="flex items-center gap-2">
                    {selectedDevice.status === 'online' ? (
                      <Wifi className="h-4 w-4 text-green-600" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium">
                      {selectedDevice.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Last Seen</p>
                  <p className="text-sm font-medium">
                    {selectedDevice.lastSeen 
                      ? format(new Date(selectedDevice.lastSeen), 'PPpp')
                      : 'Never'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedDevice.createdAt), 'PPpp')}
                  </p>
                </div>
                {selectedDevice.ipAddress && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="text-sm font-medium font-mono">{selectedDevice.ipAddress}</p>
                  </div>
                )}
                {selectedDevice.osVersion && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Operating System</p>
                    <p className="text-sm font-medium">{selectedDevice.osVersion}</p>
                  </div>
                )}
                {selectedDevice.appVersion && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">App Version</p>
                    <p className="text-sm font-medium">{selectedDevice.appVersion}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            <Button variant={selectedDevice?.status !== 'disabled' ? 'secondary' : 'default'} onClick={() => {
              if (selectedDevice) handleToggleDeviceStatus(selectedDevice)
              setShowDetailDialog(false)
            }}>
              {selectedDevice?.status !== 'disabled' ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Disable Device
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Enable Device
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remove Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{selectedDevice?.deviceName}"? 
              The device will need to re-register to connect again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDevice} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
