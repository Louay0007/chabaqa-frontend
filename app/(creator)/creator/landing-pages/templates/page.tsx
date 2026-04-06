"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { PageTemplate, TemplateCategory } from "@/lib/landing-pages/types";
import {
    pageTemplates,
    getTemplatesByCategory,
    getTemplateCategories,
} from "@/lib/landing-pages/templates";
import {
    Search,
    Star,
    Users,
    Sparkles,
    Wand2,
    LayoutTemplate,
    Eye,
    ArrowRight,
    ChevronRight,
    Loader2,
    BookOpen,
    Megaphone,
    Calendar,
    Languages,
    Briefcase,
    Video,
    GraduationCap,
    Target,
    Zap,
    TrendingUp,
    FileText,
    MousePointerClick,
    Rocket,
    Globe,
    Layers,
    X,
} from "lucide-react";

// ─── Category icon mapping ───────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    sales: Megaphone,
    "lead-capture": Target,
    events: Calendar,
    arabic: Languages,
    business: Briefcase,
    webinar: Video,
    course: GraduationCap,
};

const CATEGORY_COLORS: Record<string, string> = {
    sales: "from-orange-500 to-rose-500",
    "lead-capture": "from-cyan-500 to-blue-500",
    events: "from-violet-500 to-purple-500",
    arabic: "from-emerald-500 to-teal-500",
    business: "from-slate-600 to-zinc-700",
    webinar: "from-pink-500 to-fuchsia-500",
    course: "from-amber-500 to-orange-500",
};

const CARD_GRADIENTS = [
    "from-violet-500 via-purple-500 to-fuchsia-500",
    "from-cyan-500 via-blue-500 to-indigo-500",
    "from-orange-400 via-rose-500 to-pink-500",
    "from-emerald-400 via-teal-500 to-cyan-500",
    "from-amber-400 via-orange-500 to-red-500",
    "from-indigo-500 via-purple-500 to-pink-500",
    "from-rose-400 via-fuchsia-500 to-violet-500",
];

// ─── AI prompt examples ──────────────────────────────────────────────────────

const AI_PROMPT_EXAMPLES = [
    "A sales page for my online cooking course",
    "Lead capture for a free marketing ebook",
    "Webinar registration with countdown timer",
    "Arabic RTL page for business consulting",
    "Event home page for a tech conference",
    "Course page with testimonials and pricing",
];

// ─── Additional mock templates to fill the gallery ───────────────────────────

const EXTRA_TEMPLATES: PageTemplate[] = [
    {
        id: "tpl-event-summit",
        name: "Tech Summit Event",
        description:
            "Professional event landing page with speaker lineup, schedule overview, and early-bird ticket pricing. Perfect for conferences and summits.",
        category: "events",
        thumbnail: "/images/templates/thumbnails/event-summit.jpg",
        blocks: [],
        popularity: 87,
        rating: 4.6,
        usageCount: 1890,
    },
    {
        id: "tpl-sales-product",
        name: "Product Launch Sales",
        description:
            "High-impact product launch page with feature showcase, comparison table, limited-time offer banners, and urgency-driven CTAs.",
        category: "sales",
        thumbnail: "/images/templates/thumbnails/sales-product.jpg",
        blocks: [],
        popularity: 93,
        rating: 4.8,
        usageCount: 3210,
    },
    {
        id: "tpl-lead-webinar",
        name: "Free Masterclass Signup",
        description:
            "Optimized signup page for free masterclasses and workshops with social proof, instructor credibility section, and one-click registration.",
        category: "lead-capture",
        thumbnail: "/images/templates/thumbnails/lead-webinar.jpg",
        blocks: [],
        popularity: 91,
        rating: 4.7,
        usageCount: 2780,
    },
];

const ALL_TEMPLATES = [...pageTemplates, ...EXTRA_TEMPLATES];

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
                y: [0, -18, 0, 12, 0],
                x: [0, 8, -8, 4, 0],
                rotate: [0, 6, -6, 3, 0],
                scale: [1, 1.04, 0.96, 1.02, 1],
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

// ─── Star Rating Display ─────────────────────────────────────────────────────

function StarRating({
    rating,
    size = "sm",
}: {
    rating: number;
    size?: "sm" | "md";
}) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.3;
    const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        iconSize,
                        i < fullStars
                            ? "text-amber-400 fill-amber-400"
                            : i === fullStars && hasHalfStar
                              ? "text-amber-400 fill-amber-400/50"
                              : "text-zinc-300 dark:text-zinc-600",
                    )}
                />
            ))}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
                {rating.toFixed(1)}
            </span>
        </div>
    );
}

// ─── Hero Section ────────────────────────────────────────────────────────────

function HeroSection({
    searchQuery,
    onSearchChange,
}: {
    searchQuery: string;
    onSearchChange: (value: string) => void;
}) {
    const [searchFocused, setSearchFocused] = useState(false);
    const suggestions =
        searchQuery.length > 0
            ? ALL_TEMPLATES.filter(
                  (t) =>
                      t.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                      t.description
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                      t.category
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
              ).slice(0, 5)
            : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#8e78fb] via-[#a855f7] to-[#f65887] p-8 md:p-12"
        >
            {/* Floating shapes */}
            <FloatingShape
                className="w-20 h-20 bg-white/20 top-6 right-16 blur-sm"
                delay={0}
                duration={7}
            />
            <FloatingShape
                className="w-14 h-14 bg-white/15 bottom-6 right-1/4 rounded-full"
                delay={1.2}
                duration={5}
            />
            <FloatingShape
                className="w-16 h-16 bg-white/10 top-1/2 left-6 rotate-45"
                delay={0.6}
                duration={6}
            />
            <FloatingShape
                className="w-10 h-10 bg-white/20 top-4 left-1/4 rounded-full blur-[2px]"
                delay={2}
                duration={8}
            />

            {/* Dot pattern */}
            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
            />

            <div className="relative z-10 max-w-2xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm">
                        <LayoutTemplate className="h-3 w-3 mr-1" />
                        Template Gallery
                    </Badge>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
                >
                    Choose a{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-amber-200">
                        Template
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-white/80 text-base md:text-lg mb-8"
                >
                    Start with a professionally designed template and customize
                    it to match your brand in minutes.
                </motion.p>

                {/* Search with autocomplete */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="relative max-w-lg mx-auto"
                >
                    <div
                        className={cn(
                            "relative rounded-xl overflow-hidden transition-all duration-300",
                            searchFocused
                                ? "ring-2 ring-white/40 shadow-xl shadow-black/10"
                                : "shadow-lg shadow-black/5",
                        )}
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                        <Input
                            value={searchQuery}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => onSearchChange(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() =>
                                setTimeout(() => setSearchFocused(false), 200)
                            }
                            placeholder="Search templates by name, category, or keyword..."
                            className="pl-11 pr-10 h-12 border-0 bg-white dark:bg-zinc-900 text-base rounded-xl"
                        />
                        {searchQuery.length > 0 && (
                            <button
                                onClick={() => onSearchChange("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-10"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {/* Autocomplete dropdown */}
                    <AnimatePresence>
                        {searchFocused && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border overflow-hidden z-20"
                            >
                                {suggestions.map((tpl) => {
                                    const CatIcon =
                                        CATEGORY_ICONS[tpl.category] ||
                                        FileText;
                                    return (
                                        <button
                                            key={tpl.id}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                onSearchChange(tpl.name);
                                            }}
                                        >
                                            <div
                                                className={cn(
                                                    "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                                                    CATEGORY_COLORS[
                                                        tpl.category
                                                    ] ||
                                                        "from-zinc-400 to-zinc-600",
                                                )}
                                            >
                                                <CatIcon className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {tpl.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {tpl.category.replace(
                                                        "-",
                                                        " ",
                                                    )}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    );
}

// ─── AI Generator Section ────────────────────────────────────────────────────

function AIGeneratorSection() {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generated, setGenerated] = useState(false);

    const handleGenerate = useCallback(() => {
        if (!prompt.trim() || isGenerating) return;
        setIsGenerating(true);
        setProgress(0);
        setGenerated(false);

        // Simulate AI generation progress
        const steps = [10, 25, 40, 55, 70, 85, 95, 100];
        let i = 0;
        const interval = setInterval(() => {
            if (i < steps.length) {
                setProgress(steps[i]);
                i++;
            } else {
                clearInterval(interval);
                setIsGenerating(false);
                setGenerated(true);
            }
        }, 350);
    }, [prompt, isGenerating]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
        >
            <Card className="relative overflow-hidden border-dashed border-2 border-purple-200 dark:border-purple-800/40 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 dark:from-purple-950/20 dark:via-zinc-950 dark:to-pink-950/20">
                {/* Subtle shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-30" />

                <CardContent className="relative p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-[#8e78fb] to-[#f65887] shadow-lg shadow-purple-500/20 flex-shrink-0">
                            <Wand2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                AI Template Generator
                                <Badge className="bg-gradient-to-r from-[#8e78fb] to-[#f65887] text-white border-0 text-[10px]">
                                    Beta
                                </Badge>
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Describe your ideal home page and let AI create
                                a custom template tailored to your needs.
                            </p>
                        </div>
                    </div>

                    {/* Prompt input */}
                    <div className="flex gap-3 mb-4">
                        <div className="relative flex-1">
                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                            <Input
                                value={prompt}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                    setPrompt(e.target.value);
                                    setGenerated(false);
                                }}
                                placeholder="Describe your page... e.g. 'A sales page for my photography course with testimonials'"
                                className="pl-10 h-11 border-purple-200 dark:border-purple-800/40 focus-visible:ring-purple-400"
                                onKeyDown={(
                                    e: React.KeyboardEvent<HTMLInputElement>,
                                ) => e.key === "Enter" && handleGenerate()}
                            />
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                onClick={handleGenerate}
                                disabled={!prompt.trim() || isGenerating}
                                className="h-11 px-6 bg-gradient-to-r from-[#8e78fb] to-[#f65887] hover:opacity-90 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Generate
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </div>

                    {/* Progress bar */}
                    <AnimatePresence>
                        {isGenerating && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 overflow-hidden"
                            >
                                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-[#8e78fb] to-[#f65887] rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{
                                            duration: 0.3,
                                            ease: "easeOut",
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                    {progress < 30
                                        ? "Analyzing your description..."
                                        : progress < 60
                                          ? "Selecting optimal layout and blocks..."
                                          : progress < 90
                                            ? "Generating copy and styling..."
                                            : "Finalizing your template..."}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Generated result */}
                    <AnimatePresence>
                        {generated && !isGenerating && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <svg
                                            className="w-3 h-3 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                        Template generated successfully!
                                    </span>
                                </div>
                                <p className="text-xs text-emerald-600 dark:text-emerald-500 mb-3">
                                    Your custom template is ready with optimized
                                    copy, layout, and styling based on your
                                    description.
                                </p>
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <Rocket className="h-3.5 w-3.5 mr-1.5" />
                                    Open in Editor
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Example chips */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground py-1">
                            Try:
                        </span>
                        {AI_PROMPT_EXAMPLES.map((example) => (
                            <motion.button
                                key={example}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                    setPrompt(example);
                                    setGenerated(false);
                                }}
                                className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-muted-foreground hover:text-foreground hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer"
                            >
                                {example}
                            </motion.button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─── Template Card ───────────────────────────────────────────────────────────

function TemplateCard({
    template,
    index,
    onPreview,
    onUse,
}: {
    template: PageTemplate;
    index: number;
    onPreview: (template: PageTemplate) => void;
    onUse: (template: PageTemplate) => void;
}) {
    const gradientClass = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
    const CatIcon = CATEGORY_ICONS[template.category] || FileText;

    // Vary card heights for a masonry feel
    const heightVariants = [
        "h-40",
        "h-48",
        "h-44",
        "h-52",
        "h-40",
        "h-46",
        "h-44",
        "h-50",
    ];
    const thumbnailHeight = heightVariants[index % heightVariants.length];

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: 0.04 * index + 0.15,
                duration: 0.4,
                ease: "easeOut",
            }}
            whileHover={{ y: -5 }}
            className="group"
        >
            <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 border-border/60">
                {/* Gradient thumbnail */}
                <div
                    className={cn(
                        "relative bg-gradient-to-br flex items-center justify-center overflow-hidden",
                        gradientClass,
                        thumbnailHeight,
                    )}
                >
                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                        }}
                    />

                    {/* Category icon */}
                    <motion.div
                        className="relative z-10 p-4 rounded-2xl bg-white/10 backdrop-blur-sm"
                        initial={{ scale: 0.9, opacity: 0.7 }}
                        whileHover={{ scale: 1.1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CatIcon
                            className="h-10 w-10 text-white/80"
                            strokeWidth={1.5}
                        />
                    </motion.div>

                    {/* Category badge */}
                    <div className="absolute top-3 left-3 z-10">
                        <Badge className="text-[10px] font-semibold bg-black/20 text-white border-white/20 backdrop-blur-sm capitalize">
                            {template.category.replace("-", " ")}
                        </Badge>
                    </div>

                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-3 z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                            <Button
                                size="sm"
                                variant="outline"
                                className="bg-white/90 hover:bg-white text-foreground border-0 shadow-lg backdrop-blur-sm"
                                onClick={(
                                    e: React.MouseEvent<HTMLButtonElement>,
                                ) => {
                                    e.stopPropagation();
                                    onPreview(template);
                                }}
                            >
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                Preview
                            </Button>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75"
                        >
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-[#8e78fb] to-[#f65887] hover:opacity-90 text-white border-0 shadow-lg"
                                onClick={(
                                    e: React.MouseEvent<HTMLButtonElement>,
                                ) => {
                                    e.stopPropagation();
                                    onUse(template);
                                }}
                            >
                                <Zap className="h-3.5 w-3.5 mr-1.5" />
                                Use Template
                            </Button>
                        </motion.div>
                    </div>
                </div>

                {/* Content */}
                <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold line-clamp-1 leading-snug">
                        {template.name}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2 mt-1 leading-relaxed">
                        {template.description}
                    </CardDescription>
                </CardHeader>

                <CardFooter className="px-4 pb-4 pt-2 flex items-center justify-between">
                    <StarRating rating={template.rating} />
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {template.usageCount.toLocaleString()}
                    </span>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

// ─── Template Preview Dialog ─────────────────────────────────────────────────

function TemplatePreviewDialog({
    template,
    open,
    onOpenChange,
    onUse,
}: {
    template: PageTemplate | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUse: (template: PageTemplate) => void;
}) {
    if (!template) return null;

    const CatIcon = CATEGORY_ICONS[template.category] || FileText;
    const gradientClass =
        CATEGORY_COLORS[template.category] || "from-zinc-400 to-zinc-600";
    const blockTypes: string[] = template.blocks.map((b) => b.type);
    const uniqueBlocks: string[] = [...new Set(blockTypes)];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div
                            className={cn(
                                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                                gradientClass,
                            )}
                        >
                            <CatIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">
                                {template.name}
                            </DialogTitle>
                            <DialogDescription className="text-xs mt-0.5">
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] capitalize mr-2"
                                >
                                    {template.category.replace("-", " ")}
                                </Badge>
                                <span>
                                    {template.usageCount.toLocaleString()}{" "}
                                    creators used this template
                                </span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Preview area */}
                <div className="space-y-4 mt-2">
                    {/* Gradient preview mockup */}
                    <div
                        className={cn(
                            "relative rounded-xl bg-gradient-to-br overflow-hidden h-56",
                            CARD_GRADIENTS[
                                ALL_TEMPLATES.indexOf(template) %
                                    CARD_GRADIENTS.length
                            ] || "from-violet-500 to-fuchsia-500",
                        )}
                    >
                        {/* Simulated page wireframe */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                            <div className="w-full max-w-sm space-y-3">
                                <div className="h-3 w-3/4 bg-white/30 rounded-full mx-auto" />
                                <div className="h-2 w-1/2 bg-white/20 rounded-full mx-auto" />
                                <div className="h-8 w-32 bg-white/25 rounded-lg mx-auto mt-4" />
                                <div className="grid grid-cols-3 gap-2 mt-6">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-12 bg-white/10 rounded-lg"
                                        />
                                    ))}
                                </div>
                                <div className="space-y-1.5 mt-4">
                                    <div className="h-1.5 w-full bg-white/15 rounded-full" />
                                    <div className="h-1.5 w-5/6 bg-white/15 rounded-full" />
                                    <div className="h-1.5 w-3/4 bg-white/15 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* Browser chrome mockup */}
                        <div className="absolute top-0 left-0 right-0 h-8 bg-white/10 backdrop-blur-sm flex items-center px-3 gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                            <div className="ml-4 h-4 flex-1 max-w-xs bg-white/10 rounded-md" />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {template.description}
                        </p>

                        <div className="flex items-center gap-4">
                            <StarRating rating={template.rating} size="md" />
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <TrendingUp className="h-4 w-4" />
                                Popularity: {template.popularity}%
                            </span>
                        </div>

                        {/* Included blocks */}
                        {uniqueBlocks.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                                    Included Sections
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {uniqueBlocks.map((blockType) => (
                                        <Badge
                                            key={blockType}
                                            variant="outline"
                                            className="text-[10px] capitalize"
                                        >
                                            {blockType.replace("-", " ")}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                    <Button
                        className="bg-gradient-to-r from-[#8e78fb] to-[#f65887] hover:opacity-90 text-white"
                        onClick={() => {
                            onUse(template);
                            onOpenChange(false);
                        }}
                    >
                        <Zap className="h-4 w-4 mr-2" />
                        Use This Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function GallerySkeleton() {
    return (
        <div className="space-y-6">
            {/* Hero skeleton */}
            <Skeleton className="h-64 rounded-2xl" />

            {/* AI section skeleton */}
            <Skeleton className="h-48 rounded-xl" />

            {/* Category tabs skeleton */}
            <Skeleton className="h-10 w-full max-w-2xl rounded-lg" />

            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-0">
                        <Skeleton
                            className="rounded-t-xl rounded-b-none"
                            style={{ height: `${160 + (i % 3) * 24}px` }}
                        />
                        <Skeleton className="h-28 rounded-b-xl rounded-t-none" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function TemplateGalleryPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [templates, setTemplates] = useState<PageTemplate[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [previewTemplate, setPreviewTemplate] = useState<PageTemplate | null>(
        null,
    );
    const [previewOpen, setPreviewOpen] = useState(false);

    const categories = getTemplateCategories();

    // Simulate loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setTemplates(ALL_TEMPLATES);
            setIsLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    // Filter templates
    const filteredTemplates = templates.filter((tpl) => {
        const matchesSearch =
            searchQuery === "" ||
            tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tpl.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            activeCategory === "all" || tpl.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    // Sort by popularity
    const sortedTemplates = [...filteredTemplates].sort(
        (a, b) => b.popularity - a.popularity,
    );

    const handlePreview = useCallback((template: PageTemplate) => {
        setPreviewTemplate(template);
        setPreviewOpen(true);
    }, []);

    const handleUseTemplate = useCallback(
        (template: PageTemplate) => {
            router.push(`/creator/landing-pages/new?templateId=${template.id}`);
        },
        [router],
    );

    if (isLoading) {
        return (
            <PageShell>
                <GallerySkeleton />
            </PageShell>
        );
    }

    return (
        <PageShell>
            <PageHeader
                title="Template Gallery"
                breadcrumbs={[
                    { label: "Dashboard", href: "/creator/dashboard" },
                    { label: "Home Pages", href: "/creator/landing-pages" },
                    { label: "Templates" },
                ]}
                actions={[
                    {
                        label: "My Pages",
                        variant: "outline" as const,
                        onClick: () => router.push("/creator/landing-pages"),
                    },
                ]}
            />

            {/* Hero with search */}
            <HeroSection
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* AI Generator */}
            <AIGeneratorSection />

            {/* Category Filters + Results Count */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="space-y-4"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <Tabs
                        value={activeCategory}
                        onValueChange={setActiveCategory}
                    >
                        <TabsList className="h-9 flex-wrap">
                            <TabsTrigger
                                value="all"
                                className="text-xs px-3 gap-1.5"
                            >
                                <Layers className="h-3 w-3" />
                                All
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 ml-0.5"
                                >
                                    {templates.length}
                                </Badge>
                            </TabsTrigger>
                            {categories.map(
                                (cat: { value: string; label: string }) => {
                                    const CatIcon =
                                        CATEGORY_ICONS[cat.value] || FileText;
                                    const count = templates.filter(
                                        (t) => t.category === cat.value,
                                    ).length;
                                    return (
                                        <TabsTrigger
                                            key={cat.value}
                                            value={cat.value}
                                            className="text-xs px-3 gap-1.5"
                                        >
                                            <CatIcon className="h-3 w-3" />
                                            {cat.label}
                                            {count > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] px-1.5 py-0 ml-0.5"
                                                >
                                                    {count}
                                                </Badge>
                                            )}
                                        </TabsTrigger>
                                    );
                                },
                            )}
                        </TabsList>
                    </Tabs>

                    <p className="text-xs text-muted-foreground flex-shrink-0">
                        {sortedTemplates.length} template
                        {sortedTemplates.length !== 1 ? "s" : ""} found
                    </p>
                </div>
            </motion.div>

            {/* Template Grid */}
            {sortedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {sortedTemplates.map((template, i) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            index={i}
                            onPreview={handlePreview}
                            onUse={handleUseTemplate}
                        />
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 px-4"
                >
                    <div className="relative mb-6">
                        <motion.div
                            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#8e78fb]/15 to-[#f65887]/15 flex items-center justify-center"
                            animate={{ rotate: [0, 3, -3, 0] }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <Search className="h-10 w-10 text-muted-foreground/40" />
                        </motion.div>
                        <motion.div
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 shadow-lg shadow-amber-400/30 flex items-center justify-center"
                            animate={{ y: [0, -6, 0], rotate: [0, 10, 0] }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <Sparkles className="h-3 w-3 text-white" />
                        </motion.div>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">
                        No templates found
                    </h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                        Try adjusting your search or selecting a different
                        category. You can also use the AI generator to create a
                        custom template.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchQuery("");
                                setActiveCategory("all");
                            }}
                        >
                            Clear Filters
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-[#8e78fb] to-[#f65887] hover:opacity-90 text-white"
                            onClick={() => {
                                setSearchQuery("");
                                setActiveCategory("all");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                        >
                            <Wand2 className="h-4 w-4 mr-2" />
                            Try AI Generator
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Popular templates promo - shown when viewing all */}
            {activeCategory === "all" &&
                searchQuery === "" &&
                sortedTemplates.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <Card className="bg-gradient-to-r from-zinc-50 to-zinc-100/50 dark:from-zinc-900 dark:to-zinc-800/50 border-dashed">
                            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20 flex-shrink-0">
                                        <Rocket className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">
                                            Can&apos;t find what you need?
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Start with a blank canvas and build
                                            your perfect home page from scratch
                                            with our drag-and-drop editor.
                                        </p>
                                    </div>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex-shrink-0"
                                >
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() =>
                                            router.push(
                                                "/creator/landing-pages/new",
                                            )
                                        }
                                    >
                                        Start from Scratch
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

            {/* Preview Dialog */}
            <TemplatePreviewDialog
                template={previewTemplate}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                onUse={handleUseTemplate}
            />
        </PageShell>
    );
}
