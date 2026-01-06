import { Outlet } from "react-router-dom"
import { AppSidebar } from "./app-sidebar"

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}