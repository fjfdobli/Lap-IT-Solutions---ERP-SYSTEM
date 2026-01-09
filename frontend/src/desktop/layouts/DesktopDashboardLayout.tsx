import { useState, useEffect, useCallback, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDesktopAuth } from '../lib/use-desktop-auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  Search,
  Building2,
  Tag,
  Truck,
  ArrowRightLeft,
  Calculator,
  Receipt,
  RotateCcw,
  Activity,
  Settings,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

// Navigation structure with collapsible groups
const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & analytics' },
    ]
  },
  {
    label: 'Products & Inventory',
    items: [
      { to: '/products', icon: Tag, label: 'Products', description: 'Product master list' },
      { to: '/inventory', icon: Package, label: 'Inventory', description: 'Stock levels' },
      { to: '/item-movement', icon: Activity, label: 'Item Movement', description: 'Stock audit trail' },
    ]
  },
  {
    label: 'Purchasing',
    items: [
      { to: '/suppliers', icon: Building2, label: 'Suppliers', description: 'Vendor management' },
      { to: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders', description: 'Manage POs' },
      { to: '/receiving', icon: Truck, label: 'Receiving', description: 'Goods receipt' },
    ]
  },
  {
    label: 'Warehouse',
    items: [
      { to: '/transfers', icon: ArrowRightLeft, label: 'Transfers', description: 'Stock transfers' },
      { to: '/physical-count', icon: Calculator, label: 'Physical Count', description: 'Inventory count' },
    ]
  },
  {
    label: 'Sales & POS',
    items: [
      { to: '/customers', icon: Users, label: 'Customers', description: 'Customer list' },
      { to: '/pos-transactions', icon: Receipt, label: 'POS Transactions', description: 'Sales records' },
      { to: '/voids-returns', icon: RotateCcw, label: 'Voids & Returns', description: 'Voided/returned sales' },
    ]
  },
  {
    label: 'Setup',
    items: [
      { to: '/classifications', icon: Layers, label: 'Classifications', description: 'Categories & classes' },
      { to: '/settings-ref', icon: Settings, label: 'Reference Data', description: 'System settings' },
    ]
  },
]

// Keep for backward compatibility
const mainNavItems = navGroups.flatMap(g => g.items)

const systemNavItems = [
  { 
    to: '/reports', 
    icon: FileText, 
    label: 'Reports',
    description: 'Generate reports'
  },
]

export default function DesktopDashboardLayout() {
  const { user, logout } = useDesktopAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    message: string
    type: string
    isRead: boolean
    createdAt: string
  }>>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.getNotifications({ limit: 10 })
      if (response.success && response.data) {
        setNotifications(response.data.notifications)
        setUnreadCount(response.data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    pollingIntervalRef.current = setInterval(loadNotifications, 30000)
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [loadNotifications])

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id)
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600'
      case 'warning': return 'bg-yellow-100 text-yellow-600'
      case 'error': return 'bg-red-100 text-red-600'
      default: return 'bg-blue-100 text-blue-600'
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U'

  const NavItem = ({ item, collapsed }: { item: typeof mainNavItems[0], collapsed: boolean }) => {
    const isActive = location.pathname === item.to || 
      (item.to !== '/' && location.pathname.startsWith(item.to))
    
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'sidebar-nav-item group',
                isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-current')} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                </>
              )}
            </NavLink>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="flex flex-col">
              <span className="font-medium text-white">{item.label}</span>
              <span className="text-xs text-gray-300">{item.description}</span>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  }

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex flex-col h-full bg-sidebar">
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-sidebar-border',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <img 
          src="/images/lap_it_no-bg.png" 
          alt="Lap IT Solutions Inc." 
          className="h-10 w-10 object-contain"
        />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-foreground text-sm">Lap IT Solutions</span>
            <span className="text-xs text-sidebar-foreground/60">ERP Desktop</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-3">
        {navGroups.map((group, groupIdx) => (
          <div key={group.label} className={cn("space-y-1", groupIdx > 0 && "mt-4")}>
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}

        <div className="mt-4 space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              System
            </p>
          )}
          {systemNavItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>
      </div>

      <div className={cn(
        'border-t border-sidebar-border p-3',
        collapsed && 'flex justify-center'
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'flex items-center gap-3 w-full rounded-lg p-2 transition-colors',
              'hover:bg-sidebar-accent text-sidebar-foreground',
              collapsed && 'justify-center'
            )}>
              <Avatar className="h-9 w-9 border-2 border-sidebar-primary/20">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56" 
            align={collapsed ? 'center' : 'end'} 
            side={collapsed ? 'right' : 'top'}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
                <Badge variant="secondary" className="w-fit mt-1 text-xs capitalize">
                  {user?.userType}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 hidden lg:block',
        sidebarCollapsed ? 'w-[70px]' : 'w-64'
      )}>
        <SidebarContent collapsed={sidebarCollapsed} />
        
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-md',
            'flex items-center justify-center hover:bg-accent transition-colors'
          )}
        >
          <ChevronRight className={cn(
            'h-4 w-4 transition-transform',
            sidebarCollapsed ? '' : 'rotate-180'
          )} />
        </button>
      </aside>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar transition-transform duration-300 lg:hidden',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent collapsed={false} />
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute right-3 top-4 p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </aside>

      <div className={cn(
        'transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-[70px]' : 'lg:ml-64'
      )}>
        <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products, orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full h-9 pl-10 pr-4 rounded-lg border bg-muted/50',
                    'text-sm placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background',
                    'transition-colors'
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between py-3">
                    <span className="text-base font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">{unreadCount} new</Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div 
                          key={notification.id} 
                          className={cn(
                            "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0",
                            !notification.isRead && "bg-primary/5"
                          )}
                          onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                        >
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                            getNotificationIcon(notification.type)
                          )}>
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium text-sm",
                              notification.isRead && "text-muted-foreground"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {notification.message}
                            </p>
                            <span className="text-[11px] text-muted-foreground/70">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>

        <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground">
          <p>© 2026 Lap IT Solutions Inc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
