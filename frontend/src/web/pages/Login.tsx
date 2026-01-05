import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

type FormValues = {
  email: string
  password: string
  remember?: boolean
}

export default function Login() {
  const { register, handleSubmit } = useForm<FormValues>({ mode: 'onSubmit' })
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(data: FormValues) {
    const validEmail = 'superadmin@example.com'
    const validPassword = 'SuperAdmin123!'

    if (data.email !== validEmail || data.password !== validPassword) {
      setError('Invalid credentials for mock Super Admin')
      return
    }

    const session = { user: { email: data.email, role: 'superadmin' }, createdAt: Date.now() }
    try {
      localStorage.setItem('mock_session', JSON.stringify(session))
    } catch (e) {
      // ignore storage errors during dev
    }

    navigate('/')
  }

  return (
    <div className="auth-page">
      <h2>Sign in (Super Admin)</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
        <label>
          Email
          <input {...register('email', { required: true, pattern: /@/ })} defaultValue={"superadmin@example.com"} />
        </label>
        <label>
          Password
          <input type="password" {...register('password', { required: true, minLength: 8 })} defaultValue={"SuperAdmin123!"} />
        </label>
        <label className="checkbox">
          <input type="checkbox" {...register('remember')} /> Remember me
        </label>
        <div className="actions">
          <button type="submit">Sign in</button>
        </div>
      </form>
      <p>
        Use the mock Super Admin account to explore the web UI: <strong>superadmin@example.com</strong>
      </p>
    </div>
  )
}
