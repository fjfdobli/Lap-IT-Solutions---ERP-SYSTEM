import { useState } from 'react'

export default function DesktopLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    console.log('Desktop login attempt', { email })
    setError(null)
    alert('Mock desktop login successful (no backend)')
  }

  return (
    <div style={{padding:24}}>
      <h2>ERP Desktop Login</h2>
      {error && <div style={{color:'red'}}>{error}</div>}
      <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:12,maxWidth:360}}>
        <label>
          Email
          <input value={email} onChange={e=>setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </div>
  )
}
