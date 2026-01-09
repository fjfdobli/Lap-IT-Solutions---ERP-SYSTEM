import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { AuthRequest, JWTPayload, UserType } from '../types'

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  // console.log('[AUTH] Request to:', req.path)
  // console.log('[AUTH] Authorization header:', authHeader ? 'Present' : 'Missing')
  const token = authHeader && authHeader.split(' ')[1] 

  if (!token) {
    // console.log('[AUTH] No token extracted from header')
    res.status(401).json({ success: false, error: 'Access token required' })
    return
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JWTPayload
    req.user = decoded
    next()
  } catch (err) {
    res.status(403).json({ success: false, error: 'Invalid or expired token' })
    return
  }
}

export function requireUserType(...allowedTypes: UserType[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }

    if (!allowedTypes.includes(req.user.userType)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' })
      return
    }

    next()
  }
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireUserType('super_admin')(req, res, next)
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, { 
    expiresIn: config.jwt.accessExpiresIn
  } as jwt.SignOptions)
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, { 
    expiresIn: config.jwt.refreshExpiresIn
  } as jwt.SignOptions)
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as JWTPayload
  } catch {
    return null
  }
}
