"use client"
import { MetricCard } from "@/components/ui/metric-card"
import { ShoppingBag, CheckCircle, Users, DollarSign } from "lucide-react"

interface ProductsStatsGridProps {
  products: any[]
  revenue?: number | null
}

export function ProductsStatsGrid({ products, revenue }: ProductsStatsGridProps) {
  const totalSales = products.reduce((acc: number, p: any) => acc + Number(p.salesCount ?? p.sales ?? 0), 0)
  const revenueFallback = products.reduce((acc: number, p: any) => acc + Number(p.price || 0) * Number(p.salesCount ?? p.sales ?? 0), 0)
  const stats = [
    {
      title: "Total Products",
      value: products.length,
      change: { value: "+3", trend: "up" as const },
      icon: ShoppingBag,
      color: "primary" as const,
    },
    {
      title: "Published Products",
      value: products.filter((p) => p.isPublished).length,
      change: { value: "+1", trend: "up" as const },
      icon: CheckCircle,
      color: "success" as const,
    },
    {
      title: "Total Sales",
      value: totalSales,
      change: { value: "+42", trend: "up" as const },
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Total Revenue",
      value: `$${Number(revenue ?? revenueFallback).toLocaleString()}`,
      change: { value: "+22%", trend: "up" as const },
      icon: DollarSign,
      color: "success" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <MetricCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </div>
  )
}