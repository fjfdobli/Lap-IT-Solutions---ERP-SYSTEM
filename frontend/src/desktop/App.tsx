import React from 'react'
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import DesktopLogin from './pages/Login'

function DesktopHome() {
  return (
    <div style={{padding:24}}>
      <h1>ERP Desktop</h1>
      <p>Welcome to the desktop app (mock).</p>
    </div>
  )
}

export default function DesktopApp() {
  return (
    <HashRouter>
      <div className="top-nav" style={{padding:8}}>
        <nav>
          <Link to="/">Home</Link> | <Link to="/login">Login</Link>
        </nav>
      </div>
      <main>
        <Routes>
          <Route path="/" element={<DesktopHome />} />
          <Route path="/login" element={<DesktopLogin />} />
        </Routes>
      </main>
    </HashRouter>
  )
}
