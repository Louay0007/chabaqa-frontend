"use client";

import { useEffect, useState } from "react";
import { BarChart3, Check, Loader2, TrendingUp, Users, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    automationWorkflowsApi,
    AutomationWorkflow,
    WorkflowStats,
} from "@/lib/api/automation-workflows.api";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
    SEND_EMAIL: "Send Email",
    SEND_DM: "Send DM",
    ADD_TAG: "Add Tag",
    REMOVE_TAG: "Remove Tag",
    GRANT_ACCESS: "Grant Access",
    REVOKE_ACCESS: "Revoke Access",
    ADD_TO_SEGMENT: "Add to Segment",
    NOTIFY_CREATOR: "Notify Creator",
};

export function WorkflowStatsDialog({
    workflow,
    open,
    onOpenChange,
}: {
    workflow: AutomationWorkflow;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [stats, setStats] = useState<WorkflowStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setError(null);
        automationWorkflowsApi
            .getWorkflowStats(workflow._id)
            .then(setStats)
            .catch((err) =>
                setError(err?.message ?? "Failed to load stats"),
            )
            .finally(() => setLoading(false));
    }, [workflow._id, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-chabaqa-primary" />
                        Workflow Stats
                    </DialogTitle>
                    <DialogDescription>{workflow.name}</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : error ? (
                    <p className="text-sm text-red-500 py-4 text-center">
                        {error}
                    </p>
                ) : stats ? (
                    <div className="space-y-5">
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border p-3">
                                <p className="text-2xl font-bold">
                                    {stats.enrolledCount}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Total enrolled
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-2xl font-bold text-green-600">
                                    {stats.completedCount}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Completed
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-2xl font-bold text-blue-600">
                                    {stats.activeCount}
                                </p>
                                <p className="text-xs text-gray-500">
                                    In progress
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-2xl font-bold text-orange-500">
                                    {stats.cancelledCount + stats.failedCount}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Cancelled / Failed
                                </p>
                            </div>
                        </div>

                        {/* Completion rate */}
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">
                                    Completion rate
                                </span>
                                <span className="font-bold text-chabaqa-primary">
                                    {stats.completionRate}%
                                </span>
                            </div>
                            <Progress
                                value={stats.completionRate}
                                className="h-2"
                            />
                        </div>

                        {/* Step breakdown */}
                        {stats.stepBreakdown.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold mb-2">
                                    Step execution breakdown
                                </p>
                                <div className="space-y-2">
                                    {stats.stepBreakdown.map((step) => (
                                        <div
                                            key={step.stepId}
                                            className="flex items-center gap-3 text-sm"
                                        >
                                            <span className="text-xs font-mono text-gray-400 w-20 truncate">
                                                {step.stepId}
                                            </span>
                                            {step.actionType && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {ACTION_LABELS[
                                                        step.actionType
                                                    ] ?? step.actionType}
                                                </Badge>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between text-xs mb-0.5">
                                                    <span className="text-gray-500">
                                                        executions
                                                    </span>
                                                    <span className="font-medium">
                                                        {step.executionCount}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        stats.enrolledCount > 0
                                                            ? (step.executionCount /
                                                                  stats.enrolledCount) *
                                                              100
                                                            : 0
                                                    }
                                                    className="h-1.5"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
