"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
    HardDrive,
    AlertTriangle,
    ArrowUpCircle,
    Lightbulb,
    Loader2,
    ArrowRight,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { subscriptionApi, StorageUsageData } from "@/lib/api/subscription.api";
import { usePlan } from "@/hooks/use-plan";
import {
    getAddonStoragePrice,
    safeFixed,
    type PlanTier,
} from "@/lib/plans/plan-config";

export default function StoragePage() {
    const router = useRouter();
    const { plan, tier } = usePlan();
    const [storage, setStorage] = useState<StorageUsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [addonDialogOpen, setAddonDialogOpen] = useState(false);
    const [purchasing, setPurchasing] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await subscriptionApi.getStorageUsage();
            setStorage(res.data);
        } catch {
            toast({
                title: "Error",
                description: "Failed to load storage data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const addonPrice = getAddonStoragePrice(tier as PlanTier);

    const handlePurchaseAddon = async () => {
        setPurchasing(true);
        try {
            await subscriptionApi.purchaseAddOn({ type: "storage", units: 1 });
            toast({
                title: "Storage expanded!",
                description: "+100 GB has been added to your plan.",
            });
            setAddonDialogOpen(false);
            await load();
        } catch {
            toast({
                title: "Purchase failed",
                description:
                    "Could not add storage. Please try again or contact support.",
                variant: "destructive",
            });
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-48 animate-pulse rounded-lg bg-muted" />
                <div className="h-32 animate-pulse rounded-lg bg-muted" />
            </div>
        );
    }

    const usedGB = storage?.usedGB ?? 0;
    const limitGB = storage?.limitGB ?? plan.limits.storageGB;
    const percentUsed = storage?.percentUsed ?? 0;
    const remainingGB = storage?.remainingGB ?? limitGB;
    const isNear = percentUsed >= 80;
    const isAt = percentUsed >= 100;

    return (
        <div className="space-y-6">
            {/* Main Storage Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <HardDrive className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base">
                                Storage Usage
                            </CardTitle>
                            <CardDescription>
                                {plan.name} Plan — {limitGB} GB included
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Progress
                        value={percentUsed}
                        className={`h-4 ${isAt ? "[&>div]:bg-destructive" : isNear ? "[&>div]:bg-amber-500" : ""}`}
                    />
                    <div className="flex justify-between text-sm">
                        <span
                            className={
                                isAt
                                    ? "text-destructive font-medium"
                                    : isNear
                                      ? "text-amber-600 font-medium"
                                      : "text-muted-foreground"
                            }
                        >
                            {safeFixed(usedGB)} GB used
                        </span>
                        <span className="text-muted-foreground">
                            {safeFixed(remainingGB)} GB remaining (
                            {safeFixed(100 - percentUsed, 1)}% free)
                        </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                        {tier !== "pro" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.push("/creator/plan/upgrade")
                                }
                            >
                                <ArrowUpCircle className="h-4 w-4 mr-1" />
                                Upgrade to{" "}
                                {tier === "starter"
                                    ? "Growth (50 GB)"
                                    : "Pro (300 GB)"}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/creator/communities">
                                Manage Files{" "}
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Storage Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">
                            {safeFixed(usedGB)}
                        </p>
                        <p className="text-sm text-muted-foreground">GB Used</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">{limitGB}</p>
                        <p className="text-sm text-muted-foreground">
                            GB Limit
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p
                            className={`text-3xl font-bold ${isAt ? "text-destructive" : isNear ? "text-amber-600" : "text-green-600"}`}
                        >
                            {safeFixed(percentUsed, 1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Utilization
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Near / At Limit Warning */}
            {isNear && (
                <Card
                    className={
                        isAt
                            ? "border-destructive/50 bg-destructive/5"
                            : "border-amber-400/50 bg-amber-50"
                    }
                >
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle
                                className={`h-5 w-5 mt-0.5 shrink-0 ${isAt ? "text-destructive" : "text-amber-600"}`}
                            />
                            <div>
                                <h4 className="font-medium">
                                    {isAt
                                        ? "Storage limit reached!"
                                        : "Running low on storage"}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {isAt
                                        ? "You cannot upload new files until you free up space or expand your storage."
                                        : `You've used ${safeFixed(percentUsed, 0)}% of your storage. Consider expanding before you reach the limit.`}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="sm"
                                        variant={isAt ? "default" : "outline"}
                                        onClick={() => setAddonDialogOpen(true)}
                                    >
                                        Add 100 GB for {addonPrice} TND/mo
                                    </Button>
                                    {tier !== "pro" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                router.push(
                                                    "/creator/plan/upgrade",
                                                )
                                            }
                                        >
                                            Upgrade Plan Instead
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Storage Breakdown Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-primary" />
                        Storage Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Detailed breakdown by file type (videos, images,
                        documents) is coming soon.
                    </p>
                </CardContent>
            </Card>

            {/* Tips */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Save Storage Space
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                            • Compress videos before upload — target 1080p max
                            with HandBrake or similar tools
                        </li>
                        <li>
                            • Use YouTube or Vimeo embeds for video lessons
                            instead of direct uploads
                        </li>
                        <li>
                            • Archive or delete unused course content to free up
                            space
                        </li>
                        <li>
                            • Optimize images with TinyPNG before uploading
                            thumbnails and banners
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Add Storage Confirmation Dialog */}
            <AlertDialog
                open={addonDialogOpen}
                onOpenChange={setAddonDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add Extra Storage</AlertDialogTitle>
                        <AlertDialogDescription>
                            +100 GB for {addonPrice} TND/month. This will be
                            charged immediately and added to your monthly bill.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={purchasing}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={purchasing}
                            onClick={(e) => {
                                e.preventDefault();
                                handlePurchaseAddon();
                            }}
                        >
                            {purchasing && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {purchasing ? "Processing…" : "Confirm Purchase"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
