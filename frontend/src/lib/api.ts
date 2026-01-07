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
        userId: string | null
        userName: string | null
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
      userId: string | null
      userName: string | null
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

  // Device registration and heartbeat (for desktop app)
  async registerDevice(deviceName: string, deviceKey: string): Promise<{
    success: boolean
    data?: {
      id: string
      deviceName: string
      deviceKey: string
      isNew: boolean
    }
    code?: string
    error?: string
  }> {
    // Use direct fetch to avoid token refresh on 403 (device disabled is not auth issue)
    const token = this.getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/devices/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ deviceName, deviceKey }),
      })
      return response.json()
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  async deviceHeartbeat(deviceKey: string): Promise<{
    success: boolean
    data?: {
      deviceId: string
      deviceName: string
      isActive: boolean
    }
    code?: string
    error?: string
  }> {
    return this.request<{
      deviceId: string
      deviceName: string
      isActive: boolean
    }>('/devices/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ deviceKey }),
    }) as Promise<{
      success: boolean
      data?: {
        deviceId: string
        deviceName: string
        isActive: boolean
      }
      code?: string
      error?: string
    }>
  }

  async getDeviceStatus(deviceKey: string) {
    return this.request<{
      deviceId: string
      deviceName: string
      isActive: boolean
      lastSeen: string | null
    }>(`/devices/status/${deviceKey}`)
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

  async getProfile() {
    return this.request<{
      id: string
      email: string
      firstName: string
      lastName: string
      userType: 'super_admin' | 'admin' | 'manager'
      avatarUrl: string | null
      phone: string | null
      isSuperAdmin: boolean
      isActive: boolean
      emailVerified: boolean
      lastLogin: string | null
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

  async getDashboardStats() {
    return this.request<{
      purchaseOrders: {
        pending: number
        todayCount: number
        todayTotal: number
      }
      inventory: {
        totalProducts: number
        lowStockCount: number
        outOfStockCount: number
        totalValue: number
      }
      recentActivity: Array<{
        id: string
        type: string
        message: string
        timestamp: string
      }>
      recentPurchaseOrders: Array<{
        id: string
        po_number: string
        status: string
        total_amount: number
        created_at: string
        supplier_name: string
      }>
      lowStockProducts: Array<{
        id: string
        sku: string
        name: string
        reorder_level: number
        quantity_on_hand: number
      }>
    }>('/dashboard/stats')
  }

  async getSuppliers(params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive))
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    return this.request<{
      suppliers: Array<{
        id: string
        name: string
        contact_person: string | null
        email: string | null
        phone: string | null
        viber: string | null
        address: string | null
        notes: string | null
        is_active: boolean
        created_at: string
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/suppliers?${query}`)
  }

  async getSupplier(id: string) {
    return this.request<{
      id: string
      name: string
      contact_person: string | null
      email: string | null
      phone: string | null
      viber: string | null
      address: string | null
      notes: string | null
      is_active: boolean
    }>(`/suppliers/${id}`)
  }

  async createSupplier(data: {
    name: string
    contactPerson?: string
    email?: string
    phone?: string
    viber?: string
    address?: string
    notes?: string
  }) {
    return this.request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSupplier(id: string, data: {
    name?: string
    contactPerson?: string
    email?: string
    phone?: string
    viber?: string
    address?: string
    notes?: string
    isActive?: boolean
  }) {
    return this.request(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSupplier(id: string) {
    return this.request(`/suppliers/${id}`, { method: 'DELETE' })
  }

  async getCategories() {
    return this.request<Array<{
      id: string
      name: string
      description: string | null
      is_active: boolean
    }>>('/products/categories')
  }

  async getProducts(params?: { search?: string; categoryId?: string; isActive?: boolean; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.categoryId) query.set('categoryId', params.categoryId)
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive))
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    return this.request<{
      products: Array<{
        id: string
        sku: string
        name: string
        description: string | null
        category_id: string | null
        category_name: string | null
        unit: string
        cost_price: number
        selling_price: number
        reorder_level: number
        quantity_on_hand: number | null
        quantity_reserved: number | null
        quantity_on_order: number | null
        is_active: boolean
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/products?${query}`)
  }

  async getProduct(id: string) {
    return this.request<{
      id: string
      sku: string
      name: string
      description: string | null
      category_id: string | null
      category_name: string | null
      unit: string
      cost_price: number
      selling_price: number
      reorder_level: number
      quantity_on_hand: number | null
      is_active: boolean
    }>(`/products/${id}`)
  }

  async createProduct(data: {
    sku: string
    name: string
    description?: string
    categoryId?: string
    unit?: string
    costPrice?: number
    sellingPrice?: number
    reorderLevel?: number
    initialQuantity?: number
  }) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProduct(id: string, data: {
    sku?: string
    name?: string
    description?: string
    categoryId?: string
    unit?: string
    costPrice?: number
    sellingPrice?: number
    reorderLevel?: number
    isActive?: boolean
  }) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, { method: 'DELETE' })
  }

  async getInventory(params?: { search?: string; lowStock?: boolean; categoryId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.lowStock) query.set('lowStock', 'true')
    if (params?.categoryId) query.set('categoryId', params.categoryId)
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    return this.request<{
      inventory: Array<{
        id: string
        product_id: string
        sku: string
        product_name: string
        unit: string
        cost_price: number
        selling_price: number
        reorder_level: number
        quantity_on_hand: number
        quantity_reserved: number
        quantity_on_order: number
        category_name: string | null
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/inventory?${query}`)
  }

  async getInventoryStats() {
    return this.request<{
      totalProducts: number
      lowStockItems: number
      outOfStock: number
      totalValue: number
    }>('/inventory/stats')
  }

  async getInventoryItem(productId: string) {
    return this.request<{
      id: string
      product_id: string
      sku: string
      product_name: string
      quantity_on_hand: number
      quantity_reserved: number
      quantity_on_order: number
      transactions: Array<{
        id: string
        transaction_type: string
        quantity: number
        quantity_before: number
        quantity_after: number
        notes: string | null
        first_name: string
        last_name: string
        created_at: string
      }>
    }>(`/inventory/${productId}`)
  }

  async adjustInventory(productId: string, data: { adjustment: number; notes?: string }) {
    return this.request(`/inventory/${productId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateInventoryCount(productId: string, data: { actualCount: number; notes?: string }) {
    return this.request(`/inventory/${productId}/count`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getInventoryTransactions(productId: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    return this.request<{
      transactions: Array<{
        id: string
        product_id: string
        transaction_type: string
        quantity: number
        quantity_before: number
        quantity_after: number
        reference_type: string | null
        reference_id: string | null
        notes: string | null
        created_by: string
        first_name: string
        last_name: string
        created_at: string
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/inventory/${productId}/transactions${query.toString() ? `?${query.toString()}` : ''}`)
  }

  async getPurchaseOrders(params?: { 
    status?: string
    supplierId?: string
    search?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number 
  }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.supplierId) query.set('supplierId', params.supplierId)
    if (params?.search) query.set('search', params.search)
    if (params?.startDate) query.set('startDate', params.startDate)
    if (params?.endDate) query.set('endDate', params.endDate)
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    return this.request<{
      purchaseOrders: Array<{
        id: string
        po_number: string
        supplier_id: string
        supplier_name: string
        supplier_email: string | null
        status: string
        order_date: string
        expected_date: string | null
        total_amount: number
        item_count: number
        created_at: string
        creator_first_name: string
        creator_last_name: string
        approver_first_name: string | null
        approver_last_name: string | null
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/purchase-orders?${query}`)
  }

  async getPurchaseOrderStats() {
    return this.request<{
      pendingApproval: number
      approved: number
      sent: number
      partial: number
      onHold: number
      thisMonth: { count: number; total: number }
    }>('/purchase-orders/stats')
  }

  async getPurchaseOrder(id: string) {
    return this.request<{
      id: string
      po_number: string
      supplier_id: string
      supplier_name: string
      supplier_email: string | null
      supplier_phone: string | null
      supplier_viber: string | null
      supplier_address: string | null
      status: string
      order_date: string
      expected_date: string | null
      received_date: string | null
      subtotal: number
      tax_amount: number
      total_amount: number
      notes: string | null
      delivery_method: string
      sent_via: string | null
      sent_at: string | null
      approved_by: string | null
      approved_at: string | null
      approval_notes: string | null
      delivery_receipt_filed: boolean
      items: Array<{
        id: string
        product_id: string
        sku: string
        product_name: string
        unit: string
        quantity_ordered: number
        quantity_received: number
        unit_cost: number
        total_cost: number
        notes: string | null
      }>
    }>(`/purchase-orders/${id}`)
  }

  async createPurchaseOrder(data: {
    supplierId: string
    orderDate: string
    expectedDate?: string
    notes?: string
    deliveryMethod?: 'delivery' | 'pickup'
    items: Array<{
      productId: string
      quantity: number
      unitCost: number
      notes?: string
    }>
  }) {
    return this.request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePurchaseOrder(id: string, data: {
    supplierId?: string
    orderDate?: string
    expectedDate?: string
    notes?: string
    deliveryMethod?: 'delivery' | 'pickup'
    items?: Array<{
      productId: string
      quantity: number
      unitCost: number
      notes?: string
    }>
  }) {
    return this.request(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async submitPurchaseOrder(id: string) {
    return this.request(`/purchase-orders/${id}/submit`, { method: 'POST' })
  }

  async approvePurchaseOrder(id: string, approvalNotes?: string) {
    return this.request(`/purchase-orders/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvalNotes }),
    })
  }

  async sendPurchaseOrder(id: string, sentVia: 'email' | 'viber' | 'message' | 'other') {
    return this.request(`/purchase-orders/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ sentVia }),
    })
  }

  async receivePurchaseOrderItems(id: string, data: {
    items: Array<{ itemId: string; quantityReceived: number }>
    receiptNumber?: string
    discrepancyNotes?: string
  }) {
    return this.request(`/purchase-orders/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async holdPurchaseOrder(id: string, notes?: string) {
    return this.request(`/purchase-orders/${id}/hold`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    })
  }

  async cancelPurchaseOrder(id: string, notes?: string) {
    return this.request(`/purchase-orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    })
  }

  async filePurchaseOrderReceipt(id: string) {
    return this.request(`/purchase-orders/${id}/file`, { method: 'POST' })
  }

  async getPosPoHeaders(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    const query = searchParams.toString()
    return this.request<{
      records: Array<{
        id: number
        xCode: string
        PoDate: string | null
        POdateTime: string
        DRDate: string | null
        Xname: string
        SupplierID: string
        SupplierName: string
        SupplierCode: string
        Information: string
        Terms: string
        Remarks: string
        POStatus: string
        Qty_Total: number
        Amnt_Subcost: number
        Amnt_Shipping: number
        Amnt_TRDiscount: number
        Amnt_ItemDiscount: number
        Amnt_GrandCost: number
        DateCreate: string
        CreateBy: string
        ForceClose: string
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/pos-data/purchase-orders/headers${query ? `?${query}` : ''}`)
  }

  async getPosPoItems(params?: { xCode?: string; search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.xCode) searchParams.append('xCode', params.xCode)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    const query = searchParams.toString()
    return this.request<{
      records: Array<{
        id: number
        xCode: string
        PoDate: string | null
        Xname: string
        POStatus: string
        SupplierID: string
        SupplierName: string
        SupplierCode: string
        ItemName: string
        ItemCode: string
        Qty_Com: number
        Qty_Order: number
        Qty_Free: number
        Amnt_Cost: number
        Amnt_totalCost: number
        Amnt_Percentage: number
        Amnt_Value: number
        Grand_Total: number
        ForceClose: string
        UOM: string
        EQ: number
        TotQty: number
        ItemRemarks: string
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/pos-data/purchase-orders/items${query ? `?${query}` : ''}`)
  }

  async getPosPhyHeaders(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    const query = searchParams.toString()
    return this.request<{
      records: Array<{
        id: number
        xCode: string
        Xname: string
        DatesTart: string | null
        DateEnd: string | null
        CheckBy: string
        Approve: string
        Remarks: string
        ExQty: number
        ExAmnt: number
        OQty: number
        OAmnt: number
        UQty: number
        UAmnt: number
        PerOQty: string
        PerUQty: string
        PerOAmnt: string
        PerUAmnt: string
        POStatus: string
        DateCreate: string
        CreateBy: string
        title: string
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/pos-data/physical-inventory/headers${query ? `?${query}` : ''}`)
  }

  async getPosPhyItems(params?: { xCode?: string; search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.xCode) searchParams.append('xCode', params.xCode)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    const query = searchParams.toString()
    return this.request<{
      records: Array<{
        id: number
        PhyDate: string | null
        Xname: string
        ItemName: string
        ItemCode: string
        Class: string
        Dept: string
        Location: string
        SysQty: number
        AdjQty: number
        AdjPer: number
        Cost: number
        title: string
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/pos-data/physical-inventory/items${query ? `?${query}` : ''}`)
  }

  async getPosSuppliers(params?: { search?: string; active?: boolean; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.active !== undefined) searchParams.append('active', params.active.toString())
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    const query = searchParams.toString()
    return this.request<{
      suppliers: Array<{
        id: number
        code: string
        name: string
        term: string
        contact: string
        phone: string
        address: string
        account_number: string
        fax: string
        email: string
        notes: string
        created_at: string
        created_by: string
        updated_at: string
        updated_by: string
        active: string
        tin: string
        input_vat: number
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/pos-data/suppliers${query ? `?${query}` : ''}`)
  }

  async getPosStats() {
    return this.request<{
      purchaseOrders: {
        total_pos: number
        open_pos: number
        closed_pos: number
        total_amount: number
      }
      physicalInventory: {
        total_counts: number
        open_counts: number
        closed_counts: number
      }
      suppliers: {
        total_suppliers: number
        active_suppliers: number
      }
    }>('/pos-data/stats')
  }
}

export const api = new ApiService(API_BASE_URL)
