"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Activity,
    AlertCircle,
    BarChart3,
    Check,
    ChevronRight,
    Clock,
    Copy,
    GitBranch,
    Layers,
    Loader2,
    Mail,
    MessageSquare,
    Pause,
    Play,
    Plus,
    Settings2,
    Tag,
    Trash2,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/creator-dashboard";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { useCommunityGuard } from "@/hooks/use-community-guard";
import {
    automationWorkflowsApi,
    AutomationWorkflow,
    WorkflowStats,
    WorkflowTrigger,
    WorkflowActionType,
    WorkflowStep,
    CreateWorkflowDto,
} from "@/lib/api/automation-workflows.api";
import { cn } from "@/lib/utils";
import { WorkflowBuilder } from "../workflows/components/workflow-builder";
import { WorkflowStatsDialog } from "../workflows/components/workflow-stats-dialog";
import { WorkflowEnrollmentsDialog } from "../workflows/components/workflow-enrollments-dialog";
import { AutomationsTab } from "../components/automations-tab";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<WorkflowTrigger, string> = {
    MEMBER_JOINED: "Member Joined",
    PURCHASE_COMPLETED: "Purchase Completed",
    COURSE_COMPLETED: "Course Completed",
    COURSE_STARTED: "Course Started",
    CHALLENGE_JOINED: "Challenge Joined",
    INACTIVITY: "Inactivity",
    TAG_ADDED: "Tag Added",
    CUSTOM_EVENT: "Custom Event",
};

const TRIGGER_ICONS: Record<WorkflowTrigger, React.ElementType> = {
    MEMBER_JOINED: Users,
    PURCHASE_COMPLETED: TrendingUp,
    COURSE_COMPLETED: Check,
    COURSE_STARTED: Play,
    CHALLENGE_JOINED: Zap,
    INACTIVITY: Clock,
    TAG_ADDED: Tag,
    CUSTOM_EVENT: Settings2,
};

const TRIGGER_COLORS: Record<WorkflowTrigger, string> = {
    MEMBER_JOINED: "bg-blue-50 text-blue-600",
    PURCHASE_COMPLETED: "bg-green-50 text-green-600",
    COURSE_COMPLETED: "bg-purple-50 text-purple-600",
    COURSE_STARTED: "bg-indigo-50 text-indigo-600",
    CHALLENGE_JOINED: "bg-orange-50 text-orange-600",
    INACTIVITY: "bg-red-50 text-red-600",
    TAG_ADDED: "bg-yellow-50 text-yellow-600",
    CUSTOM_EVENT: "bg-gray-50 text-gray-600",
};

function WorkflowCard({
    workflow,
    onToggle,
    onPause,
    onResume,
    onDelete,
    onEdit,
    onStats,
    onEnrollments,
    loading,
}: {
    workflow: AutomationWorkflow;
    onToggle: (id: string, active: boolean) => void;
    onPause: (id: string) => void;
    onResume: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (w: AutomationWorkflow) => void;
    onStats: (w: AutomationWorkflow) => void;
    onEnrollments: (w: AutomationWorkflow) => void;
    loading: boolean;
}) {
    const TriggerIcon = TRIGGER_ICONS[workflow.trigger] ?? Zap;
    const triggerColorClass =
        TRIGGER_COLORS[workflow.trigger] ?? "bg-gray-50 text-gray-600";

    const completionRate =
        workflow.enrolledCount > 0
            ? Math.round(
                  (workflow.completedCount / workflow.enrolledCount) * 100,
              )
            : 0;

    const statusLabel = !workflow.isActive
        ? "Inactive"
        : workflow.isPaused
          ? "Paused"
          : "Active";

    const statusColor = !workflow.isActive
        ? "bg-gray-100 text-gray-500"
        : workflow.isPaused
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700";

    return (
        <Card className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                            className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                triggerColorClass,
                            )}
                        >
                            <TriggerIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-sm truncate max-w-[180px]">
                                    {workflow.name}
                                </CardTitle>
                                <Badge
                                    className={cn("text-xs px-1.5 py-0", statusColor)}
                                    variant="secondary"
                                >
                                    {statusLabel}
                                </Badge>
                            </div>
                            <CardDescription className="text-xs mt-0.5">
                                {TRIGGER_LABELS[workflow.trigger] ??
                                    workflow.trigger}
                                {workflow.triggerConfig?.minInactiveDays && (
                                    <span className="ml-1 text-orange-500">
                                        · {workflow.triggerConfig.minInactiveDays}d
                                        inactive
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                    <Switch
                        checked={workflow.isActive}
                        onCheckedChange={(v) => onToggle(workflow._id, v)}
                        disabled={loading}
                        aria-label="Toggle workflow"
                        className="flex-shrink-0 mt-0.5"
                    />
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {workflow.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                        {workflow.description}
                    </p>
                )}

                {/* Step count & stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {workflow.steps.length} steps
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {workflow.enrolledCount} enrolled
                    </span>
                    {workflow.enrolledCount > 0 && (
                        <span className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            {completionRate}% done
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => onEdit(workflow)}
                        disabled={loading}
                    >
                        <Settings2 className="w-3 h-3 mr-1" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => onStats(workflow)}
                        disabled={loading}
                    >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Stats
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => onEnrollments(workflow)}
                        disabled={loading}
                    >
                        <Users className="w-3 h-3 mr-1" />
                        Members
                    </Button>
                    {workflow.isActive && !workflow.isPaused && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 text-yellow-600 hover:text-yellow-700"
                            onClick={() => onPause(workflow._id)}
                            disabled={loading}
                        >
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                        </Button>
                    )}
                    {workflow.isPaused && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 text-green-600 hover:text-green-700"
                            onClick={() => onResume(workflow._id)}
                            disabled={loading}
                        >
                            <Play className="w-3 h-3 mr-1" />
                            Resume
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2 text-red-500 hover:text-red-600 ml-auto"
                        onClick={() => onDelete(workflow._id)}
                        disabled={loading}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Template picker ───────────────────────────────────────────────────────────

function TemplatesPicker({
    communityId,
    onCreated,
    onClose,
}: {
    communityId: string;
    onCreated: () => void;
    onClose: () => void;
}) {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<
        Omit<CreateWorkflowDto, "communityId">[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [cloning, setCloning] = useState<string | null>(null);

    useEffect(() => {
        automationWorkflowsApi
            .getTemplates()
            .then(setTemplates)
            .catch(() => setTemplates([]))
            .finally(() => setLoading(false));
    }, []);

    const clone = async (tmpl: Omit<CreateWorkflowDto, "communityId">) => {
        setCloning(tmpl.name);
        try {
            await automationWorkflowsApi.createWorkflow({
                ...tmpl,
                communityId,
            });
            toast({
                title: "Workflow created",
                description: `"${tmpl.name}" was added. Toggle it on when ready.`,
            });
            onCreated();
            onClose();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message ?? "Failed to create workflow",
                variant: "destructive",
            });
        } finally {
            setCloning(null);
        }
    };

    const TriggerIcon = (trigger: WorkflowTrigger) =>
        TRIGGER_ICONS[trigger] ?? Zap;

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {templates.map((tmpl) => {
                const Icon = TriggerIcon(tmpl.trigger as WorkflowTrigger);
                const colorClass =
                    TRIGGER_COLORS[tmpl.trigger as WorkflowTrigger] ??
                    "bg-gray-50 text-gray-600";
                return (
                    <div
                        key={tmpl.name}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:border-chabaqa-primary/50 hover:bg-chabaqa-primary/5 transition-colors cursor-pointer group"
                        onClick={() => clone(tmpl)}
                    >
                        <div
                            className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                colorClass,
                            )}
                        >
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{tmpl.name}</p>
                            {tmpl.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {tmpl.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs py-0">
                                    {TRIGGER_LABELS[
                                        tmpl.trigger as WorkflowTrigger
                                    ] ?? tmpl.trigger}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                    {tmpl.steps.length} steps
                                </span>
                            </div>
                        </div>
                        <div className="flex-shrink-0 mt-1">
                            {cloning === tmpl.name ? (
                                <Loader2 className="w-4 h-4 animate-spin text-chabaqa-primary" />
                            ) : (
                                <Copy className="w-4 h-4 text-gray-300 group-hover:text-chabaqa-primary transition-colors" />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyWorkflows({ onNew }: { onNew: () => void }) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <div className="w-14 h-14 rounded-full bg-chabaqa-primary/10 flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-7 h-7 text-chabaqa-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
                No workflows yet
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Create a multi-step automation to send emails, add tags, and
                react to member actions automatically.
            </p>
            <Button onClick={onNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first workflow
            </Button>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
    const { guard, selectedCommunityId, selectedCommunity } =
        useCommunityGuard();
    const { toast } = useToast();

    const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Dialogs
    const [showTemplates, setShowTemplates] = useState(false);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editWorkflow, setEditWorkflow] = useState<AutomationWorkflow | null>(
        null,
    );
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [statsWorkflow, setStatsWorkflow] =
        useState<AutomationWorkflow | null>(null);
    const [enrollmentsWorkflow, setEnrollmentsWorkflow] =
        useState<AutomationWorkflow | null>(null);

    const load = useCallback(async () => {
        if (!selectedCommunityId) return;
        setLoading(true);
        setError(null);
        try {
            const data =
                await automationWorkflowsApi.getWorkflows(selectedCommunityId);
            setWorkflows(data);
        } catch (err: any) {
            setError(err?.message ?? "Failed to load workflows");
        } finally {
            setLoading(false);
        }
    }, [selectedCommunityId]);

    useEffect(() => {
        load();
    }, [load]);

    const runAction = async (id: string, fn: () => Promise<any>) => {
        setActionLoadingId(id);
        try {
            await fn();
            await load();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message ?? "Action failed",
                variant: "destructive",
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleToggle = (id: string, active: boolean) =>
        runAction(id, () => automationWorkflowsApi.toggleWorkflow(id, active));

    const handlePause = (id: string) =>
        runAction(id, () => automationWorkflowsApi.pauseWorkflow(id));

    const handleResume = (id: string) =>
        runAction(id, () => automationWorkflowsApi.resumeWorkflow(id));

    const handleDelete = async () => {
        if (!deleteId) return;
        runAction(deleteId, async () => {
            await automationWorkflowsApi.deleteWorkflow(deleteId);
            toast({ title: "Workflow deleted" });
            setDeleteId(null);
        });
    };

    if (!selectedCommunity) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Please select a community to manage workflows.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (guard) return guard;

    const activeCount = workflows.filter(
        (w) => w.isActive && !w.isPaused,
    ).length;
    const totalEnrolled = workflows.reduce(
        (sum, w) => sum + w.enrolledCount,
        0,
    );
    const totalCompleted = workflows.reduce(
        (sum, w) => sum + w.completedCount,
        0,
    );

    return (
        <PageShell className="container mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <GitBranch className="w-6 h-6 text-chabaqa-primary" />
                        Automations
                    </h1>
                    <p className="text-gray-500 mt-0.5">
                        Automated workflows for{" "}
                        <strong>{selectedCommunity.name}</strong>
                    </p>
                </div>
            </div>

            {/* Built-in Triggers */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-gray-700">Built-in Triggers</h2>
                <AutomationsTab />
            </section>

            {/* Workflow builder section header */}
            <div className="flex items-center gap-2 border-t pt-4">
                <h2 className="text-base font-semibold text-gray-700 flex-1">Behavioral Workflows</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                >
                    <Copy className="w-4 h-4 mr-2" />
                    From Template
                </Button>
                <Button size="sm" onClick={() => setShowBuilder(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Workflow
                </Button>
            </div>

            {/* Stats summary */}
            {workflows.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {activeCount}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Active workflows
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {totalEnrolled}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Members enrolled
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {totalCompleted}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Completions
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Error */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Workflow list */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-52 animate-pulse rounded-xl bg-muted"
                        />
                    ))}
                </div>
            ) : workflows.length === 0 ? (
                <EmptyWorkflows onNew={() => setShowBuilder(true)} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workflows.map((w) => (
                        <WorkflowCard
                            key={w._id}
                            workflow={w}
                            onToggle={handleToggle}
                            onPause={handlePause}
                            onResume={handleResume}
                            onDelete={(id) => setDeleteId(id)}
                            onEdit={setEditWorkflow}
                            onStats={setStatsWorkflow}
                            onEnrollments={setEnrollmentsWorkflow}
                            loading={actionLoadingId === w._id}
                        />
                    ))}
                </div>
            )}

            {/* ── Templates dialog ─────────────────────────── */}
            <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Choose a Template</DialogTitle>
                        <DialogDescription>
                            Select a pre-built workflow to clone into your
                            community. You can customize it after creation.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCommunityId && (
                        <TemplatesPicker
                            communityId={selectedCommunityId}
                            onCreated={load}
                            onClose={() => setShowTemplates(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Create workflow builder ──────────────────── */}
            {selectedCommunityId && (
                <WorkflowBuilder
                    open={showBuilder}
                    onOpenChange={setShowBuilder}
                    communityId={selectedCommunityId}
                    onSuccess={() => {
                        load();
                        setShowBuilder(false);
                    }}
                />
            )}

            {/* ── Edit workflow builder ────────────────────── */}
            {selectedCommunityId && editWorkflow && (
                <WorkflowBuilder
                    open={!!editWorkflow}
                    onOpenChange={(open) => !open && setEditWorkflow(null)}
                    communityId={selectedCommunityId}
                    initialWorkflow={editWorkflow}
                    onSuccess={() => {
                        load();
                        setEditWorkflow(null);
                    }}
                />
            )}

            {/* ── Delete confirm ──────────────────────────── */}
            <AlertDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the workflow and cancel
                            all active member enrollments. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={!!actionLoadingId}
                        >
                            {actionLoadingId && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Stats dialog ────────────────────────────── */}
            {statsWorkflow && (
                <WorkflowStatsDialog
                    workflow={statsWorkflow}
                    open={!!statsWorkflow}
                    onOpenChange={(open) => !open && setStatsWorkflow(null)}
                />
            )}

            {/* ── Enrollments dialog ──────────────────────── */}
            {enrollmentsWorkflow && (
                <WorkflowEnrollmentsDialog
                    workflow={enrollmentsWorkflow}
                    open={!!enrollmentsWorkflow}
                    onOpenChange={(open) =>
                        !open && setEnrollmentsWorkflow(null)
                    }
                />
            )}
        </PageShell>
    );
}
