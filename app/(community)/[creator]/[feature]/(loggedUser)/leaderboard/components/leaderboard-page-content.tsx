"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    Trophy,
    Medal,
    Crown,
    Flame,
    Star,
    Zap,
    Target,
    RefreshCw,
    Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
    Community,
    LeaderboardResponse,
    GamificationProfile,
    LeaderboardEntry,
} from "@/lib/api/types";

interface LeaderboardPageContentProps {
    slug: string;
    community: Community | null;
    leaderboard: LeaderboardResponse | null;
    myProfile: GamificationProfile | null;
    period: "weekly" | "all_time";
    onPeriodChange: (period: "weekly" | "all_time") => void;
    onRefresh: () => void;
}

const RANK_STYLES: Record<
    number,
    { icon: typeof Trophy; color: string; bg: string; border: string }
> = {
    1: {
        icon: Crown,
        color: "text-yellow-500",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
    },
    2: {
        icon: Medal,
        color: "text-slate-400",
        bg: "bg-slate-50",
        border: "border-slate-200",
    },
    3: {
        icon: Medal,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
    },
};

const LeaderboardRow = memo(function LeaderboardRow({
    entry,
    isCurrentUser,
}: {
    entry: LeaderboardEntry;
    isCurrentUser: boolean;
}) {
    const rankStyle = RANK_STYLES[entry.rank];
    const RankIcon = rankStyle?.icon;

    return (
        <div
            className={cn(
                "flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                rankStyle
                    ? `${rankStyle.bg} ${rankStyle.border}`
                    : "border-[var(--bd)]",
                isCurrentUser &&
                    "ring-2 ring-[var(--p)]/40 bg-[var(--p)]/5 border-[var(--p)]/30",
            )}
        >
            {/* Rank */}
            <div className="w-12 flex-shrink-0 text-center">
                {RankIcon ? (
                    <RankIcon
                        className={cn("mx-auto h-7 w-7", rankStyle.color)}
                    />
                ) : (
                    <span className="text-lg font-bold text-[var(--t2)]">
                        #{entry.rank}
                    </span>
                )}
            </div>

            {/* Avatar + Name */}
            <div className="flex flex-1 min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-[var(--bd)] shadow-sm">
                    <AvatarImage src={entry.userAvatar} alt={entry.userName} />
                    <AvatarFallback className="text-sm font-semibold bg-[var(--bg)]">
                        {entry.userName?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p
                        className={cn(
                            "truncate font-semibold text-foreground",
                            isCurrentUser && "text-[var(--p)]",
                        )}
                    >
                        {entry.userName}
                        {isCurrentUser && (
                            <span className="ml-2 text-xs text-[var(--t3)]">
                                (You)
                            </span>
                        )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[var(--t3)]">
                        <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-xs bg-[var(--bd)] text-[var(--t2)]"
                        >
                            Lv.{entry.level}
                        </Badge>
                        <span>{entry.levelName}</span>
                    </div>
                </div>
            </div>

            {/* Streak */}
            {entry.streakCurrent > 0 && (
                <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm font-medium">
                        {entry.streakCurrent}
                    </span>
                </div>
            )}

            {/* Points */}
            <div className="flex-shrink-0 text-right">
                <p className="text-lg font-bold text-foreground">
                    {entry.totalPoints.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--t3)]">points</p>
            </div>
        </div>
    );
});

export default function LeaderboardPageContent({
    slug,
    community,
    leaderboard,
    myProfile,
    period,
    onPeriodChange,
    onRefresh,
}: LeaderboardPageContentProps) {
    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <div className="container mx-auto px-4 py-8">

                {/* ── Header Banner ── */}
                <div className="mb-6">
                    <div className="relative flex flex-col items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 p-4 text-white md:flex-row">
                        {/* decorative circles */}
                        <div className="absolute right-0 top-0 h-20 w-20 -translate-y-12 translate-x-12 rounded-full bg-white/10" />
                        <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-8 translate-y-8 rounded-full bg-white/10" />

                        <div className="flex flex-col space-y-1 md:flex-row md:items-center md:space-x-3 md:space-y-0">
                            <div className="flex items-center space-x-2">
                                <Trophy className="h-6 w-6" />
                                <h1 className="text-2xl font-bold">
                                    Leaderboard
                                </h1>
                            </div>
                            <p className="text-sm text-yellow-100">
                                {community?.name || "Community"}{" "}
                                · Top contributors
                            </p>
                        </div>

                        <p className="mt-2 hidden text-sm text-white/70 md:mt-0 md:block">
                            Earn points by posting, commenting &amp; engaging
                        </p>

                        {leaderboard && leaderboard.total > 0 && (
                            <div className="mt-4 flex space-x-6 md:mt-0">
                                <div className="text-center">
                                    <div className="text-xl font-bold">
                                        {leaderboard.total}
                                    </div>
                                    <div className="text-xs text-white/70">
                                        Members
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold">
                                        {leaderboard.entries.length}
                                    </div>
                                    <div className="text-xs text-white/70">
                                        Showing
                                    </div>
                                </div>
                                {myProfile && leaderboard?.currentUserRank != null && (
                                    <div className="text-center">
                                        <div className="text-xl font-bold">
                                            #{leaderboard.currentUserRank}
                                        </div>
                                        <div className="text-xs text-white/70">
                                            Your Rank
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── My Stats Card ── */}
                {myProfile && (
                    <section className="mb-8">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-xl bg-[var(--p)]/10 p-2 text-[var(--p)]">
                                <Star className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    Your Stats
                                </h2>
                                <p className="text-sm text-[var(--t3)]">
                                    Your current standing in this community.
                                </p>
                            </div>
                        </div>

                        <Card className="border border-[var(--bd)] bg-white shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    {/* Rank badge */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--p)]/10">
                                            <Trophy className="h-7 w-7 text-[var(--p)]" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-[var(--t3)]">
                                                Your Rank
                                            </p>
                                            <p className="text-3xl font-bold text-foreground">
                                                #{leaderboard?.currentUserRank ?? myProfile.rank}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:flex sm:gap-8 text-center">
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">
                                                {myProfile.totalPoints.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-[var(--t3)]">
                                                Total Points
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-[var(--p)]">
                                                {myProfile.weeklyPoints.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-[var(--t3)]">
                                                This Week
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">
                                                Lv.{myProfile.level}
                                            </p>
                                            <p className="text-xs text-[var(--t3)]">
                                                {myProfile.levelName}
                                            </p>
                                        </div>
                                        {myProfile.streakCurrent > 0 && (
                                            <div>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Flame className="h-5 w-5 text-orange-500" />
                                                    <p className="text-2xl font-bold text-orange-500">
                                                        {
                                                            myProfile.streakCurrent
                                                        }
                                                    </p>
                                                </div>
                                                <p className="text-xs text-[var(--t3)]">
                                                    Day Streak
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Level progress bar */}
                                <div className="mt-5 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-[var(--t3)]">
                                        <span>{myProfile.levelName}</span>
                                        <span>
                                            {myProfile.nextLevelName} &mdash;{" "}
                                            {myProfile.pointsToNextLevel} pts to
                                            go
                                        </span>
                                    </div>
                                    <Progress
                                        value={myProfile.levelProgress}
                                        className="h-2 bg-[var(--bd)] [&>*]:bg-[var(--p)]"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* ── Period Switcher ── */}
                <section className="mb-8">
                    <div className="rounded-2xl border border-[var(--bd)] bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    Rankings
                                </h2>
                                <p className="text-sm text-[var(--t3)]">
                                    Switch between all-time and weekly rankings.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 self-start">
                                <Button
                                    variant={
                                        period === "all_time"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                        onPeriodChange("all_time")
                                    }
                                    className="h-9 gap-2"
                                >
                                    <Trophy className="h-4 w-4" />
                                    All Time
                                </Button>
                                <Button
                                    variant={
                                        period === "weekly"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() => onPeriodChange("weekly")}
                                    className="h-9 gap-2"
                                >
                                    <Zap className="h-4 w-4" />
                                    This Week
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onRefresh}
                                    className="h-9 gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Private Leaderboard ── */}
                {leaderboard?.isPrivate && (
                    <Card className="border border-[var(--bd)] bg-white shadow-sm">
                        <CardContent className="py-12 text-center">
                            <div className="mx-auto mb-4 inline-flex rounded-full bg-[var(--bg)] p-3 text-[var(--t2)]">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">
                                Private Leaderboard
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--t3)]">
                                This community&apos;s leaderboard is private.
                                Only admins can view the full rankings.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* ── Leaderboard List ── */}
                {!leaderboard?.isPrivate && (
                    <div className="space-y-3">
                        {leaderboard?.entries &&
                        leaderboard.entries.length > 0 ? (
                            leaderboard.entries.map((entry) => (
                                <LeaderboardRow
                                    key={entry.userId}
                                    entry={entry}
                                    isCurrentUser={
                                        entry.userId === myProfile?.userId
                                    }
                                />
                            ))
                        ) : (
                            <Card className="border border-[var(--bd)] bg-white shadow-sm">
                                <CardContent className="py-12 text-center">
                                    <div className="mx-auto mb-4 inline-flex rounded-full bg-[var(--bg)] p-3 text-[var(--t2)]">
                                        <Target className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        No rankings yet
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--t3)]">
                                        Be the first to earn points! Create
                                        posts, comment, and engage with the
                                        community.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* ── Footer count ── */}
                {leaderboard && leaderboard.total > 0 && (
                    <p className="mt-6 text-center text-sm text-[var(--t3)]">
                        Showing {leaderboard.entries.length} of{" "}
                        {leaderboard.total} members
                    </p>
                )}
            </div>
        </div>
    );
}