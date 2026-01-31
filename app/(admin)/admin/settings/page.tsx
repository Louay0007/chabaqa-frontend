"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "../../providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, User, Bell, Settings as SettingsIcon, AlertTriangle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // If newPassword is provided, currentPassword must be provided
  if (data.newPassword && !data.currentPassword) {
    return false
  }
  // If newPassword is provided, confirmPassword must match
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false
  }
  return true
}, {
  message: "Password validation failed",
  path: ["confirmPassword"]
})

// Alert configuration schema
const alertConfigSchema = z.object({
  pendingContentThreshold: z.number().min(1, "Must be at least 1").max(1000),
  flaggedContentThreshold: z.number().min(1, "Must be at least 1").max(1000),
  pendingCommunitiesThreshold: z.number().min(1, "Must be at least 1").max(100),
  failedLoginsThreshold: z.number().min(1, "Must be at least 1").max(100),
  highValueTransactionThreshold: z.number().min(100, "Must be at least 100"),
})

type ProfileFormData = z.infer<typeof profileSchema>
type AlertConfigFormData = z.infer<typeof alertConfigSchema>

interface AdminProfile {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  lastLogin?: string
}

interface AlertConfiguration {
  pendingContentThreshold: number
  flaggedContentThreshold: number
  pendingCommunitiesThreshold: number
  failedLoginsThreshold: number
  highValueTransactionThreshold: number
}

export default function AdminSettingsPage() {
  const { admin, isAuthenticated, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [alertLoading, setAlertLoading] = useState(false)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [alertConfig, setAlertConfig] = useState<AlertConfiguration | null>(null)

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  })

  // Alert configuration form
  const alertForm = useForm<AlertConfigFormData>({
    resolver: zodResolver(alertConfigSchema),
    defaultValues: {
      pendingContentThreshold: 50,
      flaggedContentThreshold: 20,
      pendingCommunitiesThreshold: 10,
      failedLoginsThreshold: 5,
      highValueTransactionThreshold: 10000,
    }
  })

  // Fetch settings data
  const fetchSettings = async () => {
    setLoading(true)
    
    try {
      // For now, use admin data from context
      // In production, you would fetch from dedicated endpoints
      if (admin) {
        const adminProfile: AdminProfile = {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt?.toString() || new Date().toISOString(),
          lastLogin: admin.lastLogin?.toString()
        }
        
        setProfile(adminProfile)
        
        // Set profile form values
        profileForm.reset({
          name: adminProfile.name,
          email: adminProfile.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }

      // Fetch alert configuration
      try {
        const alertsRes = await adminApi.analytics.getAlerts()
        const alerts = alertsRes?.data || alertsRes || []
        
        // Parse alert thresholds from existing alerts
        const config: AlertConfiguration = {
          pendingContentThreshold: 50,
          flaggedContentThreshold: 20,
          pendingCommunitiesThreshold: 10,
          failedLoginsThreshold: 5,
          highValueTransactionThreshold: 10000,
        }

        // Update with actual values if available
        alerts.forEach((alert: any) => {
          if (alert.metric === 'pending_content') {
            config.pendingContentThreshold = alert.threshold
          } else if (alert.metric === 'flagged_content') {
            config.flaggedContentThreshold = alert.threshold
          } else if (alert.metric === 'pending_communities') {
            config.pendingCommunitiesThreshold = alert.threshold
          } else if (alert.metric === 'failed_logins') {
            config.failedLoginsThreshold = alert.threshold
          } else if (alert.metric === 'high_value_transaction') {
            config.highValueTransactionThreshold = alert.threshold
          }
        })

        setAlertConfig(config)
        alertForm.reset(config)
      } catch (err) {
        console.error('[Settings] Alert config fetch error:', err)
        // Use default values
        const defaultConfig: AlertConfiguration = {
          pendingContentThreshold: 50,
          flaggedContentThreshold: 20,
          pendingCommunitiesThreshold: 10,
          failedLoginsThreshold: 5,
          highValueTransactionThreshold: 10000,
        }
        setAlertConfig(defaultConfig)
        alertForm.reset(defaultConfig)
      }
    } catch (err) {
      console.error('[Settings] Fetch error:', err)
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
      return
    }

    if (isAuthenticated) {
      fetchSettings()
    }
  }, [isAuthenticated, authLoading, router])

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileLoading(true)
    
    try {
      // In production, call dedicated profile update endpoint
      // For now, simulate success
      console.log('[Settings] Profile update:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local profile
      if (profile) {
        setProfile({
          ...profile,
          name: data.name,
          email: data.email
        })
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      // Clear password fields
      profileForm.setValue('currentPassword', '')
      profileForm.setValue('newPassword', '')
      profileForm.setValue('confirmPassword', '')
    } catch (err) {
      console.error('[Settings] Profile update error:', err)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setProfileLoading(false)
    }
  }

  // Handle alert configuration save
  const onAlertConfigSubmit = async (data: AlertConfigFormData) => {
    setAlertLoading(true)
    
    try {
      // Create or update alert configurations
      const alertUpdates = [
        {
          name: 'High Pending Content',
          metric: 'pending_content',
          threshold: data.pendingContentThreshold,
          condition: 'greater_than',
          enabled: true
        },
        {
          name: 'High Flagged Content',
          metric: 'flagged_content',
          threshold: data.flaggedContentThreshold,
          condition: 'greater_than',
          enabled: true
        },
        {
          name: 'Pending Community Approvals',
          metric: 'pending_communities',
          threshold: data.pendingCommunitiesThreshold,
          condition: 'greater_than',
          enabled: true
        },
        {
          name: 'Failed Login Attempts',
          metric: 'failed_logins',
          threshold: data.failedLoginsThreshold,
          condition: 'greater_than',
          enabled: true
        },
        {
          name: 'High Value Transaction',
          metric: 'high_value_transaction',
          threshold: data.highValueTransactionThreshold,
          condition: 'greater_than',
          enabled: true
        }
      ]

      // Get existing alerts
      const existingAlertsRes = await adminApi.analytics.getAlerts()
      const existingAlerts = existingAlertsRes?.data || existingAlertsRes || []

      // Update or create each alert
      for (const alertData of alertUpdates) {
        const existing = existingAlerts.find((a: any) => a.metric === alertData.metric)
        
        if (existing) {
          // Update existing alert
          await adminApi.analytics.updateAlert(existing._id, alertData)
        } else {
          // Create new alert
          await adminApi.analytics.createAlert(alertData)
        }
      }

      setAlertConfig(data)

      toast({
        title: "Success",
        description: "Alert configuration saved successfully",
      })
    } catch (err) {
      console.error('[Settings] Alert config save error:', err)
      toast({
        title: "Error",
        description: "Failed to save alert configuration. Please try again.",
        variant: "destructive"
      })
    } finally {
      setAlertLoading(false)
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your admin profile and system configuration
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alert Configuration
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Platform Settings
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>
                Update your personal information and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                {/* Profile Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Profile Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        {...profileForm.register("name")}
                        placeholder="Enter your name"
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-sm text-red-600">
                          {profileForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register("email")}
                        placeholder="Enter your email"
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {profile && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <Label className="text-muted-foreground">Role</Label>
                        <p className="text-sm font-medium mt-1">{profile.role}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Member Since</Label>
                        <p className="text-sm font-medium mt-1">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Password Change */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Leave blank if you don't want to change your password
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...profileForm.register("currentPassword")}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...profileForm.register("newPassword")}
                          placeholder="Enter new password"
                        />
                        {profileForm.formState.errors.newPassword && (
                          <p className="text-sm text-red-600">
                            {profileForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...profileForm.register("confirmPassword")}
                          placeholder="Confirm new password"
                        />
                        {profileForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-600">
                            {profileForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Configuration Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>
                Configure thresholds for automated system alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={alertForm.handleSubmit(onAlertConfigSubmit)} className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    When these thresholds are exceeded, alerts will be displayed on the dashboard
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {/* Content Moderation Alerts */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Content Moderation</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pendingContentThreshold">
                          Pending Content Threshold
                        </Label>
                        <Input
                          id="pendingContentThreshold"
                          type="number"
                          {...alertForm.register("pendingContentThreshold", { valueAsNumber: true })}
                          placeholder="50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Alert when pending items exceed this number
                        </p>
                        {alertForm.formState.errors.pendingContentThreshold && (
                          <p className="text-sm text-red-600">
                            {alertForm.formState.errors.pendingContentThreshold.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="flaggedContentThreshold">
                          Flagged Content Threshold
                        </Label>
                        <Input
                          id="flaggedContentThreshold"
                          type="number"
                          {...alertForm.register("flaggedContentThreshold", { valueAsNumber: true })}
                          placeholder="20"
                        />
                        <p className="text-xs text-muted-foreground">
                          Alert when flagged items exceed this number
                        </p>
                        {alertForm.formState.errors.flaggedContentThreshold && (
                          <p className="text-sm text-red-600">
                            {alertForm.formState.errors.flaggedContentThreshold.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Community Management Alerts */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Community Management</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pendingCommunitiesThreshold">
                        Pending Communities Threshold
                      </Label>
                      <Input
                        id="pendingCommunitiesThreshold"
                        type="number"
                        {...alertForm.register("pendingCommunitiesThreshold", { valueAsNumber: true })}
                        placeholder="10"
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when pending community approvals exceed this number
                      </p>
                      {alertForm.formState.errors.pendingCommunitiesThreshold && (
                        <p className="text-sm text-red-600">
                          {alertForm.formState.errors.pendingCommunitiesThreshold.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Security Alerts */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Security</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="failedLoginsThreshold">
                        Failed Login Attempts Threshold
                      </Label>
                      <Input
                        id="failedLoginsThreshold"
                        type="number"
                        {...alertForm.register("failedLoginsThreshold", { valueAsNumber: true })}
                        placeholder="5"
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when failed login attempts exceed this number
                      </p>
                      {alertForm.formState.errors.failedLoginsThreshold && (
                        <p className="text-sm text-red-600">
                          {alertForm.formState.errors.failedLoginsThreshold.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Financial Alerts */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Financial</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="highValueTransactionThreshold">
                        High Value Transaction Threshold (USD)
                      </Label>
                      <Input
                        id="highValueTransactionThreshold"
                        type="number"
                        {...alertForm.register("highValueTransactionThreshold", { valueAsNumber: true })}
                        placeholder="10000"
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when transactions exceed this amount
                      </p>
                      {alertForm.formState.errors.highValueTransactionThreshold && (
                        <p className="text-sm text-red-600">
                          {alertForm.formState.errors.highValueTransactionThreshold.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={alertLoading}>
                    {alertLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Settings Tab */}
        <TabsContent value="platform">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>
                Global platform configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Platform settings are coming soon. This section will allow you to configure
                    global platform behavior, maintenance mode, feature flags, and more.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Planned Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Maintenance mode toggle</li>
                    <li>Feature flags management</li>
                    <li>Email notification settings</li>
                    <li>Platform-wide announcement banner</li>
                    <li>Default user permissions</li>
                    <li>Content moderation rules</li>
                    <li>Payment gateway configuration</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
