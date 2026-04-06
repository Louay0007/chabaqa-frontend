"use client";

import { useState, useEffect, use } from "react";
import { communitiesApi } from "@/lib/api/communities.api";
import { gamificationApi } from "@/lib/api/gamification.api";
import type {
    Community,
    LeaderboardResponse,
    GamificationProfile,
} from "@/lib/api/types";
import LeaderboardPageContent from "./components/leaderboard-page-content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

export default function LeaderboardPage({
    params,
}: {
    params: Promise<{ creator: string; feature: string }>;
}) {
    const { feature } = use(params);
    const normalisedSlug = decodeURIComponent(feature).trim();

    const [period, setPeriod] = useState<"weekly" | "all_time">("all_time");
    const [community, setCommunity] = useState<Community | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
        null,
    );
    const [myProfile, setMyProfile] = useState<GamificationProfile | null>(
        null,
    );
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async (period: "weekly" | "all_time" = "all_time") => {
        try {
            setError(null);
            setLoading(true);
            const [communityResponse, leaderboardResponse, profileResponse] =
                await Promise.all([
                    communitiesApi.getBySlug(normalisedSlug),
                    gamificationApi.getLeaderboard({
                        communitySlug: normalisedSlug,
                        period,
                        limit: 50,
                    }),
                    gamificationApi
                        .getMyProfile({ communitySlug: normalisedSlug })
                        .catch(() => null),
                ]);

            const communityPayload =
                (communityResponse as any)?.data?.data ??
                communityResponse?.data;
            const communityData = Array.isArray(communityPayload)
                ? communityPayload[0]
                : communityPayload;
            setCommunity(communityData as Community);
            setLeaderboard(leaderboardResponse);
            setMyProfile(profileResponse);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = async (newPeriod: "weekly" | "all_time") => {
        setPeriod(newPeriod);
        await fetchData(newPeriod);
    };

    useEffect(() => {
        fetchData();
    }, [normalisedSlug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg)]">
                <div className="container mx-auto px-4 py-8">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card
                                key={i}
                                className="overflow-hidden border border-[var(--bd)] bg-white shadow-sm"
                            >
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--bd)]" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-2/5 animate-pulse rounded bg-[var(--bd)]" />
                                        <div className="h-3 w-1/4 animate-pulse rounded bg-[var(--bg)]" />
                                    </div>
                                    <div className="h-6 w-16 animate-pulse rounded bg-[var(--bd)]" />
                                </CardContent>
                            </Card>
                        ))}
                        <div className="flex items-center justify-center gap-2 pt-4 text-sm text-[var(--t3)]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading leaderboard…
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--bg)]">
                <div className="container mx-auto px-4 py-8">
                    <Card className="border border-red-200 bg-white shadow-sm">
                        <CardContent className="py-12 text-center">
                            <div className="mx-auto mb-4 inline-flex rounded-full bg-red-50 p-3 text-red-600">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">
                                Unable to load leaderboard
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--t2)]">
                                We encountered an issue. Please try again.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => fetchData()}
                                className="mt-4 gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <LeaderboardPageContent
            slug={normalisedSlug}
            community={community}
            leaderboard={leaderboard}
            myProfile={myProfile}
            period={period}
            onPeriodChange={handlePeriodChange}
            onRefresh={() => fetchData(period)}
        />
    );
}