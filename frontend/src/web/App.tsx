import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth-context'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Roles from './pages/Roles'
import Devices from './pages/Devices'
import Health from './pages/Health'
import Settings from './pages/Settings'
import Audit from './pages/Audit'
import Help from './pages/Help'
import InviteAccept from './pages/InviteAccept'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<InviteAccept />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/health" element={<Health />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/help" element={<Help />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
