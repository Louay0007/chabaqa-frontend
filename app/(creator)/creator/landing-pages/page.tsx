"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { PageShell, PageHeader } from "@/components/creator-dashboard";
import type { LandingPage, PageStatus } from "@/lib/landing-pages/types";
import {
    Search,
    Plus,
    MoreVertical,
    Eye,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    BarChart3,
    Copy,
    Pencil,
    Archive,
    Globe,
    Trash2,
    FileText,
    LayoutTemplate,
    Sparkles,
    Rocket,
    MousePointerClick,
    Layers,
    Users,
} from "lucide-react";
import {
    landingPagesApi,
    communityHomePageApi,
} from "@/lib/api/landing-pages.api";

// ─── Animated counter hook ───────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration = 1200, suffix = "") {
    const [display, setDisplay] = useState("0" + suffix);

    useEffect(() => {
        let start = 0;
        const startTime = Date.now();
        const isDecimal = !Number.isInteger(target);

        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * eased;

            if (isDecimal) {
                setDisplay(current.toFixed(1) + suffix);
            } else {
                setDisplay(Math.round(current).toLocaleString() + suffix);
            }

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    }, [target, duration, suffix]);

    return display;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PageStatus, { label: string; className: string }> =
    {
        draft: {
            label: "Draft",
            className:
                "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
        },
        published: {
            label: "Published",
            className:
                "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        },
        archived: {
            label: "Archived",
            className:
                "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        },
    };

const GRADIENT_THUMBNAILS = [
    "from-violet-500 via-purple-500 to-fuchsia-500",
    "from-cyan-500 via-blue-500 to-indigo-500",
    "from-orange-400 via-rose-500 to-pink-500",
    "from-emerald-400 via-teal-500 to-cyan-500",
    "from-amber-400 via-orange-500 to-red-500",
    "from-indigo-500 via-purple-500 to-pink-500",
];

const THUMBNAIL_ICONS = [
    FileText,
    LayoutTemplate,
    Rocket,
    Sparkles,
    Globe,
    Layers,
];

// ─── Floating geometric shapes ───────────────────────────────────────────────

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
            className={cn("absolute rounded-2xl opacity-20", className)}
            animate={{
                y: [0, -20, 0, 15, 0],
                x: [0, 10, -10, 5, 0],
                rotate: [0, 8, -8, 4, 0],
                scale: [1, 1.05, 0.95, 1.02, 1],
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

// ─── Hero Section ────────────────────────────────────────────────────────────

function HeroSection() {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#8e78fb] via-[#a855f7] to-[#f65887] p-8 md:p-12"
        >
            {/* Floating shapes */}
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

            {/* Dot pattern overlay */}
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
                        <Sparkles className="h-3 w-3 mr-1" />
                        Community Home Page Builder
                    </Badge>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
                >
                    Your{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-amber-200">
                        Community
                    </span>{" "}
                    Home Pages
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-white/80 text-base md:text-lg mb-8 max-w-lg"
                >
                    Design stunning community home pages, engage your members,
                    and grow your community with our drag-and-drop builder. No
                    coding required.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex flex-wrap gap-3"
                >
                    <motion.div
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <Button
                            size="lg"
                            className="bg-white text-[#8e78fb] hover:bg-white/90 shadow-lg shadow-black/10 font-semibold"
                            onClick={() =>
                                router.push("/creator/landing-pages/templates")
                            }
                        >
                            <LayoutTemplate className="h-4 w-4 mr-2" />
                            Browse Templates
                        </Button>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-white/40 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
                            onClick={() =>
                                router.push("/creator/landing-pages/new")
                            }
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Blank Canvas
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
}

// ─── Stats Row ───────────────────────────────────────────────────────────────

function StatsRow({ pages }: { pages: LandingPage[] }) {
    const totalPages = pages.length;
    const published = pages.filter((p) => p.status === "published").length;
    const totalViews = pages.reduce(
        (sum, p) => sum + (p.analytics?.views || 0),
        0,
    );
    const totalConversions = pages.reduce(
        (sum, p) => sum + (p.analytics?.conversions || 0),
        0,
    );
    const avgConversion =
        totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

    const animatedTotal = useAnimatedCounter(totalPages, 800);
    const animatedPublished = useAnimatedCounter(published, 900);
    const animatedViews = useAnimatedCounter(totalViews, 1100);
    const animatedRate = useAnimatedCounter(
        parseFloat(avgConversion.toFixed(1)),
        1200,
        "%",
    );

    const stats = [
        {
            label: "Home Pages",
            value: animatedTotal,
            icon: FileText,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-50 dark:bg-violet-900/20",
        },
        {
            label: "Published",
            value: animatedPublished,
            icon: Globe,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
        },
        {
            label: "Total Views",
            value: animatedViews,
            icon: Eye,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
            label: "Conversion Rate",
            value: animatedRate,
            icon: MousePointerClick,
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

// ─── Page Card ───────────────────────────────────────────────────────────────

function PageCard({
    page,
    index,
    onAction,
}: {
    page: LandingPage & { community?: any };
    index: number;
    onAction: (action: string, page: LandingPage) => void;
}) {
    const statusConfig = STATUS_CONFIG[page.status];
    const gradientClass =
        GRADIENT_THUMBNAILS[index % GRADIENT_THUMBNAILS.length];
    const ThumbnailIcon = THUMBNAIL_ICONS[index % THUMBNAIL_ICONS.length];

    const views = page.analytics?.views || 0;
    const conversions = page.analytics?.conversions || 0;
    const rate = page.analytics?.conversionRate || 0;

    const trendUp = rate > 3;
    const trendNeutral = rate >= 1 && rate <= 3;

    const community = (page as any).community;
    const updatedAt = page.updatedAt
        ? new Date(page.updatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
          })
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index + 0.2, duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="group"
        >
            <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 border-border/60">
                {/* Thumbnail */}
                <div
                    className={cn(
                        "relative h-36 md:h-40 bg-gradient-to-br flex items-center justify-center overflow-hidden",
                        gradientClass,
                    )}
                >
                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                            backgroundSize: "20px 20px",
                        }}
                    />
                    <motion.div
                        className="relative z-10"
                        initial={{ scale: 0.9, opacity: 0.7 }}
                        whileHover={{ scale: 1.1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ThumbnailIcon
                            className="h-12 w-12 text-white/60"
                            strokeWidth={1.5}
                        />
                    </motion.div>

                    {/* Status badge overlay */}
                    <div className="absolute top-3 left-3 z-10">
                        <Badge
                            className={cn(
                                "text-[10px] font-semibold border backdrop-blur-sm shadow-sm",
                                statusConfig.className,
                            )}
                        >
                            {statusConfig.label}
                        </Badge>
                    </div>

                    {/* Dropdown menu */}
                    <div className="absolute top-3 right-3 z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={() => onAction("edit", page)}
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Home Page
                                </DropdownMenuItem>
                                {page.pageType !== "community-home" && (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onAction("duplicate", page)
                                        }
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => onAction("analytics", page)}
                                >
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Analytics
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onAction("leads", page)}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    View Leads
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {page.status === "published" ? (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onAction("archive", page)
                                        }
                                    >
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive
                                    </DropdownMenuItem>
                                ) : page.status === "draft" ||
                                  page.status === "archived" ? (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onAction("publish", page)
                                        }
                                    >
                                        <Globe className="h-4 w-4 mr-2" />
                                        Publish
                                    </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onAction("delete", page)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                {/* Content */}
                <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold line-clamp-1 leading-snug">
                        {page.title}
                    </CardTitle>
                    {community && (
                        <p className="text-xs text-purple-600 font-medium mt-0.5 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {community.name}
                            {community.membersCount != null && (
                                <span className="text-muted-foreground font-normal">
                                    ({community.membersCount} members)
                                </span>
                            )}
                        </p>
                    )}
                    {page.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {page.description}
                        </p>
                    )}
                </CardHeader>

                {/* Stats */}
                <CardFooter className="px-4 pb-4 pt-2">
                    <div className="flex items-center justify-between w-full text-xs">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Eye className="h-3.5 w-3.5" />
                                {views.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <MousePointerClick className="h-3.5 w-3.5" />
                                {conversions.toLocaleString()}
                            </span>
                            {updatedAt && (
                                <span className="text-muted-foreground/70">
                                    {updatedAt}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                            {trendUp ? (
                                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            ) : trendNeutral ? (
                                <ArrowUpRight className="h-3.5 w-3.5 text-amber-500" />
                            ) : conversions > 0 ? (
                                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                            ) : null}
                            <span
                                className={cn(
                                    trendUp
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : trendNeutral
                                          ? "text-amber-600 dark:text-amber-400"
                                          : conversions > 0
                                            ? "text-rose-600 dark:text-rose-400"
                                            : "text-muted-foreground",
                                )}
                            >
                                {rate > 0 ? `${rate.toFixed(1)}%` : "—"}
                            </span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-20 px-4"
        >
            {/* 3D-style illustration */}
            <div className="relative mb-8">
                <motion.div
                    className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#8e78fb]/20 to-[#f65887]/20 flex items-center justify-center"
                    animate={{
                        rotateY: [0, 5, -5, 0],
                        rotateX: [0, -3, 3, 0],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{ perspective: "800px" }}
                >
                    <motion.div
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8e78fb] to-[#f65887] flex items-center justify-center shadow-lg shadow-purple-500/20"
                        animate={{ rotate: [0, 3, -3, 0] }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <FileText
                            className="h-10 w-10 text-white"
                            strokeWidth={1.5}
                        />
                    </motion.div>
                </motion.div>

                {/* Orbiting elements */}
                <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-amber-400 shadow-lg shadow-amber-400/30 flex items-center justify-center"
                    animate={{
                        y: [0, -8, 0],
                        x: [0, 4, 0],
                        rotate: [0, 15, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <Sparkles className="h-4 w-4 text-white" />
                </motion.div>
                <motion.div
                    className="absolute -bottom-1 -left-3 w-6 h-6 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30"
                    animate={{
                        y: [0, 6, 0],
                        x: [0, -4, 0],
                    }}
                    transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                    }}
                />
            </div>

            <h3 className="text-xl font-semibold mb-2 text-center">
                Create Your First Community Home Page
            </h3>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-8">
                Use the visual builder to create a stunning home page for your
                community. Start from a template or build from scratch.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
                <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-[#8e78fb] to-[#f65887] hover:opacity-90 text-white shadow-lg shadow-purple-500/20"
                        onClick={() =>
                            router.push("/creator/landing-pages/templates")
                        }
                    >
                        <LayoutTemplate className="h-4 w-4 mr-2" />
                        Start From Template
                    </Button>
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() =>
                            router.push("/creator/landing-pages/new")
                        }
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Blank Canvas
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
}

// ─── Floating Action Button ──────────────────────────────────────────────────

function FloatingActionButton() {
    const [expanded, setExpanded] = useState(false);
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setExpanded(false);
            }
        }
        if (expanded) {
            document.addEventListener("mousedown", handleClick);
            return () => document.removeEventListener("mousedown", handleClick);
        }
    }, [expanded]);

    return (
        <div
            ref={containerRef}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
        >
            <AnimatePresence>
                {expanded && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                        >
                            <Button
                                onClick={() => {
                                    router.push(
                                        "/creator/landing-pages/templates",
                                    );
                                    setExpanded(false);
                                }}
                                className="bg-white dark:bg-zinc-800 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-lg rounded-full pl-4 pr-5 h-11 border"
                            >
                                <LayoutTemplate className="h-4 w-4 mr-2 text-[#8e78fb]" />
                                From Template
                            </Button>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Button
                                onClick={() => {
                                    router.push("/creator/landing-pages/new");
                                    setExpanded(false);
                                }}
                                className="bg-white dark:bg-zinc-800 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-lg rounded-full pl-4 pr-5 h-11 border"
                            >
                                <FileText className="h-4 w-4 mr-2 text-[#f65887]" />
                                Blank Canvas
                            </Button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <Button
                    size="icon"
                    onClick={() => setExpanded((prev) => !prev)}
                    className={cn(
                        "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
                        expanded
                            ? "bg-zinc-700 hover:bg-zinc-800 dark:bg-zinc-300 dark:hover:bg-zinc-200 rotate-45"
                            : "bg-gradient-to-br from-[#8e78fb] to-[#f65887] hover:shadow-2xl hover:shadow-purple-500/30",
                    )}
                >
                    <Plus
                        className={cn(
                            "h-6 w-6 transition-transform duration-300",
                            expanded
                                ? "text-white dark:text-zinc-900"
                                : "text-white",
                        )}
                    />
                </Button>
            </motion.div>
        </div>
    );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Hero skeleton */}
            <Skeleton className="h-64 rounded-2xl" />

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>

            {/* Search bar skeleton */}
            <div className="flex gap-3">
                <Skeleton className="h-10 flex-1 max-w-sm rounded-lg" />
                <Skeleton className="h-10 w-72 rounded-lg" />
            </div>

            {/* Card grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-0">
                        <Skeleton className="h-40 rounded-t-xl rounded-b-none" />
                        <Skeleton className="h-28 rounded-b-xl rounded-t-none" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Delete Confirmation Dialog ──────────────────────────────────────────────

function DeleteDialog({
    page,
    open,
    onOpenChange,
    onConfirm,
}: {
    page: LandingPage | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete Home Page</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-foreground">
                            {page?.title}
                        </span>
                        ? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={onConfirm}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Page
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function LandingPagesPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [pages, setPages] = useState<LandingPage[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [deleteTarget, setDeleteTarget] = useState<LandingPage | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        communityHomePageApi
            .getAllForCreator()
            .then((data) => {
                if (!cancelled) {
                    // Normalize: the API returns enriched pages with community info
                    const normalized = (data ?? []).map((p: any) => ({
                        ...p,
                        id: p._id || p.id,
                    }));
                    setPages(normalized);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Filter pages
    const filteredPages = pages.filter((page) => {
        const matchesSearch =
            searchQuery === "" ||
            page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "all" || page.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Tab counts
    const tabCounts = {
        all: pages.length,
        draft: pages.filter((p) => p.status === "draft").length,
        published: pages.filter((p) => p.status === "published").length,
        archived: pages.filter((p) => p.status === "archived").length,
    };

    // Handle card actions
    const handleAction = useCallback(
        async (action: string, page: LandingPage) => {
            switch (action) {
                case "edit":
                    router.push(`/creator/landing-pages/${page.id}/edit`);
                    break;
                case "duplicate": {
                    if (page.pageType === "community-home") {
                        break;
                    }
                    try {
                        const res = await landingPagesApi.duplicate(page.id);
                        setPages((prev) => [(res as any).data, ...prev]);
                    } catch (err) {
                        console.error("Failed to duplicate page", err);
                    }
                    break;
                }
                case "analytics":
                    router.push(`/creator/landing-pages/${page.id}/analytics`);
                    break;
                case "leads":
                    router.push(`/creator/landing-pages/${page.id}/leads`);
                    break;
                case "archive":
                    try {
                        await landingPagesApi.update(page.id, {
                            status: "archived",
                        } as any);
                        setPages((prev) =>
                            prev.map((p) =>
                                p.id === page.id
                                    ? { ...p, status: "archived" as any }
                                    : p,
                            ),
                        );
                    } catch (err) {
                        console.error(err);
                    }
                    break;
                case "publish":
                    try {
                        const res = await landingPagesApi.publish(page.id);
                        setPages((prev) =>
                            prev.map((p) =>
                                p.id === page.id ? ((res as any).data ?? p) : p,
                            ),
                        );
                    } catch (err) {
                        console.error(err);
                    }
                    break;
                case "delete":
                    setDeleteTarget(page);
                    setDeleteDialogOpen(true);
                    break;
            }
        },
        [router],
    );

    const confirmDelete = useCallback(async () => {
        if (deleteTarget) {
            try {
                await landingPagesApi.delete(deleteTarget.id);
                setPages((prev) =>
                    prev.filter((p) => p.id !== deleteTarget.id),
                );
            } catch (err) {
                console.error("Failed to delete page", err);
            }
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    }, [deleteTarget]);

    if (isLoading) {
        return (
            <PageShell>
                <DashboardSkeleton />
            </PageShell>
        );
    }

    const hasPages = pages.length > 0;
    const hasFilteredPages = filteredPages.length > 0;
    const isSearching = searchQuery.length > 0 || statusFilter !== "all";

    return (
        <PageShell>
            <PageHeader
                title="Community Home Pages"
                breadcrumbs={[
                    { label: "Dashboard", href: "/creator/dashboard" },
                    { label: "Community Home Pages" },
                ]}
                badge={
                    hasPages
                        ? {
                              label: `${pages.length} page${pages.length !== 1 ? "s" : ""}`,
                              variant: "secondary",
                          }
                        : undefined
                }
                actions={
                    hasPages
                        ? [
                              {
                                  label: "New Home Page",
                                  icon: Plus,
                                  onClick: () =>
                                      router.push(
                                          "/creator/landing-pages/templates",
                                      ),
                              },
                          ]
                        : undefined
                }
            />

            {/* Hero */}
            <HeroSection />

            {hasPages ? (
                <>
                    {/* Stats */}
                    <StatsRow pages={pages} />

                    {/* Search & Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className="space-y-4"
                    >
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                            <Tabs
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <TabsList className="h-9">
                                    <TabsTrigger
                                        value="all"
                                        className="text-xs gap-1.5 px-3"
                                    >
                                        All
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] px-1.5 py-0 ml-0.5"
                                        >
                                            {tabCounts.all}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="draft"
                                        className="text-xs gap-1.5 px-3"
                                    >
                                        Draft
                                        {tabCounts.draft > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1.5 py-0 ml-0.5"
                                            >
                                                {tabCounts.draft}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="published"
                                        className="text-xs gap-1.5 px-3"
                                    >
                                        Published
                                        {tabCounts.published > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1.5 py-0 ml-0.5"
                                            >
                                                {tabCounts.published}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="archived"
                                        className="text-xs gap-1.5 px-3"
                                    >
                                        Archived
                                        {tabCounts.archived > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1.5 py-0 ml-0.5"
                                            >
                                                {tabCounts.archived}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Search home pages..."
                                    className="pl-9 h-9"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Page Grid */}
                    {hasFilteredPages ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredPages.map((page, i) => (
                                <PageCard
                                    key={page.id}
                                    page={page}
                                    index={i}
                                    onAction={handleAction}
                                />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-16 px-4"
                        >
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <Search className="h-8 w-8 text-muted-foreground/60" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">
                                No home pages found
                            </h3>
                            <p className="text-sm text-muted-foreground text-center max-w-md">
                                {isSearching
                                    ? "Try adjusting your search terms or clearing your filters."
                                    : "Create your first community home page to get started."}
                            </p>
                            {isSearching && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </motion.div>
                    )}
                </>
            ) : (
                <EmptyState />
            )}

            {/* FAB */}
            <FloatingActionButton />

            {/* Delete Dialog */}
            <DeleteDialog
                page={deleteTarget}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
            />
        </PageShell>
    );
}
