"use client";

import { PageShell } from "@/components/creator-dashboard";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search,
    Filter,
    Download,
    Plus,
    MoreHorizontal,
    CheckCircle,
    AlertCircle,
    Clock,
    RefreshCw,
    Loader2,
    ExternalLink,
} from "lucide-react";
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WanisAssistButton } from "@/components/wanis-assist-button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import {
    subscriptionApi,
    CreatorSubscription,
    SubscriptionStats,
    SubscriptionStatus,
    PlanTier,
    CreatePlanData,
} from "@/lib/api/subscription.api";
import { format, parseISO } from "date-fns";

const SubscriptionsPage = () => {
    const [subscriptions, setSubscriptions] = useState<CreatorSubscription[]>(
        [],
    );
    const [stats, setStats] = useState<SubscriptionStats | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<SubscriptionStatus | "all">(
        "all",
    );
    const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
    const [newPlan, setNewPlan] = useState<Partial<CreatePlanData>>({
        tier: PlanTier.STARTER,
        name: "",
        description: "",
        priceDTPerMonth: 0,
        trialDays: 7,
    });
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    // View dialog state
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewingSubscription, setViewingSubscription] =
        useState<CreatorSubscription | null>(null);

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] =
        useState<CreatorSubscription | null>(null);
    const [editFormData, setEditFormData] = useState<{
        status: SubscriptionStatus;
        plan: PlanTier;
    }>({ status: SubscriptionStatus.ACTIVE, plan: PlanTier.STARTER });
    const [editSaving, setEditSaving] = useState(false);

    // Cancel confirmation state
    const [cancelAlertOpen, setCancelAlertOpen] = useState(false);
    const [cancellingSubscription, setCancellingSubscription] =
        useState<CreatorSubscription | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    // Export CSV state
    const [exporting, setExporting] = useState(false);

    const loadSubscriptions = useCallback(async () => {
        setLoading(true);
        try {
            const filters: Record<string, unknown> = {
                status: activeTab === "all" ? undefined : activeTab,
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery || undefined,
            };
            const response = await subscriptionApi.getAllSubscriptions(filters);
            setSubscriptions(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error("Failed to load subscriptions:", error);
            toast({
                title: "Error",
                description: "Failed to load subscriptions. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [activeTab, pagination.page, pagination.limit, searchQuery]);

    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await subscriptionApi.getSubscriptionStats();
            setStats(response.data);
        } catch (error) {
            console.error("Failed to load stats:", error);
            toast({
                title: "Error",
                description: "Failed to load subscription statistics.",
                variant: "destructive",
            });
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSubscriptions();
        loadStats();
    }, [loadSubscriptions, loadStats]);

    const handleCreatePlan = async () => {
        if (!newPlan.name || !newPlan.priceDTPerMonth) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        try {
            await subscriptionApi.createPlan(newPlan as CreatePlanData);
            toast({
                title: "Plan Created",
                description: `New plan "${newPlan.name}" has been created successfully`,
            });
            setShowNewPlanDialog(false);
            setNewPlan({
                tier: PlanTier.STARTER,
                name: "",
                priceDTPerMonth: 0,
            });
        } catch (error) {
            console.error("Failed to create plan:", error);
            toast({
                title: "Creation Failed",
                description: "Failed to create plan. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleViewSubscription = (subscription: CreatorSubscription) => {
        setViewingSubscription(subscription);
        setViewDialogOpen(true);
    };

    const handleEditSubscription = (subscription: CreatorSubscription) => {
        setEditingSubscription(subscription);
        setEditFormData({
            status: subscription.status,
            plan: subscription.plan,
        });
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingSubscription) return;
        setEditSaving(true);
        try {
            await subscriptionApi.updateSubscription(editingSubscription.id, {
                status: editFormData.status,
                plan: editFormData.plan,
            });
            toast({
                title: "Subscription Updated",
                description: `Subscription for ${editingSubscription.creatorId} has been updated.`,
            });
            setEditDialogOpen(false);
            setEditingSubscription(null);
            loadSubscriptions();
        } catch (error) {
            console.error("Failed to update subscription:", error);
            toast({
                title: "Update Failed",
                description: "Failed to update subscription. Please try again.",
                variant: "destructive",
            });
        } finally {
            setEditSaving(false);
        }
    };

    const handleRequestCancel = (subscription: CreatorSubscription) => {
        setCancellingSubscription(subscription);
        setCancelAlertOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!cancellingSubscription) return;
        setCancelLoading(true);
        try {
            // CRITICAL: Use cancelSubscriptionById to cancel a SPECIFIC subscriber's subscription.
            // Do NOT use cancelSubscription() — that cancels the caller's own platform subscription!
            await subscriptionApi.cancelSubscriptionById(
                cancellingSubscription.id,
            );
            toast({
                title: "Subscription Canceled",
                description: `Subscription for ${cancellingSubscription.creatorId} will be canceled at the end of the billing period.`,
            });
            setCancelAlertOpen(false);
            setCancellingSubscription(null);
            loadSubscriptions();
        } catch (error) {
            console.error("Failed to cancel subscription:", error);
            toast({
                title: "Cancel Failed",
                description: "Failed to cancel subscription. Please try again.",
                variant: "destructive",
            });
        } finally {
            setCancelLoading(false);
        }
    };

    const handleDeleteSubscription = async (
        subscription: CreatorSubscription,
    ) => {
        try {
            await subscriptionApi.deleteSubscription(subscription.id);
            toast({
                title: "Subscription Deleted",
                description: `Subscription for ${subscription.creatorId} has been deleted.`,
            });
            loadSubscriptions();
        } catch (error) {
            console.error("Failed to delete subscription:", error);
            toast({
                title: "Delete Failed",
                description: "Failed to delete subscription. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const params: Record<string, unknown> = {
                status: activeTab === "all" ? undefined : activeTab,
                plan: undefined,
            };
            const response = await subscriptionApi.exportSubscriptions(params);
            if (response.data?.downloadUrl) {
                window.open(response.data.downloadUrl, "_blank");
            }
            toast({
                title: "Export Started",
                description:
                    response.data?.message ||
                    "Your CSV export is being prepared.",
            });
        } catch (error) {
            console.error("Failed to export subscriptions:", error);
            toast({
                title: "Export Failed",
                description:
                    "Failed to export subscriptions. Please try again.",
                variant: "destructive",
            });
        } finally {
            setExporting(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    return (
        <PageShell>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Platform Subscriptions
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View and manage all creator subscriptions on the Chabaqa
                        platform.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCsv}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Download CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadStats}
                        disabled={statsLoading}
                    >
                        {statsLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh Stats
                    </Button>
                    <Dialog
                        open={showNewPlanDialog}
                        onOpenChange={setShowNewPlanDialog}
                    >
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" /> New Plan
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Create New Subscription Plan
                                </DialogTitle>
                                <DialogDescription>
                                    Add a new subscription plan to offer to your
                                    customers.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="plan-name"
                                        className="text-right"
                                    >
                                        Plan Name
                                    </Label>
                                    <Input
                                        id="plan-name"
                                        value={newPlan.name}
                                        onChange={(e) =>
                                            setNewPlan({
                                                ...newPlan,
                                                name: e.target.value,
                                            })
                                        }
                                        className="col-span-3"
                                        placeholder="e.g. Pro Plan"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label
                                        htmlFor="plan-description"
                                        className="text-right pt-2"
                                    >
                                        Description
                                    </Label>
                                    <div className="col-span-3 space-y-2">
                                        <Textarea
                                            id="plan-description"
                                            value={newPlan.description || ""}
                                            onChange={(e) =>
                                                setNewPlan({
                                                    ...newPlan,
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="Describe what subscribers get with this plan..."
                                            rows={3}
                                        />
                                        <WanisAssistButton
                                            value={newPlan.description || ""}
                                            onAccept={(text) =>
                                                setNewPlan({
                                                    ...newPlan,
                                                    description: text,
                                                })
                                            }
                                            context="subscription plan description"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="plan-tier"
                                        className="text-right"
                                    >
                                        Plan Tier
                                    </Label>
                                    <Select
                                        onValueChange={(value: PlanTier) =>
                                            setNewPlan({
                                                ...newPlan,
                                                tier: value,
                                            })
                                        }
                                        defaultValue={PlanTier.STARTER}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a tier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(PlanTier).map(
                                                (tier) => (
                                                    <SelectItem
                                                        key={tier}
                                                        value={tier}
                                                    >
                                                        {tier}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="plan-price"
                                        className="text-right"
                                    >
                                        Price (TND)
                                    </Label>
                                    <Input
                                        id="plan-price"
                                        type="number"
                                        value={newPlan.priceDTPerMonth}
                                        onChange={(e) =>
                                            setNewPlan({
                                                ...newPlan,
                                                priceDTPerMonth: parseFloat(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                        className="col-span-3"
                                        placeholder="e.g. 29.99"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="plan-trial"
                                        className="text-right"
                                    >
                                        Trial Days
                                    </Label>
                                    <Input
                                        id="plan-trial"
                                        type="number"
                                        value={newPlan.trialDays}
                                        onChange={(e) =>
                                            setNewPlan({
                                                ...newPlan,
                                                trialDays: parseInt(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                        className="col-span-3"
                                        placeholder="e.g. 7"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowNewPlanDialog(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleCreatePlan}>
                                    Create Plan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Subscribers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statsLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                (stats?.totalSubscribers ?? 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Subscribers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statsLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                (stats?.activeSubscribers ?? 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Monthly Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statsLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                `${(stats?.monthlyRevenue ?? 0).toFixed(2)} TND`
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Avg. Subscription Value
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statsLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                `${(stats?.averageSubscriptionValue ?? 0).toFixed(2)} TND`
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Subscription Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Management</CardTitle>
                    <CardDescription>
                        Manage your subscribers and subscription plans
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs
                        value={activeTab}
                        onValueChange={(value) =>
                            setActiveTab(value as SubscriptionStatus | "all")
                        }
                    >
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value={SubscriptionStatus.ACTIVE}>
                                    Active
                                </TabsTrigger>
                                <TabsTrigger
                                    value={SubscriptionStatus.TRIALING}
                                >
                                    Trialing
                                </TabsTrigger>
                                <TabsTrigger
                                    value={SubscriptionStatus.PAST_DUE}
                                >
                                    Past Due
                                </TabsTrigger>
                                <TabsTrigger
                                    value={SubscriptionStatus.CANCELED}
                                >
                                    Canceled
                                </TabsTrigger>
                            </TabsList>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search subscriptions..."
                                    className="pl-8 w-[250px]"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <TabsContent value={activeTab} className="m-0">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Next Billing</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead className="w-[80px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="text-center py-4"
                                                >
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : subscriptions.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="text-center py-4 text-muted-foreground"
                                                >
                                                    No subscriptions found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            subscriptions.map(
                                                (subscription) => (
                                                    <TableRow
                                                        key={subscription.id}
                                                    >
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">
                                                                    {
                                                                        subscription.creatorId
                                                                    }
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="capitalize">
                                                                {
                                                                    subscription.plan
                                                                }
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    subscription.status ===
                                                                    SubscriptionStatus.ACTIVE
                                                                        ? "default"
                                                                        : subscription.status ===
                                                                            SubscriptionStatus.PAST_DUE
                                                                          ? "destructive"
                                                                          : "outline"
                                                                }
                                                                className="flex items-center gap-1 w-fit"
                                                            >
                                                                {subscription.status ===
                                                                    SubscriptionStatus.ACTIVE && (
                                                                    <CheckCircle className="h-3 w-3" />
                                                                )}
                                                                {subscription.status ===
                                                                    SubscriptionStatus.PAST_DUE && (
                                                                    <AlertCircle className="h-3 w-3" />
                                                                )}
                                                                {subscription.status ===
                                                                    SubscriptionStatus.CANCELED && (
                                                                    <Clock className="h-3 w-3" />
                                                                )}
                                                                <span className="capitalize">
                                                                    {subscription.status.replace(
                                                                        "_",
                                                                        " ",
                                                                    )}
                                                                </span>
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(
                                                                parseISO(
                                                                    subscription.currentPeriodEnd,
                                                                ),
                                                                "yyyy-MM-dd",
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(
                                                                parseISO(
                                                                    subscription.createdAt,
                                                                ),
                                                                "yyyy-MM-dd",
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                        <span className="sr-only">
                                                                            Open
                                                                            menu
                                                                        </span>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>
                                                                        Actions
                                                                    </DropdownMenuLabel>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleViewSubscription(
                                                                                subscription,
                                                                            )
                                                                        }
                                                                    >
                                                                        View
                                                                        details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleEditSubscription(
                                                                                subscription,
                                                                            )
                                                                        }
                                                                    >
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-yellow-600"
                                                                        onClick={() =>
                                                                            handleRequestCancel(
                                                                                subscription,
                                                                            )
                                                                        }
                                                                    >
                                                                        Cancel
                                                                        subscription
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-red-600"
                                                                        onClick={() =>
                                                                            handleDeleteSubscription(
                                                                                subscription,
                                                                            )
                                                                        }
                                                                    >
                                                                        Delete
                                                                        subscription
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                    <CardFooter className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing <strong>{subscriptions.length}</strong> of{" "}
                            <strong>{pagination.total}</strong> subscriptions
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page <= 1}
                                onClick={() =>
                                    handlePageChange(pagination.page - 1)
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                    pagination.page >= pagination.totalPages
                                }
                                onClick={() =>
                                    handlePageChange(pagination.page + 1)
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </CardFooter>
                </CardContent>
            </Card>

            {/* View Subscription Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle>Subscription Details</DialogTitle>
                        <DialogDescription>
                            Full details for this subscription.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingSubscription && (
                        <div className="grid gap-3 py-4">
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Subscription ID
                                </span>
                                <span className="col-span-2 text-sm font-mono break-all">
                                    {viewingSubscription.id}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Creator ID
                                </span>
                                <span className="col-span-2 text-sm">
                                    {viewingSubscription.creatorId}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Plan
                                </span>
                                <span className="col-span-2 text-sm capitalize">
                                    {viewingSubscription.plan}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Status
                                </span>
                                <span className="col-span-2">
                                    <Badge
                                        variant={
                                            viewingSubscription.status ===
                                            SubscriptionStatus.ACTIVE
                                                ? "default"
                                                : viewingSubscription.status ===
                                                    SubscriptionStatus.PAST_DUE
                                                  ? "destructive"
                                                  : "outline"
                                        }
                                    >
                                        <span className="capitalize">
                                            {viewingSubscription.status.replace(
                                                "_",
                                                " ",
                                            )}
                                        </span>
                                    </Badge>
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Cancel at Period End
                                </span>
                                <span className="col-span-2 text-sm">
                                    {viewingSubscription.cancelAtPeriodEnd
                                        ? "Yes"
                                        : "No"}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Current Period
                                </span>
                                <span className="col-span-2 text-sm">
                                    {format(
                                        parseISO(
                                            viewingSubscription.currentPeriodStart,
                                        ),
                                        "yyyy-MM-dd",
                                    )}{" "}
                                    &rarr;{" "}
                                    {format(
                                        parseISO(
                                            viewingSubscription.currentPeriodEnd,
                                        ),
                                        "yyyy-MM-dd",
                                    )}
                                </span>
                            </div>
                            {viewingSubscription.trialEndsAt && (
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Trial Ends At
                                    </span>
                                    <span className="col-span-2 text-sm">
                                        {format(
                                            parseISO(
                                                viewingSubscription.trialEndsAt,
                                            ),
                                            "yyyy-MM-dd",
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Payment Method
                                </span>
                                <span className="col-span-2 text-sm">
                                    {viewingSubscription.hasPaymentMethod
                                        ? `${viewingSubscription.paymentBrand ?? "Card"} ending in ${viewingSubscription.paymentLast4 ?? "****"}`
                                        : "No payment method on file"}
                                </span>
                            </div>
                            {viewingSubscription.provider && (
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Provider
                                    </span>
                                    <span className="col-span-2 text-sm">
                                        {viewingSubscription.provider}
                                    </span>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Created
                                </span>
                                <span className="col-span-2 text-sm">
                                    {format(
                                        parseISO(viewingSubscription.createdAt),
                                        "yyyy-MM-dd HH:mm",
                                    )}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Last Updated
                                </span>
                                <span className="col-span-2 text-sm">
                                    {format(
                                        parseISO(viewingSubscription.updatedAt),
                                        "yyyy-MM-dd HH:mm",
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setViewDialogOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Subscription Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Subscription</DialogTitle>
                        <DialogDescription>
                            Update subscription details for{" "}
                            {editingSubscription?.creatorId ?? "this creator"}.
                        </DialogDescription>
                    </DialogHeader>
                    {editingSubscription && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="edit-status"
                                    className="text-right"
                                >
                                    Status
                                </Label>
                                <Select
                                    value={editFormData.status}
                                    onValueChange={(
                                        value: SubscriptionStatus,
                                    ) =>
                                        setEditFormData((prev) => ({
                                            ...prev,
                                            status: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(SubscriptionStatus).map(
                                            (status) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                >
                                                    <span className="capitalize">
                                                        {status.replace(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </span>
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="edit-plan"
                                    className="text-right"
                                >
                                    Plan Tier
                                </Label>
                                <Select
                                    value={editFormData.plan}
                                    onValueChange={(value: PlanTier) =>
                                        setEditFormData((prev) => ({
                                            ...prev,
                                            plan: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(PlanTier).map((tier) => (
                                            <SelectItem key={tier} value={tier}>
                                                <span className="capitalize">
                                                    {tier}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditDialogOpen(false)}
                            disabled={editSaving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={editSaving}>
                            {editSaving && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation AlertDialog */}
            <AlertDialog
                open={cancelAlertOpen}
                onOpenChange={setCancelAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Cancel subscription for{" "}
                            {cancellingSubscription?.creatorId}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Their access will continue until the end of their
                            billing period. This action will mark the
                            subscription for cancellation at the next renewal
                            date.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelLoading}>
                            Keep Subscription
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmCancel}
                            disabled={cancelLoading}
                            className="bg-yellow-600 hover:bg-yellow-700"
                        >
                            {cancelLoading && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Yes, Cancel Subscription
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageShell>
    );
};

export default SubscriptionsPage;
