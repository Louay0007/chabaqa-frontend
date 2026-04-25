"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  Users,
  Send,
  TrendingUp,
  ArrowRight,
  MessageSquare,
  Phone,
} from "lucide-react"

export default function WhatsAppOverviewPage() {
  const router = useRouter()

  const stats = [
    {
      title: "Total Opted-in",
      value: "—",
      description: "Users opted into WhatsApp",
      icon: Users,
    },
    {
      title: "Messages Sent",
      value: "—",
      description: "Total messages sent",
      icon: Send,
    },
    {
      title: "Delivery Rate",
      value: "—%",
      description: "Average delivery rate",
      icon: TrendingUp,
    },
    {
      title: "Active Campaigns",
      value: "—",
      description: "Currently running",
      icon: MessageCircle,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-green-500" />
            WhatsApp Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage WhatsApp Business campaigns and contacts
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          WhatsApp Business API
        </Badge>
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
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="admin-surface rounded-3xl border-0 shadow-none cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/admin/communication/whatsapp/campaigns")}
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
              Create and manage WhatsApp broadcast campaigns
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="admin-surface rounded-3xl border-0 shadow-none cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/admin/communication/whatsapp/templates")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="admin-icon-chip h-11 w-11 rounded-2xl">
                <MessageSquare className="h-5 w-5 text-[hsl(var(--admin-success))]" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">Templates</CardTitle>
            <CardDescription>
              Manage approved WhatsApp message templates
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="admin-surface rounded-3xl border-0 shadow-none cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/admin/communication/whatsapp/contacts")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="admin-icon-chip h-11 w-11 rounded-2xl">
                <Phone className="h-5 w-5 text-[hsl(var(--admin-cyan))]" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">Contacts</CardTitle>
            <CardDescription>
              View opted-in contacts and manage subscriptions
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="admin-surface rounded-3xl border-0 shadow-none">
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
          <CardDescription>
            WhatsApp Business API integration status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "WhatsApp Business Account", status: "Not Configured" },
            { label: "Phone Number", status: "Not Configured" },
            { label: "Webhook URL", status: "Not Configured" },
            { label: "Access Token", status: "Not Configured" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <span className="text-sm font-medium">{item.label}</span>
              <Badge variant="outline" className="text-muted-foreground">
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
