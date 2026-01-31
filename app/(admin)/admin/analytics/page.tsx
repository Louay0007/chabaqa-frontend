"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { MetricCard } from "@/app/(admin)/_components/metric-card"
import { ChartCard } from "@/app/(admin)/_components/chart-card"
import { ExportDialog } from "@/app/(admin)/_components/export-dialog"

// Dynamic imports for chart components with loading fallbacks
const LineChart = dynamic(
  () => import("@/app/(admin)/_components/charts/line-chart").then((mod) => ({ default: mod.LineChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false
  }
)

const BarChart = dynamic(
  () => import("@/app/(admin)/_components/charts/bar-chart").then((mod) => ({ default: mod.BarChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false
  }
)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  Download,
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"

// Types
interface PlatformStatistics {
  totalUsers: number
  totalCommunities: number
  totalContent: number
  totalRevenue: number
  activeUsers: number
  newUsers: number
  growthRate: number
  healthScore: number
}

interface EngagementMetrics {
  totalSessions: number
  averageSessionDuration: number
  pageViews: number
  bounceRate: number
  contentInteractions: number
  communityParticipation: number
  engagementRate: number
}

interface RetentionAnalysis {
  day1Retention: number
  day7Retention: number
  day30Retention: number
  overallRetention: number
  churnRate: number
  cohortAnalysis: CohortData[]
}

interface CohortData {
  period: string
  size: number
  retained: number
  retentionRate: number
}

interface DashboardData {
  platformStatistics: PlatformStatistics
  engagementMetrics: EngagementMetrics
  retentionAnalysis: RetentionAnalysis
  revenueMetrics: any
  healthMetrics: any
  generatedAt: Date
}

interface AlertConfig {
  _id?: string
  metric: string
  threshold: number
  condition: 'above' | 'below'
  enabled: boolean
}

export default function AnalyticsDashboardPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()

  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false)
  const [alerts, setAlerts] = useState<AlertConfig[]>([])

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch analytics data
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const period = {
          startDate: startDate || getDefaultStartDate(dateRange),
          endDate: endDate || new Date().toISOString(),
          granularity: getGranularity(dateRange)
        }

        const [dashboardRes, alertsRes] = await Promise.all([
          adminApi.analytics.getDashboard(period),
          adminApi.analytics.getAlerts().catch(() => ({ data: [] }))
        ])

        const data = dashboardRes?.data || dashboardRes
        setDashboardData(data)

        const alertsData = alertsRes?.data || alertsRes || []
        setAlerts(Array.isArray(alertsData) ? alertsData : [])

      } catch (error) {
        console.error('[Analytics Dashboard] Error:', error)
        toast.error('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, authLoading, dateRange, startDate, endDate])

  const getDefaultStartDate = (range: string): string => {
    const now = new Date()
    switch (range) {
      case 'week':
        now.setDate(now.getDate() - 7)
        break
      case 'month':
        now.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        now.setMonth(now.getMonth() - 3)
        break
      case 'year':
        now.setFullYear(now.getFullYear() - 1)
        break
    }
    return now.toISOString()
  }

  const getGranularity = (range: string): 'day' | 'week' | 'month' | 'year' => {
    switch (range) {
      case 'week':
        return 'day'
      case 'month':
        return 'week'
      case 'quarter':
      case 'year':
        return 'month'
      default:
        return 'day'
    }
  }

  const handleExport = async (format: 'csv' | 'json' | 'pdf', options: any) => {
    try {
      await adminApi.analytics.exportAnalytics({
        format,
        startDate: options.startDate || startDate || getDefaultStartDate(dateRange),
        endDate: options.endDate || endDate || new Date().toISOString(),
        includeCharts: options.includeDetails
      })
      toast.success(`Analytics exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('[Export] Error:', error)
      throw error
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}m ${secs}s`
  }

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  const calculateGrowth = (value: number) => {
    if (value === 0) return { value: "0%", trend: "neutral" as const }
    const sign = value >= 0 ? "+" : ""
    return {
      value: `${sign}${value.toFixed(1)}%`,
      trend: value >= 0 ? "up" as const : "down" as const
    }
  }

  const getHealthColor = (score: number): "success" | "warning" | "danger" => {
    if (score >= 80) return "success"
    if (score >= 60) return "warning"
    return "danger"
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.platformStatistics
  const engagement = dashboardData?.engagementMetrics
  const retention = dashboardData?.retentionAnalysis

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive platform analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last 3 Months</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setExportDialogOpen(true)} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setAlertsDialogOpen(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Alerts
          </Button>
        </div>
      </div>

      {/* Custom Date Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Custom Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Platform Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Users"
              value={formatNumber(stats?.totalUsers || 0)}
              change={calculateGrowth(stats?.growthRate || 0)}
              icon={Users}
              color="primary"
            />
            <MetricCard
              title="Active Users"
              value={formatNumber(stats?.activeUsers || 0)}
              icon={Activity}
              color="success"
            />
            <MetricCard
              title="Communities"
              value={formatNumber(stats?.totalCommunities || 0)}
              icon={Building2}
              color="info"
            />
            <MetricCard
              title="Total Content"
              value={formatNumber(stats?.totalContent || 0)}
              icon={FileText}
              color="warning"
            />
          </div>

          {/* Revenue & Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={DollarSign}
              color="primary"
            />
            <MetricCard
              title="Platform Health"
              value={`${stats?.healthScore || 0}/100`}
              icon={stats?.healthScore >= 80 ? CheckCircle2 : AlertTriangle}
              color={getHealthColor(stats?.healthScore || 0)}
            />
          </div>

          {/* User Growth Chart */}
          <ChartCard
            title="User Growth"
            description="New users over time"
            loading={loading}
          >
            <LineChart
              data={[
                { period: 'Week 1', users: stats?.newUsers * 0.2 || 0 },
                { period: 'Week 2', users: stats?.newUsers * 0.3 || 0 },
                { period: 'Week 3', users: stats?.newUsers * 0.25 || 0 },
                { period: 'Week 4', users: stats?.newUsers * 0.25 || 0 }
              ]}
              xKey="period"
              yKeys={[
                { key: 'users', color: 'hsl(var(--chart-1))', name: 'New Users' }
              ]}
              height={300}
              formatYAxis={(value) => formatNumber(value)}
            />
          </ChartCard>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Sessions"
              value={formatNumber(engagement?.totalSessions || 0)}
              icon={Activity}
              color="primary"
            />
            <MetricCard
              title="Avg Session Duration"
              value={formatDuration(engagement?.averageSessionDuration || 0)}
              icon={Clock}
              color="info"
            />
            <MetricCard
              title="Page Views"
              value={formatNumber(engagement?.pageViews || 0)}
              icon={FileText}
              color="success"
            />
            <MetricCard
              title="Engagement Rate"
              value={formatPercentage(engagement?.engagementRate || 0)}
              icon={TrendingUp}
              color="warning"
            />
          </div>

          {/* Engagement Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Content Interactions"
              value={formatNumber(engagement?.contentInteractions || 0)}
              icon={FileText}
              color="primary"
            />
            <MetricCard
              title="Community Participation"
              value={formatNumber(engagement?.communityParticipation || 0)}
              icon={Building2}
              color="success"
            />
          </div>

          {/* Engagement Chart */}
          <ChartCard
            title="Engagement Metrics"
            description="User engagement over time"
            loading={loading}
          >
            <BarChart
              data={[
                { metric: 'Sessions', value: engagement?.totalSessions || 0 },
                { metric: 'Page Views', value: engagement?.pageViews || 0 },
                { metric: 'Interactions', value: engagement?.contentInteractions || 0 },
                { metric: 'Participation', value: engagement?.communityParticipation || 0 }
              ]}
              xKey="metric"
              yKeys={[
                { key: 'value', color: 'hsl(var(--chart-1))', name: 'Count' }
              ]}
              height={300}
              formatYAxis={(value) => formatNumber(value)}
            />
          </ChartCard>

          {/* Bounce Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Bounce Rate</CardTitle>
              <CardDescription>Percentage of single-page sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {formatPercentage(engagement?.bounceRate || 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {engagement?.bounceRate < 0.4 ? 'Excellent' : engagement?.bounceRate < 0.6 ? 'Good' : 'Needs Improvement'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-6">
          {/* Retention Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Day 1 Retention"
              value={formatPercentage(retention?.day1Retention || 0)}
              icon={Users}
              color="primary"
            />
            <MetricCard
              title="Day 7 Retention"
              value={formatPercentage(retention?.day7Retention || 0)}
              icon={Users}
              color="info"
            />
            <MetricCard
              title="Day 30 Retention"
              value={formatPercentage(retention?.day30Retention || 0)}
              icon={Users}
              color="success"
            />
            <MetricCard
              title="Churn Rate"
              value={formatPercentage(retention?.churnRate || 0)}
              icon={AlertTriangle}
              color="danger"
            />
          </div>

          {/* Overall Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Retention Rate</CardTitle>
              <CardDescription>Average user retention across all periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {formatPercentage(retention?.overallRetention || 0)}
              </div>
            </CardContent>
          </Card>

          {/* Cohort Analysis Chart */}
          <ChartCard
            title="Cohort Analysis"
            description="User retention by cohort"
            loading={loading}
          >
            <BarChart
              data={retention?.cohortAnalysis || []}
              xKey="period"
              yKeys={[
                { key: 'retentionRate', color: 'hsl(var(--chart-1))', name: 'Retention Rate' }
              ]}
              height={300}
              formatYAxis={(value) => formatPercentage(value)}
              formatTooltip={(value) => formatPercentage(value)}
            />
          </ChartCard>

          {/* Cohort Details Table */}
          {retention?.cohortAnalysis && retention.cohortAnalysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cohort Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Period</th>
                        <th className="text-right p-2">Cohort Size</th>
                        <th className="text-right p-2">Retained</th>
                        <th className="text-right p-2">Retention Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retention.cohortAnalysis.map((cohort, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{cohort.period}</td>
                          <td className="text-right p-2">{formatNumber(cohort.size)}</td>
                          <td className="text-right p-2">{formatNumber(cohort.retained)}</td>
                          <td className="text-right p-2">{formatPercentage(cohort.retentionRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Alert Configuration Section */}
      {alertsDialogOpen && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alert Configuration</CardTitle>
                <CardDescription>Configure thresholds for automated alerts</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAlertsDialogOpen(false)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Alert configuration coming soon. You'll be able to set thresholds for metrics like user growth, engagement rate, and churn rate.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        availableFormats={['csv', 'json', 'pdf']}
        dateRangeRequired={false}
        title="Export Analytics"
        description="Export analytics data in your preferred format"
      />
    </div>
  )
}
