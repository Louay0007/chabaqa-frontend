"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Receipt,
    Download,
    Loader2,
    FileText,
    Calendar,
    ExternalLink,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
    subscriptionApi,
    Invoice,
    InvoiceStatus,
} from "@/lib/api/subscription.api";
import { INVOICE_STATUS_MAP } from "@/lib/plans/plan-config";

const STATUS_OPTIONS = [
    { value: "all", label: "All" },
    { value: "paid", label: "Paid" },
    { value: "open", label: "Open" },
    { value: "draft", label: "Draft" },
    { value: "void", label: "Void" },
    { value: "uncollectible", label: "Uncollectible" },
];

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Totals from server
    const [totalPaid, setTotalPaid] = useState(0);
    const [totalOpen, setTotalOpen] = useState(0);
    const [totalsCurrency, setTotalsCurrency] = useState("TND");

    // Upcoming invoice
    const [upcomingInvoice, setUpcomingInvoice] = useState<{
        amount: number;
        currency: string;
        dueDate: string;
        planName: string;
    } | null>(null);
    const [upcomingLoading, setUpcomingLoading] = useState(true);

    // CSV export
    const [exporting, setExporting] = useState(false);

    // Invoice detail dialog
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(
        null,
    );
    const [detailLoading, setDetailLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // ---- Data fetching ----

    const loadInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page, limit: 20 };
            if (statusFilter !== "all") {
                params.status = statusFilter;
            }
            if (startDate) {
                params.startDate = startDate;
            }
            if (endDate) {
                params.endDate = endDate;
            }

            const res = (await subscriptionApi.getInvoices(
                params as any,
            )) as any;
            // Backend may return { data, pagination } (PaginatedResponse) or { invoices, total }
            const list: Invoice[] = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.invoices)
                  ? res.invoices
                  : [];
            setInvoices(list);

            const total = res?.pagination?.total ?? res?.total ?? 0;
            const pages = res?.pagination?.totalPages ?? Math.ceil(total / 20);
            setTotalPages(pages || 1);
        } catch {
            toast({
                title: "Error",
                description: "Failed to load invoices.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, startDate, endDate]);

    const loadTotals = useCallback(async () => {
        try {
            const res = await subscriptionApi.getInvoiceTotals();
            const data = res?.data;
            if (data) {
                setTotalPaid(data.totalPaid ?? 0);
                setTotalOpen(data.totalOpen ?? 0);
                setTotalsCurrency(data.currency ?? "TND");
            }
        } catch {
            // Fall back to client-side sum — computed in render
        }
    }, []);

    const loadUpcoming = useCallback(async () => {
        setUpcomingLoading(true);
        try {
            const res = await subscriptionApi.getUpcomingInvoice();
            setUpcomingInvoice(res?.data ?? null);
        } catch {
            setUpcomingInvoice(null);
        } finally {
            setUpcomingLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInvoices();
    }, [loadInvoices]);

    useEffect(() => {
        loadTotals();
        loadUpcoming();
    }, [loadTotals, loadUpcoming]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [statusFilter, startDate, endDate]);

    // Client-side fallback for totals (used only when server totals are 0 and invoices exist)
    const clientTotalPaid =
        totalPaid === 0 && invoices.length > 0
            ? invoices
                  .filter((inv) => inv.status === InvoiceStatus.PAID)
                  .reduce((sum, inv) => sum + inv.total, 0)
            : totalPaid;

    const clientTotalOpen =
        totalOpen === 0 && invoices.length > 0
            ? invoices
                  .filter((inv) => inv.status === InvoiceStatus.OPEN)
                  .reduce((sum, inv) => sum + inv.total, 0)
            : totalOpen;

    // ---- Actions ----

    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const res = await subscriptionApi.exportSubscriptions();
            const url = res?.data?.downloadUrl;
            if (url) {
                window.open(url, "_blank");
            } else {
                toast({
                    title: "Export ready",
                    description: res?.data?.message ?? "Export completed.",
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to export invoices.",
                variant: "destructive",
            });
        } finally {
            setExporting(false);
        }
    };

    const handleRowClick = async (inv: Invoice) => {
        setDialogOpen(true);
        setDetailLoading(true);
        setSelectedInvoice(inv); // Show basic info immediately
        try {
            const res = await subscriptionApi.getInvoiceById(inv.id);
            if (res?.data) {
                setSelectedInvoice(res.data);
            }
        } catch {
            // Keep the basic invoice data we already have
        } finally {
            setDetailLoading(false);
        }
    };

    // ---- Render ----

    if (loading && invoices.length === 0) {
        return (
            <div className="space-y-6">
                <div className="h-28 animate-pulse rounded-lg bg-muted" />
                <div className="h-28 animate-pulse rounded-lg bg-muted" />
                <div className="h-64 animate-pulse rounded-lg bg-muted" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Total Paid */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Receipt className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Paid
                                </p>
                                <p className="text-2xl font-bold">
                                    {clientTotalPaid.toFixed(2)}{" "}
                                    {totalsCurrency}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Outstanding */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                                <FileText className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Outstanding
                                </p>
                                <p className="text-2xl font-bold">
                                    {clientTotalOpen.toFixed(2)}{" "}
                                    {totalsCurrency}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Invoice */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                <Calendar className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Next Invoice
                                </p>
                                {upcomingLoading ? (
                                    <div className="h-6 w-24 animate-pulse rounded bg-muted mt-1" />
                                ) : upcomingInvoice ? (
                                    <>
                                        <p className="text-2xl font-bold">
                                            {upcomingInvoice.amount.toFixed(2)}{" "}
                                            {upcomingInvoice.currency}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {upcomingInvoice.planName} &middot;{" "}
                                            {new Date(
                                                upcomingInvoice.dueDate,
                                            ).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        No upcoming invoice
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base">
                                Billing History
                            </CardTitle>
                            <CardDescription>
                                All invoices for your Chabaqa subscription
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCsv}
                            disabled={exporting}
                        >
                            {exporting ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4 mr-1" />
                            )}
                            Download CSV
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:flex-wrap">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                                Filter by Status
                            </Label>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                                From
                            </Label>
                            <Input
                                type="date"
                                className="w-[160px]"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                                To
                            </Label>
                            <Input
                                type="date"
                                className="w-[160px]"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        {(statusFilter !== "all" || startDate || endDate) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStatusFilter("all");
                                    setStartDate("");
                                    setEndDate("");
                                }}
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="font-medium">No invoices yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {statusFilter !== "all" || startDate || endDate
                                    ? "No invoices match your current filters."
                                    : "Invoices will appear here once your first billing cycle completes."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left py-3 px-4 font-medium">
                                                Invoice
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium">
                                                Date
                                            </th>
                                            <th className="text-right py-3 px-4 font-medium">
                                                Amount
                                            </th>
                                            <th className="text-center py-3 px-4 font-medium">
                                                Status
                                            </th>
                                            <th className="text-right py-3 px-4 font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {invoices.map((inv) => {
                                            const status =
                                                INVOICE_STATUS_MAP[
                                                    inv.status
                                                ] ?? INVOICE_STATUS_MAP.draft;
                                            return (
                                                <tr
                                                    key={inv.id}
                                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                    onClick={() =>
                                                        handleRowClick(inv)
                                                    }
                                                >
                                                    <td className="py-3 px-4 font-medium">
                                                        {inv.invoiceNumber ||
                                                            inv.id.slice(0, 12)}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {new Date(
                                                            inv.invoiceDate,
                                                        ).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            },
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-medium">
                                                        {inv.total.toFixed(2)}{" "}
                                                        {inv.currency}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge
                                                            variant={
                                                                status.variant
                                                            }
                                                        >
                                                            {status.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {inv.invoicePdfUrl && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                                onClick={(
                                                                    e: React.MouseEvent,
                                                                ) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <a
                                                                    href={
                                                                        inv.invoicePdfUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <Download className="h-4 w-4 mr-1" />{" "}
                                                                    PDF
                                                                </a>
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Page {page} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() =>
                                                setPage((p) => p - 1)
                                            }
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= totalPages}
                                            onClick={() =>
                                                setPage((p) => p + 1)
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Invoice Detail Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Invoice{" "}
                            {selectedInvoice?.invoiceNumber ||
                                selectedInvoice?.id.slice(0, 12)}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedInvoice
                                ? `Issued on ${new Date(
                                      selectedInvoice.invoiceDate,
                                  ).toLocaleDateString("en-US", {
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                  })}`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>

                    {detailLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : selectedInvoice ? (
                        <div className="space-y-4">
                            {/* Status & Dates */}
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">
                                        Status:{" "}
                                    </span>
                                    <Badge
                                        variant={
                                            (
                                                INVOICE_STATUS_MAP[
                                                    selectedInvoice.status
                                                ] ?? INVOICE_STATUS_MAP.draft
                                            ).variant
                                        }
                                    >
                                        {
                                            (
                                                INVOICE_STATUS_MAP[
                                                    selectedInvoice.status
                                                ] ?? INVOICE_STATUS_MAP.draft
                                            ).label
                                        }
                                    </Badge>
                                </div>
                                {selectedInvoice.dueDate && (
                                    <div>
                                        <span className="text-muted-foreground">
                                            Due:{" "}
                                        </span>
                                        {new Date(
                                            selectedInvoice.dueDate,
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </div>
                                )}
                                {selectedInvoice.paidAt && (
                                    <div>
                                        <span className="text-muted-foreground">
                                            Paid:{" "}
                                        </span>
                                        {new Date(
                                            selectedInvoice.paidAt,
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Line Items */}
                            {selectedInvoice.lineItems &&
                            selectedInvoice.lineItems.length > 0 ? (
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="text-left py-2 px-3 font-medium">
                                                    Description
                                                </th>
                                                <th className="text-right py-2 px-3 font-medium">
                                                    Qty
                                                </th>
                                                <th className="text-right py-2 px-3 font-medium">
                                                    Amount
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedInvoice.lineItems.map(
                                                (item) => (
                                                    <tr key={item.id}>
                                                        <td className="py-2 px-3">
                                                            {item.description}
                                                        </td>
                                                        <td className="py-2 px-3 text-right">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="py-2 px-3 text-right">
                                                            {item.amount.toFixed(
                                                                2,
                                                            )}{" "}
                                                            {item.currency}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No line items available.
                                </p>
                            )}

                            {/* Totals */}
                            <div className="flex flex-col items-end gap-1 text-sm border-t pt-3">
                                <div className="flex gap-6">
                                    <span className="text-muted-foreground">
                                        Subtotal
                                    </span>
                                    <span className="font-medium">
                                        {selectedInvoice.subtotal.toFixed(2)}{" "}
                                        {selectedInvoice.currency}
                                    </span>
                                </div>
                                {selectedInvoice.tax != null &&
                                    selectedInvoice.tax > 0 && (
                                        <div className="flex gap-6">
                                            <span className="text-muted-foreground">
                                                Tax
                                            </span>
                                            <span className="font-medium">
                                                {selectedInvoice.tax.toFixed(2)}{" "}
                                                {selectedInvoice.currency}
                                            </span>
                                        </div>
                                    )}
                                <div className="flex gap-6">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-bold">
                                        {selectedInvoice.total.toFixed(2)}{" "}
                                        {selectedInvoice.currency}
                                    </span>
                                </div>
                            </div>

                            {/* PDF Link */}
                            {selectedInvoice.invoicePdfUrl && (
                                <div className="pt-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={selectedInvoice.invoicePdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            View PDF
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
