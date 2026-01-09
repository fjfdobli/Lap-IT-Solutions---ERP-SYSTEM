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
import ItemMovement from './pages/ItemMovement'
import Receiving from './pages/Receiving'
import Transfers from './pages/Transfers'
import PhysicalCount from './pages/PhysicalCount'
import Customers from './pages/Customers'
import POSTransactions from './pages/POSTransactions'
import VoidsReturns from './pages/VoidsReturns'
import Classifications from './pages/Classifications'
import SettingsRef from './pages/SettingsRef'
import Reports from './pages/Reports'

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
              {/* Overview */}
              <Route path="/" element={<DesktopDashboard />} />
              
              {/* Products & Inventory */}
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<Products />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/item-movement" element={<ItemMovement />} />
              
              {/* Purchasing */}
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/purchase-orders/new" element={<PurchaseOrderForm />} />
              <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
              <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderForm />} />
              <Route path="/receiving" element={<Receiving />} />
              
              {/* Warehouse */}
              <Route path="/transfers" element={<Transfers />} />
              <Route path="/physical-count" element={<PhysicalCount />} />
              
              {/* Sales & POS */}
              <Route path="/customers" element={<Customers />} />
              <Route path="/pos-transactions" element={<POSTransactions />} />
              <Route path="/voids-returns" element={<VoidsReturns />} />
              
              {/* Setup */}
              <Route path="/classifications" element={<Classifications />} />
              <Route path="/settings-ref" element={<SettingsRef />} />
              
              {/* Reports */}
              <Route path="/reports" element={<Reports />} />
              
              {/* Legacy */}
              <Route path="/pos-data" element={<POSDataViewer />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </DesktopAuthProvider>
  )
}
