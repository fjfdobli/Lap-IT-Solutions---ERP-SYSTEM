import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth-context'
import { ProtectedRoute, PublicRoute } from '../components/ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'
import Login from './Login'
import Dashboard from './Dashboard'
import Users from './Users'
import Roles from './Roles'
import Devices from './Devices'
import Health from './Health'
import Settings from './Settings'
import Audit from './Audit'
import Help from './Help'
import InviteAccept from './InviteAccept'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>        
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
