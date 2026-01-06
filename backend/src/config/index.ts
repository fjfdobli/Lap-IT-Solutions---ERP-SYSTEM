import dotenv from 'dotenv'
dotenv.config()

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
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
}
