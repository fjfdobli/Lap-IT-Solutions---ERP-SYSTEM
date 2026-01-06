import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Package, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import lapLogo from "../../../images/lap_it_no-bg.png"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/desktop/dashboard",
  },
  {
    title: "Purchase Order",
    icon: ShoppingCart,
    href: "/desktop/purchase-order",
  },
  {
    title: "Inventory",
    icon: Package,
    href: "/desktop/inventory",
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <img
          src={lapLogo}
          alt="LAP IT Solutions"
          className="h-10 w-auto"
        />
        <div className="flex flex-col">
          <span className="text-lg font-bold text-[#1E3A5F] leading-tight">
            LAP I.T. Solutions
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            Enterprise Resource Planning
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}