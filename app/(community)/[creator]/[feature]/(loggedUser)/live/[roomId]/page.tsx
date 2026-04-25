"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    ScreenShare,
    PhoneOff,
    MessageSquare,
    Send,
    Users,
    Eye,
    Heart,
    ThumbsUp,
    Smile,
    X,
    Radio,
    Loader2,
    AlertCircle,
    ExternalLink,
} from "lucide-react";
import { liveStreamingApi, LiveRoom, LiveRoomStatus } from "@/lib/api/live-streaming.api";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
    id: string;
    user: string;
    avatar?: string;
    message: string;
    time: string;
    reaction?: string;
}

// ─── LiveKit dynamic import (only if configured) ─────────────────────────────

// We dynamically import LiveKit components to avoid SSR issues and to
// gracefully handle the case where LiveKit is not configured.

// ─── Reaction button ─────────────────────────────────────────────────────────

function ReactionButton({
    emoji,
    onClick,
}: {
    emoji: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="text-xl hover:scale-125 transition-transform active:scale-150"
            title={`React with ${emoji}`}
        >
            {emoji}
        </button>
    );
}

// ─── Main live room viewer ────────────────────────────────────────────────────

export default function LiveRoomViewerPage() {
    const params = useParams<{
        creator: string;
        feature: string;
        roomId: string;
    }>();
    const router = useRouter();
    const { toast } = useToast();

    const [room, setRoom] = useState<LiveRoom | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [wsUrl, setWsUrl] = useState<string | null>(null);
    const [loadingRoom, setLoadingRoom] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Viewer controls (for speaker/host role)
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [showChat, setShowChat] = useState(true);

    // Chat
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMsg, setNewMsg] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Floating reactions
    const [floatingReactions, setFloatingReactions] = useState<
        { id: string; emoji: string }[]
    >([]);

    // ── Load room info ──────────────────────────────────────────────────────

    const loadRoom = useCallback(async () => {
        try {
            // Try to find community by slug (feature param is the community slug)
            // We need to get the communityId from the slug
            const commRes = await api.community
                .getBySlug(params.feature)
                .catch(() => null);
            const communityId =
                commRes?.data?.community?._id ||
                commRes?.data?._id ||
                (commRes as any)?.community?._id;

            if (!communityId) {
                setError("Community not found.");
                return;
            }

            const roomRes = await liveStreamingApi.getRoom(
                communityId,
                params.roomId,
            );
            const roomData = (roomRes as any)?.data;
            setRoom(roomData);

            if (
                roomData?.status === LiveRoomStatus.ENDED ||
                roomData?.status === LiveRoomStatus.CANCELLED
            ) {
                setError(
                    roomData.status === LiveRoomStatus.ENDED
                        ? "This live stream has ended."
                        : "This live stream was cancelled.",
                );
                return;
            }

            if (roomData?.status === LiveRoomStatus.LIVE) {
                // Get token for joining
                const tokenRes = await liveStreamingApi.getToken(
                    communityId,
                    params.roomId,
                    "viewer",
                );
                if (tokenRes?.token) {
                    setToken(tokenRes.token);
                    setWsUrl(tokenRes.wsUrl || roomData.wsUrl || null);
                }
            }
        } catch (err: any) {
            setError(err?.message || "Failed to load live room.");
        } finally {
            setLoadingRoom(false);
        }
    }, [params.feature, params.roomId]);

    useEffect(() => {
        loadRoom();
    }, [loadRoom]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Connect to room ─────────────────────────────────────────────────────

    const connectToRoom = async () => {
        if (!token) {
            toast({
                title: "Not ready",
                description: "No connection token available.",
                variant: "destructive",
            });
            return;
        }

        setConnecting(true);
        try {
            // If LiveKit is configured, a real WebRTC session is possible.
            // We mark as connected here; the actual LiveKit <LiveKitRoom>
            // component (rendered below when connected=true) handles the rest.
            setConnected(true);
            addSystemMessage("You joined the live stream");
            toast({
                title: "Connected!",
                description: "You are now watching the live stream.",
            });
        } catch {
            toast({
                title: "Connection failed",
                description: "Could not connect to the live stream.",
                variant: "destructive",
            });
        } finally {
            setConnecting(false);
        }
    };

    // ── Chat ────────────────────────────────────────────────────────────────

    const addSystemMessage = (text: string) => {
        setMessages((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                user: "System",
                message: text,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            },
        ]);
    };

    const sendMessage = () => {
        const trimmed = newMsg.trim();
        if (!trimmed) return;

        setMessages((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                user: "You",
                message: trimmed,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            },
        ]);
        setNewMsg("");
    };

    // ── Reactions ───────────────────────────────────────────────────────────

    const sendReaction = (emoji: string) => {
        const id = crypto.randomUUID();
        setFloatingReactions((prev) => [...prev, { id, emoji }]);
        setTimeout(() => {
            setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
        }, 2500);

        // Also post to chat
        setMessages((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                user: "You",
                message: emoji,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                reaction: emoji,
            },
        ]);
    };

    const leaveRoom = () => {
        setConnected(false);
        router.back();
    };

    // ── Render states ────────────────────────────────────────────────────────

    if (loadingRoom) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950">
                <div className="text-white text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-red-400" />
                    <p>Loading live stream...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950">
                <div className="text-center text-white max-w-sm px-4">
                    <AlertCircle className="h-14 w-14 mx-auto mb-4 text-red-400" />
                    <h2 className="text-xl font-bold mb-2">{error}</h2>
                    {room && (
                        <p className="text-gray-400 mb-4">{room.title}</p>
                    )}
                    <Button
                        variant="outline"
                        className="text-white border-white/30"
                        onClick={() => router.back()}
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (room?.status === LiveRoomStatus.SCHEDULED) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950">
                <div className="text-center text-white max-w-sm px-4">
                    <Radio className="h-14 w-14 mx-auto mb-4 text-blue-400" />
                    <h2 className="text-2xl font-bold mb-2">{room.title}</h2>
                    <p className="text-gray-400 mb-2">{room.description}</p>
                    {room.scheduledAt && (
                        <Badge className="bg-blue-600 text-white mb-4">
                            Starts{" "}
                            {new Date(room.scheduledAt).toLocaleString()}
                        </Badge>
                    )}
                    <br />
                    <Button
                        variant="outline"
                        className="text-white border-white/30 mt-4"
                        onClick={() => router.back()}
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // ── Connected view ───────────────────────────────────────────────────────

    const isLiveKitConfigured = wsUrl && !token?.startsWith("demo-token:");

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden">
            {/* ── Main video area ── */}
            <div className="flex-1 flex flex-col relative">
                {/* Video */}
                <div className="flex-1 flex items-center justify-center bg-gray-900 relative">
                    {connected ? (
                        isLiveKitConfigured ? (
                            // LiveKit components would be rendered here when properly configured.
                            // Import dynamically to avoid SSR issues:
                            // import('@livekit/components-react').then(...)
                            <LiveKitVideoArea
                                token={token!}
                                wsUrl={wsUrl}
                                onDisconnect={leaveRoom}
                            />
                        ) : (
                            <div className="text-center text-gray-400 max-w-md px-4">
                                <Radio className="h-20 w-20 mx-auto mb-4 text-red-400 opacity-60" />
                                <p className="text-white font-semibold text-lg mb-2">
                                    {room?.title}
                                </p>
                                <p className="text-sm mb-4">
                                    Live stream is active. WebRTC video requires
                                    LiveKit server credentials to be configured.
                                </p>
                                <a
                                    href="https://livekit.io"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 text-xs underline flex items-center justify-center gap-1"
                                >
                                    Get free LiveKit credentials{" "}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )
                    ) : (
                        // Pre-join screen
                        <div className="text-center text-white max-w-sm px-4">
                            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
                                <Radio className="h-10 w-10 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-1">
                                {room?.title}
                            </h2>
                            {room?.description && (
                                <p className="text-gray-400 text-sm mb-4">
                                    {room.description}
                                </p>
                            )}
                            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-6">
                                <Eye className="h-4 w-4" />
                                <span>{room?.viewerCount ?? 0} watching</span>
                            </div>
                            <Button
                                onClick={connectToRoom}
                                disabled={connecting || !token}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3"
                                size="lg"
                            >
                                {connecting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Video className="h-4 w-4 mr-2" />
                                        Join Live Stream
                                    </>
                                )}
                            </Button>
                            {!token && (
                                <p className="text-gray-500 text-xs mt-2">
                                    Stream not yet initialized
                                </p>
                            )}
                        </div>
                    )}

                    {/* Floating reactions */}
                    <div className="absolute bottom-20 right-4 pointer-events-none flex flex-col-reverse gap-1">
                        {floatingReactions.map((r) => (
                            <span
                                key={r.id}
                                className="text-3xl animate-bounce"
                                style={{
                                    animation:
                                        "floatUp 2.5s ease-out forwards",
                                }}
                            >
                                {r.emoji}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-red-500 text-white animate-pulse font-bold text-xs px-2">
                            ● LIVE
                        </Badge>
                        <span className="text-white font-medium text-sm truncate max-w-xs">
                            {room?.title}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white text-sm pointer-events-auto">
                        <Eye className="h-4 w-4" />
                        <span>{room?.viewerCount ?? 0}</span>
                    </div>
                </div>

                {/* Bottom controls */}
                {connected && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
                        {/* Reactions */}
                        <div className="flex items-center gap-3">
                            {room?.reactionsEnabled &&
                                ["❤️", "👍", "😂", "🔥", "👏"].map((e) => (
                                    <ReactionButton
                                        key={e}
                                        emoji={e}
                                        onClick={() => sendReaction(e)}
                                    />
                                ))}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            {room?.chatEnabled && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={() => setShowChat(!showChat)}
                                >
                                    <MessageSquare className="h-5 w-5" />
                                </Button>
                            )}
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={leaveRoom}
                                title="Leave stream"
                            >
                                <PhoneOff className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Chat sidebar ── */}
            {connected && showChat && room?.chatEnabled && (
                <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                        <h3 className="text-white font-medium text-sm">
                            Live Chat
                        </h3>
                        <button
                            onClick={() => setShowChat(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {messages.map((msg) => (
                            <div key={msg.id} className="text-sm">
                                {msg.user === "System" ? (
                                    <p className="text-gray-500 text-xs italic text-center">
                                        {msg.message}
                                    </p>
                                ) : msg.reaction ? (
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-400 text-xs font-medium">
                                            {msg.user}
                                        </span>
                                        <span className="text-lg">
                                            {msg.reaction}
                                        </span>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="text-chabaqa-primary text-xs font-semibold">
                                            {msg.user}
                                        </span>
                                        <span className="text-gray-300 ml-1">
                                            {msg.message}
                                        </span>
                                        <span className="text-gray-600 text-xs ml-1">
                                            {msg.time}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-3 border-t border-gray-800">
                        <div className="flex gap-2">
                            <Input
                                value={newMsg}
                                onChange={(e) => setNewMsg(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && sendMessage()
                                }
                                placeholder="Say something..."
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm"
                            />
                            <Button
                                size="icon"
                                onClick={sendMessage}
                                className="bg-chabaqa-primary hover:bg-chabaqa-primary/90 shrink-0"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-120px) scale(1.4); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

// ─── LiveKit video area (dynamic, only rendered when configured) ──────────────
// This component wraps @livekit/components-react so it can be loaded dynamically.

function LiveKitVideoArea({
    token,
    wsUrl,
    onDisconnect,
}: {
    token: string;
    wsUrl: string;
    onDisconnect: () => void;
}) {
    const [LiveKitRoom, setLiveKitRoom] = useState<any>(null);
    const [VideoConference, setVideoConference] = useState<any>(null);

    useEffect(() => {
        import("@livekit/components-react")
            .then((mod) => {
                setLiveKitRoom(() => mod.LiveKitRoom);
                setVideoConference(() => mod.VideoConference);
            })
            .catch(() => {
                // Package not available
            });
    }, []);

    if (!LiveKitRoom || !VideoConference) {
        return (
            <div className="text-center text-gray-400">
                <Radio className="h-16 w-16 mx-auto mb-3 text-red-400 opacity-60" />
                <p className="text-white font-semibold">Connected to stream</p>
                <p className="text-sm mt-1">
                    Loading video components...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <LiveKitRoom
                serverUrl={wsUrl}
                token={token}
                connect={true}
                audio={false}
                video={false}
                onDisconnected={onDisconnect}
                className="w-full h-full"
            >
                <VideoConference />
            </LiveKitRoom>
        </div>
    );
}
