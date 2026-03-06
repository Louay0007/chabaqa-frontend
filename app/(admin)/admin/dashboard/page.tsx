"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAdminAuth } from "../../providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertCircle,
  Building2,
  Coins,
  FileText,
  LifeBuoy,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"

type WidgetState = {
  label: string
  value: number
  description: string
  available: boolean
  loading: boolean
  error: string | null
}

type DashboardWidgets = {
  totalUsers: WidgetState
  pendingCommunities: WidgetState
  pendingContent: WidgetState
  liveSupport: WidgetState
  revenue: WidgetState
}

const INITIAL_WIDGETS: DashboardWidgets = {
  totalUsers: {
    label: "Total Users",
    value: 0,
    description: "User base",
    available: true,
    loading: true,
    error: null,
  },
  pendingCommunities: {
    label: "Pending Communities",
    value: 0,
    description: "Awaiting approval",
    available: true,
    loading: true,
    error: null,
  },
  pendingContent: {
    label: "Pending Content",
    value: 0,
    description: "Needs review",
    available: true,
    loading: true,
    error: null,
  },
  liveSupport: {
    label: "Live Support Queue",
    value: 0,
    description: "Available tickets",
    available: true,
    loading: true,
    error: null,
  },
  revenue: {
    label: "Revenue",
    value: 0,
    description: "This period",
    available: true,
    loading: true,
    error: null,
  },
}

function getResponsePayload<T>(response: { data?: T } | T): T {
  if (response && typeof response === "object" && "data" in response && response.data) {
    return response.data
  }
  return response as T
}

function getErrorMessage(error: any): string {
  const message = error?.message || "Request failed"
  if (typeof message !== "string") return "Request failed"
  return message
}

export default function AdminDashboardPage() {
  const { admin, isAuthenticated, loading: authLoading, logout, capabilities } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("admin.dashboard")
  const [loading, setLoading] = useState(true)
  const [growthRate, setGrowthRate] = useState(0)
  const [revenueChange, setRevenueChange] = useState(0)
  const [widgets, setWidgets] = useState<DashboardWidgets>(INITIAL_WIDGETS)

  const widgetText = {
    totalUsers: { label: t("totalUsers"), description: t("userBase") },
    pendingCommunities: { label: t("pendingCommunities"), description: t("awaitingApproval") },
    pendingContent: { label: t("pendingContent"), description: t("needsReview") },
    liveSupport: { label: t("liveSupportQueue"), description: t("availableTickets") },
    revenue: { label: t("revenue"), description: t("thisPeriod") },
  } as const

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(localizeHref(pathname, "/admin/login"))
    }
  }, [authLoading, isAuthenticated, router, pathname])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    let cancelled = false

    const fetchDashboard = async () => {
      setLoading(true)

      const period = {
        endDate: new Date().toISOString(),
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        granularity: "month" as const,
      }

      const tasks = [
        capabilities.analytics ? adminApi.analytics.getDashboard(period) : Promise.resolve(null),
        capabilities.communities ? adminApi.communities.getPendingApprovals({ page: 1, limit: 1 }) : Promise.resolve(null),
        capabilities.contentModeration ? adminApi.contentModeration.getQueueStats() : Promise.resolve(null),
        capabilities.liveSupport ? adminApi.support.getQueueCounts() : Promise.resolve(null),
        !capabilities.analytics && capabilities.financial
          ? adminApi.financial.getRevenueDashboard({ period: "month" })
          : Promise.resolve(null),
      ] as const

      const [analyticsResult, communitiesResult, moderationResult, liveSupportResult, financialResult] = await Promise.allSettled(tasks)

      if (cancelled) return

      const nextWidgets: DashboardWidgets = {
        totalUsers: {
          ...INITIAL_WIDGETS.totalUsers,
          available: capabilities.analytics,
          loading: false,
        },
        pendingCommunities: {
          ...INITIAL_WIDGETS.pendingCommunities,
          available: capabilities.communities,
          loading: false,
        },
        pendingContent: {
          ...INITIAL_WIDGETS.pendingContent,
          available: capabilities.contentModeration,
          loading: false,
        },
        liveSupport: {
          ...INITIAL_WIDGETS.liveSupport,
          available: capabilities.liveSupport,
          loading: false,
        },
        revenue: {
          ...INITIAL_WIDGETS.revenue,
          available: capabilities.analytics || capabilities.financial,
          loading: false,
        },
      }

      if (analyticsResult.status === "fulfilled" && analyticsResult.value) {
        const dashboard = getResponsePayload<any>(analyticsResult.value)
        const platformStats = dashboard?.platformStatistics || {}
        const revenueMetrics = dashboard?.revenueMetrics || {}

        nextWidgets.totalUsers.value = Number(dashboard?.userGrowth?.totalUsers || platformStats?.totalUsers || 0)
        nextWidgets.revenue.value = Number(dashboard?.revenue?.totalRevenue || platformStats?.totalRevenue || 0)
        setGrowthRate(Number(dashboard?.userGrowth?.growthRate || platformStats?.growthRate || 0))
        setRevenueChange(Number(revenueMetrics?.revenueChange || 0))
      } else if (capabilities.analytics) {
        const error = analyticsResult.status === "rejected" ? getErrorMessage(analyticsResult.reason) : "Failed to load analytics"
        nextWidgets.totalUsers.error = error
        nextWidgets.revenue.error = error
        if (error.includes("401")) {
          await logout()
          return
        }
      } else if (financialResult.status === "fulfilled" && financialResult.value) {
        const financialMetrics = getResponsePayload<any>(financialResult.value) || {}
        nextWidgets.revenue.value = Number(financialMetrics?.monthlyRevenue || financialMetrics?.totalRevenue || 0)
      } else if (capabilities.financial) {
        nextWidgets.revenue.error =
          financialResult.status === "rejected" ? getErrorMessage(financialResult.reason) : "Failed to load revenue"
      }

      if (communitiesResult.status === "fulfilled" && communitiesResult.value) {
        const pendingCommunities = getResponsePayload<any>(communitiesResult.value)
        nextWidgets.pendingCommunities.value = Number(pendingCommunities?.total || pendingCommunities?.data?.total || 0)
      } else if (capabilities.communities) {
        nextWidgets.pendingCommunities.error =
          communitiesResult.status === "rejected" ? getErrorMessage(communitiesResult.reason) : "Failed to load communities"
      }

      if (moderationResult.status === "fulfilled" && moderationResult.value) {
        const moderationStats = getResponsePayload<any>(moderationResult.value) || {}
        nextWidgets.pendingContent.value = Number(
          moderationStats?.pending ||
          moderationStats?.pendingCount ||
          moderationStats?.byStatus?.pending ||
          0,
        )
      } else if (capabilities.contentModeration) {
        nextWidgets.pendingContent.error =
          moderationResult.status === "rejected" ? getErrorMessage(moderationResult.reason) : "Failed to load moderation"
      }

      if (liveSupportResult.status === "fulfilled" && liveSupportResult.value) {
        const supportCounts = getResponsePayload<any>(liveSupportResult.value)
        nextWidgets.liveSupport.value = Number(supportCounts?.available || 0)
      } else if (capabilities.liveSupport) {
        nextWidgets.liveSupport.error =
          liveSupportResult.status === "rejected" ? getErrorMessage(liveSupportResult.reason) : "Failed to load live support"
      }

      setWidgets(nextWidgets)
      setLoading(false)
    }

    fetchDashboard().catch(async (error) => {
      if (cancelled) return

      const message = getErrorMessage(error)
      if (message.includes("401")) {
        await logout()
        return
      }

      setLoading(false)
      toast.error(t("failedToLoad"))
    })

    return () => {
      cancelled = true
    }
  }, [authLoading, capabilities, isAuthenticated, logout, t])

  const visibleWidgets = [
    {
      key: "totalUsers",
      icon: Users,
      onClick: localizeHref(pathname, "/admin/users"),
      formatter: (value: number) => value.toLocaleString(),
      trend: growthRate,
      widget: widgets.totalUsers,
    },
    {
      key: "pendingCommunities",
      icon: Building2,
      onClick: localizeHref(pathname, "/admin/communities"),
      formatter: (value: number) => value.toLocaleString(),
      trend: null,
      widget: widgets.pendingCommunities,
    },
    {
      key: "pendingContent",
      icon: FileText,
      onClick: localizeHref(pathname, "/admin/content-moderation"),
      formatter: (value: number) => value.toLocaleString(),
      trend: null,
      widget: widgets.pendingContent,
    },
    {
      key: "liveSupport",
      icon: LifeBuoy,
      onClick: localizeHref(pathname, "/admin/communication/support"),
      formatter: (value: number) => value.toLocaleString(),
      trend: null,
      widget: widgets.liveSupport,
    },
    {
      key: "revenue",
      icon: Coins,
      onClick: localizeHref(pathname, "/admin/financial"),
      formatter: (value: number) =>
        new Intl.NumberFormat("fr-TN", {
          style: "currency",
          currency: "TND",
          maximumFractionDigits: 0,
        }).format(value || 0),
      trend: revenueChange,
      widget: widgets.revenue,
    },
  ].filter(({ widget }) => widget.available)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">{t("loadingDashboardData")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Welcome back, <span className="font-semibold">{admin?.name || "Admin"}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visibleWidgets.map(({ key, icon: Icon, onClick, formatter, trend, widget }) => (
          <Card
            key={key}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(onClick)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{widgetText[key as keyof typeof widgetText]?.label || widget.label}</CardTitle>
              <Icon className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{formatter(widget.value)}</div>
              {widget.error ? (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{widget.error}</span>
                </p>
              ) : trend !== null ? (
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={trend >= 0 ? "text-green-600" : "text-red-600"}>
                    {trend >= 0 ? "+" : ""}
                    {trend.toFixed(1)}%
                  </span>
                  <span className="ml-1">{widgetText[key as keyof typeof widgetText]?.description || widget.description}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{widgetText[key as keyof typeof widgetText]?.description || widget.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.users && (
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              onClick={() => router.push(localizeHref(pathname, "/admin/users"))}
            >
              <UserPlus className="h-8 w-8 text-blue-600" />
              <span className="font-medium">Manage Users</span>
            </Button>
          )}

          {capabilities.communities && (
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300 transition-colors"
              onClick={() => router.push(localizeHref(pathname, "/admin/communities"))}
            >
              <Building2 className="h-8 w-8 text-green-600" />
              <span className="font-medium">Review Communities</span>
            </Button>
          )}

          {capabilities.contentModeration && (
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-amber-50 hover:border-amber-300 transition-colors"
              onClick={() => router.push(localizeHref(pathname, "/admin/content-moderation"))}
            >
              <FileText className="h-8 w-8 text-amber-600" />
              <span className="font-medium">Moderate Content</span>
            </Button>
          )}

          {(capabilities.analytics || capabilities.financial) && (
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              onClick={() => router.push(localizeHref(pathname, capabilities.financial ? "/admin/financial" : "/admin/analytics"))}
            >
              <RefreshCcw className="h-8 w-8 text-purple-600" />
              <span className="font-medium">View Reports</span>
            </Button>
          )}
        </div>
      </div>

      {visibleWidgets.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Dashboard Modules Available</CardTitle>
            <CardDescription>
              This admin account does not currently have dashboard capabilities assigned.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
