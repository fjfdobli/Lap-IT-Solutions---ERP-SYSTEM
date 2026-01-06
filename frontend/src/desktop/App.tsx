import { HashRouter, Routes, Route } from 'react-router-dom'
import DesktopLogin from './pages/Login'
import Dashboard from './pages/Dashboard'
import PurchaseOrder from './pages/PurchaseOrder'
import Inventory from './pages/Inventory'
import { DashboardLayout } from '@/components/desktop/dashboard-layout'

export default function DesktopApp() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<DesktopLogin />} />
        <Route path="/desktop" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="purchase-order" element={<PurchaseOrder />} />
          <Route path="inventory" element={<Inventory />} />
          <Route index element={<Dashboard />} />
        </Route>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
