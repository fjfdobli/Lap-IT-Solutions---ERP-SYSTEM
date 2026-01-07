import { HashRouter, Routes, Route } from 'react-router-dom'
import { DesktopAuthProvider } from './lib/desktop-auth-context'
import { DesktopProtectedRoute, DesktopPublicRoute } from './components/DesktopProtectedRoute'
import DesktopDashboardLayout from './layouts/DesktopDashboardLayout'
import DesktopLogin from './pages/Login'
import DesktopDashboard from './pages/Dashboard'
import PurchaseOrders from './pages/PurchaseOrders'
import PurchaseOrderDetail from './pages/PurchaseOrderDetail'
import PurchaseOrderForm from './pages/PurchaseOrderForm'
import POSDataViewer from './pages/POSDataViewer'
import Inventory from './pages/Inventory'
import Suppliers from './pages/Suppliers'
import Products from './pages/Products'

export default function DesktopApp() {
  return (
    <DesktopAuthProvider>
      <HashRouter>
        <Routes>
          <Route element={<DesktopPublicRoute />}>
            <Route path="/login" element={<DesktopLogin />} />
          </Route>

          <Route element={<DesktopProtectedRoute />}>
            <Route element={<DesktopDashboardLayout />}>
              <Route path="/" element={<DesktopDashboard />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/purchase-orders/new" element={<PurchaseOrderForm />} />
              <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
              <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderForm />} />
              <Route path="/pos-data" element={<POSDataViewer />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<Products />} />
              
              {/* Future Routes */}
              {/* <Route path="/sales" element={<Sales />} /> */}
              {/* <Route path="/reports" element={<Reports />} /> */}
              {/* <Route path="/customers" element={<Customers />} /> */}
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </DesktopAuthProvider>
  )
}
