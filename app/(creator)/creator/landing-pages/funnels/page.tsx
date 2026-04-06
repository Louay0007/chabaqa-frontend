"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
    DialogTrigger,
} from "@/components/ui/dialog";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageShell, PageHeader } from "@/components/creator-dashboard";
import type {
    Funnel,
    FunnelStep,
    FunnelStepType,
    FunnelStatus,
    FunnelConnection,
    FunnelAnalytics,
} from "@/lib/landing-pages/types";
import {
    Globe,
    Mail,
    CreditCard,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Video,
    Plus,
    MoreVertical,
    Pencil,
    Copy,
    BarChart3,
    Archive,
    Trash2,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Eye,
    DollarSign,
    Users,
    Zap,
    ChevronRight,
    ChevronDown,
    GripVertical,
    Settings,
    X,
    Play,
    Pause,
    Clock,
    Target,
    Filter,
    MousePointerClick,
    Layers,
    GitBranch,
    Route,
} from "lucide-react";
import { funnelsApi, type CreateFunnelData } from "@/lib/api/landing-pages.api";

// ─── Animated counter hook ──────────────────────────────────────────────────

function useAnimatedCounter(
    target: number,
    duration = 1200,
    suffix = "",
    prefix = "",
) {
    const [display, setDisplay] = useState(prefix + "0" + suffix);

    useEffect(() => {
        const startTime = Date.now();
        const isDecimal = !Number.isInteger(target);

        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;

            if (isDecimal) {
                setDisplay(prefix + current.toFixed(1) + suffix);
            } else {
                setDisplay(
                    prefix + Math.round(current).toLocaleString() + suffix,
                );
            }

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    }, [target, duration, suffix, prefix]);

    return display;
}

// ─── Step type config ───────────────────────────────────────────────────────

const STEP_TYPE_CONFIG: Record<
    FunnelStepType,
    { label: string; icon: typeof Globe; color: string; bg: string }
> = {
    landing: {
        label: "Landing Page",
        icon: Globe,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/30",
    },
    "opt-in": {
        label: "Opt-in",
        icon: Mail,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/30",
    },
    checkout: {
        label: "Checkout",
        icon: CreditCard,
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-900/30",
    },
    upsell: {
        label: "Upsell",
        icon: TrendingUp,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/30",
    },
    downsell: {
        label: "Downsell",
        icon: TrendingDown,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-900/30",
    },
    "thank-you": {
        label: "Thank You",
        icon: CheckCircle,
        color: "text-pink-600 dark:text-pink-400",
        bg: "bg-pink-50 dark:bg-pink-900/30",
    },
    webinar: {
        label: "Webinar",
        icon: Video,
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-900/30",
    },
};

const STATUS_CONFIG: Record<
    FunnelStatus,
    { label: string; className: string }
> = {
    active: {
        label: "Active",
        className:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    },
    draft: {
        label: "Draft",
        className:
            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    },
    paused: {
        label: "Paused",
        className:
            "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    },
    archived: {
        label: "Archived",
        className:
            "bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500 border-gray-200 dark:border-gray-800",
    },
};

// ─── Mock landing pages for step association ────────────────────────────────

const MOCK_LANDING_PAGES = [
    { id: "lp-1", title: "Arabic Course - Main" },
    { id: "lp-2", title: "Free Ebook Download" },
    { id: "lp-3", title: "Coaching Signup" },
    { id: "lp-4", title: "Webinar Registration" },
    { id: "lp-5", title: "Checkout - Premium" },
    { id: "lp-6", title: "Thank You - Default" },
    { id: "lp-7", title: "Upsell - VIP Package" },
    { id: "lp-8", title: "Ramadan Challenge Signup" },
];

// ─── Mock funnels ───────────────────────────────────────────────────────────

// ─── Funnels list (fetched from API) ────────────────────────────────────────

const MOCK_FUNNELS: Funnel[] = [];
/*
    {
        id: "funnel-1",
        name: "Arabic Course Launch",
        description:
            "Complete launch funnel for the premium Arabic language course with webinar registration",
        status: "active",
        steps: [
            {
                id: "s1-1",
                type: "landing",
                title: "Course Landing Page",
                pageId: "lp-1",
                order: 0,
                visitors: 12840,
                conversions: 4623,
                conversionRate: 36.0,
            },
            {
                id: "s1-2",
                type: "opt-in",
                title: "Email Signup",
                pageId: "lp-2",
                order: 1,
                visitors: 4623,
                conversions: 3241,
                conversionRate: 70.1,
            },
            {
                id: "s1-3",
                type: "webinar",
                title: "Live Webinar",
                pageId: "lp-4",
                order: 2,
                visitors: 3241,
                conversions: 1782,
                conversionRate: 55.0,
            },
            {
                id: "s1-4",
                type: "checkout",
                title: "Course Checkout",
                pageId: "lp-5",
                order: 3,
                visitors: 1782,
                conversions: 534,
                conversionRate: 30.0,
            },
            {
                id: "s1-5",
                type: "thank-you",
                title: "Welcome & Thank You",
                pageId: "lp-6",
                order: 4,
                visitors: 534,
                conversions: 534,
                conversionRate: 100,
            },
        ],
        connections: [
            { id: "c1-1", fromStepId: "s1-1", toStepId: "s1-2", label: "36%" },
            {
                id: "c1-2",
                fromStepId: "s1-2",
                toStepId: "s1-3",
                label: "70.1%",
            },
            { id: "c1-3", fromStepId: "s1-3", toStepId: "s1-4", label: "55%" },
            { id: "c1-4", fromStepId: "s1-4", toStepId: "s1-5", label: "30%" },
        ],
        analytics: {
            totalVisitors: 12840,
            totalConversions: 534,
            overallConversionRate: 4.2,
            revenue: 26700,
            avgTimeToConvert: 4.2,
            stepMetrics: [
                {
                    stepId: "s1-1",
                    visitors: 12840,
                    conversions: 4623,
                    dropOff: 64.0,
                    conversionRate: 36.0,
                },
                {
                    stepId: "s1-2",
                    visitors: 4623,
                    conversions: 3241,
                    dropOff: 29.9,
                    conversionRate: 70.1,
                },
                {
                    stepId: "s1-3",
                    visitors: 3241,
                    conversions: 1782,
                    dropOff: 45.0,
                    conversionRate: 55.0,
                },
                {
                    stepId: "s1-4",
                    visitors: 1782,
                    conversions: 534,
                    dropOff: 70.0,
                    conversionRate: 30.0,
                },
                {
                    stepId: "s1-5",
                    visitors: 534,
                    conversions: 534,
                    dropOff: 0,
                    conversionRate: 100,
                },
            ],
        },
        createdAt: "2024-11-15T10:00:00Z",
        updatedAt: "2025-01-10T14:30:00Z",
    },
    {
        id: "funnel-2",
        name: "Free Ebook Funnel",
        description:
            "Simple lead magnet funnel to capture emails with a free Arabic learning ebook",
        status: "active",
        steps: [
            {
                id: "s2-1",
                type: "landing",
                title: "Ebook Landing Page",
                pageId: "lp-2",
                order: 0,
                visitors: 8420,
                conversions: 3789,
                conversionRate: 45.0,
            },
            {
                id: "s2-2",
                type: "opt-in",
                title: "Download Form",
                order: 1,
                visitors: 3789,
                conversions: 3032,
                conversionRate: 80.0,
            },
            {
                id: "s2-3",
                type: "thank-you",
                title: "Download & Next Steps",
                pageId: "lp-6",
                order: 2,
                visitors: 3032,
                conversions: 3032,
                conversionRate: 100,
            },
        ],
        connections: [
            { id: "c2-1", fromStepId: "s2-1", toStepId: "s2-2", label: "45%" },
            { id: "c2-2", fromStepId: "s2-2", toStepId: "s2-3", label: "80%" },
        ],
        analytics: {
            totalVisitors: 8420,
            totalConversions: 3032,
            overallConversionRate: 36.0,
            revenue: 0,
            avgTimeToConvert: 1.5,
            stepMetrics: [
                {
                    stepId: "s2-1",
                    visitors: 8420,
                    conversions: 3789,
                    dropOff: 55.0,
                    conversionRate: 45.0,
                },
                {
                    stepId: "s2-2",
                    visitors: 3789,
                    conversions: 3032,
                    dropOff: 20.0,
                    conversionRate: 80.0,
                },
                {
                    stepId: "s2-3",
                    visitors: 3032,
                    conversions: 3032,
                    dropOff: 0,
                    conversionRate: 100,
                },
            ],
        },
        createdAt: "2024-12-01T08:00:00Z",
        updatedAt: "2025-01-08T09:15:00Z",
    },
    {
        id: "funnel-3",
        name: "Coaching Package",
        description:
            "High-ticket coaching package funnel with upsell for VIP access",
        status: "draft",
        steps: [
            {
                id: "s3-1",
                type: "landing",
                title: "Coaching Overview",
                pageId: "lp-3",
                order: 0,
                visitors: 0,
                conversions: 0,
            },
            {
                id: "s3-2",
                type: "checkout",
                title: "Package Selection",
                order: 1,
                visitors: 0,
                conversions: 0,
            },
            {
                id: "s3-3",
                type: "upsell",
                title: "VIP Upgrade",
                pageId: "lp-7",
                order: 2,
                visitors: 0,
                conversions: 0,
            },
            {
                id: "s3-4",
                type: "thank-you",
                title: "Welcome Aboard",
                order: 3,
                visitors: 0,
                conversions: 0,
            },
        ],
        connections: [
            { id: "c3-1", fromStepId: "s3-1", toStepId: "s3-2" },
            { id: "c3-2", fromStepId: "s3-2", toStepId: "s3-3" },
            { id: "c3-3", fromStepId: "s3-3", toStepId: "s3-4" },
        ],
        analytics: {
            totalVisitors: 0,
            totalConversions: 0,
            overallConversionRate: 0,
            revenue: 0,
            avgTimeToConvert: 0,
            stepMetrics: [],
        },
        createdAt: "2025-01-02T12:00:00Z",
        updatedAt: "2025-01-09T16:45:00Z",
    },
    {
        id: "funnel-4",
        name: "Ramadan Challenge",
        description:
            "30-day Ramadan Arabic learning challenge with special pricing",
        status: "paused",
        steps: [
            {
                id: "s4-1",
                type: "landing",
                title: "Challenge Landing",
                pageId: "lp-8",
                order: 0,
                visitors: 5200,
                conversions: 2340,
                conversionRate: 45.0,
            },
            {
                id: "s4-2",
                type: "opt-in",
                title: "Challenge Signup",
                order: 1,
                visitors: 2340,
                conversions: 1872,
                conversionRate: 80.0,
            },
            {
                id: "s4-3",
                type: "checkout",
                title: "Premium Access",
                order: 2,
                visitors: 1872,
                conversions: 468,
                conversionRate: 25.0,
            },
            {
                id: "s4-4",
                type: "thank-you",
                title: "Welcome to the Challenge",
                order: 3,
                visitors: 468,
                conversions: 468,
                conversionRate: 100,
            },
        ],
        connections: [
            { id: "c4-1", fromStepId: "s4-1", toStepId: "s4-2", label: "45%" },
            { id: "c4-2", fromStepId: "s4-2", toStepId: "s4-3", label: "80%" },
            { id: "c4-3", fromStepId: "s4-3", toStepId: "s4-4", label: "25%" },
        ],
        analytics: {
            totalVisitors: 5200,
            totalConversions: 468,
            overallConversionRate: 9.0,
            revenue: 14040,
            avgTimeToConvert: 2.8,
            stepMetrics: [
                {
                    stepId: "s4-1",
                    visitors: 5200,
                    conversions: 2340,
                    dropOff: 55.0,
                    conversionRate: 45.0,
                },
                {
                    stepId: "s4-2",
                    visitors: 2340,
                    conversions: 1872,
                    dropOff: 20.0,
                    conversionRate: 80.0,
                },
                {
                    stepId: "s4-3",
                    visitors: 1872,
                    conversions: 468,
                    dropOff: 75.0,
                    conversionRate: 25.0,
                },
                {
                    stepId: "s4-4",
                    visitors: 468,
                    conversions: 468,
                    dropOff: 0,
                    conversionRate: 100,
                },
            ],
        },
        createdAt: "2025-01-05T06:00:00Z",
        updatedAt: "2025-01-07T11:20:00Z",
    },
];

// ─── Funnel template definitions ────────────────────────────────────────────

*/

interface FunnelTemplate {
    id: string;
    name: string;
    description: string;
    steps: { type: FunnelStepType; title: string }[];
}

const FUNNEL_TEMPLATES: FunnelTemplate[] = [
    {
        id: "tmpl-sales",
        name: "Sales Funnel",
        description: "Classic sales funnel with opt-in, checkout, and upsell",
        steps: [
            { type: "landing", title: "Sales Page" },
            { type: "opt-in", title: "Lead Capture" },
            { type: "checkout", title: "Order Form" },
            { type: "upsell", title: "One-Time Offer" },
            { type: "thank-you", title: "Confirmation" },
        ],
    },
    {
        id: "tmpl-webinar",
        name: "Webinar Funnel",
        description: "Register, attend, and convert with a live webinar",
        steps: [
            { type: "landing", title: "Webinar Page" },
            { type: "opt-in", title: "Registration" },
            { type: "webinar", title: "Live Webinar" },
            { type: "checkout", title: "Special Offer" },
            { type: "thank-you", title: "Thank You" },
        ],
    },
    {
        id: "tmpl-lead",
        name: "Lead Magnet Funnel",
        description: "Simple lead capture with a free resource download",
        steps: [
            { type: "landing", title: "Lead Page" },
            { type: "opt-in", title: "Download Form" },
            { type: "thank-you", title: "Download Page" },
        ],
    },
    {
        id: "tmpl-course",
        name: "Course Launch Funnel",
        description:
            "Full course launch with waitlist, webinar, and tiered checkout",
        steps: [
            { type: "landing", title: "Course Preview" },
            { type: "opt-in", title: "Waitlist Signup" },
            { type: "webinar", title: "Free Masterclass" },
            { type: "checkout", title: "Enrollment" },
            { type: "upsell", title: "Premium Upgrade" },
            { type: "thank-you", title: "Welcome" },
        ],
    },
];

// ─── Floating shapes for hero ───────────────────────────────────────────────

function FloatingShape({
    className,
    delay = 0,
    duration = 6,
}: {
    className?: string;
    delay?: number;
    duration?: number;
}) {
    return (
        <motion.div
            className={cn(
                "absolute rounded-2xl pointer-events-none",
                className,
            )}
            animate={{
                y: [0, -15, 5, -10, 0],
                x: [0, 8, -5, 3, 0],
                rotate: [0, 5, -3, 2, 0],
                scale: [1, 1.05, 0.98, 1.02, 1],
            }}
            transition={{
                duration,
                repeat: Infinity,
                delay,
                ease: "easeInOut",
            }}
        />
    );
}

// ─── Hero Section ───────────────────────────────────────────────────────────

function HeroBanner() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#8e78fb] via-[#a855f7] to-[#f65887] p-8 md:p-12"
        >
            <FloatingShape
                className="w-24 h-24 bg-white/20 top-4 right-12 blur-sm"
                delay={0}
                duration={7}
            />
            <FloatingShape
                className="w-16 h-16 bg-white/15 bottom-8 right-1/3 rounded-full"
                delay={1.5}
                duration={5}
            />
            <FloatingShape
                className="w-20 h-20 bg-white/10 top-1/2 left-8 rotate-45"
                delay={0.8}
                duration={6}
            />
            <FloatingShape
                className="w-12 h-12 bg-white/20 top-6 left-1/3 rounded-full blur-[2px]"
                delay={2}
                duration={8}
            />
            <FloatingShape
                className="w-32 h-32 bg-white/5 -bottom-4 -right-4 rounded-3xl"
                delay={0.5}
                duration={9}
            />

            <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            />

            <div className="relative z-10 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm">
                        <Route className="h-3 w-3 mr-1" />
                        Funnel Builder
                    </Badge>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
                >
                    Marketing{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-amber-200">
                        Funnels
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-white/80 text-base md:text-lg mb-2 max-w-lg"
                >
                    Build automated conversion paths that turn visitors into
                    customers. Design, test, and optimize every step of the
                    journey.
                </motion.p>
            </div>
        </motion.div>
    );
}

// ─── Stats Bar ──────────────────────────────────────────────────────────────

function StatsBar({ funnels }: { funnels: Funnel[] }) {
    const total = funnels.length;
    const active = funnels.filter((f) => f.status === "active").length;
    const totalConversions = funnels.reduce(
        (s, f) => s + (f.analytics?.totalConversions ?? 0),
        0,
    );
    const totalRevenue = funnels.reduce(
        (s, f) => s + (f.analytics?.revenue ?? 0),
        0,
    );

    const animTotal = useAnimatedCounter(total, 800);
    const animActive = useAnimatedCounter(active, 900);
    const animConversions = useAnimatedCounter(totalConversions, 1100);
    const animRevenue = useAnimatedCounter(totalRevenue, 1200, "", "$");

    const stats = [
        {
            label: "Total Funnels",
            value: animTotal,
            icon: Layers,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-50 dark:bg-violet-900/20",
        },
        {
            label: "Active",
            value: animActive,
            icon: Zap,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
        },
        {
            label: "Total Conversions",
            value: animConversions,
            icon: MousePointerClick,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
            label: "Revenue",
            value: animRevenue,
            icon: DollarSign,
            color: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-50 dark:bg-rose-900/20",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i + 0.3, duration: 0.4 }}
                >
                    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
                        <CardContent className="p-4 md:p-5">
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110",
                                        stat.bg,
                                    )}
                                >
                                    <stat.icon
                                        className={cn("h-5 w-5", stat.color)}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground font-medium truncate">
                                        {stat.label}
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold tracking-tight">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

// ─── Mini Flowchart (for funnel cards) ──────────────────────────────────────

function MiniFlowchart({ steps }: { steps: FunnelStep[] }) {
    return (
        <div className="flex items-center gap-0.5 py-2 px-1 overflow-x-auto">
            {steps.map((step, i) => {
                const config = STEP_TYPE_CONFIG[step.type];
                const StepIcon = config.icon;
                return (
                    <div
                        key={step.id}
                        className="flex items-center flex-shrink-0"
                    >
                        <TooltipProvider delayDuration={200}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110",
                                            config.bg,
                                        )}
                                    >
                                        <StepIcon
                                            className={cn(
                                                "h-3.5 w-3.5",
                                                config.color,
                                            )}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    <p className="font-medium">{step.title}</p>
                                    <p className="text-muted-foreground">
                                        {config.label}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {i < steps.length - 1 && (
                            <div className="w-4 h-px bg-muted-foreground/30 flex-shrink-0" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Funnel Card ────────────────────────────────────────────────────────────

function FunnelCard({
    funnel,
    index,
    onEdit,
    onViewAnalytics,
    onDuplicate,
    onArchive,
    onDelete,
}: {
    funnel: Funnel;
    index: number;
    onEdit: (funnel: Funnel) => void;
    onViewAnalytics: (funnel: Funnel) => void;
    onDuplicate: (funnel: Funnel) => void;
    onArchive: (funnel: Funnel) => void;
    onDelete: (funnel: Funnel) => void;
}) {
    const statusCfg = STATUS_CONFIG[funnel.status];
    const visitors = funnel.analytics?.totalVisitors ?? 0;
    const conversions = funnel.analytics?.totalConversions ?? 0;
    const rate = funnel.analytics?.overallConversionRate ?? 0;
    const revenue = funnel.analytics?.revenue ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index + 0.2, duration: 0.4 }}
            whileHover={{ y: -2 }}
        >
            <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
                {/* Color top bar */}
                <div className="h-1 bg-gradient-to-r from-[#8e78fb] via-[#a855f7] to-[#f65887]" />

                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-base font-semibold truncate">
                                {funnel.name}
                            </CardTitle>
                            {funnel.description && (
                                <CardDescription className="text-xs mt-1 line-clamp-2">
                                    {funnel.description}
                                </CardDescription>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px] px-2 py-0.5",
                                    statusCfg.className,
                                )}
                            >
                                {statusCfg.label}
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                    >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-44"
                                >
                                    <DropdownMenuItem
                                        onClick={() => onEdit(funnel)}
                                    >
                                        <Pencil className="h-3.5 w-3.5 mr-2" />
                                        Edit Funnel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDuplicate(funnel)}
                                    >
                                        <Copy className="h-3.5 w-3.5 mr-2" />
                                        Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onViewAnalytics(funnel)}
                                    >
                                        <BarChart3 className="h-3.5 w-3.5 mr-2" />
                                        View Analytics
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onArchive(funnel)}
                                    >
                                        <Archive className="h-3.5 w-3.5 mr-2" />
                                        Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDelete(funnel)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pb-3 flex-1">
                    {/* Mini flowchart */}
                    <div className="bg-muted/50 rounded-lg p-2 mb-3">
                        <MiniFlowchart steps={funnel.steps} />
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs">
                                Visitors
                            </span>
                            <span className="ml-auto font-medium text-xs">
                                {visitors.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs">
                                Conv.
                            </span>
                            <span className="ml-auto font-medium text-xs">
                                {conversions.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs">
                                Rate
                            </span>
                            <span className="ml-auto font-medium text-xs">
                                {rate}%
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs">
                                Revenue
                            </span>
                            <span className="ml-auto font-medium text-xs">
                                ${revenue.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="pt-0 pb-3 px-6 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => onViewAnalytics(funnel)}
                    >
                        <BarChart3 className="h-3 w-3 mr-1.5" />
                        Analytics
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 text-xs h-8 bg-gradient-to-r from-[#8e78fb] to-[#a855f7] hover:opacity-90 text-white"
                        onClick={() => onEdit(funnel)}
                    >
                        <Pencil className="h-3 w-3 mr-1.5" />
                        Edit
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

// ─── Create Funnel Dialog ───────────────────────────────────────────────────

function CreateFunnelDialog({
    open,
    onOpenChange,
    onCreate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (
        name: string,
        description: string,
        template: FunnelTemplate,
    ) => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<string>(
        FUNNEL_TEMPLATES[0].id,
    );

    const template = FUNNEL_TEMPLATES.find((t) => t.id === selectedTemplate)!;

    const handleCreate = () => {
        if (!name.trim()) return;
        onCreate(name.trim(), description.trim(), template);
        setName("");
        setDescription("");
        setSelectedTemplate(FUNNEL_TEMPLATES[0].id);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30">
                            <Plus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        Create New Funnel
                    </DialogTitle>
                    <DialogDescription>
                        Set up a new marketing funnel to convert visitors into
                        customers.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            Funnel Name
                        </label>
                        <Input
                            placeholder="e.g. Premium Course Launch"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            Description
                        </label>
                        <textarea
                            placeholder="Briefly describe what this funnel is for..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                        />
                    </div>

                    {/* Template selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Choose a Template
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {FUNNEL_TEMPLATES.map((tmpl) => (
                                <motion.button
                                    key={tmpl.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedTemplate(tmpl.id)}
                                    className={cn(
                                        "text-left p-3 rounded-xl border-2 transition-all duration-200",
                                        selectedTemplate === tmpl.id
                                            ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 shadow-sm"
                                            : "border-border hover:border-muted-foreground/30",
                                    )}
                                >
                                    <p className="text-sm font-medium mb-0.5">
                                        {tmpl.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                        {tmpl.description}
                                    </p>
                                    {/* Mini step visualization */}
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {tmpl.steps.map((s, i) => {
                                            const cfg =
                                                STEP_TYPE_CONFIG[s.type];
                                            const Icon = cfg.icon;
                                            return (
                                                <div
                                                    key={i}
                                                    className="flex items-center"
                                                >
                                                    <div
                                                        className={cn(
                                                            "w-5 h-5 rounded flex items-center justify-center",
                                                            cfg.bg,
                                                        )}
                                                    >
                                                        <Icon
                                                            className={cn(
                                                                "h-2.5 w-2.5",
                                                                cfg.color,
                                                            )}
                                                        />
                                                    </div>
                                                    {i <
                                                        tmpl.steps.length -
                                                            1 && (
                                                        <ChevronRight className="h-3 w-3 text-muted-foreground/40 mx-0.5" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        disabled={!name.trim()}
                        onClick={handleCreate}
                        className="bg-gradient-to-r from-[#8e78fb] to-[#a855f7] hover:opacity-90 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Funnel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Visual Editor: Step Node ───────────────────────────────────────────────

function StepNode({
    step,
    index,
    isSelected,
    onSelect,
    total,
}: {
    step: FunnelStep;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    total: number;
}) {
    const config = STEP_TYPE_CONFIG[step.type];
    const StepIcon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                delay: index * 0.08,
                duration: 0.4,
                type: "spring",
                stiffness: 200,
            }}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={onSelect}
            className={cn(
                "relative cursor-pointer group",
                "w-48 flex-shrink-0",
            )}
        >
            <Card
                className={cn(
                    "transition-all duration-200 overflow-hidden",
                    isSelected
                        ? "ring-2 ring-violet-500 shadow-lg shadow-violet-500/20"
                        : "hover:shadow-md",
                )}
            >
                {/* Gradient strip */}
                <div
                    className={cn(
                        "h-1 transition-all duration-200",
                        isSelected
                            ? "bg-gradient-to-r from-[#8e78fb] to-[#f65887]"
                            : "bg-muted",
                    )}
                />

                <CardContent className="p-3">
                    {/* Drag handle + type */}
                    <div className="flex items-center gap-2 mb-2">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                        <div className={cn("p-1.5 rounded-lg", config.bg)}>
                            <StepIcon
                                className={cn("h-3.5 w-3.5", config.color)}
                            />
                        </div>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                            {config.label}
                        </span>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-medium truncate mb-2">
                        {step.title}
                    </p>

                    {/* Mini stats */}
                    {step.visitors !== undefined && step.visitors > 0 ? (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {step.visitors.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {(step.conversions ?? 0).toLocaleString()}
                            </span>
                            {step.conversionRate !== undefined && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 h-4"
                                >
                                    {step.conversionRate}%
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">
                            No data yet
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Step number */}
            <div
                className={cn(
                    "absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    isSelected
                        ? "bg-violet-600 text-white"
                        : "bg-muted text-muted-foreground",
                )}
            >
                {index + 1}
            </div>
        </motion.div>
    );
}

// ─── Animated Connection Arrow ──────────────────────────────────────────────

function ConnectionArrow({ label, index }: { label?: string; index: number }) {
    return (
        <div className="flex flex-col items-center justify-center flex-shrink-0 w-16 relative">
            <svg
                width="64"
                height="24"
                viewBox="0 0 64 24"
                className="overflow-visible"
            >
                <motion.line
                    x1="0"
                    y1="12"
                    x2="48"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground/30"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                />
                <motion.polygon
                    points="48,6 60,12 48,18"
                    fill="currentColor"
                    className="text-muted-foreground/30"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.8, duration: 0.3 }}
                />
            </svg>
            {label && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 1, duration: 0.3 }}
                    className="absolute -bottom-3 text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-background px-1 rounded whitespace-nowrap"
                >
                    {label}
                </motion.span>
            )}
        </div>
    );
}

// ─── Add Step Button ────────────────────────────────────────────────────────

function AddStepButton({
    onAdd,
    index,
}: {
    onAdd: (type: FunnelStepType) => void;
    index: number;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const stepTypes: FunnelStepType[] = [
        "landing",
        "opt-in",
        "checkout",
        "upsell",
        "downsell",
        "thank-you",
        "webinar",
    ];

    return (
        <div className="flex flex-col items-center justify-center flex-shrink-0 w-10 relative">
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.6, duration: 0.3 }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 border-2 border-dashed border-violet-300 dark:border-violet-700 flex items-center justify-center hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
                    >
                        <Plus className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                    </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-44">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                        Add Step
                    </p>
                    <DropdownMenuSeparator />
                    {stepTypes.map((type) => {
                        const cfg = STEP_TYPE_CONFIG[type];
                        const Icon = cfg.icon;
                        return (
                            <DropdownMenuItem
                                key={type}
                                onClick={() => onAdd(type)}
                                className="gap-2"
                            >
                                <div className={cn("p-1 rounded", cfg.bg)}>
                                    <Icon
                                        className={cn("h-3 w-3", cfg.color)}
                                    />
                                </div>
                                {cfg.label}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// ─── Step Settings Panel ────────────────────────────────────────────────────

function StepSettingsPanel({
    step,
    onClose,
    onUpdate,
}: {
    step: FunnelStep;
    onClose: () => void;
    onUpdate: (updated: FunnelStep) => void;
}) {
    const config = STEP_TYPE_CONFIG[step.type];
    const StepIcon = config.icon;
    const router = useRouter();
    const [title, setTitle] = useState(step.title);
    const [stepType, setStepType] = useState<FunnelStepType>(step.type);
    const [selectedPage, setSelectedPage] = useState(step.pageId || "");
    const [delay, setDelay] = useState("0");

    const stepTypes: FunnelStepType[] = [
        "landing",
        "opt-in",
        "checkout",
        "upsell",
        "downsell",
        "thank-you",
        "webinar",
    ];

    useEffect(() => {
        setTitle(step.title);
        setStepType(step.type);
        setSelectedPage(step.pageId || "");
    }, [step]);

    const handleSave = () => {
        onUpdate({
            ...step,
            title,
            type: stepType,
            pageId: selectedPage || undefined,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-80 border-l bg-card flex flex-col h-full overflow-y-auto"
        >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg", config.bg)}>
                        <StepIcon className={cn("h-4 w-4", config.color)} />
                    </div>
                    <h3 className="text-sm font-semibold">Step Settings</h3>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onClose}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="p-4 space-y-4 flex-1">
                {/* Title */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                        Step Title
                    </label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>

                {/* Step Type */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                        Step Type
                    </label>
                    <Select
                        value={stepType}
                        onValueChange={(v) => setStepType(v as FunnelStepType)}
                    >
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {stepTypes.map((type) => {
                                const c = STEP_TYPE_CONFIG[type];
                                const Icon = c.icon;
                                return (
                                    <SelectItem key={type} value={type}>
                                        <div className="flex items-center gap-2">
                                            <Icon
                                                className={cn(
                                                    "h-3.5 w-3.5",
                                                    c.color,
                                                )}
                                            />
                                            {c.label}
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Associated Page */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                        Associated Page
                    </label>
                    <Select
                        value={selectedPage}
                        onValueChange={setSelectedPage}
                    >
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select a page..." />
                        </SelectTrigger>
                        <SelectContent>
                            {MOCK_LANDING_PAGES.map((page) => (
                                <SelectItem key={page.id} value={page.id}>
                                    {page.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs gap-1.5 mt-2"
                        onClick={() =>
                            router.push(
                                `/creator/landing-pages/${selectedPage || "demo-1"}/edit`,
                            )
                        }
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Page
                    </Button>
                </div>

                <Separator />

                {/* Delay / Timing */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Delay (minutes)
                    </label>
                    <Input
                        type="number"
                        value={delay}
                        onChange={(e) => setDelay(e.target.value)}
                        min="0"
                        className="h-8 text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">
                        Time to wait before showing this step
                    </p>
                </div>

                <Separator />

                {/* Conditional Logic placeholder */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <GitBranch className="h-3 w-3" />
                        Conditional Logic
                    </label>
                    <div className="border border-dashed rounded-lg p-3 text-center">
                        <GitBranch className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                            Add conditions to control when this step is shown
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs h-7"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Condition
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                {step.visitors !== undefined && step.visitors > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Performance
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-muted/50 rounded-lg p-2 text-center">
                                    <p className="text-lg font-bold">
                                        {step.visitors?.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Visitors
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-2 text-center">
                                    <p className="text-lg font-bold">
                                        {step.conversions?.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Conversions
                                    </p>
                                </div>
                            </div>
                            {step.conversionRate !== undefined && (
                                <div className="bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-lg p-2 text-center">
                                    <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
                                        {step.conversionRate}%
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Conversion Rate
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
                <Button
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-[#8e78fb] to-[#a855f7] hover:opacity-90 text-white text-sm"
                    size="sm"
                >
                    Save Changes
                </Button>
            </div>
        </motion.div>
    );
}

// ─── Visual Funnel Editor ───────────────────────────────────────────────────

function FunnelEditor({
    funnel,
    onBack,
    onViewAnalytics,
}: {
    funnel: Funnel;
    onBack: () => void;
    onViewAnalytics: () => void;
}) {
    const [steps, setSteps] = useState<FunnelStep[]>(funnel.steps);
    const [connections, setConnections] = useState<FunnelConnection[]>(
        funnel.connections,
    );
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

    const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;

    const handleAddStep = (afterIndex: number, type: FunnelStepType) => {
        const cfg = STEP_TYPE_CONFIG[type];
        const newStep: FunnelStep = {
            id: `new-${Date.now()}`,
            type,
            title: cfg.label,
            order: afterIndex + 1,
            visitors: 0,
            conversions: 0,
        };
        const updated = [...steps];
        updated.splice(afterIndex + 1, 0, newStep);
        // Re-index orders
        updated.forEach((s, i) => (s.order = i));
        setSteps(updated);

        // Rebuild connections
        const newConns: FunnelConnection[] = [];
        for (let i = 0; i < updated.length - 1; i++) {
            newConns.push({
                id: `conn-${i}`,
                fromStepId: updated[i].id,
                toStepId: updated[i + 1].id,
            });
        }
        setConnections(newConns);
    };

    const handleUpdateStep = (updated: FunnelStep) => {
        setSteps((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s)),
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full"
        >
            {/* Editor Header */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Back
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold truncate">
                            {funnel.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {steps.length} steps · {connections.length}{" "}
                            connections
                        </p>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[10px] px-2 py-0.5",
                            STATUS_CONFIG[funnel.status].className,
                        )}
                    >
                        {STATUS_CONFIG[funnel.status].label}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewAnalytics}
                    >
                        <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                        Analytics
                    </Button>
                    <Button
                        size="sm"
                        className="bg-gradient-to-r from-[#8e78fb] to-[#a855f7] hover:opacity-90 text-white"
                    >
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                        Publish
                    </Button>
                </div>
            </div>

            {/* Editor Body */}
            <div className="flex flex-1 min-h-0 -mx-1">
                {/* Canvas */}
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <div className="min-h-[300px] flex items-start justify-start p-6">
                        <div className="flex items-center gap-0">
                            {steps.map((step, i) => (
                                <div
                                    key={step.id}
                                    className="flex items-center"
                                >
                                    {/* Add button before first step */}
                                    {i === 0 && (
                                        <AddStepButton
                                            onAdd={(type) =>
                                                handleAddStep(-1, type)
                                            }
                                            index={0}
                                        />
                                    )}

                                    <StepNode
                                        step={step}
                                        index={i}
                                        isSelected={selectedStepId === step.id}
                                        onSelect={() =>
                                            setSelectedStepId(
                                                selectedStepId === step.id
                                                    ? null
                                                    : step.id,
                                            )
                                        }
                                        total={steps.length}
                                    />

                                    {i < steps.length - 1 && (
                                        <>
                                            <ConnectionArrow
                                                label={connections[i]?.label}
                                                index={i}
                                            />
                                            <AddStepButton
                                                onAdd={(type) =>
                                                    handleAddStep(i, type)
                                                }
                                                index={i + 1}
                                            />
                                        </>
                                    )}

                                    {/* Add button after last step */}
                                    {i === steps.length - 1 && (
                                        <>
                                            <div className="w-4" />
                                            <AddStepButton
                                                onAdd={(type) =>
                                                    handleAddStep(i, type)
                                                }
                                                index={steps.length}
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Settings panel */}
                <AnimatePresence mode="wait">
                    {selectedStep && (
                        <StepSettingsPanel
                            key={selectedStep.id}
                            step={selectedStep}
                            onClose={() => setSelectedStepId(null)}
                            onUpdate={handleUpdateStep}
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ─── Funnel Analytics Panel ─────────────────────────────────────────────────

function FunnelAnalyticsPanel({
    funnel,
    onBack,
}: {
    funnel: Funnel;
    onBack: () => void;
}) {
    const [timeFilter, setTimeFilter] = useState("30d");
    const analytics = funnel.analytics;

    if (!analytics) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
            >
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                    No analytics data available yet
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Back to Editor
                </Button>
            </motion.div>
        );
    }

    const maxVisitors = Math.max(
        ...funnel.steps.map((s) => s.visitors ?? 0),
        1,
    );

    // Find best performing step (highest conversion rate, excluding thank-you)
    const bestStep = funnel.steps
        .filter((s) => s.type !== "thank-you" && (s.conversionRate ?? 0) > 0)
        .sort((a, b) => (b.conversionRate ?? 0) - (a.conversionRate ?? 0))[0];

    const animRevenue = useAnimatedCounter(analytics.revenue, 1200, "", "$");
    const animRate = useAnimatedCounter(
        analytics.overallConversionRate,
        1000,
        "%",
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Back
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div>
                        <h2 className="text-lg font-semibold">
                            {funnel.name} — Analytics
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Funnel performance overview
                        </p>
                    </div>
                </div>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-36 h-8 text-sm">
                        <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                        <CardContent className="p-4 text-center">
                            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                            <p className="text-2xl font-bold">{animRevenue}</p>
                            <p className="text-xs text-muted-foreground">
                                Total Revenue
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-violet-400 to-violet-600" />
                        <CardContent className="p-4 text-center">
                            <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400 mx-auto mb-1" />
                            <p className="text-2xl font-bold">{animRate}</p>
                            <p className="text-xs text-muted-foreground">
                                Avg Conversion Rate
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                        <CardContent className="p-4 text-center">
                            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                            <p className="text-2xl font-bold">
                                {bestStep ? bestStep.title : "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Best Performing Step
                                {bestStep && ` (${bestStep.conversionRate}%)`}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Funnel Visualization */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Route className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        Funnel Flow
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Visual breakdown of visitor progression through each
                        step
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                    <div className="space-y-3">
                        {funnel.steps.map((step, i) => {
                            const visitors = step.visitors ?? 0;
                            const widthPct =
                                maxVisitors > 0
                                    ? (visitors / maxVisitors) * 100
                                    : 0;
                            const config = STEP_TYPE_CONFIG[step.type];
                            const StepIcon = config.icon;
                            const metric = analytics.stepMetrics.find(
                                (m) => m.stepId === step.id,
                            );

                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: i * 0.1 + 0.2,
                                        duration: 0.4,
                                    }}
                                    className="space-y-1"
                                >
                                    {/* Drop-off indicator between steps */}
                                    {i > 0 && metric && metric.dropOff > 0 && (
                                        <div className="flex items-center gap-2 pl-8 py-1">
                                            <div className="flex-1 border-l-2 border-dashed border-red-300/50 dark:border-red-800/50 pl-3">
                                                <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">
                                                    ↓ {metric.dropOff}% drop-off
                                                </span>
                                            </div>
                                            {step.conversionRate !==
                                                undefined && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] h-4 px-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                >
                                                    {step.conversionRate}%
                                                    converted
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        {/* Step icon */}
                                        <div
                                            className={cn(
                                                "p-1.5 rounded-lg flex-shrink-0",
                                                config.bg,
                                            )}
                                        >
                                            <StepIcon
                                                className={cn(
                                                    "h-4 w-4",
                                                    config.color,
                                                )}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Labels */}
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium truncate">
                                                    {step.title}
                                                </span>
                                                <span className="text-sm font-semibold flex-shrink-0 ml-2">
                                                    {visitors.toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Animated bar */}
                                            <div className="relative h-8 bg-muted/50 rounded-lg overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${widthPct}%`,
                                                    }}
                                                    transition={{
                                                        delay: i * 0.15 + 0.3,
                                                        duration: 0.8,
                                                        ease: [
                                                            0.33, 1, 0.68, 1,
                                                        ],
                                                    }}
                                                    className={cn(
                                                        "absolute inset-y-0 left-0 rounded-lg",
                                                        i === 0
                                                            ? "bg-gradient-to-r from-violet-500/80 to-violet-400/60"
                                                            : i ===
                                                                funnel.steps
                                                                    .length -
                                                                    1
                                                              ? "bg-gradient-to-r from-emerald-500/80 to-emerald-400/60"
                                                              : "bg-gradient-to-r from-[#8e78fb]/70 to-[#a855f7]/50",
                                                    )}
                                                />
                                                <div className="absolute inset-0 flex items-center px-3">
                                                    <span className="text-xs font-medium text-foreground/80 relative z-10">
                                                        {config.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Summary line */}
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Overall: {analytics.totalVisitors.toLocaleString()}{" "}
                            visitors →{" "}
                            {analytics.totalConversions.toLocaleString()}{" "}
                            conversions
                        </span>
                        <Badge className="bg-gradient-to-r from-[#8e78fb] to-[#f65887] text-white border-0">
                            {analytics.overallConversionRate}% conversion rate
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─── Delete Confirmation Dialog ─────────────────────────────────────────────

function DeleteDialog({
    open,
    name,
    onOpenChange,
    onConfirm,
}: {
    open: boolean;
    name: string;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Delete Funnel
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-foreground">
                            {name}
                        </span>
                        ? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={onConfirm}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main View type ─────────────────────────────────────────────────────────

type ViewMode =
    | { type: "list" }
    | { type: "editor"; funnelId: string }
    | { type: "analytics"; funnelId: string };

// ─── Page Component ─────────────────────────────────────────────────────────

export default function FunnelsPage() {
    const [funnels, setFunnels] = useState<any[]>([]);
    const [isLoadingFunnels, setIsLoadingFunnels] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>({ type: "list" });
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Funnel | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | FunnelStatus>(
        "all",
    );

    useEffect(() => {
        let cancelled = false;
        funnelsApi
            .getAll()
            .then((res) => {
                if (!cancelled) {
                    setFunnels((res as any).data ?? []);
                    setIsLoadingFunnels(false);
                }
            })
            .catch(() => {
                if (!cancelled) setIsLoadingFunnels(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const filteredFunnels = useMemo(() => {
        return funnels.filter((f) => {
            const matchesSearch =
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.description ?? "")
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
            const matchesStatus =
                statusFilter === "all" || f.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [funnels, searchQuery, statusFilter]);

    const handleCreate = async (
        name: string,
        description: string,
        template: FunnelTemplate,
    ) => {
        try {
            const res = await funnelsApi.create({
                name,
                description: description || undefined,
                steps: template.steps.map((s, i) => ({
                    id: `ns-${Date.now()}-${i}`,
                    type: s.type,
                    title: s.title,
                    order: i,
                    visitors: 0,
                    conversions: 0,
                })),
                connections: [],
            });
            const newFunnel = (res as any).data;
            setFunnels((prev) => [newFunnel, ...prev]);
            setViewMode({
                type: "editor",
                funnelId: newFunnel.id || newFunnel._id,
            });
        } catch (err) {
            console.error("Failed to create funnel", err);
        }
    };

    const handleDuplicate = (funnel: Funnel) => {
        const duped: Funnel = {
            ...funnel,
            id: `funnel-${Date.now()}`,
            name: `${funnel.name} (Copy)`,
            status: "draft",
            steps: funnel.steps.map((s) => ({
                ...s,
                id: `dup-${Date.now()}-${s.id}`,
                visitors: 0,
                conversions: 0,
                conversionRate: undefined,
            })),
            connections: funnel.connections.map((c, i) => ({
                ...c,
                id: `dup-c-${Date.now()}-${i}`,
            })),
            analytics: {
                totalVisitors: 0,
                totalConversions: 0,
                overallConversionRate: 0,
                revenue: 0,
                avgTimeToConvert: 0,
                stepMetrics: [],
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setFunnels((prev) => [duped, ...prev]);
    };

    const handleArchive = (funnel: Funnel) => {
        setFunnels((prev) =>
            prev.map((f) =>
                f.id === funnel.id
                    ? {
                          ...f,
                          status: "archived" as FunnelStatus,
                          updatedAt: new Date().toISOString(),
                      }
                    : f,
            ),
        );
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await funnelsApi.delete(
                deleteTarget.id || (deleteTarget as any)._id,
            );
            setFunnels((prev) =>
                prev.filter(
                    (f) =>
                        f.id !== deleteTarget.id &&
                        (f as any)._id !== deleteTarget.id,
                ),
            );
            setDeleteTarget(null);
        } catch (err) {
            console.error("Failed to delete funnel", err);
        }
    };

    // Get active funnel for editor / analytics views
    const activeFunnel =
        viewMode.type !== "list"
            ? funnels.find((f) => f.id === viewMode.funnelId)
            : null;

    return (
        <PageShell>
            <PageHeader
                title="Marketing Funnels"
                description="Build automated conversion paths that turn visitors into customers"
                breadcrumbs={[
                    { label: "Dashboard", href: "/creator" },
                    { label: "Community Home", href: "/creator/landing-pages" },
                    { label: "Funnels" },
                ]}
            />

            <AnimatePresence mode="wait">
                {/* ── List View ─────────────────────────────────────────────── */}
                {viewMode.type === "list" && (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Hero Banner */}
                        <HeroBanner />

                        {/* Stats */}
                        <StatsBar funnels={funnels} />

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="relative">
                                    <Input
                                        placeholder="Search funnels..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="pl-9 h-9 w-64"
                                    />
                                    <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(v) =>
                                        setStatusFilter(
                                            v as "all" | FunnelStatus,
                                        )
                                    }
                                >
                                    <SelectTrigger className="h-9 w-32 text-sm">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="draft">
                                            Draft
                                        </SelectItem>
                                        <SelectItem value="paused">
                                            Paused
                                        </SelectItem>
                                        <SelectItem value="archived">
                                            Archived
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Button
                                    onClick={() => setCreateDialogOpen(true)}
                                    className="bg-gradient-to-r from-[#8e78fb] to-[#a855f7] hover:opacity-90 text-white shadow-lg shadow-violet-500/20"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Funnel
                                </Button>
                            </motion.div>
                        </div>

                        {/* Funnel Cards Grid */}
                        {filteredFunnels.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredFunnels.map((funnel, i) => (
                                    <FunnelCard
                                        key={funnel.id}
                                        funnel={funnel}
                                        index={i}
                                        onEdit={(f) =>
                                            setViewMode({
                                                type: "editor",
                                                funnelId: f.id,
                                            })
                                        }
                                        onViewAnalytics={(f) =>
                                            setViewMode({
                                                type: "analytics",
                                                funnelId: f.id,
                                            })
                                        }
                                        onDuplicate={handleDuplicate}
                                        onArchive={handleArchive}
                                        onDelete={(f) => setDeleteTarget(f)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-16"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto mb-4">
                                    <Route className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">
                                    No funnels found
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                                    {searchQuery || statusFilter !== "all"
                                        ? "Try adjusting your search or filters"
                                        : "Create your first marketing funnel to start converting visitors"}
                                </p>
                                {!searchQuery && statusFilter === "all" && (
                                    <Button
                                        onClick={() =>
                                            setCreateDialogOpen(true)
                                        }
                                        className="bg-gradient-to-r from-[#8e78fb] to-[#a855f7] hover:opacity-90 text-white"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Your First Funnel
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* ── Editor View ───────────────────────────────────────────── */}
                {viewMode.type === "editor" && activeFunnel && (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <FunnelEditor
                            funnel={activeFunnel}
                            onBack={() => setViewMode({ type: "list" })}
                            onViewAnalytics={() =>
                                setViewMode({
                                    type: "analytics",
                                    funnelId: activeFunnel.id,
                                })
                            }
                        />
                    </motion.div>
                )}

                {/* ── Analytics View ────────────────────────────────────────── */}
                {viewMode.type === "analytics" && activeFunnel && (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <FunnelAnalyticsPanel
                            funnel={activeFunnel}
                            onBack={() =>
                                setViewMode({
                                    type: "editor",
                                    funnelId: activeFunnel.id,
                                })
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dialogs */}
            <CreateFunnelDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onCreate={handleCreate}
            />

            <DeleteDialog
                open={!!deleteTarget}
                name={deleteTarget?.name ?? ""}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                onConfirm={handleDelete}
            />
        </PageShell>
    );
}
