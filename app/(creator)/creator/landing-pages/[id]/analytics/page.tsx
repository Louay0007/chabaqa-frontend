"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Eye,
    Users,
    Target,
    Percent,
    TrendingUp,
    TrendingDown,
    Monitor,
    Smartphone,
    Tablet,
    Sparkles,
    MousePointerClick,
    ScrollText,
    ExternalLink,
    Calendar,
    RefreshCw,
    Download,
    ChevronRight,
    Flame,
    BarChart3,
    Globe,
    Pencil,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
} from "recharts";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    PageShell,
    PageHeader,
    StatsGrid,
    Section,
} from "@/components/creator-dashboard";
import type { PageAnalytics } from "@/lib/landing-pages/types";
import { landingPagesApi } from "@/lib/api/landing-pages.api";

// ---------------------------------------------------------------------------
// Mock data generation
// ---------------------------------------------------------------------------

const TOP_BLOCKS = [
    {
        name: "Hero Section",
        metric: "92% scroll depth",
        icon: ScrollText,
        color: "text-purple-500",
    },
    {
        name: "CTA Button",
        metric: "14.2% click rate",
        icon: MousePointerClick,
        color: "text-green-500",
    },
    {
        name: "Testimonials",
        metric: "87% scroll depth",
        icon: ScrollText,
        color: "text-blue-500",
    },
    {
        name: "Pricing Table",
        metric: "9.8% click rate",
        icon: MousePointerClick,
        color: "text-orange-500",
    },
    {
        name: "Feature Grid",
        metric: "76% scroll depth",
        icon: ScrollText,
        color: "text-pink-500",
    },
];

const HEATMAP_SECTIONS = [
    { name: "Header / Navigation", intensity: 0.95, height: "h-8" },
    { name: "Hero Section", intensity: 1.0, height: "h-16" },
    { name: "Features", intensity: 0.78, height: "h-14" },
    { name: "Social Proof", intensity: 0.65, height: "h-10" },
    { name: "Testimonials", intensity: 0.58, height: "h-12" },
    { name: "Pricing", intensity: 0.72, height: "h-14" },
    { name: "CTA Section", intensity: 0.85, height: "h-10" },
    { name: "FAQ", intensity: 0.35, height: "h-12" },
    { name: "Footer", intensity: 0.2, height: "h-8" },
];

const AI_INSIGHTS = [
    {
        title: "Boost CTA Visibility",
        description:
            "Your CTA button color could improve conversions by 15%. Try using a higher-contrast color like #8e78fb on a white background.",
        impact: "high" as const,
    },
    {
        title: "Add Video Content",
        description:
            "Adding a video above the fold increases engagement by 2x. Consider adding a short explainer video to your hero section.",
        impact: "high" as const,
    },
    {
        title: "Optimize for Mobile",
        description:
            "34% of your visitors are on mobile but your mobile conversion rate is 40% lower. Review mobile layout and button sizes.",
        impact: "medium" as const,
    },
];

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------

function useAnimatedCounter(target: number, duration: number = 1200) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let raf: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setCount(Math.floor(eased * target));
            if (progress < 1) {
                raf = requestAnimationFrame(animate);
            }
        };

        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);

    return count;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AnimatedStatCard({
    title,
    value,
    formattedValue,
    trend,
    icon: Icon,
    color,
    sparklineData,
    delay = 0,
}: {
    title: string;
    value: number;
    formattedValue?: string;
    trend: number;
    icon: React.ElementType;
    color: string;
    sparklineData: number[];
    delay?: number;
}) {
    const animatedValue = useAnimatedCounter(value);
    const isPositive = trend >= 0;

    const colorMap: Record<
        string,
        { bg: string; iconBg: string; iconText: string; sparkline: string }
    > = {
        blue: {
            bg: "from-blue-50 to-blue-50/30",
            iconBg: "bg-blue-100",
            iconText: "text-blue-600",
            sparkline: "#3b82f6",
        },
        purple: {
            bg: "from-purple-50 to-purple-50/30",
            iconBg: "bg-purple-100",
            iconText: "text-purple-600",
            sparkline: "#8e78fb",
        },
        green: {
            bg: "from-green-50 to-green-50/30",
            iconBg: "bg-green-100",
            iconText: "text-green-600",
            sparkline: "#22c55e",
        },
        orange: {
            bg: "from-orange-50 to-orange-50/30",
            iconBg: "bg-orange-100",
            iconText: "text-orange-600",
            sparkline: "#f97316",
        },
    };

    const c = colorMap[color] || colorMap.blue;

    // Generate sparkline path
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const w = 80;
    const h = 28;
    const points = sparklineData.map((v, i) => {
        const x = (i / (sparklineData.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
    });
    const linePath = `M${points.join(" L")}`;
    const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Card
                className={cn(
                    "relative overflow-hidden bg-gradient-to-br border-0 shadow-sm",
                    c.bg,
                )}
            >
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <div
                                className={cn(
                                    "inline-flex items-center justify-center w-9 h-9 rounded-lg",
                                    c.iconBg,
                                )}
                            >
                                <Icon
                                    className={cn("h-4.5 w-4.5", c.iconText)}
                                />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {title}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight">
                                    {formattedValue
                                        ? formattedValue.replace(
                                              /[\d,]+/,
                                              animatedValue.toLocaleString(),
                                          )
                                        : animatedValue.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {isPositive ? (
                                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                )}
                                <span
                                    className={cn(
                                        "text-xs font-medium",
                                        isPositive
                                            ? "text-green-600"
                                            : "text-red-600",
                                    )}
                                >
                                    {isPositive ? "+" : ""}
                                    {trend}%
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    vs last period
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 opacity-70">
                            <svg
                                width={w}
                                height={h}
                                viewBox={`0 0 ${w} ${h}`}
                                className="overflow-visible"
                            >
                                <defs>
                                    <linearGradient
                                        id={`spark-grad-${color}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor={c.sparkline}
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor={c.sparkline}
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={areaPath}
                                    fill={`url(#spark-grad-${color})`}
                                />
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke={c.sparkline}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function CustomChartTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-xl">
            <p className="text-sm font-medium mb-1.5">{label}</p>
            {payload.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground capitalize">
                        {entry.dataKey}:
                    </span>
                    <span className="font-semibold">
                        {entry.value.toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
}

function HeatmapSection({
    name,
    intensity,
    height,
    index,
}: {
    name: string;
    intensity: number;
    height: string;
    index: number;
}) {
    const r = Math.round(142 + (255 - 142) * (1 - intensity));
    const g = Math.round(120 + (255 - 120) * (1 - intensity));
    const b = Math.round(251 + (255 - 251) * (1 - intensity));
    const bgColor = `rgb(${r}, ${g}, ${b})`;

    return (
        <motion.div
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            className={cn(
                "relative rounded-md flex items-center justify-between px-4 group cursor-default transition-all hover:ring-2 hover:ring-purple-300",
                height,
            )}
            style={{ backgroundColor: bgColor }}
        >
            <span className="text-xs font-medium text-gray-700 truncate">
                {name}
            </span>
            <span className="text-xs font-semibold text-gray-600">
                {Math.round(intensity * 100)}%
            </span>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function LandingPageAnalyticsPage() {
    const params = useParams() as { id: string };
    const router = useRouter();
    const pageId = params.id as string;

    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
        "30d",
    );
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsLoadingData(true);
        landingPagesApi
            .getAnalytics(params.id, timeRange as any)
            .then((res) => {
                if (!cancelled) {
                    setAnalyticsData((res as any).data ?? null);
                    setIsLoadingData(false);
                }
            })
            .catch(() => {
                if (!cancelled) setIsLoadingData(false);
            });
        return () => {
            cancelled = true;
        };
    }, [params.id, timeRange]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        landingPagesApi
            .getAnalytics(params.id, timeRange as any)
            .then((res) => {
                setAnalyticsData((res as any).data ?? null);
                setIsRefreshing(false);
            })
            .catch(() => setIsRefreshing(false));
    }, [params.id, timeRange]);

    const maxReferrer = Math.max(
        ...((analyticsData?.topReferrers ?? []) as any[]).map((r) => r.count),
        1,
    );

    return (
        <TooltipProvider>
            <PageShell>
                {/* Header */}
                <PageHeader
                    title="Page Analytics"
                    breadcrumbs={[
                        { label: "Dashboard", href: "/creator/dashboard" },
                        {
                            label: "Community Home",
                            href: "/creator/landing-pages",
                        },
                        { label: "Analytics" },
                    ]}
                    actions={[
                        {
                            label: "View Leads",
                            href: `/creator/landing-pages/${params.id}/leads`,
                            variant: "outline" as const,
                            icon: Users,
                        },
                        {
                            label: "Edit Page",
                            href: `/creator/landing-pages/${params.id}/edit`,
                            icon: Pencil,
                        },
                    ]}
                >
                    <div className="flex items-center gap-3 mt-2">
                        <Select
                            value={timeRange}
                            onValueChange={(v: any) => setTimeRange(v)}
                        >
                            <SelectTrigger className="w-[160px] h-9">
                                <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">
                                    Last 30 days
                                </SelectItem>
                                <SelectItem value="90d">
                                    Last 90 days
                                </SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={handleRefresh}
                                >
                                    <RefreshCw
                                        className={cn(
                                            "h-4 w-4",
                                            isRefreshing && "animate-spin",
                                        )}
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Refresh data</TooltipContent>
                        </Tooltip>
                    </div>
                </PageHeader>

                {/* Overview Stats */}
                <StatsGrid columns={4}>
                    <AnimatedStatCard
                        title="Total Views"
                        value={analyticsData?.views ?? 0}
                        trend={12.5}
                        icon={Eye}
                        color="blue"
                        sparklineData={(analyticsData?.dailyViews ?? [])
                            .slice(-10)
                            .map((d: any) => d.views)}
                        delay={0}
                    />
                    <AnimatedStatCard
                        title="Unique Visitors"
                        value={analyticsData?.uniqueVisitors ?? 0}
                        trend={8.3}
                        icon={Users}
                        color="purple"
                        sparklineData={(analyticsData?.dailyViews ?? [])
                            .slice(-10)
                            .map((d: any) => d.uniqueVisitors)}
                        delay={0.1}
                    />
                    <AnimatedStatCard
                        title="Conversions"
                        value={analyticsData?.conversions ?? 0}
                        trend={23.1}
                        icon={Target}
                        color="green"
                        sparklineData={(analyticsData?.dailyViews ?? [])
                            .slice(-10)
                            .map((d: any) => d.conversions)}
                        delay={0.2}
                    />
                    <AnimatedStatCard
                        title="Conversion Rate"
                        value={analyticsData?.conversionRate ?? 0}
                        formattedValue={`${analyticsData?.conversionRate ?? 0}%`}
                        trend={-2.4}
                        icon={Percent}
                        color="orange"
                        sparklineData={(analyticsData?.dailyViews ?? [])
                            .slice(-10)
                            .map((d: any) =>
                                d.views > 0
                                    ? (d.conversions / d.views) * 100
                                    : 0,
                            )}
                        delay={0.3}
                    />
                </StatsGrid>

                {/* Views & Conversions Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold">
                                        Views & Conversions
                                    </CardTitle>
                                    <CardDescription>
                                        Daily breakdown of traffic and
                                        conversions
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        <span className="text-muted-foreground">
                                            Views
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <span className="text-muted-foreground">
                                            Conversions
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={analyticsData?.dailyViews ?? []}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -10,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="viewsGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#3b82f6"
                                                    stopOpacity={0.2}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#3b82f6"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="conversionsGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#22c55e"
                                                    stopOpacity={0.2}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#22c55e"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="stroke-muted/30"
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            className="text-xs"
                                            tick={{
                                                fill: "hsl(var(--muted-foreground))",
                                                fontSize: 11,
                                            }}
                                            interval={
                                                timeRange === "7d"
                                                    ? 0
                                                    : timeRange === "30d"
                                                      ? 4
                                                      : timeRange === "90d"
                                                        ? 13
                                                        : 29
                                            }
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fill: "hsl(var(--muted-foreground))",
                                                fontSize: 11,
                                            }}
                                        />
                                        <RechartsTooltip
                                            content={<CustomChartTooltip />}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="views"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            fill="url(#viewsGradient)"
                                            dot={false}
                                            activeDot={{
                                                r: 5,
                                                strokeWidth: 2,
                                                stroke: "#fff",
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="conversions"
                                            stroke="#22c55e"
                                            strokeWidth={2}
                                            fill="url(#conversionsGradient)"
                                            dot={false}
                                            activeDot={{
                                                r: 5,
                                                strokeWidth: 2,
                                                stroke: "#fff",
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Traffic Sources + Device Breakdown Row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Traffic Sources */}
                    <motion.div
                        className="lg:col-span-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card className="border-0 shadow-sm h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-base font-semibold">
                                        Traffic Sources
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    Where your visitors are coming from
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                {(analyticsData?.topReferrers ?? []).map(
                                    (ref: any, i: number) => {
                                        const REFERRER_COLORS = [
                                            "#8e78fb",
                                            "#6c5ce7",
                                            "#a29bfe",
                                            "#b8b0ff",
                                            "#d4cfff",
                                        ];
                                        return (
                                            <motion.div
                                                key={ref.source}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: 0.4 + i * 0.08,
                                                }}
                                                className="space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">
                                                        {ref.source}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {ref.count.toLocaleString()}{" "}
                                                        visits
                                                    </span>
                                                </div>
                                                <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                REFERRER_COLORS[
                                                                    i %
                                                                        REFERRER_COLORS.length
                                                                ],
                                                        }}
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${(ref.count / maxReferrer) * 100}%`,
                                                        }}
                                                        transition={{
                                                            duration: 0.8,
                                                            delay:
                                                                0.5 + i * 0.1,
                                                            ease: "easeOut",
                                                        }}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    },
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Device Breakdown */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Card className="border-0 shadow-sm h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <Monitor className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-base font-semibold">
                                        Devices
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    Visitor device breakdown
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="h-[160px] flex items-center justify-center">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={
                                                    analyticsData?.deviceBreakdown ??
                                                    []
                                                }
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={48}
                                                outerRadius={72}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {(
                                                    analyticsData?.deviceBreakdown ??
                                                    []
                                                ).map(
                                                    (
                                                        entry: any,
                                                        index: number,
                                                    ) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                entry.color ??
                                                                [
                                                                    "#8e78fb",
                                                                    "#6c5ce7",
                                                                    "#b8b0ff",
                                                                ][index % 3]
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                            <RechartsTooltip
                                                content={({
                                                    active,
                                                    payload,
                                                }) => {
                                                    if (
                                                        !active ||
                                                        !payload ||
                                                        !payload.length
                                                    )
                                                        return null;
                                                    const d =
                                                        payload[0].payload;
                                                    return (
                                                        <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-2.5 shadow-xl text-xs">
                                                            <span className="font-medium">
                                                                {d.name}
                                                            </span>
                                                            : {d.value}%
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-2.5">
                                    {(analyticsData?.deviceBreakdown ?? []).map(
                                        (device: any, i: number) => {
                                            const DeviceIcon =
                                                device.name === "Desktop"
                                                    ? Monitor
                                                    : device.name === "Mobile"
                                                      ? Smartphone
                                                      : Tablet;
                                            const deviceColors = [
                                                "#8e78fb",
                                                "#6c5ce7",
                                                "#b8b0ff",
                                            ];
                                            return (
                                                <motion.div
                                                    key={device.name}
                                                    initial={{
                                                        opacity: 0,
                                                        x: -10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    transition={{
                                                        duration: 0.3,
                                                        delay: 0.5 + i * 0.1,
                                                    }}
                                                    className="flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    device.color ??
                                                                    deviceColors[
                                                                        i %
                                                                            deviceColors.length
                                                                    ],
                                                            }}
                                                        />
                                                        <DeviceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {device.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-semibold">
                                                        {device.value}%
                                                    </span>
                                                </motion.div>
                                            );
                                        },
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Top Blocks + Heatmap Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Performing Blocks */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.35 }}
                    >
                        <Card className="border-0 shadow-sm h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-base font-semibold">
                                        Top Performing Blocks
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    Which sections get the most engagement
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="space-y-1">
                                    {TOP_BLOCKS.map((block, i) => {
                                        const BlockIcon = block.icon;
                                        return (
                                            <motion.div
                                                key={block.name}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: 0.4 + i * 0.08,
                                                }}
                                                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "flex items-center justify-center w-8 h-8 rounded-lg bg-muted/70",
                                                        )}
                                                    >
                                                        <BlockIcon
                                                            className={cn(
                                                                "h-4 w-4",
                                                                block.color,
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {block.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {block.metric}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Engagement Heatmap */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Card className="border-0 shadow-sm h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-base font-semibold">
                                        Engagement Heatmap
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    Visual engagement intensity by page section
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="space-y-1.5 rounded-lg overflow-hidden border p-2 bg-muted/20">
                                    {HEATMAP_SECTIONS.map((section, i) => (
                                        <HeatmapSection
                                            key={section.name}
                                            name={section.name}
                                            intensity={section.intensity}
                                            height={section.height}
                                            index={i}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-3 px-1">
                                    <span className="text-[10px] text-muted-foreground">
                                        Low engagement
                                    </span>
                                    <div className="flex-1 mx-3 h-1.5 rounded-full bg-gradient-to-r from-purple-100 via-purple-300 to-[#8e78fb]" />
                                    <span className="text-[10px] text-muted-foreground">
                                        High engagement
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* AI Insights */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                >
                    <Card className="border-0 shadow-sm overflow-hidden relative bg-gradient-to-br from-purple-600 via-[#8e78fb] to-indigo-600 text-white">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                        <CardHeader className="relative pb-2">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-white">
                                        AI Insights
                                    </CardTitle>
                                    <CardDescription className="text-purple-100">
                                        Smart recommendations to improve your
                                        page performance
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {AI_INSIGHTS.map((insight, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.4,
                                            delay: 0.55 + i * 0.1,
                                        }}
                                        className="rounded-xl bg-white/10 backdrop-blur-sm p-4 hover:bg-white/15 transition-colors border border-white/10"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-[10px] font-semibold uppercase tracking-wider border-0",
                                                    insight.impact === "high"
                                                        ? "bg-yellow-400/20 text-yellow-200"
                                                        : "bg-white/15 text-white/80",
                                                )}
                                            >
                                                {insight.impact} impact
                                            </Badge>
                                        </div>
                                        <h4 className="text-sm font-semibold mb-1.5 text-white">
                                            {insight.title}
                                        </h4>
                                        <p className="text-xs leading-relaxed text-purple-100">
                                            {insight.description}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </PageShell>
        </TooltipProvider>
    );
}
