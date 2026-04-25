"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Radio,
    Calendar,
    Eye,
    Users,
    Clock,
    Video,
    Loader2,
    Play,
} from "lucide-react";
import {
    liveStreamingApi,
    LiveRoom,
    LiveRoomStatus,
} from "@/lib/api/live-streaming.api";
import { api } from "@/lib/api";

function StatusBadge({ status }: { status: LiveRoomStatus }) {
    if (status === LiveRoomStatus.LIVE)
        return (
            <Badge className="bg-red-500 text-white animate-pulse font-bold">
                ● LIVE
            </Badge>
        );
    if (status === LiveRoomStatus.SCHEDULED)
        return (
            <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>
        );
    return <Badge variant="secondary">Ended</Badge>;
}

function StreamCard({
    room,
    creator,
    feature,
}: {
    room: LiveRoom;
    creator: string;
    feature: string;
}) {
    const router = useRouter();
    const canJoin =
        room.status === LiveRoomStatus.LIVE ||
        room.status === LiveRoomStatus.SCHEDULED;

    return (
        <Card
            className={`hover:shadow-md transition-shadow ${
                room.status === LiveRoomStatus.LIVE
                    ? "border-red-200 bg-red-50/30"
                    : ""
            }`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <StatusBadge status={room.status} />
                        <CardTitle className="text-base mt-2">
                            {room.title}
                        </CardTitle>
                        {room.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {room.description}
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3 flex-wrap">
                    {room.status === LiveRoomStatus.LIVE && (
                        <span className="flex items-center gap-1 text-red-600">
                            <Eye className="h-3 w-3" />
                            {room.viewerCount} watching
                        </span>
                    )}
                    {room.scheduledAt && room.status === LiveRoomStatus.SCHEDULED && (
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(room.scheduledAt).toLocaleString()}
                        </span>
                    )}
                    {room.startedAt && room.status === LiveRoomStatus.LIVE && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Started{" "}
                            {new Date(room.startedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    )}
                </div>
                {canJoin && (
                    <Button
                        onClick={() =>
                            router.push(
                                `/${creator}/${feature}/live/${room.roomId}`,
                            )
                        }
                        className={
                            room.status === LiveRoomStatus.LIVE
                                ? "bg-red-500 hover:bg-red-600 text-white w-full"
                                : "w-full"
                        }
                        variant={
                            room.status === LiveRoomStatus.LIVE
                                ? "default"
                                : "outline"
                        }
                    >
                        {room.status === LiveRoomStatus.LIVE ? (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Watch Live
                            </>
                        ) : (
                            <>
                                <Calendar className="h-4 w-4 mr-2" />
                                Set Reminder
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default function CommunityLivePage() {
    const params = useParams<{ creator: string; feature: string }>();
    const [communityId, setCommunityId] = useState<string | null>(null);
    const [rooms, setRooms] = useState<LiveRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "past">(
        "live",
    );

    // Resolve communityId from slug
    useEffect(() => {
        api.community
            .getBySlug(params.feature)
            .then((res: any) => {
                const id =
                    res?.data?.community?._id ||
                    res?.data?._id ||
                    res?.community?._id;
                if (id) setCommunityId(id);
            })
            .catch(() => {});
    }, [params.feature]);

    const load = useCallback(async () => {
        if (!communityId) return;
        setLoading(true);
        try {
            const [liveRes, scheduledRes, pastRes] = await Promise.allSettled([
                liveStreamingApi.getRooms(communityId, LiveRoomStatus.LIVE),
                liveStreamingApi.getUpcoming(communityId),
                liveStreamingApi.getPast(communityId),
            ]);

            const all: LiveRoom[] = [
                ...(liveRes.status === "fulfilled"
                    ? (liveRes.value as any)?.data ?? []
                    : []),
                ...(scheduledRes.status === "fulfilled"
                    ? (scheduledRes.value as any)?.data ?? []
                    : []),
                ...(pastRes.status === "fulfilled"
                    ? (pastRes.value as any)?.data ?? []
                    : []),
            ];
            setRooms(all);
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    useEffect(() => {
        load();
    }, [load]);

    const liveRooms = rooms.filter((r) => r.status === LiveRoomStatus.LIVE);
    const upcomingRooms = rooms.filter(
        (r) => r.status === LiveRoomStatus.SCHEDULED,
    );
    const pastRooms = rooms.filter((r) => r.status === LiveRoomStatus.ENDED);

    const tabRooms =
        activeTab === "live"
            ? liveRooms
            : activeTab === "upcoming"
              ? upcomingRooms
              : pastRooms;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Radio className="h-5 w-5 text-red-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Live Streams</h1>
                    <p className="text-gray-500 text-sm">
                        Watch live broadcasts from this community
                    </p>
                </div>
                {liveRooms.length > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white animate-pulse font-bold">
                        ● {liveRooms.length} LIVE
                    </Badge>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b">
                {(
                    [
                        { key: "live", label: "Live Now", count: liveRooms.length },
                        {
                            key: "upcoming",
                            label: "Upcoming",
                            count: upcomingRooms.length,
                        },
                        {
                            key: "past",
                            label: "Past",
                            count: pastRooms.length,
                        },
                    ] as { key: "live" | "upcoming" | "past"; label: string; count: number }[]
                ).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.key
                                ? "border-red-500 text-red-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : tabRooms.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Video className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">
                        {activeTab === "live"
                            ? "No active streams right now"
                            : activeTab === "upcoming"
                              ? "No upcoming streams scheduled"
                              : "No past streams"}
                    </p>
                    {activeTab === "live" && (
                        <p className="text-sm mt-1 text-gray-400">
                            Check back soon or look at upcoming streams.
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {tabRooms.map((room) => (
                        <StreamCard
                            key={room.roomId}
                            room={room}
                            creator={params.creator}
                            feature={params.feature}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
