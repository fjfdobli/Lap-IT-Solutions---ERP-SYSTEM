import { useEffect, useState, ReactNode } from 'react'
import { api } from '@/lib/api'
import { AuthContext, User } from './auth-types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('access_token')

      if (!storedUser || !token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const response = await api.getMe()
      if (response.success && response.data) {
        setUser({
          id: response.data.id,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          userType: response.data.userType,
        })
      } else {
        localStorage.removeItem('user')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await api.login(email, password, 'web', rememberMe)
    if (response.success && response.data) {
      setUser(response.data.user)
      return { success: true }
    }
    return { success: false, error: response.error || 'Login failed' }
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
