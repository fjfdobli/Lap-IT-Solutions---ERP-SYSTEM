import { createContext } from 'react'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
