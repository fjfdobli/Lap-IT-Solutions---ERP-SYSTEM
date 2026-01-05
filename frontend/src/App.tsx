import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'

import Login from './web/pages/Login'
import InviteAccept from './web/pages/InviteAccept'
import Users from './web/pages/Users'
import Roles from './web/pages/Roles'
import Devices from './web/pages/Devices'
import PosClients from './web/pages/PosClients.tsx'
import Audit from './web/pages/Audit'
import Chat from './web/pages/Chat'
import Health from './web/pages/Health'
import Integrations from './web/pages/Integrations'
import Settings from './web/pages/Settings'

function Dashboard() {
  return (
    <div>
      <h1>Super Admin Dashboard</h1>
      <p>Welcome — this is a mock dashboard (display-only).</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="top-nav">
        <nav>
          <Link to="/">Dashboard</Link> | <Link to="/users">Users</Link> | <Link to="/roles">Roles</Link> | <Link to="/pos-clients">POS</Link> | <Link to="/devices">Devices</Link> | <Link to="/audit">Audit</Link> | <Link to="/chat">Chat</Link> | <Link to="/health">Health</Link> | <Link to="/integrations">Integrations</Link> | <Link to="/settings">Settings</Link> | <Link to="/login">Login</Link> | <Link to="/invite">Accept Invite</Link>
        </nav>
      </div>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/invite" element={<InviteAccept />} />
          <Route path="/users" element={<Users />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/pos-clients" element={<PosClients />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/health" element={<Health />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
