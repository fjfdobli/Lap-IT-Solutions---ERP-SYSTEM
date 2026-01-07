import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDesktopAuth } from '../lib/use-desktop-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Mail, 
  Lock, 
  Loader2, 
  ShieldCheck, 
  Monitor, 
  Package,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldX
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DesktopLogin() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading: authLoading } = useDesktopAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [deviceDisabledReason, setDeviceDisabledReason] = useState<string | null>(null)

  useEffect(() => {
    // Check if device was disabled/removed by admin
    const reason = localStorage.getItem('device_disabled_reason')
    if (reason) {
      setDeviceDisabledReason(reason)
      // Clear it after reading so it doesn't persist forever
      localStorage.removeItem('device_disabled_reason')
    }
  }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)

    try {
      const result = await login(formData.email, formData.password, formData.rememberMe)
      
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error || 'Invalid credentials')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    { 
      icon: Package, 
      title: 'Inventory Management', 
      description: 'Real-time stock tracking and management' 
    },
    { 
      icon: ShieldCheck, 
      title: 'Secure Access', 
      description: 'Role-based authentication system' 
    },
    { 
      icon: Monitor, 
      title: 'Desktop Optimized', 
      description: 'Built for desktop productivity' 
    },
  ]

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-[45%] bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-10">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <img 
                src="/images/lap_it_no-bg.png" 
                alt="Lap IT Solutions" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h2 className="text-xl font-bold text-sidebar-foreground">Lap IT Solutions Inc.</h2>
                <p className="text-sm text-sidebar-foreground/60">Enterprise Resource Planning</p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
                ERP Desktop
                <br />
                <span className="text-sidebar-primary">Application</span>
              </h1>
              <p className="text-sidebar-foreground/70 max-w-md text-lg">
                Manage your inventory, purchase orders, and sales operations from a streamlined desktop interface.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-sidebar-accent/50 backdrop-blur border border-sidebar-border"
              >
                <div className="p-3 rounded-lg bg-sidebar-primary/20">
                  <feature.icon className="h-6 w-6 text-sidebar-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sidebar-foreground">{feature.title}</h3>
                  <p className="text-sm text-sidebar-foreground/60">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-sm text-sidebar-foreground/40">
            © 2026 Lap IT Solutions Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center lg:hidden">
            <img 
              src="/images/lap_it_no-bg.png" 
              alt="Lap IT Solutions" 
              className="h-16 w-16 object-contain mb-2"
            />
            <h2 className="text-xl font-bold">Lap IT Solutions</h2>
            <p className="text-sm text-muted-foreground">ERP Desktop</p>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in with your credentials to access the ERP system
            </p>
          </div>

          {/* Device Disabled Alert */}
          {deviceDisabledReason && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <ShieldX className="h-5 w-5" />
              <AlertTitle className="font-semibold">
                {deviceDisabledReason === 'removed' ? 'Device Removed' : 'Device Disabled'}
              </AlertTitle>
              <AlertDescription className="mt-1">
                {deviceDisabledReason === 'removed' 
                  ? 'This device has been removed by the Super Admin. Please contact your administrator if you believe this is an error.'
                  : 'This device has been disabled by the Super Admin. Please contact your administrator to re-enable access.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-shake">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={cn(
                      "pl-10 h-11",
                      error && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={cn(
                      "pl-10 pr-10 h-11",
                      error && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                  disabled={isLoading}
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Remember me
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="rounded-lg bg-muted/50 p-4 border">
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium text-foreground">Admin & Manager access only.</span>
              <br />
              Contact your administrator if you need access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
