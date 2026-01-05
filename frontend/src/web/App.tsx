import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login.tsx'
import InviteAccept from './pages/InviteAccept.tsx'
import Users from './pages/Users.tsx'
import Roles from './pages/Roles.tsx'
import Devices from './pages/Devices.tsx'
import Audit from './pages/Audit.tsx'
import Chat from './pages/Chat.tsx'
import Health from './pages/Health.tsx'
import Integrations from './pages/Integrations.tsx'
import Settings from './pages/Settings.tsx'

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
          <Link to="/">Dashboard</Link> | <Link to="/users">Users</Link> | <Link to="/roles">Roles</Link> | <Link to="/devices">Devices</Link> | <Link to="/audit">Audit</Link> | <Link to="/chat">Chat</Link> | <Link to="/health">Health</Link> | <Link to="/integrations">Integrations</Link> | <Link to="/settings">Settings</Link> | <Link to="/login">Login</Link> | <Link to="/invite">Accept Invite</Link>
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
