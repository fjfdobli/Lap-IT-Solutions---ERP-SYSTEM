import { useState, useEffect, useRef, ReactNode } from 'react'
import { api } from '@/lib/api'
import { DesktopAuthContext } from './desktop-auth-types'

interface DesktopUser {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: 'admin' | 'manager'
}

// Generate a unique device key based on system info
function getDeviceKey(): string {
  const stored = localStorage.getItem('device_key')
  if (stored) return stored
  
  // Generate a unique key based on browser fingerprint
  const userAgent = navigator.userAgent
  const screenRes = `${screen.width}x${screen.height}`
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const lang = navigator.language
  const hash = btoa(`${userAgent}-${screenRes}-${timezone}-${lang}-${Date.now()}`).slice(0, 32)
  const deviceKey = `device_${hash}`
  localStorage.setItem('device_key', deviceKey)
  return deviceKey
}

function getDeviceName(): string {
  const stored = localStorage.getItem('device_name')
  if (stored) return stored
  
  // Try to get a meaningful device name
  const platform = navigator.platform || 'Unknown'
  const userAgent = navigator.userAgent
  let os = 'Unknown OS'
  
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  
  const deviceName = `${os} Desktop - ${platform}`
  localStorage.setItem('device_name', deviceName)
  return deviceName
}

export function DesktopAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DesktopUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  // Handle device disabled - force logout and store reason
  const handleDeviceDisabled = () => {
    stopHeartbeat()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('desktop_user')
    // Store reason for login page to display
    localStorage.setItem('device_disabled_reason', 'disabled')
    setUser(null)
  }

  // Handle device removed - force logout and clear device key
  const handleDeviceRemoved = () => {
    stopHeartbeat()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('desktop_user')
    localStorage.removeItem('device_key')
    localStorage.removeItem('device_name')
    // Store reason for login page to display
    localStorage.setItem('device_disabled_reason', 'removed')
    setUser(null)
  }

  // Check device status immediately
  const checkDeviceStatus = async () => {
    const deviceKey = getDeviceKey()
    try {
      const response = await api.deviceHeartbeat(deviceKey)
      if (!response.success) {
        if (response.code === 'DEVICE_DISABLED') {
          handleDeviceDisabled()
          return false
        }
        if (response.code === 'DEVICE_NOT_FOUND') {
          handleDeviceRemoved()
          return false
        }
      }
    } catch (error) {
      console.error('Device status check failed:', error)
    }
    return true
  }

  // Send a single heartbeat check - only if authenticated
  const sendHeartbeat = async () => {
    // Don't send heartbeat if not authenticated
    const token = localStorage.getItem('access_token')
    if (!token) {
      return true // Not logged in, no need to check
    }
    
    const deviceKey = getDeviceKey()
    try {
      const response = await api.deviceHeartbeat(deviceKey)
      if (!response.success) {
        if (response.code === 'DEVICE_DISABLED') {
          handleDeviceDisabled()
          return false
        }
        if (response.code === 'DEVICE_NOT_FOUND') {
          handleDeviceRemoved()
          return false
        }
      }
    } catch (error: any) {
      // Ignore 403 errors (session expired, already logged out)
      if (error?.message?.includes('403') || error?.message?.includes('Session expired')) {
        return true
      }
      console.error('Heartbeat failed:', error)
      if (error?.code === 'DEVICE_DISABLED' || error?.message?.includes('disabled')) {
        handleDeviceDisabled()
        return false
      }
    }
    return true
  }

  // Start heartbeat to keep device online - check every 15 seconds for faster response
  const startHeartbeat = () => {
    stopHeartbeat() // Clean up any existing heartbeat first
    
    // Send heartbeat every 15 seconds for faster detection of disabled devices
    heartbeatRef.current = setInterval(sendHeartbeat, 15 * 1000) // 15 seconds
    
    // Also check when window gains focus (user switches back to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && localStorage.getItem('access_token')) {
        sendHeartbeat()
      }
    }
    
    const handleFocus = () => {
      if (localStorage.getItem('access_token')) {
        sendHeartbeat()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    // Store cleanup functions
    ;(heartbeatRef as any).cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      if ((heartbeatRef as any).cleanup) {
        (heartbeatRef as any).cleanup()
      }
      heartbeatRef.current = null
    }
  }

  useEffect(() => {
    checkAuth()
    
    return () => {
      stopHeartbeat()
    }
  }, [])

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      const accessToken = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('desktop_user')
      
      if (accessToken && storedUser) {
        const response = await api.getProfile()
        if (response.success && response.data) {
          if (response.data.userType === 'admin' || response.data.userType === 'manager') {
            setUser({
              id: response.data.id,
              email: response.data.email,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              userType: response.data.userType as 'admin' | 'manager',
            })
            
            // Register device and check if it's still active
            try {
              const deviceKey = getDeviceKey()
              const deviceName = getDeviceName()
              await api.registerDevice(deviceName, deviceKey)
              
              // Check device status before starting heartbeat
              const isActive = await checkDeviceStatus()
              if (isActive) {
                startHeartbeat()
              }
            } catch (err) {
              console.error('Device registration failed:', err)
            }
          } else {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('desktop_user')
            setUser(null)
          }
        } else {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('desktop_user')
          setUser(null)
        }
      } else {
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
    try {
      const response = await api.login(email, password, 'desktop', rememberMe)
      if (response.success && response.data) {
        const userData = response.data.user
        if (userData.userType === 'admin' || userData.userType === 'manager') {
          // Register device first and check if it's disabled
          const deviceKey = getDeviceKey()
          const deviceName = getDeviceName()
          
          try {
            const registerResponse = await api.registerDevice(deviceName, deviceKey)
            
            // Check if device registration failed due to being disabled
            if (!registerResponse.success) {
              if ((registerResponse as any).code === 'DEVICE_DISABLED') {
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                return { 
                  success: false, 
                  error: 'This device has been disabled by the Super Admin. Please contact your administrator to re-enable access.' 
                }
              }
            }
          } catch (err: any) {
            console.error('Device registration failed:', err)
            // Check if error is due to device being disabled
            if (err?.code === 'DEVICE_DISABLED' || err?.message?.includes('disabled')) {
              localStorage.removeItem('access_token')
              localStorage.removeItem('refresh_token')
              return { 
                success: false, 
                error: 'This device has been disabled by the Super Admin. Please contact your administrator to re-enable access.' 
              }
            }
          }
          
          const desktopUser: DesktopUser = {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            userType: userData.userType as 'admin' | 'manager',
          }
          localStorage.setItem('desktop_user', JSON.stringify(desktopUser))
          setUser(desktopUser)
          
          // Start heartbeat for active device
          startHeartbeat()
          
          return { success: true }
        } else {
          return { success: false, error: 'Only Admin and Manager accounts can access the desktop app.' }
        }
      }
      return { success: false, error: response.error || 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const logout = async () => {
    try {
      stopHeartbeat()
      await api.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('desktop_user')
      setUser(null)
    }
  }

  return (
    <DesktopAuthContext.Provider
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
    </DesktopAuthContext.Provider>
  )
}
