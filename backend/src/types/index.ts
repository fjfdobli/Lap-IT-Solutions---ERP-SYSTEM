import { Request } from 'express'

export type UserType = 'super_admin' | 'admin' | 'manager'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  user_type: UserType
  is_active: boolean
  email_verified: boolean
  last_login: Date | null
  created_at: Date
  updated_at: Date
  created_by: string | null
}

export interface UserWithPassword extends User {
  password_hash: string
}

export interface Role {
  id: string
  name: string
  description: string | null
  is_system_role: boolean
  created_at: Date
  updated_at: Date
  created_by: string | null
}

export interface Permission {
  id: string
  module: string
  action: string
  description: string | null
  created_at: Date
}

export interface Session {
  id: string
  user_id: string
  refresh_token: string
  device_info: string | null
  ip_address: string | null
  expires_at: Date
  created_at: Date
}

export interface Invitation {
  id: string
  email: string
  user_type: UserType
  token: string
  invited_by: string
  expires_at: Date
  accepted_at: Date | null
  created_at: Date
}

export interface JWTPayload {
  id: string  // alias for userId for convenience
  userId: string
  email: string
  userType: UserType
}

export interface AuthRequest extends Request {
  user?: JWTPayload
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
