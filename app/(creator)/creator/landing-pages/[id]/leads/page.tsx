"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    Download,
    Trash2,
    Mail,
    MoreHorizontal,
    Eye,
    Filter,
    Users,
    TrendingUp,
    Target,
    Flame,
    Thermometer,
    Snowflake,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FileSpreadsheet,
    FileJson,
    FileText,
    Check,
    X,
    Clock,
    Globe,
    MousePointerClick,
    MessageSquare,
    Phone,
    UserCircle,
    Sparkles,
    AlertCircle,
    Inbox,
    Lightbulb,
    ExternalLink,
    Pencil,
    BarChart3,
} from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { PageLead } from "@/lib/landing-pages/types";
import { landingPagesApi } from "@/lib/api/landing-pages.api";

// ---------------------------------------------------------------------------
// UI constants
// ---------------------------------------------------------------------------

const LEAD_SOURCES = ["Organic", "Social", "Email", "Direct", "Referral"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ScoreCategory = "hot" | "warm" | "cold";

function getScoreCategory(score: number): ScoreCategory {
    if (score >= 70) return "hot";
    if (score >= 40) return "warm";
    return "cold";
}

function getScoreBadge(score: number) {
    const category = getScoreCategory(score);
    const config = {
        hot: {
            label: "Hot",
            className: "bg-red-100 text-red-700 border-red-200",
            icon: Flame,
        },
        warm: {
            label: "Warm",
            className: "bg-orange-100 text-orange-700 border-orange-200",
            icon: Thermometer,
        },
        cold: {
            label: "Cold",
            className: "bg-blue-100 text-blue-700 border-blue-200",
            icon: Snowflake,
        },
    };
    return config[category];
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

type SortField = "name" | "email" | "score" | "source" | "createdAt";
type SortDirection = "asc" | "desc";

// ---------------------------------------------------------------------------
// Animated counter
// ---------------------------------------------------------------------------

function useAnimatedCounter(target: number, duration: number = 1000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let raf: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
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

function StatCard({
    title,
    value,
    icon: Icon,
    color,
    delay = 0,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    delay?: number;
}) {
    const animatedValue = useAnimatedCounter(value);

    const colorMap: Record<
        string,
        { bg: string; iconBg: string; iconText: string }
    > = {
        purple: {
            bg: "from-purple-50 to-purple-50/30",
            iconBg: "bg-purple-100",
            iconText: "text-purple-600",
        },
        blue: {
            bg: "from-blue-50 to-blue-50/30",
            iconBg: "bg-blue-100",
            iconText: "text-blue-600",
        },
        green: {
            bg: "from-green-50 to-green-50/30",
            iconBg: "bg-green-100",
            iconText: "text-green-600",
        },
        orange: {
            bg: "from-orange-50 to-orange-50/30",
            iconBg: "bg-orange-100",
            iconText: "text-orange-600",
        },
    };

    const c = colorMap[color] || colorMap.purple;

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
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "inline-flex items-center justify-center w-10 h-10 rounded-xl",
                                c.iconBg,
                            )}
                        >
                            <Icon className={cn("h-5 w-5", c.iconText)} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {title}
                            </p>
                            <p className="text-2xl font-bold tracking-tight">
                                {animatedValue.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function SortableHeader({
    label,
    field,
    currentSort,
    currentDirection,
    onSort,
}: {
    label: string;
    field: SortField;
    currentSort: SortField;
    currentDirection: SortDirection;
    onSort: (field: SortField) => void;
}) {
    const isActive = currentSort === field;
    return (
        <button
            onClick={() => onSort(field)}
            className="flex items-center gap-1 hover:text-foreground transition-colors group"
        >
            <span>{label}</span>
            {isActive ? (
                currentDirection === "asc" ? (
                    <ArrowUp className="h-3.5 w-3.5 text-[#8e78fb]" />
                ) : (
                    <ArrowDown className="h-3.5 w-3.5 text-[#8e78fb]" />
                )
            ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
        </button>
    );
}

// ---------------------------------------------------------------------------
// Lead Detail Dialog
// ---------------------------------------------------------------------------

function LeadDetailDialog({
    lead,
    open,
    onOpenChange,
}: {
    lead:
        | (PageLead & {
              name: string;
              phone: string;
              score: number;
              source: string;
          })
        | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!lead) return null;

    const scoreBadge = getScoreBadge(lead.score);
    const ScoreIcon = scoreBadge.icon;

    const activityTimeline = [
        { time: "2 hours ago", event: "Viewed pricing section", icon: Eye },
        {
            time: "1 day ago",
            event: "Submitted contact form",
            icon: MessageSquare,
        },
        {
            time: "2 days ago",
            event: "Clicked CTA button",
            icon: MousePointerClick,
        },
        {
            time: "3 days ago",
            event: "First page visit via " + lead.source,
            icon: Globe,
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 via-[#8e78fb] to-indigo-600 p-6 text-white relative">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent_50%)]" />
                    <DialogHeader className="relative">
                        <DialogTitle className="text-white text-lg">
                            {lead.name}
                        </DialogTitle>
                        <DialogDescription className="text-purple-100">
                            {lead.email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-3 mt-3 relative">
                        <Badge className={cn("border", scoreBadge.className)}>
                            <ScoreIcon className="h-3 w-3 mr-1" />
                            {scoreBadge.label} — Score: {lead.score}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="bg-white/15 text-white border-0"
                        >
                            {lead.source}
                        </Badge>
                    </div>
                </div>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Contact Info */}
                    <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            Contact Information
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                    Email
                                </p>
                                <p className="text-sm font-medium truncate">
                                    {lead.email}
                                </p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                    Phone
                                </p>
                                <p className="text-sm font-medium">
                                    {lead.phone}
                                </p>
                            </div>
                            {!!lead.data?.company && (
                                <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                        Company
                                    </p>
                                    <p className="text-sm font-medium">
                                        {String(lead.data.company)}
                                    </p>
                                </div>
                            )}
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                    Submitted
                                </p>
                                <p className="text-sm font-medium">
                                    {formatDateTime(lead.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submission Data */}
                    {!!lead.data?.message && (
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                Submission Data
                            </h4>
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                                    Message
                                </p>
                                <p className="text-sm">
                                    {String(lead.data.message)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Activity Timeline */}
                    <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Activity Timeline
                        </h4>
                        <div className="space-y-0">
                            {activityTimeline.map((item, i) => {
                                const ItemIcon = item.icon;
                                return (
                                    <div
                                        key={i}
                                        className="flex gap-3 relative"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 shrink-0">
                                                <ItemIcon className="h-3.5 w-3.5 text-purple-600" />
                                            </div>
                                            {i <
                                                activityTimeline.length - 1 && (
                                                <div className="w-px h-full bg-border min-h-[20px]" />
                                            )}
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-sm font-medium">
                                                {item.event}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.time}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="border-t p-4 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    <Button
                        size="sm"
                        className="bg-[#8e78fb] hover:bg-[#7c68e8]"
                    >
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        Send Email
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Export Dialog
// ---------------------------------------------------------------------------

function ExportDialog({
    open,
    onOpenChange,
    selectedCount,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
}) {
    const [format, setFormat] = useState("csv");
    const [dateRange, setDateRange] = useState("all");

    const formats = [
        {
            value: "csv",
            label: "CSV",
            icon: FileText,
            desc: "Comma-separated values",
        },
        {
            value: "excel",
            label: "Excel",
            icon: FileSpreadsheet,
            desc: "XLSX spreadsheet",
        },
        {
            value: "json",
            label: "JSON",
            icon: FileJson,
            desc: "Structured data format",
        },
    ];

    const fields = [
        { key: "name", label: "Name", checked: true },
        { key: "email", label: "Email", checked: true },
        { key: "phone", label: "Phone", checked: true },
        { key: "score", label: "Score", checked: true },
        { key: "source", label: "Source", checked: true },
        { key: "date", label: "Date", checked: true },
        { key: "company", label: "Company", checked: false },
        { key: "message", label: "Message", checked: false },
    ];

    const [checkedFields, setCheckedFields] = useState<Record<string, boolean>>(
        Object.fromEntries(fields.map((f) => [f.key, f.checked])),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Export Leads</DialogTitle>
                    <DialogDescription>
                        {selectedCount > 0
                            ? `Export ${selectedCount} selected leads`
                            : "Export all filtered leads"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Format */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Format
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {formats.map((f) => {
                                const FormatIcon = f.icon;
                                return (
                                    <button
                                        key={f.value}
                                        onClick={() => setFormat(f.value)}
                                        className={cn(
                                            "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center",
                                            format === f.value
                                                ? "border-[#8e78fb] bg-purple-50"
                                                : "border-muted hover:border-muted-foreground/30",
                                        )}
                                    >
                                        <FormatIcon
                                            className={cn(
                                                "h-5 w-5",
                                                format === f.value
                                                    ? "text-[#8e78fb]"
                                                    : "text-muted-foreground",
                                            )}
                                        />
                                        <span className="text-xs font-medium">
                                            {f.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Date Range
                        </label>
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">
                                    Last 30 days
                                </SelectItem>
                                <SelectItem value="90d">
                                    Last 90 days
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fields */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Fields to Include
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {fields.map((f) => (
                                <label
                                    key={f.key}
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                                >
                                    <Checkbox
                                        checked={checkedFields[f.key]}
                                        onCheckedChange={(
                                            checked: boolean | "indeterminate",
                                        ) =>
                                            setCheckedFields((prev) => ({
                                                ...prev,
                                                [f.key]: !!checked,
                                            }))
                                        }
                                    />
                                    <span className="text-sm">{f.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-[#8e78fb] hover:bg-[#7c68e8]"
                        onClick={() => onOpenChange(false)}
                    >
                        <Download className="h-4 w-4 mr-1.5" />
                        Export {format.toUpperCase()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center mb-5">
                <Inbox className="h-10 w-10 text-[#8e78fb]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
                When visitors submit forms on your landing page, their
                information will appear here. Start collecting leads to grow
                your audience.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full">
                {[
                    {
                        icon: Lightbulb,
                        tip: "Add a compelling CTA above the fold",
                    },
                    {
                        icon: Sparkles,
                        tip: "Offer a lead magnet like a free guide",
                    },
                    { icon: Target, tip: "Use social proof to build trust" },
                ].map((item, i) => {
                    const TipIcon = item.icon;
                    return (
                        <div
                            key={i}
                            className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-left"
                        >
                            <TipIcon className="h-4 w-4 text-[#8e78fb] mt-0.5 shrink-0" />
                            <span className="text-xs text-muted-foreground">
                                {item.tip}
                            </span>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function LandingPageLeadsPage() {
    const params = useParams() as { id: string };
    const router = useRouter();
    const pageId = params.id as string;

    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [scoreFilter, setScoreFilter] = useState<
        "all" | "hot" | "warm" | "cold"
    >("all");
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [detailLead, setDetailLead] = useState<any>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoadingLeads, setIsLoadingLeads] = useState(true);
    const [totalLeads, setTotalLeads] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLeads = useCallback(async () => {
        setIsLoadingLeads(true);
        try {
            const res = (await landingPagesApi.getLeads(params.id, {
                page: currentPage,
                limit: 20,
                score: scoreFilter !== "all" ? scoreFilter : undefined,
                search: searchQuery || undefined,
            })) as any;
            setLeads(res.data ?? []);
            setTotalLeads(res.pagination?.total ?? 0);
            setTotalPages(res.pagination?.totalPages ?? 1);
        } catch (err) {
            console.error("Failed to load leads", err);
            setLeads([]);
        } finally {
            setIsLoadingLeads(false);
        }
    }, [params.id, currentPage, scoreFilter, searchQuery]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleExport = async () => {
        try {
            const blob = await landingPagesApi.exportLeads(params.id, "csv");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `leads-${params.id}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed", err);
        }
    };

    const handleDeleteLead = async (leadId: string) => {
        try {
            await landingPagesApi.deleteLead(params.id, leadId);
            setLeads((prev) =>
                prev.filter(
                    (l) => l.id !== leadId && (l as any)._id !== leadId,
                ),
            );
        } catch (err) {
            console.error("Failed to delete lead", err);
        }
    };

    // Filtering
    const filteredLeads = useMemo(() => {
        let result = [...leads];

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (l) =>
                    l.name.toLowerCase().includes(q) ||
                    l.email.toLowerCase().includes(q),
            );
        }

        // Score filter
        if (scoreFilter !== "all") {
            result = result.filter(
                (l) => getScoreCategory(l.score) === scoreFilter,
            );
        }

        // Source filter
        if (sourceFilter !== "all") {
            result = result.filter((l) => l.source === sourceFilter);
        }

        // Date filter
        if (dateFilter !== "all") {
            const now = new Date();
            const days =
                dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90;
            const cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() - days);
            result = result.filter((l) => new Date(l.createdAt) >= cutoff);
        }

        // Sorting
        result.sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case "name":
                    cmp = a.name.localeCompare(b.name);
                    break;
                case "email":
                    cmp = a.email.localeCompare(b.email);
                    break;
                case "score":
                    cmp = a.score - b.score;
                    break;
                case "source":
                    cmp = a.source.localeCompare(b.source);
                    break;
                case "createdAt":
                    cmp =
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime();
                    break;
            }
            return sortDirection === "asc" ? cmp : -cmp;
        });

        return result;
    }, [
        leads,
        searchQuery,
        scoreFilter,
        sourceFilter,
        dateFilter,
        sortField,
        sortDirection,
    ]);

    // Pagination (server-side; totalPages/totalLeads set by fetchLeads)
    const paginatedLeads = filteredLeads;

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, scoreFilter, sourceFilter, dateFilter, pageSize]);

    // Sort handler
    const handleSort = useCallback((field: SortField) => {
        setSortField((prev) => {
            if (prev === field) {
                setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
                return field;
            }
            setSortDirection("asc");
            return field;
        });
    }, []);

    // Selection handlers
    const allOnPageSelected =
        paginatedLeads.length > 0 &&
        paginatedLeads.every((l) => selectedIds.has(l.id));
    const someOnPageSelected = paginatedLeads.some((l) =>
        selectedIds.has(l.id),
    );

    const toggleAll = useCallback(() => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allOnPageSelected) {
                paginatedLeads.forEach((l) => next.delete(l.id));
            } else {
                paginatedLeads.forEach((l) => next.add(l.id));
            }
            return next;
        });
    }, [allOnPageSelected, paginatedLeads]);

    const toggleOne = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // Stats
    const thisWeekLeads = leads.filter((l) => {
        const d = new Date(l.createdAt);
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
    }).length;

    const avgScore =
        leads.length > 0
            ? Math.round(
                  leads.reduce((s: number, l: any) => s + (l.score ?? 0), 0) /
                      leads.length,
              )
            : 0;
    const conversionRate = 14; // mock

    return (
        <TooltipProvider>
            <PageShell>
                {/* Header */}
                <PageHeader
                    title="Leads"
                    breadcrumbs={[
                        { label: "Dashboard", href: "/creator/dashboard" },
                        {
                            label: "Community Home",
                            href: "/creator/landing-pages",
                        },
                        { label: "Leads" },
                    ]}
                    actions={[
                        {
                            label: "Export All",
                            icon: Download,
                            variant: "outline" as const,
                            onClick: handleExport,
                        },
                        {
                            label: "View Analytics",
                            href: `/creator/landing-pages/${params.id}/analytics`,
                            variant: "outline" as const,
                            icon: BarChart3,
                        },
                        {
                            label: "Edit Page",
                            href: `/creator/landing-pages/${params.id}/edit`,
                            icon: Pencil,
                        },
                    ]}
                />

                {/* Stats Row */}
                <StatsGrid columns={4}>
                    <StatCard
                        title="Total Leads"
                        value={totalLeads}
                        icon={Users}
                        color="purple"
                        delay={0}
                    />
                    <StatCard
                        title="This Week"
                        value={thisWeekLeads}
                        icon={TrendingUp}
                        color="blue"
                        delay={0.1}
                    />
                    <StatCard
                        title="Avg Score"
                        value={avgScore}
                        icon={Target}
                        color="green"
                        delay={0.2}
                    />
                    <StatCard
                        title="Conversion Rate"
                        value={conversionRate}
                        icon={Flame}
                        color="orange"
                        delay={0.3}
                    />
                </StatsGrid>

                {/* Filters Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 min-w-[220px] max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or email..."
                                        className="pl-9 h-9"
                                    />
                                </div>

                                <Select
                                    value={dateFilter}
                                    onValueChange={setDateFilter}
                                >
                                    <SelectTrigger className="w-[140px] h-9">
                                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                        <SelectValue placeholder="Date range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Time
                                        </SelectItem>
                                        <SelectItem value="7d">
                                            Last 7 days
                                        </SelectItem>
                                        <SelectItem value="30d">
                                            Last 30 days
                                        </SelectItem>
                                        <SelectItem value="90d">
                                            Last 90 days
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={scoreFilter}
                                    onValueChange={(v: any) =>
                                        setScoreFilter(v)
                                    }
                                >
                                    <SelectTrigger className="w-[120px] h-9">
                                        <SelectValue placeholder="Score" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Scores
                                        </SelectItem>
                                        <SelectItem value="hot">
                                            <span className="flex items-center gap-1.5">
                                                <Flame className="h-3.5 w-3.5 text-red-500" />{" "}
                                                Hot
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="warm">
                                            <span className="flex items-center gap-1.5">
                                                <Thermometer className="h-3.5 w-3.5 text-orange-500" />{" "}
                                                Warm
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="cold">
                                            <span className="flex items-center gap-1.5">
                                                <Snowflake className="h-3.5 w-3.5 text-blue-500" />{" "}
                                                Cold
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={sourceFilter}
                                    onValueChange={setSourceFilter}
                                >
                                    <SelectTrigger className="w-[130px] h-9">
                                        <SelectValue placeholder="Source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Sources
                                        </SelectItem>
                                        {LEAD_SOURCES.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(searchQuery ||
                                    scoreFilter !== "all" ||
                                    sourceFilter !== "all" ||
                                    dateFilter !== "all") && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground h-9"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setScoreFilter("all");
                                            setSourceFilter("all");
                                            setDateFilter("all");
                                        }}
                                    >
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Bulk Actions Bar */}
                <AnimatePresence>
                    {selectedIds.size > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="border-[#8e78fb]/30 bg-purple-50/50 shadow-sm">
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-[#8e78fb] text-white border-0 text-xs">
                                                {selectedIds.size} selected
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                lead
                                                {selectedIds.size !== 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() =>
                                                    setShowExportDialog(true)
                                                }
                                            >
                                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                                Export Selected
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                            >
                                                <Mail className="h-3.5 w-3.5 mr-1.5" />
                                                Send Email
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                                Delete
                                            </Button>
                                            <Separator
                                                orientation="vertical"
                                                className="h-5"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() =>
                                                    setSelectedIds(new Set())
                                                }
                                            >
                                                Clear selection
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Leads Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                >
                    <Card className="border-0 shadow-sm overflow-hidden">
                        {filteredLeads.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                <TableHead className="w-[40px]">
                                                    <Checkbox
                                                        checked={
                                                            allOnPageSelected
                                                        }
                                                        onCheckedChange={
                                                            toggleAll
                                                        }
                                                        aria-label="Select all"
                                                    />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader
                                                        label="Name"
                                                        field="name"
                                                        currentSort={sortField}
                                                        currentDirection={
                                                            sortDirection
                                                        }
                                                        onSort={handleSort}
                                                    />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader
                                                        label="Email"
                                                        field="email"
                                                        currentSort={sortField}
                                                        currentDirection={
                                                            sortDirection
                                                        }
                                                        onSort={handleSort}
                                                    />
                                                </TableHead>
                                                <TableHead className="hidden md:table-cell">
                                                    Phone
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader
                                                        label="Score"
                                                        field="score"
                                                        currentSort={sortField}
                                                        currentDirection={
                                                            sortDirection
                                                        }
                                                        onSort={handleSort}
                                                    />
                                                </TableHead>
                                                <TableHead className="hidden sm:table-cell">
                                                    <SortableHeader
                                                        label="Source"
                                                        field="source"
                                                        currentSort={sortField}
                                                        currentDirection={
                                                            sortDirection
                                                        }
                                                        onSort={handleSort}
                                                    />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader
                                                        label="Date"
                                                        field="createdAt"
                                                        currentSort={sortField}
                                                        currentDirection={
                                                            sortDirection
                                                        }
                                                        onSort={handleSort}
                                                    />
                                                </TableHead>
                                                <TableHead className="w-[50px]" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedLeads.map((lead, i) => {
                                                const scoreBadge =
                                                    getScoreBadge(lead.score);
                                                const ScoreIcon =
                                                    scoreBadge.icon;
                                                const isSelected =
                                                    selectedIds.has(lead.id);

                                                return (
                                                    <motion.tr
                                                        key={lead.id}
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
                                                            delay: i * 0.03,
                                                        }}
                                                        className={cn(
                                                            "border-b transition-colors hover:bg-muted/50 group cursor-pointer",
                                                            isSelected &&
                                                                "bg-purple-50/50",
                                                        )}
                                                        onClick={() => {
                                                            setDetailLead(lead);
                                                            setShowDetailDialog(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <TableCell
                                                            onClick={(
                                                                e: React.MouseEvent,
                                                            ) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <Checkbox
                                                                checked={
                                                                    isSelected
                                                                }
                                                                onCheckedChange={() =>
                                                                    toggleOne(
                                                                        lead.id,
                                                                    )
                                                                }
                                                                aria-label={`Select ${lead.name}`}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-[#8e78fb] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                                                    {lead.name
                                                                        .split(
                                                                            " ",
                                                                        )
                                                                        .map(
                                                                            (
                                                                                n: string,
                                                                            ) =>
                                                                                n[0],
                                                                        )
                                                                        .join(
                                                                            "",
                                                                        )
                                                                        .slice(
                                                                            0,
                                                                            2,
                                                                        )}
                                                                </div>
                                                                <span className="font-medium text-sm">
                                                                    {lead.name}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm text-muted-foreground">
                                                                {lead.email}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            <span className="text-sm text-muted-foreground">
                                                                {lead.phone}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-xs font-medium gap-1",
                                                                    scoreBadge.className,
                                                                )}
                                                            >
                                                                <ScoreIcon className="h-3 w-3" />
                                                                {lead.score}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell">
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs font-normal"
                                                            >
                                                                {lead.source}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm text-muted-foreground">
                                                                {formatDate(
                                                                    lead.createdAt,
                                                                )}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell
                                                            onClick={(
                                                                e: React.MouseEvent,
                                                            ) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent
                                                                    align="end"
                                                                    className="w-44"
                                                                >
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setDetailLead(
                                                                                lead,
                                                                            );
                                                                            setShowDetailDialog(
                                                                                true,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5 mr-2" />
                                                                        View
                                                                        Details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem>
                                                                        <Mail className="h-3.5 w-3.5 mr-2" />
                                                                        Send
                                                                        Email
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setShowExportDialog(
                                                                                true,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Download className="h-3.5 w-3.5 mr-2" />
                                                                        Export
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 focus:text-red-600"
                                                                        onClick={() =>
                                                                            handleDeleteLead(
                                                                                lead.id ||
                                                                                    (
                                                                                        lead as any
                                                                                    )
                                                                                        ._id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </motion.tr>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="border-t px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span>
                                            Showing{" "}
                                            {(currentPage - 1) * pageSize + 1}–
                                            {Math.min(
                                                currentPage * pageSize,
                                                filteredLeads.length,
                                            )}{" "}
                                            of {totalLeads}
                                        </span>
                                        <Separator
                                            orientation="vertical"
                                            className="h-4"
                                        />
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs">
                                                Rows:
                                            </span>
                                            <Select
                                                value={String(pageSize)}
                                                onValueChange={(v: string) =>
                                                    setPageSize(Number(v))
                                                }
                                            >
                                                <SelectTrigger className="w-[65px] h-7 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">
                                                        10
                                                    </SelectItem>
                                                    <SelectItem value="25">
                                                        25
                                                    </SelectItem>
                                                    <SelectItem value="50">
                                                        50
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={currentPage <= 1}
                                            onClick={() => setCurrentPage(1)}
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={currentPage <= 1}
                                            onClick={() =>
                                                setCurrentPage((p) => p - 1)
                                            }
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        {Array.from(
                                            { length: Math.min(totalPages, 5) },
                                            (_, i) => {
                                                let page: number;
                                                if (totalPages <= 5) {
                                                    page = i + 1;
                                                } else if (currentPage <= 3) {
                                                    page = i + 1;
                                                } else if (
                                                    currentPage >=
                                                    totalPages - 2
                                                ) {
                                                    page = totalPages - 4 + i;
                                                } else {
                                                    page = currentPage - 2 + i;
                                                }
                                                return (
                                                    <Button
                                                        key={page}
                                                        variant={
                                                            currentPage === page
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        size="icon"
                                                        className={cn(
                                                            "h-8 w-8 text-xs",
                                                            currentPage ===
                                                                page &&
                                                                "bg-[#8e78fb] hover:bg-[#7c68e8]",
                                                        )}
                                                        onClick={() =>
                                                            setCurrentPage(page)
                                                        }
                                                    >
                                                        {page}
                                                    </Button>
                                                );
                                            },
                                        )}
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={currentPage >= totalPages}
                                            onClick={() =>
                                                setCurrentPage((p) => p + 1)
                                            }
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={currentPage >= totalPages}
                                            onClick={() =>
                                                setCurrentPage(totalPages)
                                            }
                                        >
                                            <ChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>
                </motion.div>

                {/* Dialogs */}
                <LeadDetailDialog
                    lead={detailLead}
                    open={showDetailDialog}
                    onOpenChange={setShowDetailDialog}
                />
                <ExportDialog
                    open={showExportDialog}
                    onOpenChange={setShowExportDialog}
                    selectedCount={selectedIds.size}
                />
            </PageShell>
        </TooltipProvider>
    );
}
