import { createContext } from 'react'

interface DesktopUser {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: 'admin' | 'manager'
}

export interface DesktopAuthContextType {
  user: DesktopUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const DesktopAuthContext = createContext<DesktopAuthContextType | undefined>(undefined)
