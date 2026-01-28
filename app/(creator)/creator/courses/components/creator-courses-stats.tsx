"use client"

import { MetricCard } from "@/components/ui/metric-card"
import { BookOpen, Eye, Users, DollarSign } from "lucide-react"
import { Course } from "@/lib/models" // Make sure this type is properly defined

interface CreatorCoursesStatsProps {
  allCourses: Course[]
}

export function CreatorCoursesStats({ allCourses }: CreatorCoursesStatsProps) {
  const totalCourses = allCourses.length
  const publishedCourses = allCourses.filter((c: any) => c.isPublished).length
  const totalEnrollments = allCourses.reduce((acc: number, c: any) => acc + (Array.isArray(c.enrollments) ? c.enrollments.length : (c.enrolledCount ?? 0)), 0)
  const totalRevenue = allCourses.reduce((acc: number, c: any) => acc + (Number(c.revenue ?? 0)), 0)
  const stats = [
    {
      title: "Total Courses",
      value: totalCourses,
      change: { value: "+2", trend: "up" as const },
      icon: BookOpen,
      color: "courses" as const,
    },
    {
      title: "Published Courses",
      value: publishedCourses,
      change: { value: "+1", trend: "up" as const },
      icon: Eye,
      color: "success" as const,
    },
    {
      title: "Total Enrollments",
      value: totalEnrollments,
      change: { value: "+15", trend: "up" as const },
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Course Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      change: { value: "+18%", trend: "up" as const },
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