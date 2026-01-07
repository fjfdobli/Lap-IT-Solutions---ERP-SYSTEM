import { useContext } from 'react'
import { DesktopAuthContext } from './desktop-auth-types'

export function useDesktopAuth() {
  const context = useContext(DesktopAuthContext)
  if (context === undefined) {
    throw new Error('useDesktopAuth must be used within a DesktopAuthProvider')
  }
  return context
}
