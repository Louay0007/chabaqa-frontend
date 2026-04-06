"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { PageTemplate } from "@/lib/landing-pages/types";
import {
    pageTemplates,
    cloneTemplateBlocks,
} from "@/lib/landing-pages/templates";
import {
    ArrowRight,
    ArrowLeft,
    Loader2,
    LayoutTemplate,
    FileText,
    Search,
    Tag,
    Layers,
    Sparkles,
    CheckCircle2,
} from "lucide-react";
import {
    landingPagesApi,
    communityHomePageApi,
} from "@/lib/api/landing-pages.api";
import { communitiesApi } from "@/lib/api/communities.api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const CATEGORY_LABELS: Record<string, string> = {
    sales: "Sales",
    "lead-capture": "Lead Capture",
    events: "Events",
    arabic: "Arabic (RTL)",
    business: "Business",
    webinar: "Webinar",
    course: "Course",
};

const CATEGORY_COLORS: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
> = {
    sales: "default",
    "lead-capture": "secondary",
    events: "outline",
    arabic: "secondary",
    business: "default",
    webinar: "outline",
    course: "default",
};

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

interface StepIndicatorProps {
    currentStep: number;
    steps: { label: string }[];
}

function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map((step, idx) => {
                const num = idx + 1;
                const isCompleted = num < currentStep;
                const isActive = num === currentStep;

                return (
                    <React.Fragment key={num}>
                        <div className="flex flex-col items-center gap-1.5">
                            <motion.div
                                animate={
                                    isActive
                                        ? { scale: 1.1 }
                                        : isCompleted
                                          ? { scale: 1 }
                                          : { scale: 1 }
                                }
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                }}
                                className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300",
                                    isCompleted &&
                                        "bg-gradient-to-br from-[#8e78fb] to-[#f65887] border-transparent text-white shadow-md shadow-purple-200",
                                    isActive &&
                                        "bg-gradient-to-br from-[#8e78fb] to-[#f65887] border-transparent text-white shadow-lg shadow-purple-300 ring-4 ring-purple-100",
                                    !isActive &&
                                        !isCompleted &&
                                        "bg-white border-gray-200 text-gray-400",
                                )}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    num
                                )}
                            </motion.div>
                            <span
                                className={cn(
                                    "text-xs font-medium whitespace-nowrap transition-colors duration-200",
                                    isActive
                                        ? "text-purple-600"
                                        : "text-gray-400",
                                )}
                            >
                                {step.label}
                            </span>
                        </div>

                        {idx < steps.length - 1 && (
                            <div
                                className={cn(
                                    "h-0.5 w-16 mx-1 mb-5 rounded-full transition-all duration-500",
                                    isCompleted
                                        ? "bg-gradient-to-r from-[#8e78fb] to-[#f65887]"
                                        : "bg-gray-200",
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Template info card
// ---------------------------------------------------------------------------

function TemplateInfoCard({ template }: { template: PageTemplate }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50/80 to-pink-50/60 p-4 flex gap-3 items-start"
        >
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-gradient-to-br from-[#8e78fb] to-[#f65887] flex items-center justify-center flex-shrink-0">
                <LayoutTemplate className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                        {template.name}
                    </p>
                    <Badge
                        variant={
                            CATEGORY_COLORS[template.category] ?? "outline"
                        }
                        className="text-xs capitalize"
                    >
                        {CATEGORY_LABELS[template.category] ??
                            template.category}
                    </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {template.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {template.blocks.length} blocks
                    </span>
                    <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {CATEGORY_LABELS[template.category] ??
                            template.category}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Blank canvas info card
// ---------------------------------------------------------------------------

function BlankCanvasCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 flex gap-3 items-start"
        >
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">
                    Starting from: Blank Canvas
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                    A clean slate — drag and drop blocks to build your page
                    exactly the way you want it.
                </p>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const STEPS = [{ label: "Details" }, { label: "SEO" }];

const SLIDE_VARIANTS = {
    enterFromRight: { x: 40, opacity: 0 },
    enterFromLeft: { x: -40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitToLeft: { x: -40, opacity: 0 },
    exitToRight: { x: 40, opacity: 0 },
};

export default function NewLandingPagePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedCommunityId = searchParams.get("communityId") ?? "";

    // ------------------------------------------------------------------
    // Template resolution
    // ------------------------------------------------------------------
    const templateId = searchParams.get("templateId") ?? "";
    const [selectedTemplate, setSelectedTemplate] =
        useState<PageTemplate | null>(null);

    useEffect(() => {
        if (templateId) {
            const found =
                pageTemplates.find((t: PageTemplate) => t.id === templateId) ??
                null;
            setSelectedTemplate(found);
        } else {
            setSelectedTemplate(null);
        }
    }, [templateId]);

    // ------------------------------------------------------------------
    // Step state
    // ------------------------------------------------------------------
    const [step, setStep] = useState<1 | 2>(1);
    const [direction, setDirection] = useState<"forward" | "back">("forward");

    // ------------------------------------------------------------------
    // Step 1 fields
    // ------------------------------------------------------------------
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [description, setDescription] = useState("");
    const [communities, setCommunities] = useState<Array<any>>([]);
    const [selectedCommunityId, setSelectedCommunityId] = useState("");
    const [loadingCommunities, setLoadingCommunities] = useState(true);

    // ------------------------------------------------------------------
    // Step 2 fields
    // ------------------------------------------------------------------
    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");

    // ------------------------------------------------------------------
    // Submission state
    // ------------------------------------------------------------------
    const [isCreating, setIsCreating] = useState(false);

    // ------------------------------------------------------------------
    // Auto-slug from title
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!slugManuallyEdited) {
            setSlug(slugify(title));
        }
    }, [title, slugManuallyEdited]);

    useEffect(() => {
        let cancelled = false;
        setLoadingCommunities(true);

        communitiesApi
            .getMyCreated()
            .then((response) => {
                if (cancelled) return;
                const list = Array.isArray(response?.data) ? response.data : [];
                setCommunities(list);
                const requestedExists =
                    requestedCommunityId &&
                    list.some(
                        (community: any) =>
                            String(community?._id || community?.id || "") ===
                            requestedCommunityId,
                    );
                const nextSelected = requestedExists
                    ? requestedCommunityId
                    : String(list[0]?._id || list[0]?.id || "");
                setSelectedCommunityId(nextSelected);
                setLoadingCommunities(false);
            })
            .catch(() => {
                if (cancelled) return;
                setCommunities([]);
                setSelectedCommunityId("");
                setLoadingCommunities(false);
            });

        return () => {
            cancelled = true;
        };
    }, [requestedCommunityId]);

    // Pre-fill SEO title when moving to step 2
    const goToStep2 = useCallback(() => {
        if (!seoTitle && title) {
            setSeoTitle(title);
        }
        setDirection("forward");
        setStep(2);
    }, [seoTitle, title]);

    const goToStep1 = useCallback(() => {
        setDirection("back");
        setStep(1);
    }, []);

    // ------------------------------------------------------------------
    // Submit
    // ------------------------------------------------------------------
    const handleCreate = useCallback(async () => {
        if (!selectedCommunityId) return;
        setIsCreating(true);
        try {
            const draft =
                await communityHomePageApi.getOrCreateDraft(selectedCommunityId);
            const newId = (draft as any)?.id || (draft as any)?._id;
            if (!newId) {
                throw new Error("Failed to resolve community home page draft ID");
            }

            await landingPagesApi.update(String(newId), {
                title: title,
                description: description || undefined,
                seo: {
                    title: seoTitle || undefined,
                    description: seoDescription || undefined,
                },
            });

            const params = new URLSearchParams();
            if (templateId) params.set("template", templateId);
            router.push(
                `/creator/landing-pages/${newId}/edit${params.toString() ? `?${params.toString()}` : ""}`,
            );
        } catch (err) {
            console.error("Failed to create page", err);
            setIsCreating(false);
        }
    }, [
        selectedCommunityId,
        router,
        templateId,
        title,
        description,
        seoTitle,
        seoDescription,
    ]);

    // ------------------------------------------------------------------
    // Animated step panel
    // ------------------------------------------------------------------
    const stepVariants = {
        initial:
            direction === "forward"
                ? SLIDE_VARIANTS.enterFromRight
                : SLIDE_VARIANTS.enterFromLeft,
        animate: SLIDE_VARIANTS.center,
        exit:
            direction === "forward"
                ? SLIDE_VARIANTS.exitToLeft
                : SLIDE_VARIANTS.exitToRight,
    };

    const SEO_DESC_MAX = 160;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 flex flex-col items-center justify-start pt-10 pb-20 px-4">
            {/* ----------------------------------------------------------------
          Page header
      ---------------------------------------------------------------- */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="w-full max-w-xl mb-8 text-center"
            >
                {/* Gradient badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#8e78fb]/10 to-[#f65887]/10 border border-purple-100 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs font-medium text-purple-600">
                        New Community Home Page
                    </span>
                </div>

                {/* Hero gradient title */}
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    <span className="bg-gradient-to-r from-[#8e78fb] to-[#f65887] bg-clip-text text-transparent">
                        Build Your Community Home Page
                    </span>
                </h1>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    {step === 1
                        ? "Give your page a name and slug to get started."
                        : "Help search engines understand what your page is about."}
                </p>
            </motion.div>

            {/* ----------------------------------------------------------------
          Card
      ---------------------------------------------------------------- */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
                className="w-full max-w-xl"
            >
                <Card className="shadow-xl shadow-purple-100/40 border border-white/80 bg-white/90 backdrop-blur-sm overflow-hidden">
                    {/* Gradient top bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-[#8e78fb] to-[#f65887]" />

                    <CardHeader className="pt-6 pb-2 px-6">
                        <StepIndicator currentStep={step} steps={STEPS} />
                    </CardHeader>

                    {/* Step panels */}
                    <div className="relative overflow-hidden">
                        <AnimatePresence mode="wait" initial={false}>
                            {step === 1 ? (
                                <motion.div
                                    key="step-1"
                                    variants={stepVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{
                                        duration: 0.28,
                                        ease: "easeInOut",
                                    }}
                                >
                                    <CardContent className="px-6 pb-6 pt-0 space-y-5">
                                        {/* Section heading */}
                                        <div>
                                            <CardTitle className="text-lg text-gray-800">
                                                Name your page
                                            </CardTitle>
                                            <CardDescription className="text-sm mt-0.5">
                                                Choose a clear title and unique
                                                URL slug.
                                            </CardDescription>
                                        </div>

                                        <Separator />

                                        {/* Page title */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="page-title"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Page Title{" "}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </label>
                                            <Input
                                                id="page-title"
                                                value={title}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLInputElement>,
                                                ) => setTitle(e.target.value)}
                                                placeholder="e.g. Arabic Course Sales Page"
                                                className="h-10 focus-visible:ring-purple-400"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Slug */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="page-slug"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Page Slug
                                            </label>
                                            <div className="flex items-center gap-0 rounded-lg border border-input overflow-hidden focus-within:ring-2 focus-within:ring-purple-400 focus-within:ring-offset-0 transition-shadow">
                                                <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-r border-input whitespace-nowrap select-none">
                                                    /lp/
                                                </span>
                                                <input
                                                    id="page-slug"
                                                    value={slug}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>,
                                                    ) => {
                                                        setSlug(
                                                            slugify(
                                                                e.target.value,
                                                            ),
                                                        );
                                                        setSlugManuallyEdited(
                                                            true,
                                                        );
                                                    }}
                                                    placeholder="my-arabic-course"
                                                    className="flex-1 px-3 py-2 text-sm bg-white outline-none placeholder:text-muted-foreground"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Auto-generated from the title.
                                                You can edit it freely.
                                            </p>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="page-description"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Description{" "}
                                                <span className="text-gray-400 font-normal">
                                                    (optional)
                                                </span>
                                            </label>
                                            <Textarea
                                                id="page-description"
                                                value={description}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLTextAreaElement>,
                                                ) =>
                                                    setDescription(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="A short internal note about this page's purpose…"
                                                rows={3}
                                                className="resize-none focus-visible:ring-purple-400"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="community-id"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Community{" "}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                id="community-id"
                                                value={selectedCommunityId}
                                                onChange={(e) =>
                                                    setSelectedCommunityId(
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={loadingCommunities}
                                                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {loadingCommunities ? (
                                                    <option value="">
                                                        Loading communities...
                                                    </option>
                                                ) : communities.length > 0 ? (
                                                    communities.map(
                                                        (community: any) => {
                                                            const id = String(
                                                                community?._id ||
                                                                    community?.id ||
                                                                    "",
                                                            );
                                                            return (
                                                                <option
                                                                    key={id}
                                                                    value={id}
                                                                >
                                                                    {community?.name ||
                                                                        "Untitled community"}
                                                                </option>
                                                            );
                                                        },
                                                    )
                                                ) : (
                                                    <option value="">
                                                        No communities available
                                                    </option>
                                                )}
                                            </select>
                                            <p className="text-xs text-gray-400">
                                                This opens your existing home
                                                page for the selected community,
                                                or creates it if missing.
                                            </p>
                                        </div>

                                        {/* Template / blank canvas info */}
                                        {selectedTemplate ? (
                                            <TemplateInfoCard
                                                template={selectedTemplate}
                                            />
                                        ) : (
                                            <BlankCanvasCard />
                                        )}

                                        {/* CTA */}
                                        <div className="pt-1">
                                            <Button
                                                onClick={goToStep2}
                                                disabled={
                                                    !title.trim() ||
                                                    !selectedCommunityId
                                                }
                                                className={cn(
                                                    "w-full h-11 font-semibold text-sm gap-2 transition-all duration-200",
                                                    title.trim() &&
                                                        selectedCommunityId
                                                        ? "bg-gradient-to-r from-[#8e78fb] to-[#f65887] hover:opacity-90 text-white border-0 shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300"
                                                        : "cursor-not-allowed",
                                                )}
                                            >
                                                Continue
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step-2"
                                    variants={stepVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{
                                        duration: 0.28,
                                        ease: "easeInOut",
                                    }}
                                >
                                    <CardContent className="px-6 pb-6 pt-0 space-y-5">
                                        {/* Section heading */}
                                        <div>
                                            <CardTitle className="text-lg text-gray-800">
                                                Optimize for search
                                            </CardTitle>
                                            <CardDescription className="text-sm mt-0.5">
                                                These fields help search engines
                                                index your page correctly.
                                            </CardDescription>
                                        </div>

                                        <Separator />

                                        {/* SEO Title */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="seo-title"
                                                className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
                                            >
                                                <Search className="w-3.5 h-3.5 text-gray-400" />
                                                SEO Title
                                            </label>
                                            <Input
                                                id="seo-title"
                                                value={seoTitle}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLInputElement>,
                                                ) =>
                                                    setSeoTitle(e.target.value)
                                                }
                                                placeholder={
                                                    title ||
                                                    "Page title for search engines"
                                                }
                                                className="h-10 focus-visible:ring-purple-400"
                                                autoFocus
                                            />
                                            <p className="text-xs text-gray-400">
                                                Shown in search results. Ideally
                                                50–60 characters.
                                            </p>
                                        </div>

                                        {/* SEO Description */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label
                                                    htmlFor="seo-description"
                                                    className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
                                                >
                                                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                                                    SEO Description
                                                </label>
                                                <span
                                                    className={cn(
                                                        "text-xs tabular-nums transition-colors",
                                                        seoDescription.length >
                                                            SEO_DESC_MAX
                                                            ? "text-red-500 font-medium"
                                                            : seoDescription.length >
                                                                SEO_DESC_MAX *
                                                                    0.85
                                                              ? "text-amber-500"
                                                              : "text-gray-400",
                                                    )}
                                                >
                                                    {seoDescription.length} /{" "}
                                                    {SEO_DESC_MAX}
                                                </span>
                                            </div>
                                            <Textarea
                                                id="seo-description"
                                                value={seoDescription}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLTextAreaElement>,
                                                ) => {
                                                    if (
                                                        e.target.value.length <=
                                                        SEO_DESC_MAX
                                                    ) {
                                                        setSeoDescription(
                                                            e.target.value,
                                                        );
                                                    }
                                                }}
                                                placeholder="A compelling 1–2 sentence summary that appears in search results…"
                                                rows={3}
                                                className="resize-none focus-visible:ring-purple-400"
                                                maxLength={SEO_DESC_MAX}
                                            />
                                        </div>

                                        {/* SEO Keywords */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="seo-keywords"
                                                className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
                                            >
                                                <Tag className="w-3.5 h-3.5 text-gray-400" />
                                                SEO Keywords{" "}
                                                <span className="text-gray-400 font-normal">
                                                    (optional)
                                                </span>
                                            </label>
                                            <Input
                                                id="seo-keywords"
                                                value={seoKeywords}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLInputElement>,
                                                ) =>
                                                    setSeoKeywords(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="arabic, online course, learn quran, beginner"
                                                className="h-10 focus-visible:ring-purple-400"
                                            />
                                            <p className="text-xs text-gray-400">
                                                Comma-separated keywords
                                                relevant to your page.
                                            </p>
                                        </div>

                                        {/* Page summary pill */}
                                        <div className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 px-4 py-3 flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8e78fb] to-[#f65887] flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-700 truncate">
                                                    {title}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    /lp/{slug || "—"} ·{" "}
                                                    {selectedTemplate
                                                        ? selectedTemplate.name
                                                        : "Blank Canvas"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-1">
                                            <button
                                                type="button"
                                                onClick={goToStep1}
                                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium py-2 px-1"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                Back
                                            </button>

                                            <Button
                                                onClick={handleCreate}
                                                disabled={
                                                    isCreating ||
                                                    !selectedCommunityId
                                                }
                                                className="flex-1 h-11 font-semibold text-sm gap-2 bg-gradient-to-r from-[#8e78fb] to-[#f65887] hover:opacity-90 text-white border-0 shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300 transition-all duration-200"
                                            >
                                                {isCreating ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Creating page…
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        Open Editor
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>

                {/* Footer note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-xs text-gray-400 mt-4"
                >
                    You can change all these settings later in the editor.
                </motion.p>
            </motion.div>
        </div>
    );
}
