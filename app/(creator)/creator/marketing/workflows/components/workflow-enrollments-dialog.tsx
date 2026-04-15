"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Loader2, Users } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    automationWorkflowsApi,
    AutomationWorkflow,
    WorkflowEnrollment,
    EnrollmentStatus,
} from "@/lib/api/automation-workflows.api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_COLORS: Record<EnrollmentStatus, string> = {
    active: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
    failed: "bg-red-100 text-red-700",
};

const PAGE_LIMIT = 15;

export function WorkflowEnrollmentsDialog({
    workflow,
    open,
    onOpenChange,
}: {
    workflow: AutomationWorkflow;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [enrollments, setEnrollments] = useState<WorkflowEnrollment[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        async (p = page, status = statusFilter) => {
            if (!open) return;
            setLoading(true);
            setError(null);
            try {
                const res = await automationWorkflowsApi.listEnrollments(
                    workflow._id,
                    {
                        page: p,
                        limit: PAGE_LIMIT,
                        status: status === "all" ? undefined : status,
                    },
                );
                setEnrollments(res.data);
                setTotal(res.total);
            } catch (err: any) {
                setError(err?.message ?? "Failed to load enrollments");
            } finally {
                setLoading(false);
            }
        },
        [open, workflow._id, page, statusFilter],
    );

    useEffect(() => {
        load(1, statusFilter);
    }, [open, workflow._id]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        load(newPage, statusFilter);
    };

    const handleStatusChange = (status: string) => {
        setStatusFilter(status);
        setPage(1);
        load(1, status);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-chabaqa-primary" />
                        Enrolled Members
                    </DialogTitle>
                    <DialogDescription>
                        {workflow.name} · {total} total enrollments
                    </DialogDescription>
                </DialogHeader>

                {/* Filter */}
                <div className="flex items-center gap-3">
                    <Select
                        value={statusFilter}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-400 ml-auto">
                        Page {page} / {totalPages}
                    </span>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : error ? (
                    <p className="text-sm text-red-500 text-center py-4">
                        {error}
                    </p>
                ) : enrollments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No enrollments found</p>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left p-2 text-xs font-medium text-gray-500">
                                        User ID
                                    </th>
                                    <th className="text-left p-2 text-xs font-medium text-gray-500">
                                        Status
                                    </th>
                                    <th className="text-left p-2 text-xs font-medium text-gray-500">
                                        Current step
                                    </th>
                                    <th className="text-left p-2 text-xs font-medium text-gray-500">
                                        Steps done
                                    </th>
                                    <th className="text-left p-2 text-xs font-medium text-gray-500">
                                        Resume at
                                    </th>
                                    <th className="text-left p-2 text-xs font-medium text-gray-500">
                                        Enrolled
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map((e) => (
                                    <tr
                                        key={e._id}
                                        className="border-t hover:bg-gray-50"
                                    >
                                        <td className="p-2 font-mono text-xs text-gray-400 truncate max-w-[100px]">
                                            {e.userId.slice(-8)}
                                        </td>
                                        <td className="p-2">
                                            <Badge
                                                className={cn(
                                                    "text-xs",
                                                    STATUS_COLORS[e.status],
                                                )}
                                                variant="secondary"
                                            >
                                                {e.status}
                                            </Badge>
                                        </td>
                                        <td className="p-2 font-mono text-xs text-gray-500">
                                            {e.currentStepId}
                                        </td>
                                        <td className="p-2 text-xs">
                                            {e.stepHistory.length}
                                        </td>
                                        <td className="p-2 text-xs text-gray-400">
                                            {e.resumeAt ? (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(
                                                        new Date(e.resumeAt),
                                                        "MMM d, HH:mm",
                                                    )}
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="p-2 text-xs text-gray-400">
                                            {format(
                                                new Date(e.createdAt),
                                                "MMM d",
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-400">{total} total</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => handlePageChange(page - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-xs">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || loading}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
