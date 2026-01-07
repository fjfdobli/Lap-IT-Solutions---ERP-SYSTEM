import dotenv from 'dotenv'
dotenv.config()

const parseCorsOrigin = () => {
  const envOrigin = process.env.CORS_ORIGIN
  if (!envOrigin) return '*'
  if (envOrigin.includes(',')) {
    return envOrigin.split(',').map(o => o.trim())
  }
  return envOrigin
}

export const config = {
  port: Number(process.env.PORT || 3000),
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  
  bcrypt: {
    saltRounds: 12,
  },
  
  cors: {
    origin: parseCorsOrigin(),
    credentials: true,
  },
}
