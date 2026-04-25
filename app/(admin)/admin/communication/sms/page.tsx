"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Users, Send, TrendingUp, ArrowRight } from "lucide-react"

export default function SmsOverviewPage() {
  const router = useRouter()

  const stats = [
    { title: "Total Recipients", value: "—", icon: Users },
    { title: "Messages Sent", value: "—", icon: Send },
    { title: "Delivery Rate", value: "—%", icon: TrendingUp },
    { title: "Active Campaigns", value: "—", icon: MessageSquare },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            SMS Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage SMS campaigns and delivery
          </p>
        </div>
        <Badge variant="outline">SMS Gateway</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="admin-surface rounded-3xl border-0 shadow-none"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="admin-surface rounded-3xl border-0 shadow-none cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/admin/communication/sms/campaigns")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="admin-icon-chip h-11 w-11 rounded-2xl">
                <Send className="h-5 w-5 text-[hsl(var(--admin-primary-strong))]" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">Campaigns</CardTitle>
            <CardDescription>
              Create and manage SMS broadcast campaigns
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="admin-surface rounded-3xl border-0 shadow-none cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/admin/communication/sms/templates")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="admin-icon-chip h-11 w-11 rounded-2xl">
                <MessageSquare className="h-5 w-5 text-[hsl(var(--admin-success))]" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">Templates</CardTitle>
            <CardDescription>Manage SMS message templates</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="admin-surface rounded-3xl border-0 shadow-none">
        <CardHeader>
          <CardTitle>Gateway Configuration</CardTitle>
          <CardDescription>SMS gateway integration status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Twilio", status: "Not Configured", region: "Global" },
            { label: "Vonage", status: "Not Configured", region: "Global" },
            { label: "Infobip", status: "Not Configured", region: "MENA" },
          ].map((gw) => (
            <div
              key={gw.label}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <div>
                <span className="text-sm font-medium">{gw.label}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({gw.region})
                </span>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                {gw.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
