import { useState } from 'react'
import { api } from '@/lib/api'

export default function DesktopLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Desktop login uses 'desktop' platform
      const response = await api.login(email, password, 'desktop')
      if (response.success && response.data) {
        // Store user info for desktop app
        localStorage.setItem('desktop_user', JSON.stringify(response.data.user))
        alert(`Welcome, ${response.data.user.firstName}!`)
        // TODO: Navigate to desktop dashboard
      } else {
        setError(response.error || 'Login failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{padding:24}}>
      <h2>ERP Desktop Login</h2>
      {error && <div style={{color:'red', marginBottom: 12}}>{error}</div>}
      <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:12,maxWidth:360}}>
        <label>
          Email
          <input 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            disabled={isLoading}
            style={{width:'100%', padding:8}}
          />
        </label>
        <label>
          Password
          <input 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            disabled={isLoading}
            style={{width:'100%', padding:8}}
          />
        </label>
        <button type="submit" disabled={isLoading} style={{padding:'8px 16px'}}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p style={{marginTop:16, color:'#666', fontSize:14}}>
        Note: Only Admin and Manager accounts can access the desktop app.
      </p>
    </div>
  )
}
