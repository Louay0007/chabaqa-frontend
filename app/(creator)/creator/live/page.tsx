"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCommunityGuard } from "@/hooks/use-community-guard";
import {
    PageShell,
    PageHeader,
    PageState,
} from "@/components/creator-dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Radio,
    Calendar,
    Users,
    Clock,
    Eye,
    Trash2,
    Play,
    Square,
    Plus,
    ExternalLink,
    Copy,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import {
    liveStreamingApi,
    LiveRoom,
    LiveRoomStatus,
    LiveRoomType,
    CreateLiveRoomPayload,
} from "@/lib/api/live-streaming.api";

// ─── Create Live Room Dialog ─────────────────────────────────────────────────

function CreateLiveDialog({
    communityId,
    onSuccess,
}: {
    communityId: string;
    onSuccess: () => void;
}) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<CreateLiveRoomPayload>({
        title: "",
        description: "",
        roomType: LiveRoomType.BROADCAST,
        scheduledAt: "",
        maxParticipants: 100,
        isPublic: true,
        chatEnabled: true,
        allowScreenShare: false,
        allowQuestions: true,
        reactionsEnabled: true,
        recordingEnabled: false,
    });

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            toast({
                title: "Title required",
                description: "Please enter a title for your live stream.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const payload: CreateLiveRoomPayload = {
                ...form,
                scheduledAt: form.scheduledAt
                    ? new Date(form.scheduledAt as string).toISOString()
                    : undefined,
            };
            await liveStreamingApi.create(communityId, payload);
            toast({
                title: form.scheduledAt ? "Stream scheduled!" : "You're live!",
                description: form.scheduledAt
                    ? "Your stream has been scheduled."
                    : "Your live stream has started.",
            });
            setOpen(false);
            setForm({
                title: "",
                description: "",
                roomType: LiveRoomType.BROADCAST,
                scheduledAt: "",
                maxParticipants: 100,
                isPublic: true,
                chatEnabled: true,
                allowScreenShare: false,
                allowQuestions: true,
                reactionsEnabled: true,
                recordingEnabled: false,
            });
            onSuccess();
        } catch {
            toast({
                title: "Error",
                description: "Failed to create live room.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700">
                    <Radio className="h-4 w-4 mr-2" />
                    Go Live
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Radio className="h-5 w-5 text-red-500" />
                        Create Live Stream
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1">
                        <Label>Title *</Label>
                        <Input
                            value={form.title as string}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                            }
                            placeholder="What will you be streaming about?"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Description</Label>
                        <Textarea
                            value={form.description as string}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Tell your community about this stream..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Schedule (optional)</Label>
                            <Input
                                type="datetime-local"
                                value={form.scheduledAt as string}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        scheduledAt: e.target.value,
                                    })
                                }
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Max viewers</Label>
                            <Input
                                type="number"
                                value={form.maxParticipants as number}
                                min={2}
                                max={1000}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        maxParticipants: parseInt(
                                            e.target.value,
                                        ),
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        {(
                            [
                                ["isPublic", "Public to all community members"],
                                ["chatEnabled", "Enable live chat"],
                                ["allowScreenShare", "Allow screen sharing"],
                                ["allowQuestions", "Allow Q&A"],
                                ["reactionsEnabled", "Enable emoji reactions"],
                            ] as [keyof CreateLiveRoomPayload, string][]
                        ).map(([key, label]) => (
                            <label
                                key={key as string}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={form[key] as boolean}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            [key]: e.target.checked,
                                        })
                                    }
                                    className="rounded"
                                />
                                <span className="text-sm">{label}</span>
                            </label>
                        ))}
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                    >
                        {loading
                            ? "Creating..."
                            : form.scheduledAt
                              ? "Schedule Stream"
                              : "Go Live Now"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LiveRoomStatus }) {
    const map: Record<
        LiveRoomStatus,
        { label: string; className: string }
    > = {
        [LiveRoomStatus.LIVE]: {
            label: "LIVE",
            className:
                "bg-red-500 text-white animate-pulse font-bold",
        },
        [LiveRoomStatus.SCHEDULED]: {
            label: "Scheduled",
            className: "bg-blue-100 text-blue-700",
        },
        [LiveRoomStatus.ENDED]: {
            label: "Ended",
            className: "bg-gray-100 text-gray-600",
        },
        [LiveRoomStatus.CANCELLED]: {
            label: "Cancelled",
            className: "bg-red-100 text-red-600",
        },
    };
    const { label, className } = map[status] ?? map[LiveRoomStatus.ENDED];
    return (
        <Badge className={className} variant="secondary">
            {label}
        </Badge>
    );
}

// ─── Room card ───────────────────────────────────────────────────────────────

function RoomCard({
    room,
    communityId,
    communitySlug,
    creatorName,
    onAction,
}: {
    room: LiveRoom;
    communityId: string;
    communitySlug: string;
    creatorName: string;
    onAction: () => void;
}) {
    const { toast } = useToast();
    const [acting, setActing] = useState(false);

    const viewerUrl = `/${encodeURIComponent(creatorName)}/${encodeURIComponent(communitySlug)}/live/${room.roomId}`;

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.origin + viewerUrl);
        toast({ title: "Link copied!" });
    };

    const doAction = async (
        action: () => Promise<unknown>,
        successMsg: string,
    ) => {
        setActing(true);
        try {
            await action();
            toast({ title: successMsg });
            onAction();
        } catch {
            toast({
                title: "Error",
                description: "Action failed.",
                variant: "destructive",
            });
        } finally {
            setActing(false);
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={room.status} />
                            <span className="text-xs text-gray-500 capitalize">
                                {room.roomType}
                            </span>
                        </div>
                        <CardTitle className="text-base truncate">
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

            <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    {room.scheduledAt && room.status === LiveRoomStatus.SCHEDULED && (
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(room.scheduledAt).toLocaleString()}
                        </span>
                    )}
                    {room.startedAt && room.status === LiveRoomStatus.LIVE && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-red-500" />
                            Started{" "}
                            {new Date(room.startedAt).toLocaleTimeString()}
                        </span>
                    )}
                    {room.status === LiveRoomStatus.LIVE && (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                            <Eye className="h-3 w-3" />
                            {room.viewerCount} watching
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Max {room.maxParticipants}
                    </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {room.status === LiveRoomStatus.SCHEDULED && (
                        <Button
                            size="sm"
                            variant="default"
                            disabled={acting}
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() =>
                                doAction(
                                    () =>
                                        liveStreamingApi.start(
                                            communityId,
                                            room.roomId,
                                        ),
                                    "Stream started!",
                                )
                            }
                        >
                            <Play className="h-3 w-3 mr-1" />
                            Start Now
                        </Button>
                    )}

                    {room.status === LiveRoomStatus.LIVE && (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={copyLink}
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Link
                            </Button>
                            <a
                                href={viewerUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Button size="sm" variant="outline">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View
                                </Button>
                            </a>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={acting}
                                    >
                                        <Square className="h-3 w-3 mr-1" />
                                        End Stream
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            End this live stream?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will disconnect all viewers.
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-red-500 hover:bg-red-600"
                                            onClick={() =>
                                                doAction(
                                                    () =>
                                                        liveStreamingApi.end(
                                                            communityId,
                                                            room.roomId,
                                                        ),
                                                    "Stream ended",
                                                )
                                            }
                                        >
                                            End Stream
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}

                    {room.status === LiveRoomStatus.SCHEDULED && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-600"
                                    disabled={acting}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Cancel
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Cancel scheduled stream?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will cancel the scheduled live
                                        stream.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Keep</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() =>
                                            doAction(
                                                () =>
                                                    liveStreamingApi.cancel(
                                                        communityId,
                                                        room.roomId,
                                                    ),
                                                "Stream cancelled",
                                            )
                                        }
                                    >
                                        Cancel Stream
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LiveStreamingPage() {
    const { toast } = useToast();
    const { guard, selectedCommunity, selectedCommunityId } =
        useCommunityGuard();

    const [rooms, setRooms] = useState<LiveRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<
        "live" | "scheduled" | "past"
    >("live");

    const communitySlug = selectedCommunity?.slug ?? "";
    const creatorName = selectedCommunity?.creator?.name ?? "";

    const load = useCallback(async () => {
        if (!selectedCommunityId) {
            setRooms([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [liveRes, scheduledRes, pastRes] = await Promise.allSettled([
                liveStreamingApi.getRooms(
                    selectedCommunityId,
                    LiveRoomStatus.LIVE,
                ),
                liveStreamingApi.getRooms(
                    selectedCommunityId,
                    LiveRoomStatus.SCHEDULED,
                ),
                liveStreamingApi.getPast(selectedCommunityId),
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
        } catch {
            toast({
                title: "Error",
                description: "Failed to load streams.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [selectedCommunityId, toast]);

    useEffect(() => {
        load();
    }, [load]);

    if (guard) return guard;

    const liveRooms = rooms.filter((r) => r.status === LiveRoomStatus.LIVE);
    const scheduledRooms = rooms.filter(
        (r) => r.status === LiveRoomStatus.SCHEDULED,
    );
    const pastRooms = rooms.filter((r) => r.status === LiveRoomStatus.ENDED);

    const tabRooms =
        activeTab === "live"
            ? liveRooms
            : activeTab === "scheduled"
              ? scheduledRooms
              : pastRooms;

    return (
        <PageShell>
            <PageHeader
                title="Live Streaming"
                description="Broadcast live to your community members"
                actions={
                    selectedCommunityId ? (
                        <CreateLiveDialog
                            communityId={selectedCommunityId}
                            onSuccess={load}
                        />
                    ) : undefined
                }
            />

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    {
                        label: "Live Now",
                        value: liveRooms.length,
                        icon: Radio,
                        color: "text-red-500",
                    },
                    {
                        label: "Scheduled",
                        value: scheduledRooms.length,
                        icon: Calendar,
                        color: "text-blue-500",
                    },
                    {
                        label: "Past Streams",
                        value: pastRooms.length,
                        icon: Video,
                        color: "text-gray-500",
                    },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="p-4">
                        <div className="flex items-center gap-3">
                            <Icon className={`h-8 w-8 ${color}`} />
                            <div>
                                <p className="text-2xl font-bold">{value}</p>
                                <p className="text-sm text-gray-500">{label}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b">
                {(
                    [
                        { key: "live", label: "Live", count: liveRooms.length },
                        {
                            key: "scheduled",
                            label: "Scheduled",
                            count: scheduledRooms.length,
                        },
                        {
                            key: "past",
                            label: "Past Streams",
                            count: pastRooms.length,
                        },
                    ] as { key: "live" | "scheduled" | "past"; label: string; count: number }[]
                ).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.key
                                ? "border-chabaqa-primary text-chabaqa-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-1.5 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <PageState type="loading" />
            ) : tabRooms.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <Video className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">
                        {activeTab === "live"
                            ? "No active streams"
                            : activeTab === "scheduled"
                              ? "No scheduled streams"
                              : "No past streams"}
                    </p>
                    {activeTab !== "past" && (
                        <p className="text-sm mt-1">
                            Click "Go Live" to start streaming to your
                            community.
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tabRooms.map((room) => (
                        <RoomCard
                            key={room.roomId}
                            room={room}
                            communityId={selectedCommunityId!}
                            communitySlug={communitySlug}
                            creatorName={creatorName}
                            onAction={load}
                        />
                    ))}
                </div>
            )}

            {/* LiveKit setup notice */}
            {!loading && (
                <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700">
                    <p className="font-medium mb-1">
                        📡 LiveKit Configuration Required
                    </p>
                    <p>
                        To enable real WebRTC video streaming, set{" "}
                        <code className="bg-blue-100 px-1 rounded">
                            LIVEKIT_API_KEY
                        </code>
                        ,{" "}
                        <code className="bg-blue-100 px-1 rounded">
                            LIVEKIT_API_SECRET
                        </code>{" "}
                        and{" "}
                        <code className="bg-blue-100 px-1 rounded">
                            LIVEKIT_WS_URL
                        </code>{" "}
                        in your backend <code>.env</code>. Get free credentials
                        at{" "}
                        <a
                            href="https://livekit.io"
                            target="_blank"
                            rel="noreferrer"
                            className="underline font-medium"
                        >
                            livekit.io
                        </a>{" "}
                        (1,000 free minutes/month).
                    </p>
                </div>
            )}
        </PageShell>
    );
}
