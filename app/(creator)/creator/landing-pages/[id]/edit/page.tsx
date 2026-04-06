"use client";
import { useAuthContext } from "@/app/providers/auth-provider";

import React, {
    useReducer,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    pageTemplates,
    cloneTemplateBlocks,
} from "@/lib/landing-pages/templates";
import { motion, AnimatePresence } from "framer-motion";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    useDraggable,
    useDroppable,
    type DragStartEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

import type {
    BlockType,
    PageBlock,
    BlockContent,
    BlockStyle,
} from "@/lib/landing-pages/types";
import {
    EditorContext,
    editorReducer,
    createInitialFullState,
    useEditorActions,
    type FullEditorState,
} from "@/lib/landing-pages/store";
import {
    createBlock,
    blockTypeLabels,
    blockTypeIcons,
    blockCategories,
} from "@/lib/landing-pages/block-defaults";

import {
    ArrowLeft,
    Monitor,
    Tablet,
    Smartphone,
    Undo2,
    Redo2,
    Grid3X3,
    ZoomIn,
    ZoomOut,
    Eye,
    Search,
    GripVertical,
    ChevronUp,
    ChevronDown,
    Copy,
    Trash2,
    Settings,
    Plus,
    X,
    Check,
    CheckCircle2,
    AlertCircle,
    Lock,
    Unlock,
    EyeOff,
    Sparkles,
    Star,
    PlayCircle,
    Type,
    Image as ImageIcon,
    MousePointerClick,
    MessageSquareQuote,
    LayoutGrid,
    CreditCard,
    HelpCircle,
    FileInput,
    Timer,
    Minus,
    Users,
    PanelTop,
    PanelBottom,
    Loader2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    PanelLeftClose,
    PanelLeftOpen,
    Globe,
    Save,
    ChevronDown as ChevronDownIcon,
    Layers,
    Zap,
    BarChart3,
    Shield,
    Clock,
    Heart,
    UserPlus,
    Layout,
    Home,
} from "lucide-react";
import { landingPagesApi } from "@/lib/api/landing-pages.api";

// ── Icon map for dynamic block icons ────────────────────────────────────────

const ICON_MAP: Record<
    string,
    React.FC<{ className?: string; size?: number }>
> = {
    Sparkles,
    Type,
    Image: ImageIcon,
    MousePointerClick,
    MessageSquareQuote,
    LayoutGrid,
    CreditCard,
    HelpCircle,
    FileInput,
    PlayCircle,
    Timer,
    Minus,
    Users,
    PanelTop,
    PanelBottom,
    Layers,
    Zap,
    BarChart3,
    Shield,
    Globe,
    Star,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    Clock,
    Plus,
    Search,
    Settings,
    Heart,
    UserPlus,
    Layout,
};

function BlockIcon({
    name,
    className,
    size = 16,
}: {
    name: string;
    className?: string;
    size?: number;
}) {
    const Icon = ICON_MAP[name] || Sparkles;
    return <Icon className={className} size={size} />;
}

const categoryIcons: Record<string, React.FC<{ className?: string }>> = {
    Layout: PanelTop,
    Content: Type,
    Engagement: MousePointerClick,
    Social: Users,
    Commerce: CreditCard,
    Community: Heart,
};

const COLOR_PRESETS = [
    "#ffffff",
    "#f8f7ff",
    "#0f0a2e",
    "#1a1a2e",
    "#8e78fb",
    "#f65887",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#6366f1",
    "#ec4899",
    "#000000",
    "#374151",
    "#f3f4f6",
];

function parsePx(val?: string): number {
    if (!val) return 0;
    const m = val.match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

function parsePxPart(
    val: string | undefined,
    side: "top" | "right" | "bottom" | "left",
): number {
    if (!val) return 0;
    const parts = val
        .trim()
        .split(/\s+/)
        .map((p) => parseInt(p) || 0);
    if (parts.length === 1) return parts[0];
    if (parts.length === 2)
        return side === "top" || side === "bottom" ? parts[0] : parts[1];
    if (parts.length === 3) {
        if (side === "top") return parts[0];
        if (side === "left" || side === "right") return parts[1];
        return parts[2];
    }
    return parts[["top", "right", "bottom", "left"].indexOf(side)];
}

function buildPaddingStyle(s: BlockStyle): React.CSSProperties {
    const hasIndividual =
        s.paddingTop || s.paddingBottom || s.paddingLeft || s.paddingRight;
    if (hasIndividual) {
        const parts = (s.padding || "48px 24px").trim().split(/\s+/);
        const vPx = parts[0] || "48px";
        const hPx = parts[1] || parts[0] || "24px";
        return {
            paddingTop: s.paddingTop ?? vPx,
            paddingBottom: s.paddingBottom ?? vPx,
            paddingLeft: s.paddingLeft ?? hPx,
            paddingRight: s.paddingRight ?? hPx,
        };
    }
    return { padding: s.padding || "48px 24px" };
}

function toEmbedUrl(url: string): string {
    if (!url) return "";
    const ytMatch = url.match(
        /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
}

// ── BlockRenderer ───────────────────────────────────────────────────────────

function BlockRenderer({ block }: { block: PageBlock }) {
    const { content: c, style: s, type } = block;
    const base: React.CSSProperties = {
        backgroundColor: s.backgroundGradient ? undefined : s.backgroundColor,
        backgroundImage: s.backgroundGradient
            ? s.backgroundGradient
            : s.backgroundImage
              ? `url(${s.backgroundImage})`
              : undefined,
        backgroundSize:
            s.backgroundImage && !s.backgroundGradient
                ? s.backgroundSize || "cover"
                : undefined,
        backgroundPosition:
            s.backgroundImage && !s.backgroundGradient
                ? s.backgroundPosition || "center"
                : undefined,
        color: s.textColor,
        textAlign: s.textAlign || "center",
        ...buildPaddingStyle(s),
        marginTop: s.marginTop || undefined,
        marginBottom: s.marginBottom || undefined,
        borderRadius: s.borderRadius,
        borderWidth:
            s.borderStyle && s.borderStyle !== "none"
                ? s.borderWidth || "1px"
                : undefined,
        borderStyle: s.borderStyle || undefined,
        borderColor: s.borderColor || undefined,
        boxShadow: s.boxShadow || undefined,
        opacity: s.opacity ?? undefined,
        minHeight: s.minHeight || undefined,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize || undefined,
        fontWeight: s.fontWeight || undefined,
        lineHeight: s.lineHeight || undefined,
        letterSpacing: s.letterSpacing || undefined,
        maxWidth: s.maxWidth || "100%",
        overflow: "hidden",
    };

    switch (type) {
        case "hero":
            return (
                <div
                    style={{
                        ...base,
                        background:
                            s.backgroundGradient ||
                            s.backgroundColor ||
                            "linear-gradient(135deg,#0f0a2e,#1a1a4e)",
                        backgroundImage: s.backgroundGradient
                            ? s.backgroundGradient
                            : (c as any).backgroundImageUrl
                              ? `url(${(c as any).backgroundImageUrl})`
                              : s.backgroundImage
                                ? `url(${s.backgroundImage})`
                                : undefined,
                        backgroundSize:
                            ((c as any).backgroundImageUrl ||
                                s.backgroundImage) &&
                            !s.backgroundGradient
                                ? "cover"
                                : undefined,
                        backgroundPosition: "center",
                        color: s.textColor || "#fff",
                    }}
                >
                    <div className="mx-auto max-w-3xl space-y-4">
                        <h1 className="text-2xl font-bold md:text-3xl">
                            {c.headline || "Your Headline Here"}
                        </h1>
                        <p className="text-sm opacity-80">
                            {c.subheadline || "Add a compelling subheadline"}
                        </p>
                        <div className="pt-2">
                            <span className="inline-block rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg">
                                {c.ctaText || "Get Started"}
                            </span>
                        </div>
                    </div>
                </div>
            );

        case "text":
            return (
                <div style={base}>
                    <div className="mx-auto max-w-3xl space-y-3">
                        {c.headline && (
                            <h2 className="text-xl font-bold">{c.headline}</h2>
                        )}
                        <p className="text-sm leading-relaxed opacity-80">
                            {c.body || "Write your content here..."}
                        </p>
                    </div>
                </div>
            );

        case "image":
            return (
                <div style={base}>
                    <div className="mx-auto max-w-2xl">
                        {c.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={c.imageUrl}
                                alt={c.imageAlt || ""}
                                className="w-full rounded-lg object-cover"
                                style={{
                                    borderRadius: (c as any).imageBorderRadius
                                        ? `${(c as any).imageBorderRadius}px`
                                        : "8px",
                                }}
                            />
                        ) : (
                            <div className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                                <div className="text-center text-gray-400">
                                    <ImageIcon className="mx-auto mb-2 h-10 w-10" />
                                    <p className="text-xs">
                                        {c.imageAlt || "Click to set image URL"}
                                    </p>
                                </div>
                            </div>
                        )}
                        {c.caption && (
                            <p className="mt-2 text-center text-xs text-gray-500">
                                {c.caption}
                            </p>
                        )}
                    </div>
                </div>
            );

        case "cta":
            return (
                <div
                    style={{
                        ...base,
                        background:
                            s.backgroundGradient ||
                            s.backgroundColor ||
                            "#f8f7ff",
                    }}
                >
                    <div className="mx-auto max-w-2xl space-y-3">
                        <h2 className="text-xl font-bold">
                            {c.headline || "Ready to Get Started?"}
                        </h2>
                        <p className="text-sm opacity-70">
                            {c.subheadline ||
                                "Join thousands of happy customers"}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            <span className="inline-block rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg">
                                {c.buttonText || "Start Now"}
                            </span>
                            {c.secondaryButtonText && (
                                <span className="inline-block rounded-lg border border-current px-6 py-2.5 text-sm font-semibold opacity-70">
                                    {c.secondaryButtonText}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            );

        case "testimonials":
            return (
                <div style={base}>
                    <div className="mx-auto max-w-4xl">
                        {c.headline && (
                            <h2 className="mb-6 text-xl font-bold">
                                {c.headline}
                            </h2>
                        )}
                        <div className="grid gap-4 md:grid-cols-3">
                            {(c.testimonials || []).slice(0, 3).map((t) => (
                                <div
                                    key={t.id}
                                    className="rounded-lg border bg-white p-4 text-left shadow-sm"
                                >
                                    <div className="mb-2 flex gap-0.5">
                                        {Array.from({
                                            length: t.rating || 5,
                                        }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                                            />
                                        ))}
                                    </div>
                                    <p className="mb-3 text-xs leading-relaxed text-gray-600">
                                        &ldquo;{t.quote}&rdquo;
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-xs font-bold text-white">
                                            {t.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-900">
                                                {t.name}
                                            </p>
                                            {t.role && (
                                                <p className="text-[10px] text-gray-500">
                                                    {t.role}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case "features":
            return (
                <div style={base}>
                    <div className="mx-auto max-w-4xl">
                        {c.headline && (
                            <h2 className="mb-2 text-xl font-bold">
                                {c.headline}
                            </h2>
                        )}
                        {c.subheadline && (
                            <p className="mb-6 text-sm opacity-70">
                                {c.subheadline}
                            </p>
                        )}
                        <div
                            className={cn(
                                "grid gap-4",
                                c.columns === 2
                                    ? "md:grid-cols-2"
                                    : c.columns === 4
                                      ? "md:grid-cols-4"
                                      : "md:grid-cols-3",
                            )}
                        >
                            {(c.features || []).slice(0, 6).map((f) => (
                                <div
                                    key={f.id}
                                    className="rounded-lg border bg-white p-4 text-center"
                                >
                                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                                        <BlockIcon
                                            name={f.icon || "Sparkles"}
                                            className="h-5 w-5 text-purple-600"
                                        />
                                    </div>
                                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                                        {f.title}
                                    </h3>
                                    <p className="text-xs leading-relaxed text-gray-500">
                                        {f.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case "pricing":
            return (
                <div style={base}>
                    <div className="mx-auto max-w-4xl">
                        {c.headline && (
                            <h2 className="mb-2 text-xl font-bold">
                                {c.headline}
                            </h2>
                        )}
                        {c.subheadline && (
                            <p className="mb-6 text-sm opacity-70">
                                {c.subheadline}
                            </p>
                        )}
                        <div className="grid gap-4 md:grid-cols-3">
                            {(c.pricingPlans || []).slice(0, 3).map((plan) => (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "rounded-xl border-2 bg-white p-5 text-left",
                                        plan.highlighted
                                            ? "border-purple-500 shadow-lg shadow-purple-100"
                                            : "border-gray-200",
                                    )}
                                >
                                    {plan.highlighted && (
                                        <span className="mb-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                                            Most Popular
                                        </span>
                                    )}
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {plan.name}
                                    </h3>
                                    <div className="my-2">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {plan.price}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {plan.period}
                                        </span>
                                    </div>
                                    <ul className="mb-4 space-y-1">
                                        {plan.features
                                            .slice(0, 4)
                                            .map((feat, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-1.5 text-xs text-gray-600"
                                                >
                                                    <Check className="h-3 w-3 text-green-500" />
                                                    {feat}
                                                </li>
                                            ))}
                                    </ul>
                                    <span
                                        className={cn(
                                            "block rounded-lg px-4 py-2 text-center text-xs font-semibold",
                                            plan.highlighted
                                                ? "bg-purple-600 text-white"
                                                : "bg-gray-100 text-gray-700",
                                        )}
                                    >
                                        {plan.ctaText || "Choose Plan"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case "faq":
            return (
                <div style={base}>
                    <div className="mx-auto max-w-2xl">
                        {c.headline && (
                            <h2 className="mb-6 text-xl font-bold">
                                {c.headline}
                            </h2>
                        )}
                        <div className="space-y-3">
                            {(c.faqs || []).slice(0, 4).map((faq, idx) => (
                                <div
                                    key={faq.id}
                                    className="rounded-lg border bg-white p-4 text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            {faq.question}
                                        </h3>
                                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                    </div>
                                    {idx === 0 && (
                                        <p className="mt-2 text-xs leading-relaxed text-gray-500">
                                            {faq.answer}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case "form":
            return (
                <div style={base}>
                    <div className="mx-auto max-w-md">
                        {c.headline && (
                            <h2 className="mb-4 text-xl font-bold">
                                {c.headline}
                            </h2>
                        )}
                        {c.subheadline && (
                            <p className="mb-4 text-sm opacity-70">
                                {c.subheadline}
                            </p>
                        )}
                        <div className="space-y-3 rounded-lg border bg-white p-5 text-left">
                            {(c.formFields || []).slice(0, 4).map((f) => (
                                <div key={f.id}>
                                    <label className="mb-1 block text-xs font-medium text-gray-700">
                                        {f.label}
                                        {f.required && (
                                            <span className="text-red-400">
                                                {" "}
                                                *
                                            </span>
                                        )}
                                    </label>
                                    <div
                                        className={cn(
                                            "rounded-md border border-gray-200 bg-gray-50",
                                            f.type === "textarea"
                                                ? "h-16"
                                                : "h-9",
                                        )}
                                    />
                                </div>
                            ))}
                            <span className="mt-2 block rounded-lg bg-purple-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
                                {c.formSubmitText || "Submit"}
                            </span>
                        </div>
                    </div>
                </div>
            );

        case "video":
            return (
                <div
                    style={{
                        ...base,
                        background:
                            s.backgroundGradient ||
                            s.backgroundColor ||
                            "#0f0a2e",
                        color: s.textColor || "#fff",
                    }}
                >
                    <div className="mx-auto max-w-3xl">
                        {c.headline && (
                            <h2 className="mb-4 text-xl font-bold">
                                {c.headline}
                            </h2>
                        )}
                        {c.videoUrl ? (
                            <div
                                style={{
                                    position: "relative",
                                    paddingBottom: "56.25%",
                                    height: 0,
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                }}
                            >
                                <iframe
                                    src={toEmbedUrl(c.videoUrl)}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        border: "none",
                                    }}
                                    allowFullScreen
                                    title={c.headline || "Video"}
                                />
                            </div>
                        ) : (
                            <div className="flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-black/30">
                                <PlayCircle className="h-14 w-14 opacity-60" />
                            </div>
                        )}
                    </div>
                </div>
            );

        case "countdown":
            return (
                <div
                    style={{
                        ...base,
                        background:
                            s.backgroundGradient ||
                            "linear-gradient(135deg,#8e78fb,#f65887)",
                        color: s.textColor || "#fff",
                    }}
                >
                    <div className="mx-auto max-w-2xl space-y-4">
                        <h2 className="text-xl font-bold">
                            {c.headline || "Don't Miss Out!"}
                        </h2>
                        <div className="flex items-center justify-center gap-3">
                            {["07", "23", "45", "12"].map((v, i) => (
                                <div key={i} className="text-center">
                                    <div className="rounded-lg bg-white/20 px-4 py-3 text-2xl font-bold backdrop-blur-sm">
                                        {v}
                                    </div>
                                    <p className="mt-1 text-[10px] uppercase opacity-70">
                                        {["Days", "Hours", "Mins", "Secs"][i]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case "divider": {
            const ds = c.dividerStyle || "line";
            const dc = c.dividerColor || "#e5e7eb";
            const dt = c.dividerThickness || 1;
            return (
                <div style={{ ...base, padding: s.padding || "16px 24px" }}>
                    {ds === "dots" ? (
                        <div
                            style={{
                                textAlign: "center",
                                color: dc,
                                letterSpacing: "8px",
                                fontSize: `${dt + 8}px`,
                            }}
                        >
                            • • • • •
                        </div>
                    ) : ds === "gradient" ? (
                        <div
                            style={{
                                height: `${dt}px`,
                                background: `linear-gradient(90deg, transparent, ${dc}, transparent)`,
                                maxWidth: s.maxWidth || "1200px",
                                margin: "0 auto",
                            }}
                        />
                    ) : (
                        <hr
                            style={{
                                border: "none",
                                borderTop: `${dt}px solid ${dc}`,
                                maxWidth: s.maxWidth || "1200px",
                                margin: "0 auto",
                            }}
                        />
                    )}
                </div>
            );
        }

        case "social-proof":
            return (
                <div style={base}>
                    <div className="mx-auto max-w-4xl">
                        {c.headline && (
                            <h2 className="mb-6 text-xl font-bold">
                                {c.headline}
                            </h2>
                        )}
                        {c.stats && c.stats.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {c.stats.map((st) => (
                                    <div key={st.id} className="text-center">
                                        <p className="text-2xl font-bold text-purple-600">
                                            {st.value}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {st.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {c.logos && c.logos.length > 0 && (
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 opacity-60">
                                {c.logos.map((logo) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        key={logo.id}
                                        src={logo.imageUrl}
                                        alt={logo.alt || ""}
                                        style={{
                                            height: "32px",
                                            objectFit: "contain",
                                            filter: "grayscale(1)",
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );

        case "header":
            return (
                <div style={{ ...base, padding: s.padding || "16px 24px" }}>
                    <div className="mx-auto flex max-w-5xl items-center justify-between">
                        <div className="flex items-center gap-2">
                            {c.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={c.logoUrl}
                                    alt={c.logoText || "Logo"}
                                    style={{
                                        height: "32px",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
                            )}
                            <span className="text-sm font-bold">
                                {c.logoText || "Brand"}
                            </span>
                        </div>
                        <nav className="hidden items-center gap-4 md:flex">
                            {(c.navLinks || []).map((l, i) => (
                                <span key={i} className="text-xs text-gray-600">
                                    {l.label}
                                </span>
                            ))}
                        </nav>
                        {c.ctaText && (
                            <span className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white">
                                {c.ctaText}
                            </span>
                        )}
                    </div>
                </div>
            );

        case "footer":
            return (
                <div
                    style={{
                        ...base,
                        background: s.backgroundColor || "#0f0a2e",
                        color: s.textColor || "#a0a0b8",
                    }}
                >
                    <div className="mx-auto max-w-4xl space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            {c.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={c.logoUrl}
                                    alt={c.logoText || "Logo"}
                                    style={{
                                        height: "24px",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <div className="h-6 w-6 rounded bg-gradient-to-br from-purple-500 to-pink-500" />
                            )}
                            <span className="text-sm font-semibold text-white">
                                {c.logoText || "Brand"}
                            </span>
                        </div>
                        <nav className="flex flex-wrap items-center justify-center gap-4">
                            {(c.navLinks || []).map((l, i) => (
                                <span key={i} className="text-xs opacity-60">
                                    {l.label}
                                </span>
                            ))}
                        </nav>
                        <p className="text-xs opacity-40">
                            {c.copyrightText || "© 2025 Your Company"}
                        </p>
                    </div>
                </div>
            );

        default:
            return (
                <div style={base} className="py-8 text-center">
                    <p className="text-sm text-gray-400">
                        Unknown block: {type}
                    </p>
                </div>
            );
    }
}

// ── DraggableSidebarItem ────────────────────────────────────────────────────

function DraggableSidebarItem({
    blockType,
    onClickAdd,
}: {
    blockType: BlockType;
    onClickAdd: (t: BlockType) => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `sidebar-${blockType}`,
        data: { fromSidebar: true, blockType },
    });
    return (
        <motion.div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
                "flex cursor-grab flex-col items-center gap-1.5 rounded-lg border bg-white p-3 text-center transition-colors hover:border-purple-400 hover:bg-purple-50/50",
                isDragging && "opacity-50",
            )}
            onClick={() => onClickAdd(blockType)}
        >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <BlockIcon name={blockTypeIcons[blockType]} size={16} />
            </div>
            <span className="text-[11px] font-medium text-gray-700 leading-tight">
                {blockTypeLabels[blockType]}
            </span>
        </motion.div>
    );
}

// ── SortableBlockWrapper ────────────────────────────────────────────────────

function SortableBlockWrapper({
    block,
    isSelected,
    onSelect,
    children,
}: {
    block: PageBlock;
    isSelected: boolean;
    onSelect: () => void;
    children: ReactNode;
}) {
    const { editor } = useEditorActions();
    const isHidden =
        (editor.devicePreview === "mobile" && block.style.hideOnMobile) ||
        (editor.devicePreview === "desktop" && block.style.hideOnDesktop);
    const isLocked = block.locked ?? false;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id, disabled: isLocked });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: "relative",
        display: isHidden ? "none" : undefined,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                block.style.customClassName || "",
                block.style.animationEffect &&
                    block.style.animationEffect !== "none"
                    ? `anim-${block.style.animationEffect}`
                    : "",
                "group relative",
                isSelected &&
                    "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20 rounded-lg",
                !isSelected && "hover:ring-2 hover:ring-blue-400/50 rounded-lg",
            )}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 cursor-grab rounded bg-white p-1 shadow-md group-hover:flex"
            >
                <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            {!block.visible && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
                    <Badge variant="secondary">
                        <EyeOff className="mr-1 h-3 w-3" />
                        Hidden
                    </Badge>
                </div>
            )}
            {children}
            {/* Floating toolbar */}
            <AnimatePresence>
                {isSelected && <BlockFloatingToolbar blockId={block.id} />}
            </AnimatePresence>
        </motion.div>
    );
}

// ── BlockFloatingToolbar ────────────────────────────────────────────────────

function BlockFloatingToolbar({ blockId }: { blockId: string }) {
    const {
        blocks,
        moveBlock,
        duplicateBlock,
        removeBlock,
        selectBlock,
        setRightPanel,
    } = useEditorActions();
    const idx = blocks.findIndex((b) => b.id === blockId);
    const actions = [
        {
            icon: ChevronUp,
            label: "Move Up",
            action: () => idx > 0 && moveBlock(idx, idx - 1),
            disabled: idx <= 0,
        },
        {
            icon: ChevronDown,
            label: "Move Down",
            action: () => idx < blocks.length - 1 && moveBlock(idx, idx + 1),
            disabled: idx >= blocks.length - 1,
        },
        {
            icon: Copy,
            label: "Duplicate",
            action: () => duplicateBlock(blockId),
        },
        {
            icon: Settings,
            label: "Settings",
            action: () => setRightPanel("content"),
        },
        {
            icon: Trash2,
            label: "Delete",
            action: () => {
                removeBlock(blockId);
                selectBlock(null);
            },
            className: "text-red-500 hover:text-red-600 hover:bg-red-50",
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute -top-11 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border bg-white px-1 py-1 shadow-xl"
        >
            <TooltipProvider delayDuration={150}>
                {actions.map((a, i) => (
                    <Tooltip key={i}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7", a.className)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    a.action();
                                }}
                                disabled={a.disabled}
                            >
                                <a.icon className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            {a.label}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </motion.div>
    );
}

// ── TopToolbar ──────────────────────────────────────────────────────────────

function TopToolbar({
    onPublish,
    onSave,
}: {
    onPublish: () => void;
    onSave: () => Promise<boolean>;
}) {
    const router = useRouter();
    const { user } = useAuthContext();
    const creatorSlug = user?.slug || user?.username || "creator";
    const {
        page,
        editor,
        canUndo,
        canRedo,
        hasUnsavedChanges,
        undo,
        redo,
        setDevicePreview,
        setZoom,
        toggleGrid,
        updatePageMeta,
    } = useEditorActions();
    const [manualSaving, setManualSaving] = useState(false);

    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(page.title);
    useEffect(() => {
        setTitleValue(page.title);
    }, [page.title]);
    const titleRef = useRef<HTMLInputElement>(null);
    const [savedAgo, setSavedAgo] = useState("");

    useEffect(() => {
        const update = () => {
            if (!editor.lastSavedAt) {
                setSavedAgo("");
                return;
            }
            const s = Math.floor(
                (Date.now() - new Date(editor.lastSavedAt).getTime()) / 1000,
            );
            setSavedAgo(
                s < 5
                    ? "just now"
                    : s < 60
                      ? `${s}s ago`
                      : `${Math.floor(s / 60)}m ago`,
            );
        };
        update();
        const iv = setInterval(update, 5000);
        return () => clearInterval(iv);
    }, [editor.lastSavedAt]);

    useEffect(() => {
        if (editingTitle && titleRef.current) titleRef.current.focus();
    }, [editingTitle]);

    const devices: {
        value: "desktop" | "tablet" | "mobile";
        icon: React.FC<{ className?: string }>;
        label: string;
    }[] = [
        { value: "desktop", icon: Monitor, label: "Desktop" },
        { value: "tablet", icon: Tablet, label: "Tablet" },
        { value: "mobile", icon: Smartphone, label: "Mobile" },
    ];

    return (
        <div className="flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20 relative">
            {/* Left */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() =>
                        router.push(
                            (page as any).pageType === "community-home" &&
                                (page as any).communityId
                                ? `/creator/communities/${(page as any).communityId}/home`
                                : "/creator/landing-pages",
                        )
                    }
                >
                    <ArrowLeft className="h-4 w-4 text-gray-600" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                {editingTitle ? (
                    <Input
                        ref={titleRef}
                        value={titleValue}
                        onChange={(e) => setTitleValue(e.target.value)}
                        className="h-7 w-48 text-sm font-semibold"
                        onBlur={() => {
                            setEditingTitle(false);
                            updatePageMeta({ title: titleValue });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setEditingTitle(false);
                                updatePageMeta({ title: titleValue });
                            }
                        }}
                    />
                ) : (
                    <button
                        onClick={() => setEditingTitle(true)}
                        className="text-sm font-semibold text-gray-800 hover:text-purple-600 transition-colors"
                    >
                        {page.title}
                    </button>
                )}
                {(page as any).pageType === "community-home" && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                        Community Home Page
                    </span>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {editor.isSaving || manualSaving ? (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving...
                        </>
                    ) : savedAgo ? (
                        <>
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Saved {savedAgo}
                        </>
                    ) : hasUnsavedChanges ? (
                        <>
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                            Unsaved changes
                        </>
                    ) : null}
                </div>
            </div>

            {/* Center - Device Preview */}
            <div className="flex items-center gap-1 rounded-full border bg-gray-50/50 p-1 shadow-sm">
                {devices.map((d) => (
                    <TooltipProvider key={d.value} delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={
                                        editor.devicePreview === d.value
                                            ? "default"
                                            : "ghost"
                                    }
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 rounded-full transition-colors",
                                        editor.devicePreview === d.value
                                            ? "bg-white shadow-sm text-purple-600 ring-1 ring-gray-200/50 hover:bg-white hover:text-purple-700"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50",
                                    )}
                                    onClick={() => setDevicePreview(d.value)}
                                >
                                    <d.icon className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{d.label}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-full border bg-gray-50/50 p-1 shadow-sm">
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                                    disabled={!canUndo}
                                    onClick={undo}
                                >
                                    <Undo2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                                    disabled={!canRedo}
                                    onClick={redo}
                                >
                                    <Redo2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={
                                        editor.showGrid ? "secondary" : "ghost"
                                    }
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 rounded-full",
                                        editor.showGrid
                                            ? "bg-white shadow-sm text-purple-600 ring-1 ring-gray-200/50 hover:bg-white hover:text-purple-700"
                                            : "text-gray-500 hover:text-gray-900",
                                    )}
                                    onClick={toggleGrid}
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Toggle Grid</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="flex items-center gap-1 rounded-full border bg-gray-50/50 p-1 shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                        onClick={() => setZoom(Math.max(50, editor.zoom - 10))}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center text-xs font-semibold text-gray-700">
                        {editor.zoom}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                        onClick={() => setZoom(Math.min(150, editor.zoom + 10))}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 rounded-full px-4 text-xs font-medium border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                        disabled={
                            manualSaving ||
                            editor.isSaving ||
                            !page?.id ||
                            page.id === "new" ||
                            page.id === "demo-page-001"
                        }
                        onClick={async () => {
                            setManualSaving(true);
                            try {
                                await onSave();
                            } finally {
                                setManualSaving(false);
                            }
                        }}
                    >
                        {manualSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 rounded-full px-4 text-xs font-medium border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-all shadow-sm"
                        onClick={() => {
                            const url = (page as any).pageType === "community-home" && (page as any).communitySlug
                                ? `${window.location.origin}/community/${(page as any).communitySlug}`
                                : `${window.location.origin}/p/${creatorSlug}/${page.slug || "preview"}`;
                            window.open(url, "_blank", "noopener,noreferrer");
                        }}
                    >
                        <Eye className="h-4 w-4" />
                        Preview
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 gap-1.5 rounded-full px-5 bg-gradient-to-r from-purple-600 to-pink-500 text-xs font-medium text-white hover:opacity-90 transition-all shadow-md hover:shadow-lg"
                        onClick={onPublish}
                    >
                        <Globe className="h-4 w-4" />
                        Publish
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── LeftSidebar ─────────────────────────────────────────────────────────────

function LeftSidebar({ onAddBlock }: { onAddBlock: (t: BlockType) => void }) {
    const { page, editor, toggleLeftPanel } = useEditorActions();
    const [search, setSearch] = useState("");
    const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(
        () => Object.fromEntries(blockCategories.map((c) => [c.name, true])),
    );
    const [dismissedAI, setDismissedAI] = useState(false);

    const isCommunityHome = (page as any).pageType === "community-home";

    // For community-home pages, prioritize Community category first
    const orderedCategories = useMemo(() => {
        if (!isCommunityHome) return blockCategories;
        const communityFirst = [...blockCategories].sort((a, b) => {
            if (a.name === "Community") return -1;
            if (b.name === "Community") return 1;
            return 0;
        });
        return communityFirst;
    }, [isCommunityHome]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return orderedCategories
            .map((cat) => ({
                ...cat,
                types: cat.types.filter(
                    (t) =>
                        blockTypeLabels[t].toLowerCase().includes(q) ||
                        t.includes(q),
                ),
            }))
            .filter((cat) => cat.types.length > 0);
    }, [search, orderedCategories]);

    return (
        <motion.div
            animate={{
                width: editor.leftPanelOpen ? 280 : 0,
                opacity: editor.leftPanelOpen ? 1 : 0,
            }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className="shrink-0 overflow-hidden border-r bg-gray-50/80"
        >
            <div className="flex h-full w-[280px] flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h2 className="text-sm font-semibold">Blocks</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={toggleLeftPanel}
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </Button>
                </div>

                {/* Community-Home Indicator */}
                {isCommunityHome && (
                    <div className="mx-3 mt-3 space-y-2">
                        <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-2.5">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-purple-100 p-1">
                                    <Home className="h-3.5 w-3.5 text-purple-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold text-purple-800 uppercase tracking-wide">
                                        Community Home Page
                                    </p>
                                    <p className="text-[10px] text-purple-600 truncate">
                                        {(page as any).communityName || (page as any).title?.replace(/ - Home Page$/, '') || 'Community'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-md border border-green-200 bg-green-50/50 px-2.5 py-1.5">
                            <p className="text-[9px] text-green-700 leading-tight">
                                <Shield className="inline h-3 w-3 mr-0.5 -mt-px" />
                                Join &amp; payment behavior is preserved by system blocks.
                            </p>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="px-3 pt-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search blocks..."
                            className="h-8 pl-8 text-xs"
                        />
                    </div>
                </div>

                {/* Categories */}
                <ScrollArea className="flex-1 px-3 py-3">
                    <div className="space-y-4">
                        {filtered.map((cat) => {
                            const CatIcon = categoryIcons[cat.name] || Layers;
                            const isOpen = expandedCats[cat.name] !== false;
                            return (
                                <div key={cat.name}>
                                    <button
                                        className="mb-2 flex w-full items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                        onClick={() =>
                                            setExpandedCats((p) => ({
                                                ...p,
                                                [cat.name]: !isOpen,
                                            }))
                                        }
                                    >
                                        <CatIcon className="h-3.5 w-3.5" />
                                        {cat.name}
                                        <ChevronDownIcon
                                            className={cn(
                                                "ml-auto h-3 w-3 transition-transform",
                                                !isOpen && "-rotate-90",
                                            )}
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{
                                                    height: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    height: "auto",
                                                    opacity: 1,
                                                }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="grid grid-cols-2 gap-2">
                                                    {cat.types.map((bt) => (
                                                        <DraggableSidebarItem
                                                            key={bt}
                                                            blockType={bt}
                                                            onClickAdd={
                                                                onAddBlock
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                {/* AI Suggestion Banner */}
                {!dismissedAI && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-3 mb-3 relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 p-3 text-white"
                    >
                        <button
                            onClick={() => setDismissedAI(true)}
                            className="absolute right-2 top-2"
                        >
                            <X className="h-3 w-3" />
                        </button>
                        <div className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                                <p className="text-xs font-semibold">
                                    AI Suggestion
                                </p>
                                <p className="mt-0.5 text-[10px] opacity-90">
                                    Add testimonials to boost conversions by 40%
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

// ── CanvasArea ───────────────────────────────────────────────────────────────

function CanvasArea() {
    const {
        blocks,
        editor,
        selectedBlockId,
        selectBlock,
        hoverBlock,
        addBlock,
    } = useEditorActions();
    const { setNodeRef } = useDroppable({ id: "canvas-drop" });

    const canvasWidth =
        editor.devicePreview === "tablet"
            ? "768px"
            : editor.devicePreview === "mobile"
              ? "375px"
              : "100vw";
    const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

    return (
        <div
            className="relative flex-1 overflow-auto bg-gray-100/50"
            onClick={() => selectBlock(null)}
        >
            {/* Dot pattern background */}
            {editor.showGrid && (
                <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle, #9ca3af 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
            )}

            <div
                ref={setNodeRef}
                className={cn(
                    "min-h-full w-full",
                    editor.devicePreview === "desktop" ? "p-0" : "p-8",
                )}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems:
                        editor.devicePreview === "desktop"
                            ? "stretch"
                            : "center",
                }}
            >
                <div
                    className={cn(
                        "w-full transition-all duration-300 bg-white",
                        editor.devicePreview === "desktop"
                            ? "min-w-full"
                            : "my-8 overflow-hidden rounded-xl shadow-2xl ring-1 ring-gray-200/50",
                    )}
                    style={{
                        width:
                            editor.devicePreview === "desktop"
                                ? "100%"
                                : canvasWidth,
                        maxWidth:
                            editor.devicePreview === "desktop"
                                ? "100%"
                                : canvasWidth,
                        transform: `scale(${editor.zoom / 100})`,
                        transformOrigin:
                            editor.devicePreview === "desktop"
                                ? "top left"
                                : "top center",
                    }}
                >
                    <SortableContext
                        items={blockIds}
                        strategy={verticalListSortingStrategy}
                    >
                        <AnimatePresence mode="popLayout">
                            {blocks.map((block) => (
                                <SortableBlockWrapper
                                    key={block.id}
                                    block={block}
                                    isSelected={selectedBlockId === block.id}
                                    onSelect={() => selectBlock(block.id)}
                                >
                                    <BlockRenderer block={block} />
                                </SortableBlockWrapper>
                            ))}
                        </AnimatePresence>
                    </SortableContext>

                    {/* Empty state */}
                    {blocks.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white/50"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <div className="text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                                    <Plus className="h-6 w-6 text-purple-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-700">
                                    Add your first block
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Drag from the sidebar or click a block type
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── ContentEditor ───────────────────────────────────────────────────────────

function FieldGroup({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            {children}
        </div>
    );
}

function ContentEditor({ block }: { block: PageBlock }) {
    const { updateBlockContent } = useEditorActions();
    const { content: c, type } = block;
    const upd = useCallback(
        (p: Partial<BlockContent>) => updateBlockContent(block.id, p),
        [block.id, updateBlockContent],
    );

    switch (type) {
        case "hero":
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Subheadline">
                        <Textarea
                            value={c.subheadline || ""}
                            onChange={(e) =>
                                upd({ subheadline: e.target.value })
                            }
                            rows={3}
                        />
                    </FieldGroup>
                    <FieldGroup label="CTA Text">
                        <Input
                            value={c.ctaText || ""}
                            onChange={(e) => upd({ ctaText: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="CTA URL">
                        <Input
                            value={c.ctaUrl || ""}
                            onChange={(e) => upd({ ctaUrl: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="CTA Variant">
                        <Select
                            value={(c as any).ctaVariant || "primary"}
                            onValueChange={(v) => upd({ ctaVariant: v } as any)}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    "primary",
                                    "secondary",
                                    "outline",
                                    "gradient",
                                ].map((v) => (
                                    <SelectItem
                                        key={v}
                                        value={v}
                                        className="text-xs"
                                    >
                                        {v}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FieldGroup>
                    <FieldGroup label="Background Image URL">
                        <Input
                            value={(c as any).backgroundImageUrl || ""}
                            onChange={(e) =>
                                upd({
                                    backgroundImageUrl: e.target.value,
                                } as any)
                            }
                            placeholder="https://..."
                        />
                        {(c as any).backgroundImageUrl && (
                            <div className="mt-2 overflow-hidden rounded border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={(c as any).backgroundImageUrl}
                                    alt="Background preview"
                                    className="h-20 w-full object-cover"
                                />
                            </div>
                        )}
                    </FieldGroup>
                </div>
            );

        case "text":
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Body">
                        <Textarea
                            value={c.body || ""}
                            onChange={(e) => upd({ body: e.target.value })}
                            rows={6}
                        />
                    </FieldGroup>
                </div>
            );

        case "image":
            return (
                <div className="space-y-4">
                    <FieldGroup label="Image URL">
                        <Input
                            value={c.imageUrl || ""}
                            onChange={(e) => upd({ imageUrl: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Alt Text">
                        <Input
                            value={c.imageAlt || ""}
                            onChange={(e) => upd({ imageAlt: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Caption">
                        <Input
                            value={c.caption || ""}
                            onChange={(e) => upd({ caption: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Image Size">
                        <Select
                            value={(c as any).imageSize || "auto"}
                            onValueChange={(v) => upd({ imageSize: v } as any)}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {["auto", "full-width", "contained"].map(
                                    (s) => (
                                        <SelectItem
                                            key={s}
                                            value={s}
                                            className="text-xs"
                                        >
                                            {s}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </FieldGroup>
                    <FieldGroup label="Image Border Radius">
                        <Slider
                            value={[(c as any).imageBorderRadius || 0]}
                            min={0}
                            max={24}
                            step={1}
                            onValueChange={([v]) =>
                                upd({ imageBorderRadius: v } as any)
                            }
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                            {(c as any).imageBorderRadius || 0}px
                        </p>
                    </FieldGroup>
                </div>
            );

        case "cta":
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Subheadline">
                        <Textarea
                            value={c.subheadline || ""}
                            onChange={(e) =>
                                upd({ subheadline: e.target.value })
                            }
                            rows={2}
                        />
                    </FieldGroup>
                    <FieldGroup label="Button Text">
                        <Input
                            value={c.buttonText || ""}
                            onChange={(e) =>
                                upd({ buttonText: e.target.value })
                            }
                        />
                    </FieldGroup>
                    <FieldGroup label="Button URL">
                        <Input
                            value={c.buttonUrl || ""}
                            onChange={(e) => upd({ buttonUrl: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Button Variant">
                        <Select
                            value={c.buttonVariant || "gradient"}
                            onValueChange={(v) =>
                                upd({
                                    buttonVariant:
                                        v as BlockContent["buttonVariant"],
                                })
                            }
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    "primary",
                                    "secondary",
                                    "outline",
                                    "gradient",
                                ].map((v) => (
                                    <SelectItem
                                        key={v}
                                        value={v}
                                        className="text-xs"
                                    >
                                        {v}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FieldGroup>
                    <FieldGroup label="Secondary Button Text">
                        <Input
                            value={c.secondaryButtonText || ""}
                            onChange={(e) =>
                                upd({ secondaryButtonText: e.target.value })
                            }
                        />
                    </FieldGroup>
                    <FieldGroup label="Secondary Button URL">
                        <Input
                            value={(c as any).secondaryButtonUrl || ""}
                            onChange={(e) =>
                                upd({
                                    secondaryButtonUrl: e.target.value,
                                } as any)
                            }
                        />
                    </FieldGroup>
                </div>
            );

        case "features": {
            const feats = c.features || [];
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Subheadline">
                        <Textarea
                            value={c.subheadline || ""}
                            onChange={(e) =>
                                upd({ subheadline: e.target.value })
                            }
                            rows={2}
                        />
                    </FieldGroup>
                    <FieldGroup label="Columns">
                        <Select
                            value={String(c.columns || 3)}
                            onValueChange={(v) =>
                                upd({ columns: Number(v) as 2 | 3 | 4 })
                            }
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[2, 3, 4].map((n) => (
                                    <SelectItem
                                        key={n}
                                        value={String(n)}
                                        className="text-xs"
                                    >
                                        {n} columns
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FieldGroup>
                    <Separator />
                    {feats.map((f, i) => (
                        <div
                            key={f.id}
                            className="space-y-2 rounded-lg border bg-gray-50 p-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">
                                    Feature {i + 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500"
                                    onClick={() =>
                                        upd({
                                            features: feats.filter(
                                                (_, j) => j !== i,
                                            ),
                                        })
                                    }
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <Input
                                placeholder="Title"
                                value={f.title}
                                onChange={(e) => {
                                    const nf = [...feats];
                                    nf[i] = { ...f, title: e.target.value };
                                    upd({ features: nf });
                                }}
                                className="h-8 text-xs"
                            />
                            <Textarea
                                placeholder="Description"
                                value={f.description}
                                onChange={(e) => {
                                    const nf = [...feats];
                                    nf[i] = {
                                        ...f,
                                        description: e.target.value,
                                    };
                                    upd({ features: nf });
                                }}
                                rows={2}
                                className="text-xs"
                            />
                            <Input
                                placeholder="Icon name (e.g. Sparkles)"
                                value={f.icon || ""}
                                onChange={(e) => {
                                    const nf = [...feats];
                                    nf[i] = { ...f, icon: e.target.value };
                                    upd({ features: nf });
                                }}
                                className="h-8 text-xs"
                            />
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                            upd({
                                features: [
                                    ...feats,
                                    {
                                        id: `f-${Date.now()}`,
                                        icon: "Sparkles",
                                        title: "New Feature",
                                        description: "Description",
                                    },
                                ],
                            })
                        }
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Feature
                    </Button>
                </div>
            );
        }

        case "form": {
            const fields = c.formFields || [];
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Subheadline">
                        <Input
                            value={c.subheadline || ""}
                            onChange={(e) =>
                                upd({ subheadline: e.target.value })
                            }
                        />
                    </FieldGroup>
                    <FieldGroup label="Submit Button Text">
                        <Input
                            value={c.formSubmitText || ""}
                            onChange={(e) =>
                                upd({ formSubmitText: e.target.value })
                            }
                        />
                    </FieldGroup>
                    <FieldGroup label="Success Message">
                        <Textarea
                            value={(c as any).formSuccessMessage || ""}
                            onChange={(e) =>
                                upd({
                                    formSuccessMessage: e.target.value,
                                } as any)
                            }
                            rows={2}
                            placeholder="Thank you for submitting!"
                        />
                    </FieldGroup>
                    <FieldGroup label="Redirect URL after submit">
                        <Input
                            value={(c as any).formRedirectUrl || ""}
                            onChange={(e) =>
                                upd({ formRedirectUrl: e.target.value } as any)
                            }
                            placeholder="https://..."
                        />
                    </FieldGroup>
                    <Separator />
                    {fields.map((f, i) => (
                        <div
                            key={f.id}
                            className="space-y-2 rounded-lg border bg-gray-50 p-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">
                                    Field {i + 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500"
                                    onClick={() =>
                                        upd({
                                            formFields: fields.filter(
                                                (_, j) => j !== i,
                                            ),
                                        })
                                    }
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <Input
                                placeholder="Label"
                                value={f.label}
                                onChange={(e) => {
                                    const nf = [...fields];
                                    nf[i] = { ...f, label: e.target.value };
                                    upd({ formFields: nf });
                                }}
                                className="h-8 text-xs"
                            />
                            <Input
                                placeholder="Placeholder"
                                value={(f as any).placeholder || ""}
                                onChange={(e) => {
                                    const nf = [...fields];
                                    nf[i] = {
                                        ...f,
                                        placeholder: e.target.value,
                                    } as any;
                                    upd({ formFields: nf });
                                }}
                                className="h-8 text-xs"
                            />
                            <Select
                                value={f.type}
                                onValueChange={(v) => {
                                    const nf = [...fields];
                                    nf[i] = {
                                        ...f,
                                        type: v as
                                            | "text"
                                            | "email"
                                            | "phone"
                                            | "textarea"
                                            | "select"
                                            | "checkbox",
                                    };
                                    upd({ formFields: nf });
                                }}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        "text",
                                        "email",
                                        "phone",
                                        "textarea",
                                        "select",
                                        "checkbox",
                                    ].map((t) => (
                                        <SelectItem
                                            key={t}
                                            value={t}
                                            className="text-xs"
                                        >
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={f.required || false}
                                    onCheckedChange={(v) => {
                                        const nf = [...fields];
                                        nf[i] = { ...f, required: v };
                                        upd({ formFields: nf });
                                    }}
                                />
                                <span className="text-xs">Required</span>
                            </div>
                            {f.type === "select" && (
                                <Textarea
                                    placeholder="Options (comma separated)"
                                    value={((f as any).options || []).join(
                                        ", ",
                                    )}
                                    onChange={(e) => {
                                        const nf = [...fields];
                                        nf[i] = {
                                            ...f,
                                            options: e.target.value
                                                .split(",")
                                                .map((o: string) => o.trim()),
                                        } as any;
                                        upd({ formFields: nf });
                                    }}
                                    rows={2}
                                    className="text-xs"
                                />
                            )}
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                            upd({
                                formFields: [
                                    ...fields,
                                    {
                                        id: `fld-${Date.now()}`,
                                        type: "text" as const,
                                        label: "New Field",
                                        required: false,
                                    },
                                ],
                            })
                        }
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Field
                    </Button>
                </div>
            );
        }

        case "testimonials":
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    {(c.testimonials || []).map((t, i) => (
                        <div
                            key={t.id}
                            className="space-y-2 rounded-lg border bg-gray-50 p-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">
                                    Testimonial {i + 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500"
                                    onClick={() =>
                                        upd({
                                            testimonials: (
                                                c.testimonials || []
                                            ).filter((_, j) => j !== i),
                                        })
                                    }
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <Input
                                placeholder="Name"
                                value={t.name}
                                onChange={(e) => {
                                    const a = [...(c.testimonials || [])];
                                    a[i] = { ...t, name: e.target.value };
                                    upd({ testimonials: a });
                                }}
                                className="h-8 text-xs"
                            />
                            <Input
                                placeholder="Role"
                                value={t.role || ""}
                                onChange={(e) => {
                                    const a = [...(c.testimonials || [])];
                                    a[i] = { ...t, role: e.target.value };
                                    upd({ testimonials: a });
                                }}
                                className="h-8 text-xs"
                            />
                            <Textarea
                                placeholder="Quote"
                                value={t.quote}
                                onChange={(e) => {
                                    const a = [...(c.testimonials || [])];
                                    a[i] = { ...t, quote: e.target.value };
                                    upd({ testimonials: a });
                                }}
                                rows={2}
                                className="text-xs"
                            />
                            <FieldGroup label="Rating">
                                <Select
                                    value={String((t as any).rating || 5)}
                                    onValueChange={(v) => {
                                        const a = [...(c.testimonials || [])];
                                        a[i] = {
                                            ...t,
                                            rating: Number(v),
                                        } as any;
                                        upd({ testimonials: a });
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <SelectItem
                                                key={n}
                                                value={String(n)}
                                                className="text-xs"
                                            >
                                                {n} star{n > 1 ? "s" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FieldGroup>
                            <Input
                                placeholder="Avatar URL"
                                value={(t as any).avatarUrl || ""}
                                onChange={(e) => {
                                    const a = [...(c.testimonials || [])];
                                    a[i] = {
                                        ...t,
                                        avatarUrl: e.target.value,
                                    } as any;
                                    upd({ testimonials: a });
                                }}
                                className="h-8 text-xs"
                            />
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                            upd({
                                testimonials: [
                                    ...(c.testimonials || []),
                                    {
                                        id: `t-${Date.now()}`,
                                        name: "New Reviewer",
                                        role: "Customer",
                                        quote: "Amazing experience!",
                                        rating: 5,
                                    },
                                ],
                            })
                        }
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Testimonial
                    </Button>
                </div>
            );

        case "pricing": {
            const plans = (c as any).pricingPlans || [];
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Subheadline">
                        <Textarea
                            value={c.subheadline || ""}
                            onChange={(e) =>
                                upd({ subheadline: e.target.value })
                            }
                            rows={2}
                        />
                    </FieldGroup>
                    <Separator />
                    {plans.map((plan: any, i: number) => (
                        <div
                            key={plan.id}
                            className="space-y-2 rounded-lg border bg-gray-50 p-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">
                                    Plan {i + 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500"
                                    onClick={() =>
                                        upd({
                                            pricingPlans: plans.filter(
                                                (_: any, j: number) => j !== i,
                                            ),
                                        } as any)
                                    }
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <Input
                                placeholder="Plan Name"
                                value={plan.name}
                                onChange={(e) => {
                                    const np = [...plans];
                                    np[i] = { ...plan, name: e.target.value };
                                    upd({ pricingPlans: np } as any);
                                }}
                                className="h-8 text-xs"
                            />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="$49"
                                    value={plan.price}
                                    onChange={(e) => {
                                        const np = [...plans];
                                        np[i] = {
                                            ...plan,
                                            price: e.target.value,
                                        };
                                        upd({ pricingPlans: np } as any);
                                    }}
                                    className="h-8 text-xs flex-1"
                                />
                                <Input
                                    placeholder="/month"
                                    value={plan.period || ""}
                                    onChange={(e) => {
                                        const np = [...plans];
                                        np[i] = {
                                            ...plan,
                                            period: e.target.value,
                                        };
                                        upd({ pricingPlans: np } as any);
                                    }}
                                    className="h-8 text-xs w-24"
                                />
                            </div>
                            <Textarea
                                placeholder="Features (one per line)"
                                value={(plan.features || []).join("\n")}
                                onChange={(e) => {
                                    const np = [...plans];
                                    np[i] = {
                                        ...plan,
                                        features: e.target.value.split("\n"),
                                    };
                                    upd({ pricingPlans: np } as any);
                                }}
                                rows={3}
                                className="text-xs"
                            />
                            <Input
                                placeholder="Button Text"
                                value={plan.ctaText || ""}
                                onChange={(e) => {
                                    const np = [...plans];
                                    np[i] = {
                                        ...plan,
                                        ctaText: e.target.value,
                                    };
                                    upd({ pricingPlans: np } as any);
                                }}
                                className="h-8 text-xs"
                            />
                            <Input
                                placeholder="Button URL"
                                value={plan.ctaUrl || ""}
                                onChange={(e) => {
                                    const np = [...plans];
                                    np[i] = {
                                        ...plan,
                                        ctaUrl: e.target.value,
                                    };
                                    upd({ pricingPlans: np } as any);
                                }}
                                className="h-8 text-xs"
                            />
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={plan.highlighted || false}
                                    onCheckedChange={(v) => {
                                        const np = [...plans];
                                        np[i] = {
                                            ...plan,
                                            highlighted: v,
                                        };
                                        upd({ pricingPlans: np } as any);
                                    }}
                                />
                                <span className="text-xs">
                                    Highlighted (Most Popular)
                                </span>
                            </div>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                            upd({
                                pricingPlans: [
                                    ...plans,
                                    {
                                        id: `plan-${Date.now()}`,
                                        name: "New Plan",
                                        price: "$29",
                                        period: "/month",
                                        features: ["Feature 1", "Feature 2"],
                                        ctaText: "Get Started",
                                    },
                                ],
                            } as any)
                        }
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Plan
                    </Button>
                </div>
            );
        }

        case "faq": {
            const items = (c as any).faqs || [];
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    <Separator />
                    {items.map((faq: any, i: number) => (
                        <div
                            key={faq.id}
                            className="space-y-2 rounded-lg border bg-gray-50 p-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">
                                    Q&A {i + 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500"
                                    onClick={() =>
                                        upd({
                                            faqs: items.filter(
                                                (_: any, j: number) => j !== i,
                                            ),
                                        } as any)
                                    }
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <Input
                                placeholder="Question"
                                value={faq.question}
                                onChange={(e) => {
                                    const nf = [...items];
                                    nf[i] = {
                                        ...faq,
                                        question: e.target.value,
                                    };
                                    upd({ faqs: nf } as any);
                                }}
                                className="h-8 text-xs"
                            />
                            <Textarea
                                placeholder="Answer"
                                value={faq.answer}
                                onChange={(e) => {
                                    const nf = [...items];
                                    nf[i] = {
                                        ...faq,
                                        answer: e.target.value,
                                    };
                                    upd({ faqs: nf } as any);
                                }}
                                rows={3}
                                className="text-xs"
                            />
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                            upd({
                                faqs: [
                                    ...items,
                                    {
                                        id: `faq-${Date.now()}`,
                                        question: "New question?",
                                        answer: "Answer here.",
                                    },
                                ],
                            } as any)
                        }
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Q&A
                    </Button>
                </div>
            );
        }

        case "video":
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Video URL">
                        <Input
                            value={(c as any).videoUrl || ""}
                            onChange={(e) =>
                                upd({ videoUrl: e.target.value } as any)
                            }
                            placeholder="https://youtube.com/embed/..."
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                            YouTube, Vimeo, or direct video URL
                        </p>
                    </FieldGroup>
                    <FieldGroup label="Thumbnail URL">
                        <Input
                            value={(c as any).videoThumbnail || ""}
                            onChange={(e) =>
                                upd({ videoThumbnail: e.target.value } as any)
                            }
                            placeholder="https://..."
                        />
                    </FieldGroup>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={(c as any).autoplay || false}
                            onCheckedChange={(v) => upd({ autoplay: v } as any)}
                        />
                        <span className="text-xs">Autoplay</span>
                    </div>
                </div>
            );

        case "countdown":
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Subheadline">
                        <Input
                            value={c.subheadline || ""}
                            onChange={(e) =>
                                upd({ subheadline: e.target.value })
                            }
                        />
                    </FieldGroup>
                    <FieldGroup label="Target Date & Time">
                        <Input
                            type="datetime-local"
                            value={(c as any).targetDate || ""}
                            onChange={(e) =>
                                upd({ targetDate: e.target.value } as any)
                            }
                            className="h-8 text-xs"
                        />
                    </FieldGroup>
                    <FieldGroup label="CTA Text">
                        <Input
                            value={c.ctaText || ""}
                            onChange={(e) => upd({ ctaText: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="CTA URL">
                        <Input
                            value={c.ctaUrl || ""}
                            onChange={(e) => upd({ ctaUrl: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Expired Message">
                        <Input
                            value={(c as any).expiredMessage || ""}
                            onChange={(e) =>
                                upd({ expiredMessage: e.target.value } as any)
                            }
                            placeholder="This offer has expired"
                        />
                    </FieldGroup>
                </div>
            );

        case "social-proof": {
            const stats = (c as any).stats || [];
            const logos = (c as any).logos || [];
            return (
                <div className="space-y-4">
                    <FieldGroup label="Headline">
                        <Input
                            value={c.headline || ""}
                            onChange={(e) => upd({ headline: e.target.value })}
                        />
                    </FieldGroup>
                    <Separator />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Stats
                    </p>
                    {stats.map((st: any, i: number) => (
                        <div key={st.id} className="flex items-center gap-2">
                            <Input
                                placeholder="10,000+"
                                value={st.value}
                                onChange={(e) => {
                                    const ns = [...stats];
                                    ns[i] = {
                                        ...st,
                                        value: e.target.value,
                                    };
                                    upd({ stats: ns } as any);
                                }}
                                className="h-8 text-xs flex-1"
                            />
                            <Input
                                placeholder="Users"
                                value={st.label}
                                onChange={(e) => {
                                    const ns = [...stats];
                                    ns[i] = {
                                        ...st,
                                        label: e.target.value,
                                    };
                                    upd({ stats: ns } as any);
                                }}
                                className="h-8 text-xs flex-1"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 shrink-0"
                                onClick={() =>
                                    upd({
                                        stats: stats.filter(
                                            (_: any, j: number) => j !== i,
                                        ),
                                    } as any)
                                }
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                            upd({
                                stats: [
                                    ...stats,
                                    {
                                        id: `st-${Date.now()}`,
                                        value: "1,000+",
                                        label: "Users",
                                    },
                                ],
                            } as any)
                        }
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Stat
                    </Button>
                    <Separator />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Logo Bar
                    </p>
                    {logos.map((logo: any, i: number) => (
                        <div key={logo.id} className="flex items-center gap-2">
                            <Input
                                placeholder="Logo URL"
                                value={logo.imageUrl}
                                onChange={(e) => {
                                    const nl = [...logos];
                                    nl[i] = {
                                        ...logo,
                                        imageUrl: e.target.value,
                                    };
                                    upd({ logos: nl } as any);
                                }}
                                className="h-8 text-xs flex-1"
                            />
                            <Input
                                placeholder="Alt"
                                value={logo.alt}
                                onChange={(e) => {
                                    const nl = [...logos];
                                    nl[i] = {
                                        ...logo,
                                        alt: e.target.value,
                                    };
                                    upd({ logos: nl } as any);
                                }}
                                className="h-8 text-xs w-20"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 shrink-0"
                                onClick={() =>
                                    upd({
                                        logos: logos.filter(
                                            (_: any, j: number) => j !== i,
                                        ),
                                    } as any)
                                }
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                            upd({
                                logos: [
                                    ...logos,
                                    {
                                        id: `logo-${Date.now()}`,
                                        imageUrl: "",
                                        alt: "Partner",
                                    },
                                ],
                            } as any)
                        }
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Logo
                    </Button>
                </div>
            );
        }

        case "header": {
            const links = (c as any).navLinks || [];
            return (
                <div className="space-y-4">
                    <FieldGroup label="Logo URL">
                        <Input
                            value={(c as any).logoUrl || ""}
                            onChange={(e) =>
                                upd({ logoUrl: e.target.value } as any)
                            }
                            placeholder="https://..."
                        />
                    </FieldGroup>
                    <FieldGroup label="CTA Button Text">
                        <Input
                            value={c.ctaText || ""}
                            onChange={(e) => upd({ ctaText: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="CTA Button URL">
                        <Input
                            value={c.ctaUrl || ""}
                            onChange={(e) => upd({ ctaUrl: e.target.value })}
                        />
                    </FieldGroup>
                    <Separator />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Navigation Links
                    </p>
                    {links.map((link: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                placeholder="Label"
                                value={link.label}
                                onChange={(e) => {
                                    const nl = [...links];
                                    nl[i] = {
                                        ...link,
                                        label: e.target.value,
                                    };
                                    upd({ navLinks: nl } as any);
                                }}
                                className="h-8 text-xs flex-1"
                            />
                            <Input
                                placeholder="URL"
                                value={link.url}
                                onChange={(e) => {
                                    const nl = [...links];
                                    nl[i] = {
                                        ...link,
                                        url: e.target.value,
                                    };
                                    upd({ navLinks: nl } as any);
                                }}
                                className="h-8 text-xs flex-1"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 shrink-0"
                                onClick={() =>
                                    upd({
                                        navLinks: links.filter(
                                            (_: any, j: number) => j !== i,
                                        ),
                                    } as any)
                                }
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                            upd({
                                navLinks: [
                                    ...links,
                                    { label: "Link", url: "#" },
                                ],
                            } as any)
                        }
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Link
                    </Button>
                </div>
            );
        }

        case "footer": {
            const links = (c as any).navLinks || [];
            const socials = (c as any).socialLinks || [];
            return (
                <div className="space-y-4">
                    <FieldGroup label="Logo URL">
                        <Input
                            value={(c as any).logoUrl || ""}
                            onChange={(e) =>
                                upd({ logoUrl: e.target.value } as any)
                            }
                        />
                    </FieldGroup>
                    <FieldGroup label="Copyright Text">
                        <Input
                            value={(c as any).copyrightText || ""}
                            onChange={(e) =>
                                upd({
                                    copyrightText: e.target.value,
                                } as any)
                            }
                            placeholder="© 2025 Your Company"
                        />
                    </FieldGroup>
                    <Separator />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Footer Links
                    </p>
                    {links.map((link: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                placeholder="Label"
                                value={link.label}
                                onChange={(e) => {
                                    const nl = [...links];
                                    nl[i] = {
                                        ...link,
                                        label: e.target.value,
                                    };
                                    upd({ navLinks: nl } as any);
                                }}
                                className="h-8 text-xs flex-1"
                            />
                            <Input
                                placeholder="URL"
                                value={link.url}
                                onChange={(e) => {
                                    const nl = [...links];
                                    nl[i] = {
                                        ...link,
                                        url: e.target.value,
                                    };
                                    upd({ navLinks: nl } as any);
                                }}
                                className="h-8 text-xs flex-1"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 shrink-0"
                                onClick={() =>
                                    upd({
                                        navLinks: links.filter(
                                            (_: any, j: number) => j !== i,
                                        ),
                                    } as any)
                                }
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                            upd({
                                navLinks: [
                                    ...links,
                                    { label: "Link", url: "#" },
                                ],
                            } as any)
                        }
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Link
                    </Button>
                    <Separator />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Social Links
                    </p>
                    {socials.map((social: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                            <Select
                                value={social.platform}
                                onValueChange={(v) => {
                                    const ns = [...socials];
                                    ns[i] = {
                                        ...social,
                                        platform: v,
                                    };
                                    upd({ socialLinks: ns } as any);
                                }}
                            >
                                <SelectTrigger className="h-8 text-xs w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        "facebook",
                                        "twitter",
                                        "instagram",
                                        "linkedin",
                                        "youtube",
                                        "tiktok",
                                        "github",
                                    ].map((p) => (
                                        <SelectItem
                                            key={p}
                                            value={p}
                                            className="text-xs"
                                        >
                                            {p}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="URL"
                                value={social.url}
                                onChange={(e) => {
                                    const ns = [...socials];
                                    ns[i] = {
                                        ...social,
                                        url: e.target.value,
                                    };
                                    upd({ socialLinks: ns } as any);
                                }}
                                className="h-8 text-xs flex-1"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 shrink-0"
                                onClick={() =>
                                    upd({
                                        socialLinks: socials.filter(
                                            (_: any, j: number) => j !== i,
                                        ),
                                    } as any)
                                }
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                            upd({
                                socialLinks: [
                                    ...socials,
                                    { platform: "twitter", url: "#" },
                                ],
                            } as any)
                        }
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Social
                    </Button>
                </div>
            );
        }

        case "divider":
            return (
                <div className="space-y-4">
                    <FieldGroup label="Style">
                        <Select
                            value={(c as any).dividerStyle || "line"}
                            onValueChange={(v) =>
                                upd({ dividerStyle: v } as any)
                            }
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {["line", "dots", "gradient", "zigzag"].map(
                                    (s) => (
                                        <SelectItem
                                            key={s}
                                            value={s}
                                            className="text-xs"
                                        >
                                            {s}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </FieldGroup>
                    <FieldGroup label="Color">
                        <Input
                            value={(c as any).dividerColor || "#e5e7eb"}
                            onChange={(e) =>
                                upd({ dividerColor: e.target.value } as any)
                            }
                            placeholder="#hex"
                            className="h-8 text-xs"
                        />
                    </FieldGroup>
                    <FieldGroup label="Thickness">
                        <Slider
                            value={[(c as any).dividerThickness || 1]}
                            min={1}
                            max={8}
                            step={1}
                            onValueChange={([v]) =>
                                upd({ dividerThickness: v } as any)
                            }
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                            {(c as any).dividerThickness || 1}px
                        </p>
                    </FieldGroup>
                </div>
            );

        default:
            return (
                <p className="py-8 text-center text-xs text-muted-foreground">
                    Content settings coming soon for{" "}
                    <strong>{blockTypeLabels[type]}</strong>
                </p>
            );
    }
}

// ── StyleEditor ─────────────────────────────────────────────────────────────

function ColorPicker({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    const [custom, setCustom] = useState("");
    return (
        <FieldGroup label={label}>
            <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((c) => (
                    <button
                        key={c}
                        onClick={() => onChange(c)}
                        className={cn(
                            "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                            value === c
                                ? "border-purple-500 ring-2 ring-purple-200"
                                : "border-gray-200",
                        )}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
            <div className="mt-2 flex gap-2">
                <Input
                    value={custom || value || ""}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="#hex"
                    className="h-7 text-xs"
                />
                {custom && (
                    <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                            onChange(custom);
                            setCustom("");
                        }}
                    >
                        Set
                    </Button>
                )}
            </div>
        </FieldGroup>
    );
}

function StyleEditor({ block }: { block: PageBlock }) {
    const { updateBlockStyle } = useEditorActions();
    const s = block.style;
    const upd = useCallback(
        (p: Partial<BlockStyle>) => updateBlockStyle(block.id, p),
        [block.id, updateBlockStyle],
    );

    const aligns: {
        value: "left" | "center" | "right";
        icon: React.FC<{ className?: string }>;
    }[] = [
        { value: "left", icon: AlignLeft },
        { value: "center", icon: AlignCenter },
        { value: "right", icon: AlignRight },
    ];

    return (
        <div className="space-y-5">
            {/* ─── Colors ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Colors
            </p>
            <ColorPicker
                label="Background"
                value={s.backgroundColor || "#ffffff"}
                onChange={(v) => upd({ backgroundColor: v })}
            />
            <ColorPicker
                label="Text Color"
                value={s.textColor || "#1a1a2e"}
                onChange={(v) => upd({ textColor: v })}
            />

            <Separator />

            {/* ─── Typography ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Typography
            </p>

            <FieldGroup label="Font Family">
                <Select
                    value={s.fontFamily || "inherit"}
                    onValueChange={(v) =>
                        upd({ fontFamily: v === "inherit" ? undefined : v })
                    }
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[
                            "inherit",
                            "Inter",
                            "Georgia",
                            "Courier New",
                            "Arial",
                            "Helvetica",
                            "Times New Roman",
                            "Tajawal",
                            "Cairo",
                            "Poppins",
                            "Roboto",
                            "Montserrat",
                            "Playfair Display",
                        ].map((f) => (
                            <SelectItem
                                key={f}
                                value={f}
                                className="text-xs"
                                style={{
                                    fontFamily: f !== "inherit" ? f : undefined,
                                }}
                            >
                                {f === "inherit" ? "Default" : f}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldGroup>

            <FieldGroup label={`Font Size: ${s.fontSize || "default"}`}>
                <Select
                    value={s.fontSize || "default"}
                    onValueChange={(v) =>
                        upd({ fontSize: v === "default" ? undefined : v })
                    }
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[
                            "default",
                            "12px",
                            "14px",
                            "16px",
                            "18px",
                            "20px",
                            "24px",
                            "28px",
                            "32px",
                            "36px",
                            "48px",
                            "64px",
                        ].map((f) => (
                            <SelectItem key={f} value={f} className="text-xs">
                                {f}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldGroup>

            <FieldGroup label={`Font Weight: ${s.fontWeight || "normal"}`}>
                <Select
                    value={s.fontWeight || "normal"}
                    onValueChange={(v) =>
                        upd({ fontWeight: v === "normal" ? undefined : v })
                    }
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[
                            ["300", "Light"],
                            ["normal", "Normal"],
                            ["500", "Medium"],
                            ["600", "Semibold"],
                            ["700", "Bold"],
                            ["800", "Extra Bold"],
                            ["900", "Black"],
                        ].map(([v, l]) => (
                            <SelectItem key={v} value={v} className="text-xs">
                                {l}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldGroup>

            <FieldGroup label="Text Align">
                <div className="flex gap-1">
                    {aligns.map((a) => (
                        <Button
                            key={a.value}
                            variant={
                                s.textAlign === a.value ? "default" : "outline"
                            }
                            size="icon"
                            className={cn(
                                "h-8 w-8",
                                s.textAlign === a.value && "bg-purple-600",
                            )}
                            onClick={() => upd({ textAlign: a.value })}
                        >
                            <a.icon className="h-4 w-4" />
                        </Button>
                    ))}
                </div>
            </FieldGroup>

            <FieldGroup label={`Line Height: ${s.lineHeight || "auto"}`}>
                <Select
                    value={s.lineHeight || "auto"}
                    onValueChange={(v) =>
                        upd({ lineHeight: v === "auto" ? undefined : v })
                    }
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[
                            "auto",
                            "1",
                            "1.2",
                            "1.4",
                            "1.5",
                            "1.6",
                            "1.8",
                            "2",
                            "2.5",
                        ].map((v) => (
                            <SelectItem key={v} value={v} className="text-xs">
                                {v}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldGroup>

            <FieldGroup
                label={`Letter Spacing: ${s.letterSpacing || "normal"}`}
            >
                <Select
                    value={s.letterSpacing || "normal"}
                    onValueChange={(v) =>
                        upd({ letterSpacing: v === "normal" ? undefined : v })
                    }
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[
                            "normal",
                            "-0.5px",
                            "0px",
                            "0.5px",
                            "1px",
                            "2px",
                            "3px",
                            "5px",
                        ].map((v) => (
                            <SelectItem key={v} value={v} className="text-xs">
                                {v}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldGroup>

            <Separator />

            {/* ─── Spacing ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Spacing
            </p>

            <FieldGroup
                label={`Padding Top: ${parsePxPart(s.paddingTop || s.padding, "top")}px`}
            >
                <Slider
                    value={[parsePxPart(s.paddingTop || s.padding, "top")]}
                    min={0}
                    max={120}
                    step={4}
                    onValueChange={([v]) => upd({ paddingTop: `${v}px` })}
                />
            </FieldGroup>
            <FieldGroup
                label={`Padding Bottom: ${parsePxPart(s.paddingBottom || s.padding, "bottom")}px`}
            >
                <Slider
                    value={[
                        parsePxPart(s.paddingBottom || s.padding, "bottom"),
                    ]}
                    min={0}
                    max={120}
                    step={4}
                    onValueChange={([v]) => upd({ paddingBottom: `${v}px` })}
                />
            </FieldGroup>
            <FieldGroup
                label={`Padding Left: ${parsePxPart(s.paddingLeft || s.padding, "left")}px`}
            >
                <Slider
                    value={[parsePxPart(s.paddingLeft || s.padding, "left")]}
                    min={0}
                    max={80}
                    step={4}
                    onValueChange={([v]) => upd({ paddingLeft: `${v}px` })}
                />
            </FieldGroup>
            <FieldGroup
                label={`Padding Right: ${parsePxPart(s.paddingRight || s.padding, "right")}px`}
            >
                <Slider
                    value={[parsePxPart(s.paddingRight || s.padding, "right")]}
                    min={0}
                    max={80}
                    step={4}
                    onValueChange={([v]) => upd({ paddingRight: `${v}px` })}
                />
            </FieldGroup>

            <FieldGroup label={`Margin Top: ${parsePx(s.marginTop)}px`}>
                <Slider
                    value={[parsePx(s.marginTop)]}
                    min={0}
                    max={80}
                    step={4}
                    onValueChange={([v]) => upd({ marginTop: `${v}px` })}
                />
            </FieldGroup>
            <FieldGroup label={`Margin Bottom: ${parsePx(s.marginBottom)}px`}>
                <Slider
                    value={[parsePx(s.marginBottom)]}
                    min={0}
                    max={80}
                    step={4}
                    onValueChange={([v]) => upd({ marginBottom: `${v}px` })}
                />
            </FieldGroup>

            <Separator />

            {/* ─── Border ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Border
            </p>

            <FieldGroup label={`Border Radius: ${parsePx(s.borderRadius)}px`}>
                <Slider
                    value={[parsePx(s.borderRadius)]}
                    min={0}
                    max={48}
                    step={2}
                    onValueChange={([v]) => upd({ borderRadius: `${v}px` })}
                />
            </FieldGroup>

            <FieldGroup label="Border Style">
                <Select
                    value={s.borderStyle || "none"}
                    onValueChange={(v) => upd({ borderStyle: v as any })}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {["none", "solid", "dashed", "dotted"].map((v) => (
                            <SelectItem key={v} value={v} className="text-xs">
                                {v}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldGroup>

            {s.borderStyle && s.borderStyle !== "none" && (
                <>
                    <FieldGroup
                        label={`Border Width: ${parsePx(s.borderWidth) || 1}px`}
                    >
                        <Slider
                            value={[parsePx(s.borderWidth) || 1]}
                            min={1}
                            max={8}
                            step={1}
                            onValueChange={([v]) =>
                                upd({ borderWidth: `${v}px` })
                            }
                        />
                    </FieldGroup>
                    <FieldGroup label="Border Color">
                        <Input
                            value={s.borderColor || "#e5e7eb"}
                            onChange={(e) =>
                                upd({ borderColor: e.target.value })
                            }
                            className="h-7 text-xs"
                            placeholder="#hex"
                        />
                    </FieldGroup>
                </>
            )}

            <Separator />

            {/* ─── Effects ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Effects
            </p>

            <FieldGroup label="Box Shadow">
                <Select
                    value={s.boxShadow || "none"}
                    onValueChange={(v) =>
                        upd({ boxShadow: v === "none" ? undefined : v })
                    }
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none" className="text-xs">
                            None
                        </SelectItem>
                        <SelectItem
                            value="0 1px 3px rgba(0,0,0,0.1)"
                            className="text-xs"
                        >
                            Small
                        </SelectItem>
                        <SelectItem
                            value="0 4px 12px rgba(0,0,0,0.1)"
                            className="text-xs"
                        >
                            Medium
                        </SelectItem>
                        <SelectItem
                            value="0 8px 30px rgba(0,0,0,0.12)"
                            className="text-xs"
                        >
                            Large
                        </SelectItem>
                        <SelectItem
                            value="0 20px 60px rgba(0,0,0,0.15)"
                            className="text-xs"
                        >
                            Extra Large
                        </SelectItem>
                        <SelectItem
                            value="0 4px 20px rgba(142,120,251,0.3)"
                            className="text-xs"
                        >
                            Purple Glow
                        </SelectItem>
                        <SelectItem
                            value="0 4px 20px rgba(246,88,135,0.3)"
                            className="text-xs"
                        >
                            Pink Glow
                        </SelectItem>
                    </SelectContent>
                </Select>
            </FieldGroup>

            <FieldGroup
                label={`Opacity: ${Math.round((s.opacity ?? 1) * 100)}%`}
            >
                <Slider
                    value={[Math.round((s.opacity ?? 1) * 100)]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={([v]) => upd({ opacity: v / 100 })}
                />
            </FieldGroup>

            <FieldGroup label={`Min Height: ${s.minHeight || "auto"}`}>
                <Select
                    value={s.minHeight || "auto"}
                    onValueChange={(v) =>
                        upd({ minHeight: v === "auto" ? undefined : v })
                    }
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[
                            "auto",
                            "100px",
                            "200px",
                            "300px",
                            "400px",
                            "500px",
                            "600px",
                            "100vh",
                        ].map((v) => (
                            <SelectItem key={v} value={v} className="text-xs">
                                {v}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldGroup>

            <Separator />

            {/* ─── Background ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Background
            </p>

            <FieldGroup label="Background Image URL">
                <Input
                    value={s.backgroundImage || ""}
                    onChange={(e) =>
                        upd({ backgroundImage: e.target.value || undefined })
                    }
                    placeholder="https://..."
                    className="h-8 text-xs"
                />
                {s.backgroundImage && (
                    <div
                        className="mt-1 h-16 rounded-md bg-cover bg-center border"
                        style={{ backgroundImage: `url(${s.backgroundImage})` }}
                    />
                )}
            </FieldGroup>

            {s.backgroundImage && (
                <>
                    <FieldGroup label="Background Size">
                        <Select
                            value={s.backgroundSize || "cover"}
                            onValueChange={(v) =>
                                upd({ backgroundSize: v as any })
                            }
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {["cover", "contain", "auto"].map((v) => (
                                    <SelectItem
                                        key={v}
                                        value={v}
                                        className="text-xs"
                                    >
                                        {v}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FieldGroup>
                    <FieldGroup label="Background Position">
                        <Select
                            value={s.backgroundPosition || "center"}
                            onValueChange={(v) =>
                                upd({ backgroundPosition: v })
                            }
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    "center",
                                    "top",
                                    "bottom",
                                    "left",
                                    "right",
                                    "top left",
                                    "top right",
                                    "bottom left",
                                    "bottom right",
                                ].map((v) => (
                                    <SelectItem
                                        key={v}
                                        value={v}
                                        className="text-xs"
                                    >
                                        {v}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FieldGroup>
                </>
            )}

            <FieldGroup label="Background Gradient">
                <Input
                    value={s.backgroundGradient || ""}
                    onChange={(e) =>
                        upd({ backgroundGradient: e.target.value || undefined })
                    }
                    placeholder="linear-gradient(135deg, #8e78fb, #f65887)"
                    className="h-8 text-xs"
                />
                {s.backgroundGradient && (
                    <div
                        className="mt-1 h-8 rounded-md"
                        style={{ background: s.backgroundGradient }}
                    />
                )}
            </FieldGroup>

            {/* Quick gradient presets */}
            <div className="flex flex-wrap gap-1.5">
                {[
                    {
                        label: "Purple→Pink",
                        value: "linear-gradient(135deg, #8e78fb, #f65887)",
                    },
                    {
                        label: "Blue→Cyan",
                        value: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                    },
                    {
                        label: "Dark",
                        value: "linear-gradient(135deg, #0f0a2e, #1a1a4e)",
                    },
                    {
                        label: "Warm",
                        value: "linear-gradient(135deg, #f59e0b, #ef4444)",
                    },
                    {
                        label: "Green",
                        value: "linear-gradient(135deg, #10b981, #059669)",
                    },
                    {
                        label: "Sunset",
                        value: "linear-gradient(135deg, #f65887, #f59e0b)",
                    },
                ].map((g) => (
                    <button
                        key={g.label}
                        onClick={() => upd({ backgroundGradient: g.value })}
                        className="h-6 w-12 rounded border text-[8px] font-medium"
                        style={{ background: g.value, color: "#fff" }}
                    >
                        {g.label.split("\u2192")[0]}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── AdvancedEditor ──────────────────────────────────────────────────────────

function AdvancedEditor({ block }: { block: PageBlock }) {
    const { toggleBlockVisibility, toggleBlockLock, updateBlockStyle } =
        useEditorActions();
    const s = block.style;

    return (
        <div className="space-y-5">
            {/* ─── Visibility ─── */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Visibility</p>
                    <p className="text-xs text-muted-foreground">
                        Show on published page
                    </p>
                </div>
                <Switch
                    checked={block.visible}
                    onCheckedChange={() => toggleBlockVisibility(block.id)}
                />
            </div>
            <Separator />

            {/* ─── Lock ─── */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Lock Block</p>
                    <p className="text-xs text-muted-foreground">
                        Prevent accidental edits
                    </p>
                </div>
                <Switch
                    checked={block.locked || false}
                    onCheckedChange={() => toggleBlockLock(block.id)}
                />
            </div>
            <Separator />

            {/* ─── Responsive ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Responsive
            </p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-gray-400" />
                    <div>
                        <p className="text-sm font-medium">Hide on Mobile</p>
                        <p className="text-[10px] text-muted-foreground">
                            {"Screen < 768px"}
                        </p>
                    </div>
                </div>
                <Switch
                    checked={(s as any).hideOnMobile || false}
                    onCheckedChange={(v) =>
                        updateBlockStyle(block.id, { hideOnMobile: v } as any)
                    }
                />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-gray-400" />
                    <div>
                        <p className="text-sm font-medium">Hide on Desktop</p>
                        <p className="text-[10px] text-muted-foreground">
                            {"Screen \u2265 1024px"}
                        </p>
                    </div>
                </div>
                <Switch
                    checked={(s as any).hideOnDesktop || false}
                    onCheckedChange={(v) =>
                        updateBlockStyle(block.id, { hideOnDesktop: v } as any)
                    }
                />
            </div>
            <Separator />

            {/* ─── Animation ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Animation
            </p>
            <FieldGroup label="Entrance Effect">
                <Select
                    value={(s as any).animationEffect || "none"}
                    onValueChange={(v) =>
                        updateBlockStyle(block.id, {
                            animationEffect: v,
                        } as any)
                    }
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[
                            "none",
                            "fadeIn",
                            "slideUp",
                            "slideLeft",
                            "slideRight",
                            "scaleIn",
                            "bounce",
                        ].map((v) => (
                            <SelectItem key={v} value={v} className="text-xs">
                                {v === "none"
                                    ? "None"
                                    : v.replace(/([A-Z])/g, " $1").trim()}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldGroup>
            <Separator />

            {/* ─── Custom ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Custom
            </p>
            <FieldGroup label="Custom CSS Class">
                <Input
                    value={(s as any).customClassName || ""}
                    onChange={(e) =>
                        updateBlockStyle(block.id, {
                            customClassName: e.target.value,
                        } as any)
                    }
                    placeholder="my-custom-class"
                    className="h-8 text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                    Add Tailwind or custom classes
                </p>
            </FieldGroup>

            <FieldGroup label="Max Width">
                <Select
                    value={s.maxWidth || "none"}
                    onValueChange={(v) =>
                        updateBlockStyle(block.id, {
                            maxWidth: v === "none" ? undefined : v,
                        })
                    }
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[
                            "none",
                            "640px",
                            "768px",
                            "1024px",
                            "1200px",
                            "1400px",
                            "100%",
                        ].map((v) => (
                            <SelectItem key={v} value={v} className="text-xs">
                                {v === "none" ? "Full Width" : v}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldGroup>
            <Separator />

            {/* ─── Info ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Block Info
            </p>
            <div>
                <p className="text-xs font-medium text-muted-foreground">
                    Block ID
                </p>
                <code className="mt-1 block rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-500 font-mono">
                    {block.id}
                </code>
            </div>
            <div>
                <p className="text-xs font-medium text-muted-foreground">
                    Block Type
                </p>
                <Badge variant="outline" className="mt-1">
                    {blockTypeLabels[block.type]}
                </Badge>
            </div>
        </div>
    );
}

// ── RightSidebar ────────────────────────────────────────────────────────────

function RightSidebar() {
    const {
        selectedBlock,
        editor,
        setRightPanel,
        selectBlock,
        page,
        updatePageMeta,
    } = useEditorActions();

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className="shrink-0 overflow-hidden border-l bg-white"
        >
            <div className="flex h-full w-[320px] flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        {selectedBlock && (
                            <BlockIcon
                                name={blockTypeIcons[selectedBlock.type]}
                                className="h-4 w-4 text-purple-600"
                            />
                        )}
                        <h2 className="text-sm font-semibold">
                            {selectedBlock
                                ? blockTypeLabels[selectedBlock.type]
                                : "Settings"}
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => selectBlock(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {!selectedBlock && (
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    Page Settings
                                </h3>
                                <div className="space-y-4">
                                    <FieldGroup label="Page Title">
                                        <Input
                                            value={page.title}
                                            onChange={(e) =>
                                                updatePageMeta({
                                                    title: e.target.value,
                                                })
                                            }
                                            placeholder="My Landing Page"
                                            className="h-8 text-xs"
                                        />
                                    </FieldGroup>
                                    <FieldGroup label="Slug">
                                        <Input
                                            value={page.slug}
                                            onChange={(e) =>
                                                updatePageMeta({
                                                    slug: e.target.value,
                                                })
                                            }
                                            placeholder="my-landing-page"
                                            className="h-8 text-xs"
                                        />
                                    </FieldGroup>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    SEO Settings
                                </h3>
                                <div className="space-y-4">
                                    <FieldGroup label="SEO Title">
                                        <Input
                                            value={page.seo?.title || ""}
                                            onChange={(e) =>
                                                updatePageMeta({
                                                    seo: {
                                                        ...page.seo,
                                                        title: e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="Page title for search engines"
                                            className="h-8 text-xs"
                                        />
                                    </FieldGroup>
                                    <FieldGroup label="SEO Description">
                                        <Textarea
                                            value={page.seo?.description || ""}
                                            onChange={(e) =>
                                                updatePageMeta({
                                                    seo: {
                                                        ...page.seo,
                                                        description:
                                                            e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="Describe this page for search engines (150-160 chars)"
                                            rows={3}
                                            className="text-xs"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {
                                                (page.seo?.description || "")
                                                    .length
                                            }
                                            /160 characters
                                        </p>
                                    </FieldGroup>
                                    <FieldGroup label="Keywords (comma separated)">
                                        <Input
                                            value={(
                                                page.seo?.keywords || []
                                            ).join(", ")}
                                            onChange={(e) =>
                                                updatePageMeta({
                                                    seo: {
                                                        ...page.seo,
                                                        keywords: e.target.value
                                                            .split(",")
                                                            .map((k) =>
                                                                k.trim(),
                                                            )
                                                            .filter(Boolean),
                                                    },
                                                })
                                            }
                                            placeholder="course, arabic, online learning"
                                            className="h-8 text-xs"
                                        />
                                    </FieldGroup>
                                </div>
                            </div>
                            <Separator />
                            <div className="rounded-lg bg-purple-50 p-3 border border-purple-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                                    <p className="text-xs font-semibold text-purple-800">
                                        Tip
                                    </p>
                                </div>
                                <p className="text-[11px] text-purple-700 leading-relaxed">
                                    Click any block on the canvas to edit its
                                    content and style. Use the Blocks panel on
                                    the left to add new sections.
                                </p>
                            </div>
                        </div>
                    </ScrollArea>
                )}

                {selectedBlock && (
                    <Tabs
                        value={editor.rightPanel || "content"}
                        onValueChange={(v) =>
                            setRightPanel(v as "content" | "style" | "advanced")
                        }
                        className="flex flex-1 flex-col overflow-hidden"
                    >
                        <TabsList className="mx-4 mt-2 grid w-auto grid-cols-3">
                            <TabsTrigger value="content" className="text-xs">
                                Content
                            </TabsTrigger>
                            <TabsTrigger value="style" className="text-xs">
                                Style
                            </TabsTrigger>
                            <TabsTrigger value="advanced" className="text-xs">
                                Advanced
                            </TabsTrigger>
                        </TabsList>
                        <ScrollArea className="flex-1 p-4">
                            <TabsContent value="content" className="mt-0">
                                <ContentEditor block={selectedBlock} />
                            </TabsContent>
                            <TabsContent value="style" className="mt-0">
                                <StyleEditor block={selectedBlock} />
                            </TabsContent>
                            <TabsContent value="advanced" className="mt-0">
                                <AdvancedEditor block={selectedBlock} />
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                )}
            </div>
        </motion.div>
    );
}

// ── PublishDialog ────────────────────────────────────────────────────────────

function PublishDialog({
    open,
    onOpenChange,
    onSave,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSave: () => Promise<boolean>;
}) {
    const { user } = useAuthContext();
    const creatorSlug = user?.slug || user?.username || "creator";
    const { page, blocks } = useEditorActions();
    const [publishing, setPublishing] = useState(false);
    const [published, setPublished] = useState(false);
    const [customDomain, setCustomDomain] = useState(
        (page as any).customDomain || "",
    );

    const checks = [
        {
            label: "Page title is set",
            passed: page.title.length > 0 && page.title !== "Untitled Page",
        },
        { label: "At least 1 block", passed: blocks.length > 0 },
        { label: "SEO description filled", passed: !!page.seo?.description },
        {
            label: "Has a hero section",
            passed: blocks.some((b) => b.type === "hero"),
        },
        {
            label: "Has a CTA block",
            passed: blocks.some((b) => b.type === "cta"),
        },
        ...(((page as any).pageType === "community-home") ? [{
            label: "Has community join block",
            passed: blocks.some((b) => b.type === "community-join" && b.visible !== false),
        }] : []),
    ];
    const passedCount = checks.filter((c) => c.passed).length;
    const allPassed = passedCount === checks.length;

    const handlePublish = async () => {
        if (!page.id || page.id === "new" || page.id === "demo-page-001") {
            alert("Please save the page first, then publish.");
            return;
        }
        setPublishing(true);
        try {
            const saved = await onSave();
            if (!saved) {
                alert("Failed to save the latest changes before publishing.");
                return;
            }
            await landingPagesApi.publish(page.id, {
                customDomain: customDomain || undefined,
            });
            setPublished(true);
        } catch (err) {
            console.error("Publish failed:", err);
            alert("Failed to publish the landing page.");
        } finally {
            setPublishing(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                onOpenChange(v);
                if (!v) setPublished(false);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {published
                            ? "🎉 Published!"
                            : (page as any).pageType === "community-home"
                              ? "Publish Community Home Page"
                              : "Publish Landing Page"}
                    </DialogTitle>
                    <DialogDescription>
                        {published
                            ? "Your page is now live and accessible."
                            : "Review the checklist below before publishing."}
                    </DialogDescription>
                </DialogHeader>

                {published ? (
                    <div className="space-y-4 py-4 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {(page as any).pageType === "community-home"
                                ? "Your community home page is live at:"
                                : "Your landing page is live at:"}
                        </p>
                        <code className="block rounded-lg bg-gray-100 px-3 py-2 text-xs">
                            {typeof window !== "undefined" ? window.location.origin : ""}
                            {(page as any).pageType === "community-home" && (page as any).communitySlug
                                ? `/community/${(page as any).communitySlug}`
                                : `/p/${creatorSlug}/${page.slug || "my-page"}`}
                        </code>
                        <Button
                            className="w-full"
                            onClick={() => onOpenChange(false)}
                        >
                            Done
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 py-4">
                            {checks.map((check, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="flex items-center gap-3"
                                >
                                    {check.passed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                    <span
                                        className={cn(
                                            "text-sm",
                                            check.passed
                                                ? "text-gray-700"
                                                : "text-amber-600",
                                        )}
                                    >
                                        {check.label}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                        <div className="mb-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Readiness</span>
                                <span>
                                    {passedCount}/{checks.length}
                                </span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${(passedCount / checks.length) * 100}%`,
                                    }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                />
                            </div>
                        </div>

                        <FieldGroup label="Custom Domain (optional)">
                            <Input
                                value={customDomain}
                                onChange={(e) =>
                                    setCustomDomain(e.target.value)
                                }
                                placeholder="pages.yourdomain.com"
                                className="h-8 text-xs font-mono"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Point a CNAME to chabaqa.com to use your domain
                            </p>
                        </FieldGroup>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePublish}
                                disabled={passedCount < 2 || publishing}
                                className="gap-2 bg-gradient-to-r from-[#8e78fb] to-[#f65887] text-white hover:opacity-90"
                            >
                                {publishing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Globe className="h-4 w-4" />
                                        Publish Now
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ── EditorInner (Main shell + DnD + shortcuts) ─────────────────────────────

function EditorInner() {
    const {
        blocks,
        page,
        editor,
        selectedBlockId,
        selectedBlock,
        canUndo,
        canRedo,
        hasUnsavedChanges,
        addBlock,
        removeBlock,
        moveBlock,
        selectBlock,
        hoverBlock,
        setDragging,
        setSaving,
        markSaved,
        undo,
        redo,
        toggleLeftPanel,
    } = useEditorActions();

    const [publishOpen, setPublishOpen] = useState(false);

    // Set browser tab title (community-aware)
    useEffect(() => {
        if (page?.title) {
            document.title =
                (page as any).pageType === "community-home"
                    ? `Editing: ${page.title} (Community Home) | Creator Dashboard`
                    : `Editing: ${page.title} | Creator Dashboard`;
        }
        return () => {
            document.title = "Creator Dashboard";
        };
    }, [page?.title, (page as any).pageType]);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragFromSidebar, setActiveDragFromSidebar] = useState(false);
    const [activeSidebarBlockType, setActiveSidebarBlockType] =
        useState<BlockType | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const savePage = useCallback(async () => {
        const pageId = page?.id;
        if (!pageId || pageId === "new" || pageId === "demo-page-001") {
            return false;
        }

        setSaving(true);
        try {
            const updatePayload = {
                title: page.title,
                slug: page.slug,
                description: (page as any).description,
                blocks: blocks as Record<string, any>[],
                seo: page.seo,
                pageType: (page as any).pageType,
                isPrimaryHome: (page as any).isPrimaryHome,
            } as any;

            await landingPagesApi.update(pageId, updatePayload);
            markSaved();
            return true;
        } catch (err) {
            console.error("Save failed:", err);
            setSaving(false);
            return false;
        }
    }, [page, blocks, setSaving, markSaved]);

    const handleAddBlock = useCallback(
        (type: BlockType) => {
            const newBlock = createBlock(type);
            addBlock(newBlock);
            selectBlock(newBlock.id);
        },
        [addBlock, selectBlock],
    );

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const tgt = e.target as HTMLElement;
            const isInput =
                tgt.tagName === "INPUT" ||
                tgt.tagName === "TEXTAREA" ||
                tgt.isContentEditable;

            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) undo();
            }
            if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "y" || (e.key === "z" && e.shiftKey))
            ) {
                e.preventDefault();
                if (canRedo) redo();
            }
            if (
                (e.key === "Delete" || e.key === "Backspace") &&
                selectedBlockId &&
                !isInput
            ) {
                e.preventDefault();
                removeBlock(selectedBlockId);
            }
            if (e.key === "Escape") selectBlock(null);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        canUndo,
        canRedo,
        selectedBlockId,
        undo,
        redo,
        removeBlock,
        selectBlock,
    ]);

    // Auto-save
    useEffect(() => {
        if (hasUnsavedChanges && !editor.isSaving) {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(async () => {
                await savePage();
            }, 500);
        }
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [hasUnsavedChanges, editor.isSaving, savePage]);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        setActiveDragId(String(active.id));
        if (active.data.current?.fromSidebar) {
            setActiveDragFromSidebar(true);
            setActiveSidebarBlockType(
                active.data.current.blockType as BlockType,
            );
        } else {
            setActiveDragFromSidebar(false);
            setActiveSidebarBlockType(null);
        }
        setDragging(true);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveDragId(null);
        setActiveDragFromSidebar(false);
        setActiveSidebarBlockType(null);
        setDragging(false);
        if (!over) return;

        if (active.data.current?.fromSidebar) {
            const blockType = active.data.current.blockType as BlockType;
            const newBlock = createBlock(blockType);
            const overIdx = blocks.findIndex((b) => b.id === String(over.id));
            addBlock(newBlock, overIdx >= 0 ? overIdx : undefined);
            selectBlock(newBlock.id);
        } else {
            const oldIdx = blocks.findIndex((b) => b.id === String(active.id));
            const newIdx = blocks.findIndex((b) => b.id === String(over.id));
            if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx)
                moveBlock(oldIdx, newIdx);
        }
    }

    const activeBlock = useMemo(() => {
        if (!activeDragId || activeDragFromSidebar) return null;
        return blocks.find((b) => b.id === activeDragId) ?? null;
    }, [activeDragId, activeDragFromSidebar, blocks]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-screen flex-col overflow-hidden bg-white">
                <TopToolbar
                    onPublish={() => setPublishOpen(true)}
                    onSave={savePage}
                />

                <div className="flex flex-1 overflow-hidden">
                    {/* Left panel toggle when collapsed */}
                    {!editor.leftPanelOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex shrink-0 items-start border-r bg-gray-50 px-1 pt-3"
                        >
                            <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={toggleLeftPanel}
                                        >
                                            <PanelLeftOpen className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        Show Blocks Panel
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </motion.div>
                    )}

                    <LeftSidebar onAddBlock={handleAddBlock} />
                    <CanvasArea />
                    <AnimatePresence mode="wait">
                        {selectedBlock && <RightSidebar />}
                    </AnimatePresence>
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={null}>
                {activeDragId &&
                activeDragFromSidebar &&
                activeSidebarBlockType ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 0.9 }}
                        className="w-[220px] rounded-lg border border-purple-300 bg-white p-3 shadow-2xl"
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                <BlockIcon
                                    name={
                                        blockTypeIcons[activeSidebarBlockType]
                                    }
                                    size={16}
                                />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-800">
                                    {blockTypeLabels[activeSidebarBlockType]}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                    Drop on canvas to add
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : activeDragId && activeBlock ? (
                    <div className="w-full max-w-[600px] rounded-lg opacity-80 shadow-2xl ring-2 ring-purple-400">
                        <BlockRenderer block={activeBlock} />
                    </div>
                ) : null}
            </DragOverlay>

            <PublishDialog
                open={publishOpen}
                onOpenChange={setPublishOpen}
                onSave={savePage}
            />
        </DndContext>
    );
}

// ── LandingPageEditor (Provider Wrapper) ────────────────────────────────────

function LandingPageEditor() {
    const searchParams = useSearchParams();
    const templateId = searchParams.get("template");

    const initialState = useMemo<FullEditorState>(() => {
        const base = createInitialFullState();

        let demoBlocks: PageBlock[] = [];
        let pageTitle = "My Awesome Landing Page";

        if (templateId) {
            const template = pageTemplates.find((t) => t.id === templateId);
            if (template) {
                demoBlocks = cloneTemplateBlocks(templateId);
                pageTitle = template.name;
            }
        }

        if (demoBlocks.length === 0) {
            demoBlocks = [
                createBlock("header"),
                createBlock("hero"),
                createBlock("features"),
                createBlock("testimonials"),
                createBlock("cta"),
                createBlock("footer"),
            ];
        }

        return {
            page: {
                ...base.page,
                id: "demo-page-001",
                title: pageTitle,
                slug: pageTitle.toLowerCase().replace(/\s+/g, "-"),
                status: "draft",
                blocks: demoBlocks,
                seo: {
                    title: pageTitle,
                    description: "",
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            editor: {
                ...base.editor,
                leftPanelOpen: true,
                rightPanel: "content",
            },
        };
    }, [templateId]);

    const [state, dispatch] = useReducer(editorReducer, initialState);

    // Load real page data on mount
    const params = useParams<{ id: string }>();
    const router = useRouter();
    useEffect(() => {
        const pageId = params?.id;
        if (!pageId) return;

        if (pageId === "new") {
            landingPagesApi
                .create({
                    title: initialState.page.title,
                    description: initialState.page.seo?.description || "",
                    templateId: templateId ?? undefined,
                    seo: initialState.page.seo,
                })
                .then((res) => {
                    if ((res as any).data?.id) {
                        router.replace(
                            `/creator/landing-pages/${(res as any).data.id}/edit`,
                        );
                    }
                })
                .catch((err) =>
                    console.error("Failed to create new page:", err),
                );
            return;
        }

        landingPagesApi
            .getById(pageId)
            .then((res) => {
                if ((res as any).data)
                    dispatch({ type: "SET_PAGE", payload: (res as any).data });
            })
            .catch((err) => console.error("Failed to load page:", err));
    }, [params?.id, router, initialState, templateId]);

    const contextValue = useMemo(
        () => ({ state, dispatch }),
        [state, dispatch],
    );

    return (
        <EditorContext.Provider value={contextValue}>
            <EditorInner />
        </EditorContext.Provider>
    );
}

// ── Page Export ──────────────────────────────────────────────────────────────

export default function LandingPageEditorPage() {
    return <LandingPageEditor />;
}
