"use client";

import { usePlan } from "@/hooks/use-plan";
import { Progress } from "@/components/ui/progress";
import type { PlanLimits } from "@/lib/plans/plan-config";
import { formatLimit } from "@/lib/plans/plan-config";
import Link from "next/link";

interface UsageIndicatorProps {
    label: string;
    current: number;
    limitKey: keyof PlanLimits;
    suffix?: string;
}

export function UsageIndicator({
    label,
    current,
    limitKey,
    suffix = "",
}: UsageIndicatorProps) {
    const { limitValue } = usePlan();

    const max = limitValue(limitKey) as number;
    const isUnlimited = max >= 999999;
    const percent = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
    const isNearLimit = percent >= 80;
    const isAtLimit = percent >= 100;

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span
                    className={
                        isAtLimit
                            ? "text-destructive font-medium"
                            : isNearLimit
                              ? "text-amber-600 font-medium"
                              : "text-foreground"
                    }
                >
                    {isUnlimited
                        ? `${current.toLocaleString()}${suffix} / Unlimited`
                        : `${current.toLocaleString()}${suffix} / ${formatLimit(max)}${suffix}`}
                </span>
            </div>
            {!isUnlimited && (
                <Progress
                    value={percent}
                    className={
                        isAtLimit
                            ? "[&>div]:bg-destructive"
                            : isNearLimit
                              ? "[&>div]:bg-amber-500"
                              : ""
                    }
                />
            )}
            {isNearLimit && !isUnlimited && (
                <div className="text-xs text-right">
                    <Link
                        href="/creator/plan/upgrade"
                        className="text-primary hover:underline font-medium"
                    >
                        Upgrade for more →
                    </Link>
                </div>
            )}
        </div>
    );
}

interface UsageSummaryProps {
    memberCount: number;
    storageUsedGB: number;
    adminCount: number;
    activeCourseCount: number;
    emailsSentThisMonth?: number;
    sessionBookingsThisMonth?: number;
    whatsappMessagesSentThisMonth?: number;
}

export function UsageSummary({
    memberCount,
    storageUsedGB,
    adminCount,
    activeCourseCount,
    emailsSentThisMonth = 0,
    sessionBookingsThisMonth = 0,
    whatsappMessagesSentThisMonth = 0,
}: UsageSummaryProps) {
    const { plan } = usePlan();

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Plan Usage — {plan.name}
            </h4>
            <UsageIndicator
                label="Members"
                current={memberCount}
                limitKey="membersMax"
            />
            <UsageIndicator
                label="Storage"
                current={storageUsedGB}
                limitKey="storageGB"
                suffix=" GB"
            />
            <UsageIndicator
                label="Admin seats"
                current={adminCount}
                limitKey="adminsMax"
            />
            <UsageIndicator
                label="Active courses"
                current={activeCourseCount}
                limitKey="coursesActivationMax"
            />
            {plan.limits.emailCampaignRecipientsPerMonth > 0 && (
                <UsageIndicator
                    label="Email recipients"
                    current={emailsSentThisMonth}
                    limitKey="emailCampaignRecipientsPerMonth"
                    suffix=" emails"
                />
            )}
            {plan.limits.sessionBookingsPerMonth > 0 && (
                <UsageIndicator
                    label="Session bookings"
                    current={sessionBookingsThisMonth}
                    limitKey="sessionBookingsPerMonth"
                />
            )}
            {plan.limits.whatsappMessagesPerMonth > 0 && (
                <UsageIndicator
                    label="WhatsApp messages"
                    current={whatsappMessagesSentThisMonth}
                    limitKey="whatsappMessagesPerMonth"
                />
            )}
            {plan.limits.analyticsLookbackDays > 0 && (
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                        Analytics history
                    </span>
                    <span className="text-foreground">
                        {plan.limits.analyticsLookbackDays >= 999999
                            ? "Unlimited"
                            : `${plan.limits.analyticsLookbackDays} days`}
                    </span>
                </div>
            )}
        </div>
    );
}
