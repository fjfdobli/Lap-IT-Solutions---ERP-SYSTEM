import { HashRouter, Routes, Route } from 'react-router-dom'
import { DesktopAuthProvider } from './lib/desktop-auth-context'
import { POSProvider } from './lib/pos-context'
import { DesktopProtectedRoute, DesktopPublicRoute } from './components/DesktopProtectedRoute'
import DesktopDashboardLayout from './layouts/DesktopDashboardLayout'
import DesktopLogin from './pages/Login'
import DesktopDashboard from './pages/Dashboard'
import POSOverview from './pages/POSOverview'
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
import RestaurantTables from './pages/RestaurantTables'
import Expenses from './pages/Expenses'
import AuditTrail from './pages/AuditTrail'

export default function DesktopApp() {
  return (
    <DesktopAuthProvider>
      <POSProvider>
        <HashRouter>
          <Routes>
            <Route element={<DesktopPublicRoute />}>
              <Route path="/login" element={<DesktopLogin />} />
            </Route>

            <Route element={<DesktopProtectedRoute />}>
              <Route element={<DesktopDashboardLayout />}>
                <Route path="/pos-overview" element={<POSOverview />} />
                <Route path="/" element={<DesktopDashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/new" element={<Products />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/item-movement" element={<ItemMovement />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/purchase-orders/new" element={<PurchaseOrderForm />} />
                <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
                <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderForm />} />
                <Route path="/receiving" element={<Receiving />} />
                <Route path="/transfers" element={<Transfers />} />
                <Route path="/physical-count" element={<PhysicalCount />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/pos-transactions" element={<POSTransactions />} />
                <Route path="/voids-returns" element={<VoidsReturns />} />
                <Route path="/classifications" element={<Classifications />} />
                <Route path="/settings-ref" element={<SettingsRef />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/tables" element={<RestaurantTables />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/audit-trail" element={<AuditTrail />} />
                <Route path="/pos-data" element={<POSDataViewer />} />
              </Route>
            </Route>
          </Routes>
        </HashRouter>
      </POSProvider>
    </DesktopAuthProvider>
  )
}
