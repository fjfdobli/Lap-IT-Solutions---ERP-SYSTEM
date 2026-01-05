import { useForm } from 'react-hook-form'
import { useSearchParams, useNavigate } from 'react-router-dom'

type FormValues = {
  password: string
  confirmPassword: string
}

export default function InviteAccept() {
  const { register, handleSubmit } = useForm<FormValues>({ mode: 'onSubmit' })
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const inviteToken = searchParams.get('token') || ''

  function onSubmit(data: FormValues) {
    if (data.password !== data.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    console.log('Accept invite', { inviteToken, password: data.password })
    navigate('/login')
  }

  return (
    <div className="auth-page">
      <h2>Set your password</h2>
      <p>Invite token: {inviteToken || 'none'}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
        <label>
          Password
          <input type="password" {...register('password', { required: true, minLength: 8 })} />
        </label>
        <label>
          Confirm password
          <input type="password" {...register('confirmPassword', { required: true })} />
        </label>
        <div className="actions">
          <button type="submit">Set password</button>
        </div>
      </form>
    </div>
  )
}
