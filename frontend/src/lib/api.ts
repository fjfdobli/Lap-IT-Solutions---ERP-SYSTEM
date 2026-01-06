const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  private clearTokens() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      if (response.status === 403) {
        const refreshed = await this.refreshAccessToken()
        if (refreshed) {
          const newToken = this.getToken()
          if (newToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`
          }
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
          })
          return retryResponse.json()
        } else {
          this.clearTokens()
          window.location.href = '/login'
          return { success: false, error: 'Session expired' }
        }
      }

      return response.json()
    } catch (error) {
      console.error('API request failed:', error)
      return { success: false, error: 'Network error' }
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()
      if (data.success && data.data?.accessToken) {
        localStorage.setItem('access_token', data.data.accessToken)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async login(email: string, password: string, platform: 'web' | 'desktop' = 'web', rememberMe = false) {
    const response = await this.request<{
      user: {
        id: string
        email: string
        firstName: string
        lastName: string
        userType: string
      }
      accessToken: string
      refreshToken: string
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, platform, rememberMe }),
    })

    if (response.success && response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response
  }

  async logout() {
    const refreshToken = this.getRefreshToken()
    await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
    this.clearTokens()
  }

  async getMe() {
    return this.request<{
      id: string
      email: string
      firstName: string
      lastName: string
      userType: string
      isActive: boolean
      emailVerified: boolean
      lastLogin: string | null
      createdAt: string
    }>('/auth/me')
  }

  async validateInvite(token: string) {
    return this.request<{
      email: string
      userType: string
      invitedBy: string
      expiresAt: string
    }>(`/auth/invite/${token}`)
  }

  async register(data: {
    token: string
    firstName: string
    lastName: string
    password: string
  }) {
    const response = await this.request<{
      user: {
        id: string
        email: string
        firstName: string
        lastName: string
        userType: string
      }
      accessToken: string
      refreshToken: string
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.success && response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response
  }

  async invite(email: string, userType: string) {
    return this.request<{
      inviteId: string
      email: string
      userType: string
      token: string
      expiresAt: string
      registrationUrl: string
    }>('/auth/invite', {
      method: 'POST',
      body: JSON.stringify({ email, userType }),
    })
  }

  async getUsers(params?: {
    userType?: string
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.userType) searchParams.set('userType', params.userType)
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    return this.request<{
      users: Array<{
        id: string
        email: string
        firstName: string
        lastName: string
        userType: string
        isActive: boolean
        emailVerified: boolean
        lastLogin: string | null
        createdAt: string
        createdBy: string | null
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/users${query ? `?${query}` : ''}`)
  }

  async getUser(id: string) {
    return this.request<{
      id: string
      email: string
      firstName: string
      lastName: string
      userType: string
      isActive: boolean
      emailVerified: boolean
      lastLogin: string | null
      createdAt: string
      updatedAt: string
      createdBy: string | null
      roles: Array<{
        id: string
        name: string
        description: string | null
      }>
    }>(`/users/${id}`)
  }

  async createUser(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    userType: string
    roleIds?: string[]
    isActive?: boolean
  }) {
    return this.request<{
      id: string
      email: string
      firstName: string
      lastName: string
      userType: string
    }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUser(
    id: string,
    data: {
      firstName?: string
      lastName?: string
      userType?: string
      isActive?: boolean
      roleIds?: string[]
    }
  ) {
    return this.request('/users/' + id, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' })
  }

  async resetUserPassword(id: string, newPassword: string) {
    return this.request(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    })
  }

  async getRoles() {
    return this.request<
      Array<{
        id: string
        name: string
        description: string | null
        isSystemRole: boolean
        userCount: number
        createdAt: string
        createdBy: string | null
      }>
    >('/roles')
  }

  async getRole(id: string) {
    return this.request<{
      id: string
      name: string
      description: string | null
      isSystemRole: boolean
      createdAt: string
      updatedAt: string
      createdBy: string | null
      permissions: Array<{
        id: string
        module: string
        action: string
        description: string | null
      }>
      users: Array<{
        id: string
        email: string
        fullName: string
      }>
    }>(`/roles/${id}`)
  }

  async createRole(data: {
    name: string
    description?: string
    permissionIds?: string[]
  }) {
    return this.request<{
      id: string
      name: string
      description: string | null
    }>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateRole(
    id: string,
    data: {
      name?: string
      description?: string
      permissionIds?: string[]
    }
  ) {
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteRole(id: string) {
    return this.request(`/roles/${id}`, { method: 'DELETE' })
  }

  async getPermissions() {
    return this.request<{
      permissions: Array<{
        id: string
        module: string
        action: string
        description: string | null
      }>
      grouped: Record<string, Array<{
        id: string
        action: string
        description: string | null
      }>>
      modules: string[]
    }>('/permissions')
  }

  async getDevices(params?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    return this.request<{
      devices: Array<{
        id: string
        deviceName: string
        deviceId: string
        status: 'online' | 'offline' | 'disabled'
        lastSeen: string | null
        ipAddress: string | null
        osVersion: string | null
        appVersion: string | null
        createdAt: string
        updatedAt: string
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/devices${query ? `?${query}` : ''}`)
  }

  async getDevice(id: string) {
    return this.request<{
      id: string
      deviceName: string
      deviceId: string
      status: 'online' | 'offline' | 'disabled'
      lastSeen: string | null
      ipAddress: string | null
      osVersion: string | null
      appVersion: string | null
      createdAt: string
      updatedAt: string
    }>(`/devices/${id}`)
  }

  async updateDevice(
    id: string,
    data: {
      deviceName?: string
      status?: 'online' | 'offline' | 'disabled'
    }
  ) {
    return this.request(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDevice(id: string) {
    return this.request(`/devices/${id}`, { method: 'DELETE' })
  }

  async getHealth() {
    return this.request<{
      status: string
      timestamp: string
    }>('/health')
  }

  async getDbHealth() {
    return this.request<{
      status: string
      databases: Array<{
        name: string
        connected: boolean
        error: string | null
      }>
      timestamp: string
    }>('/health/db')
  }

  // Audit Logs
  async getAuditLogs(params?: {
    action?: string
    entityType?: string
    userId?: string
    startDate?: string
    endDate?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.action) searchParams.set('action', params.action)
    if (params?.entityType) searchParams.set('entityType', params.entityType)
    if (params?.userId) searchParams.set('userId', params.userId)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    return this.request<{
      logs: Array<{
        id: string
        userId: string
        userName: string
        userEmail: string | null
        action: string
        entityType: string
        entityId: string | null
        details: Record<string, unknown> | null
        ipAddress: string | null
        userAgent: string | null
        timestamp: string
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/audit${query ? `?${query}` : ''}`)
  }

  async getAuditStats() {
    return this.request<{
      totalLogs: number
      actionStats: Array<{ action: string; count: number }>
      entityStats: Array<{ entityType: string; count: number }>
      recentActivity: Array<{ date: string; count: number }>
    }>('/audit/stats')
  }

  async exportAuditLogs(params?: {
    startDate?: string
    endDate?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    const query = searchParams.toString()
    
    const token = this.getToken()
    const response = await fetch(`${this.baseUrl}/audit/export/csv${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.blob()
  }

  // Notifications
  async getNotifications(params?: {
    isRead?: boolean
    type?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.isRead !== undefined) searchParams.set('isRead', String(params.isRead))
    if (params?.type) searchParams.set('type', params.type)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    return this.request<{
      notifications: Array<{
        id: string
        userId: string
        title: string
        message: string
        type: 'info' | 'warning' | 'error' | 'success'
        source: 'web' | 'desktop' | 'system'
        isRead: boolean
        createdAt: string
      }>
      unreadCount: number
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/notifications${query ? `?${query}` : ''}`)
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' })
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' })
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' })
  }

  async clearReadNotifications() {
    return this.request('/notifications/clear/read', { method: 'DELETE' })
  }

  // Settings
  async getProfile() {
    return this.request<{
      id: string
      email: string
      firstName: string
      lastName: string
      avatarUrl: string | null
      phone: string | null
      isSuperAdmin: boolean
      isActive: boolean
      createdAt: string
      role: { id: string; name: string } | null
    }>('/settings/profile')
  }

  async updateProfile(data: {
    firstName?: string
    lastName?: string
    phone?: string
    avatarUrl?: string
  }) {
    return this.request('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }) {
    return this.request('/settings/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getNotificationPreferences() {
    return this.request<{
      emailNotifications: boolean
      pushNotifications: boolean
      loginAlerts: boolean
      securityAlerts: boolean
      systemUpdates: boolean
      userActivityNotifications: boolean
      deviceNotifications: boolean
      roleChangeNotifications: boolean
      auditAlertNotifications: boolean
    }>('/settings/notifications')
  }

  async updateNotificationPreferences(data: {
    emailNotifications?: boolean
    pushNotifications?: boolean
    loginAlerts?: boolean
    securityAlerts?: boolean
    systemUpdates?: boolean
    userActivityNotifications?: boolean
    deviceNotifications?: boolean
    roleChangeNotifications?: boolean
    auditAlertNotifications?: boolean
  }) {
    return this.request('/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getSessions() {
    return this.request<{
      sessions: Array<{
        id: string
        deviceInfo: string | null
        ipAddress: string | null
        lastActive: string
        createdAt: string
      }>
    }>('/settings/sessions')
  }

  async revokeSession(id: string) {
    return this.request(`/settings/sessions/${id}`, { method: 'DELETE' })
  }

  async revokeAllOtherSessions() {
    return this.request('/settings/sessions', { method: 'DELETE' })
  }
}

export const api = new ApiService(API_BASE_URL)
