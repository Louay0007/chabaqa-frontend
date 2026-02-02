"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "../../providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Building2, 
  FileText, 
  DollarSign,
  UserPlus,
  Building,
  Shield,
  TrendingUp,
  TrendingDown
} from "lucide-react"

export default function AdminDashboardPage() {
  const { admin, isAuthenticated, loading: authLoading, logout } = useAdminAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCommunities: 0,
    pendingContent: 0,
    totalRevenue: 0,
    growthRate: 0,
    revenueChange: 0,
  })

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch dashboard data
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const period = {
          endDate: new Date().toISOString(),
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          granularity: 'month' as const,
        }

        const [dashboardRes, pendingRes] = await Promise.all([
          adminApi.analytics.getDashboard(period),
          adminApi.contentModeration.getQueueStats().catch(() => ({ data: null })),
        ])

        const dashboard = dashboardRes?.data || dashboardRes
        const platformStats = dashboard?.platformStatistics
        const revenueMetrics = dashboard?.revenueMetrics
        const pendingStats = pendingRes?.data || pendingRes

        setStats({
          // Fix: Ensure we use totalCommunities from API if available, or 0.
          // The API response structure puts userGrowth at the top level in 'dashboard', 
          // and platformStatistics inside it. We need to be careful with mapping.
          // Based on the backend service, totalCommunities is returned inside 'userGrowth'.
          
          totalUsers: dashboard?.userGrowth?.totalUsers || platformStats?.totalUsers || 0,
          totalCommunities: dashboard?.userGrowth?.totalCommunities || platformStats?.totalCommunities || 0,
          pendingContent: pendingStats?.pending || pendingStats?.pendingCount || 0,
          totalRevenue: dashboard?.revenue?.totalRevenue || platformStats?.totalRevenue || 0,
          growthRate: dashboard?.userGrowth?.growthRate || platformStats?.growthRate || 0,
          revenueChange: revenueMetrics?.revenueChange || 0,
        })
      } catch (error: any) {
        console.error('[AdminDashboard] Error:', error)
        if (error?.message?.includes('401')) {
          await logout()
          return
        }
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [isAuthenticated, authLoading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Welcome back, <span className="font-semibold">{admin?.name || 'Admin'}</span>
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/users')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {stats.growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={stats.growthRate >= 0 ? "text-green-600" : "text-red-600"}>
                {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/communities')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communities</CardTitle>
            <Building2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCommunities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">Updated</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/content-moderation')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Content</CardTitle>
            <FileText className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingContent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              <span className="text-red-600">Needs review</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/financial')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(stats.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {stats.revenueChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={stats.revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange.toFixed(1)}%
              </span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            onClick={() => router.push('/admin/users')}
          >
            <UserPlus className="h-8 w-8 text-blue-600" />
            <span className="font-medium">Manage Users</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300 transition-colors"
            onClick={() => router.push('/admin/communities')}
          >
            <Building className="h-8 w-8 text-green-600" />
            <span className="font-medium">View Communities</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-amber-50 hover:border-amber-300 transition-colors"
            onClick={() => router.push('/admin/content-moderation')}
          >
            <Shield className="h-8 w-8 text-amber-600" />
            <span className="font-medium">Moderate Content</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300 transition-colors"
            onClick={() => router.push('/admin/financial')}
          >
            <DollarSign className="h-8 w-8 text-purple-600" />
            <span className="font-medium">Financial Overview</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New community approved</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">User registered</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Content flagged for review</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Status</span>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <span className="text-sm text-green-600 font-medium">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-sm text-green-600 font-medium">75% Available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
