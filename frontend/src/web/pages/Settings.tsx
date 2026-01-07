import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/use-auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Shield,
  Bell,
  Key,
  Mail,
  Smartphone,
  Monitor,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  Building,
  Calendar,
  Clock,
  Info,
  RefreshCw,
  LogOut,
  Trash2,
  Users,
  MonitorCog,
  Activity,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [notificationsSaved, setNotificationsSaved] = useState(false)
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [systemUpdates, setSystemUpdates] = useState(false)
  const [userActivityNotifications, setUserActivityNotifications] = useState(true)
  const [deviceNotifications, setDeviceNotifications] = useState(true)
  const [roleChangeNotifications, setRoleChangeNotifications] = useState(true)
  const [auditAlertNotifications, setAuditAlertNotifications] = useState(false)
  
  const [sessions, setSessions] = useState<Array<{
    id: string
    deviceInfo: string | null
    ipAddress: string | null
    lastActive: string
    createdAt: string
  }>>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isRevokingAll, setIsRevokingAll] = useState(false)

  useEffect(() => {
    loadProfile()
    loadNotificationPreferences()
    loadSessions()
  }, [])

  async function loadProfile() {
    try {
      const response = await api.getProfile()
      if (response.success && response.data) {
        setFirstName(response.data.firstName || '')
        setLastName(response.data.lastName || '')
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    }
  }

  async function loadNotificationPreferences() {
    try {
      const response = await api.getNotificationPreferences()
      if (response.success && response.data) {
        setEmailNotifications(response.data.emailNotifications)
        setPushNotifications(response.data.pushNotifications)
        setLoginAlerts(response.data.loginAlerts)
        setSecurityAlerts(response.data.securityAlerts)
        setSystemUpdates(response.data.systemUpdates)
        setUserActivityNotifications(response.data.userActivityNotifications)
        setDeviceNotifications(response.data.deviceNotifications)
        setRoleChangeNotifications(response.data.roleChangeNotifications)
        setAuditAlertNotifications(response.data.auditAlertNotifications)
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err)
    }
  }

  async function loadSessions() {
    setIsLoadingSessions(true)
    try {
      const response = await api.getSessions()
      if (response.success && response.data) {
        setSessions(response.data.sessions)
      }
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  async function handleSaveProfile() {
    setIsSavingProfile(true)
    setProfileError(null)
    
    try {
      const response = await api.updateProfile({ firstName, lastName })
      
      if (response.success) {
        setProfileSaved(true)
        setTimeout(() => setProfileSaved(false), 3000)
      } else {
        setProfileError(response.error || 'Failed to update profile')
      }
    } catch (err) {
      setProfileError('An error occurred while saving')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleUpdatePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setIsSavingPassword(true)
    setPasswordError(null)
    
    try {
      const response = await api.changePassword({ currentPassword, newPassword })
      
      if (response.success) {
        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordSuccess(false), 3000)
      } else {
        setPasswordError(response.error || 'Failed to update password')
      }
    } catch (err) {
      setPasswordError('An error occurred while updating password')
    } finally {
      setIsSavingPassword(false)
    }
  }

  async function handleSaveNotifications() {
    setIsSavingNotifications(true)
    
    try {
      const response = await api.updateNotificationPreferences({
        emailNotifications,
        pushNotifications,
        loginAlerts,
        securityAlerts,
        systemUpdates,
        userActivityNotifications,
        deviceNotifications,
        roleChangeNotifications,
        auditAlertNotifications,
      })
      
      if (response.success) {
        setNotificationsSaved(true)
        setTimeout(() => setNotificationsSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save notification preferences:', err)
    } finally {
      setIsSavingNotifications(false)
    }
  }

  async function handleRevokeAllSessions() {
    setIsRevokingAll(true)
    try {
      const response = await api.revokeAllOtherSessions()
      if (response.success) {
        await loadSessions()
      }
    } catch (err) {
      console.error('Failed to revoke sessions:', err)
    } finally {
      setIsRevokingAll(false)
    }
  }

  const getUserTypeLabel = (type?: string) => {
    switch (type) {
      case 'super_admin':
        return 'Super Administrator'
      case 'admin':
        return 'Administrator'
      case 'manager':
        return 'Manager'
      default:
        return 'User'
    }
  }

  const getUserTypeColor = (type?: string) => {
    switch (type) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'manager':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your personal account information and details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge className={cn('mt-1', getUserTypeColor(user?.userType))}>
                    {getUserTypeLabel(user?.userType)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {profileSaved && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Profile updated successfully
                  </AlertDescription>
                </Alert>
              )}

              {profileError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="pl-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email address cannot be changed. Contact your administrator for assistance.
                </p>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <p className="font-medium">Lap IT Solutions Inc.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Account Created</p>
                    <p className="font-medium">{format(new Date(), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="font-medium">{format(new Date(), 'PPpp')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Account Status</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <p className="font-medium text-green-600">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              
              {passwordSuccess && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Password updated successfully
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Password Requirements:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={cn("h-3 w-3", newPassword.length >= 8 ? "text-green-500" : "text-muted-foreground")} />
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={cn("h-3 w-3", /[A-Z]/.test(newPassword) ? "text-green-500" : "text-muted-foreground")} />
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={cn("h-3 w-3", /[0-9]/.test(newPassword) ? "text-green-500" : "text-muted-foreground")} />
                    One number
                  </li>
                </ul>
              </div>

              <Button onClick={handleUpdatePassword} disabled={isSavingPassword}>
                {isSavingPassword ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage your active login sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Monitor className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">Windows • Chrome</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active Now</Badge>
                  </div>
                </div>
              ) : (
                sessions.map((session, index) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Monitor className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{index === 0 ? 'Current Session' : 'Session'}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.deviceInfo || 'Unknown Device'}
                            {session.ipAddress && ` • ${session.ipAddress}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={index === 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {index === 0 ? 'Active Now' : format(new Date(session.lastActive), 'MMM d, HH:mm')}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive"
                onClick={handleRevokeAllSessions}
                disabled={isRevokingAll}
              >
                {isRevokingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Sign Out All Other Sessions
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" disabled>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Contact your administrator to delete your account.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Communication Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationsSaved && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Notification preferences saved
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                  </div>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser push notifications (real-time)</p>
                  </div>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Real-Time Activity Notifications
              </CardTitle>
              <CardDescription>
                Get notified when actions happen across the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">User Activity</p>
                    <p className="text-sm text-muted-foreground">New users, profile updates, status changes</p>
                  </div>
                </div>
                <Switch checked={userActivityNotifications} onCheckedChange={setUserActivityNotifications} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MonitorCog className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Device Changes</p>
                    <p className="text-sm text-muted-foreground">New devices, status changes, disconnections</p>
                  </div>
                </div>
                <Switch checked={deviceNotifications} onCheckedChange={setDeviceNotifications} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Role & Permission Changes</p>
                    <p className="text-sm text-muted-foreground">Role assignments, permission updates</p>
                  </div>
                </div>
                <Switch checked={roleChangeNotifications} onCheckedChange={setRoleChangeNotifications} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Audit Alerts</p>
                    <p className="text-sm text-muted-foreground">Critical actions and audit log events</p>
                  </div>
                </div>
                <Switch checked={auditAlertNotifications} onCheckedChange={setAuditAlertNotifications} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Notifications
              </CardTitle>
              <CardDescription>
                Stay informed about security-related events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Login Alerts</p>
                    <p className="text-sm text-muted-foreground">Notify when someone logs into your account</p>
                  </div>
                </div>
                <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Security Alerts</p>
                    <p className="text-sm text-muted-foreground">Security events and suspicious activity</p>
                  </div>
                </div>
                <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">System Updates</p>
                    <p className="text-sm text-muted-foreground">New features and scheduled maintenance</p>
                  </div>
                </div>
                <Switch checked={systemUpdates} onCheckedChange={setSystemUpdates} />
              </div>

              <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
                {isSavingNotifications ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save All Preferences
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Environment</span>
                  <Badge variant="secondary">Development</Badge>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Build</span>
                  <span className="font-mono text-sm">2024.01.15</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">API Version</span>
                  <span className="font-mono">v1</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
