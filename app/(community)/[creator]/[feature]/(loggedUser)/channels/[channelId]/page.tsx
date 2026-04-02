"use client";

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Hash,
    Send,
    Paperclip,
    Pin,
    Smile,
    Reply,
    Pencil,
    Trash2,
    ArrowLeft,
    Loader2,
    Lock,
    Megaphone,
    Users,
    Search,
    X,
    FileIcon,
    Video,
} from "lucide-react";
import {
    format,
    formatDistanceToNow,
    isToday,
    isYesterday,
    isSameDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthContext } from "@/app/providers/auth-provider";
import { useChannelSocket } from "@/lib/channel-socket-context";
import { useChannelLayout } from "../layout";
import { getErrorMessage } from "@/lib/utils/error-messages";

// ── Helpers ────────────────────────────────────────────────────────────

const normalizeParam = (value: string | string[] | undefined): string => {
    if (!value) return "";
    return Array.isArray(value) ? value[0] : value;
};

const getUserId = (user: any): string => user?.id || user?._id || "";

const getSenderId = (msg: any): string => {
    const s = msg?.senderId ?? msg?.sender;
    if (!s) return "";
    if (typeof s === "string") return s;
    return s._id || s.id || "";
};

const getSenderName = (msg: any): string => {
    const s = msg?.sender || msg?.senderId;
    if (!s || typeof s === "string") return "User";
    return (
        s.name ||
        `${s.firstName || ""} ${s.lastName || ""}`.trim() ||
        s.username ||
        "User"
    );
};

const getSenderAvatar = (msg: any): string | undefined => {
    const s = msg?.sender || msg?.senderId;
    if (!s || typeof s === "string") return undefined;
    return s.avatar || s.profile_picture || s.photo_profil || s.photo;
};

const formatMessageTime = (date: string): string => {
    const d = new Date(date);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday " + format(d, "h:mm a");
    return format(d, "MMM d, h:mm a");
};

const formatDateSeparator = (date: string): string => {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
};

const isImageAttachment = (att: any): boolean => {
    if (att.type === "image") return true;
    return /\.(png|jpe?g|gif|webp)$/i.test(att.url || "");
};

const channelIcon = (channel: any) => {
    if (channel?.emoji) return channel.emoji;
    if (channel?.type === "ANNOUNCEMENTS") return null;
    if (channel?.visibility === "PRIVATE") return null;
    return null;
};

const FIVE_MINUTES = 5 * 60 * 1000;

// ── Component ──────────────────────────────────────────────────────────

export default function ChannelChatPage() {
    const { user: currentUser } = useAuthContext();
    const {
        socket,
        isConnected,
        onlineUsers,
        typingUsers,
        joinChannel,
        leaveChannel,
        joinCommunity,
        sendTypingStart,
        sendTypingStop,
    } = useChannelSocket();
    // Consume channels + communityId from the parent layout context
    // so we don't double-fetch what the layout already provides.
    const {
        channels,
        isLoading: isLoadingChannels,
        communityId: layoutCommunityId,
        refreshChannels: refreshChannelList,
    } = useChannelLayout();
    const router = useRouter();
    const params = useParams();

    const creator = normalizeParam(
        params?.creator as string | string[] | undefined,
    );
    const feature = normalizeParam(
        params?.feature as string | string[] | undefined,
    );
    const channelId = normalizeParam(
        params?.channelId as string | string[] | undefined,
    );

    const myId = getUserId(currentUser);

    // ── State ──────────────────────────────────────────────────────────

    // communityId is sourced from the parent layout context (already resolved there)
    const communityId = layoutCommunityId || "";

    const [currentChannel, setCurrentChannel] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null,
    );
    const [editText, setEditText] = useState("");
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [showMobileList, setShowMobileList] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    // Derive unread counts map from the layout context's channels array.
    // The layout keeps these up-to-date via socket events so we never need a
    // separate REST call or local socket listener for unread counts.
    const unreadCounts = useMemo<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        channels.forEach((c: any) => {
            const id = c.id || c._id;
            if (id) map[id] = c.unreadCount ?? 0;
        });
        return map;
    }, [channels]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const isTypingRef = useRef(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const channelsBasePath =
        creator && feature ? `/${creator}/${feature}/channels` : "/channels";

    // ── Scroll helpers ─────────────────────────────────────────────────

    const scrollToBottom = useCallback((force = false) => {
        requestAnimationFrame(() => {
            if (!scrollRef.current) return;
            const el = scrollRef.current;
            const isNearBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 150;
            if (force || isNearBottom) {
                el.scrollTop = el.scrollHeight;
            }
        });
    }, []);

    // ── Load current channel + messages ────────────────────────────────

    const loadMessages = useCallback(
        async (chId: string, cursor?: string) => {
            if (!chId) return;
            try {
                if (!cursor) setIsLoadingMessages(true);
                const params: any = { limit: 40 };
                if (cursor) params.cursor = cursor;
                const res = await api.channel.listMessages(chId, params);
                const msgs =
                    res?.messages || res?.data?.messages || res?.data || [];
                const resHasMore = res?.hasMore ?? res?.data?.hasMore ?? false;
                const resCursor =
                    res?.nextCursor || res?.data?.nextCursor || null;

                if (cursor) {
                    // Prepending older messages
                    prevScrollHeightRef.current =
                        scrollRef.current?.scrollHeight || 0;
                    setMessages((prev) => [
                        ...(Array.isArray(msgs) ? msgs : []),
                        ...prev,
                    ]);
                    // Maintain scroll position after prepend
                    requestAnimationFrame(() => {
                        if (scrollRef.current) {
                            const newHeight = scrollRef.current.scrollHeight;
                            scrollRef.current.scrollTop =
                                newHeight - prevScrollHeightRef.current;
                        }
                    });
                } else {
                    setMessages(Array.isArray(msgs) ? msgs : []);
                    setTimeout(() => scrollToBottom(true), 100);
                }
                setHasMore(resHasMore);
                setNextCursor(resCursor);
            } catch (err) {
                console.error("Failed to load messages:", err);
                setError(getErrorMessage(err) || "Failed to load messages");
            } finally {
                setIsLoadingMessages(false);
            }
        },
        [scrollToBottom],
    );

    const loadCurrentChannel = useCallback(async () => {
        if (!channelId) return;
        try {
            const res = await api.channel.getById(channelId);
            const channel =
                res?.channel || res?.data?.channel || res?.data || res;
            setCurrentChannel(channel);
        } catch (err) {
            console.error("Failed to load channel:", err);
        }
    }, [channelId]);

    useEffect(() => {
        if (!channelId) return;
        loadCurrentChannel();
        loadMessages(channelId);
        // Mark as read
        api.channel.markAsRead(channelId).catch(() => {});
        // Save to localStorage
        if (feature) {
            try {
                localStorage.setItem(`lastChannel_${feature}`, channelId);
            } catch {}
        }
    }, [channelId, loadCurrentChannel, loadMessages, feature]);

    // ── Join/leave channel room ────────────────────────────────────────

    useEffect(() => {
        if (!channelId || !isConnected) return;
        joinChannel(channelId);
        return () => {
            leaveChannel(channelId);
        };
    }, [channelId, isConnected, joinChannel, leaveChannel]);

    useEffect(() => {
        if (!communityId || !isConnected) return;
        joinCommunity(communityId);
    }, [communityId, isConnected, joinCommunity]);

    // ── Socket subscriptions ───────────────────────────────────────────

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (payload: any) => {
            const msg = payload?.message || payload;
            const msgChannelId = msg?.channelId || payload?.channelId;
            if (msgChannelId === channelId && msg) {
                setMessages((prev) => {
                    // Replace optimistic message if tempId matches
                    if (msg._tempId) {
                        const idx = prev.findIndex(
                            (m) => (m as any)._tempId === msg._tempId,
                        );
                        if (idx !== -1) {
                            const updated = [...prev];
                            updated[idx] = msg;
                            return updated;
                        }
                    }
                    // Skip duplicates
                    const msgId = msg._id || msg.id;
                    if (msgId && prev.some((m) => (m._id || m.id) === msgId))
                        return prev;
                    return [...prev, msg];
                });
                scrollToBottom();
                // Mark as read since we're looking at the channel
                api.channel.markAsRead(channelId).catch(() => {});
            }
            // Unread counts for other channels are managed by the layout
            // context via channel:unread:update — no local state update needed.
        };

        const handleMessageEdited = (payload: any) => {
            const msg = payload?.message || payload;
            const msgId = msg?._id || msg?.id;
            if (!msgId) return;
            setMessages((prev) =>
                prev.map((m) =>
                    (m._id || m.id) === msgId ? { ...m, ...msg } : m,
                ),
            );
        };

        const handleMessageDeleted = (payload: any) => {
            const msgId =
                payload?.messageId ||
                payload?.message?._id ||
                payload?.message?.id;
            if (!msgId) return;
            setMessages((prev) =>
                prev.map((m) =>
                    (m._id || m.id) === msgId
                        ? {
                              ...m,
                              text: "",
                              isDeleted: true,
                              deletedAt: new Date().toISOString(),
                          }
                        : m,
                ),
            );
        };

        const handleReaction = (payload: any) => {
            const msgId = payload?.messageId;
            const reactions = payload?.reactions;
            if (!msgId || !reactions) return;
            setMessages((prev) =>
                prev.map((m) =>
                    (m._id || m.id) === msgId ? { ...m, reactions } : m,
                ),
            );
        };

        socket.on("channel:message:new", handleNewMessage);
        socket.on("channel:message:edited", handleMessageEdited);
        socket.on("channel:message:deleted", handleMessageDeleted);
        socket.on("channel:message:reaction", handleReaction);
        // NOTE: channel:unread:update is handled by the parent layout context
        // which keeps the channels array (and its unreadCount fields) in sync.
        // We derive unreadCounts via useMemo from that array, so no local
        // listener is needed here.

        return () => {
            socket.off("channel:message:new", handleNewMessage);
            socket.off("channel:message:edited", handleMessageEdited);
            socket.off("channel:message:deleted", handleMessageDeleted);
            socket.off("channel:message:reaction", handleReaction);
        };
    }, [socket, channelId, scrollToBottom]);

    // ── Typing ─────────────────────────────────────────────────────────

    const handleTypingStart = useCallback(() => {
        if (!channelId) return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            sendTypingStart(channelId);
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            sendTypingStop(channelId);
        }, 3000);
    }, [channelId, sendTypingStart, sendTypingStop]);

    const handleTypingStopImmediate = useCallback(() => {
        if (!channelId) return;
        if (isTypingRef.current) {
            isTypingRef.current = false;
            sendTypingStop(channelId);
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    }, [channelId, sendTypingStop]);

    // ── Typing users for this channel ──────────────────────────────────

    const channelTypingUsers = useMemo(() => {
        const users = typingUsers.get(channelId) || [];
        return users.filter(
            (u: {
                userId: string;
                username: string;
                avatar?: string;
                channelId: string;
            }) => u.userId !== myId,
        );
    }, [typingUsers, channelId, myId]);

    // ── Send message ───────────────────────────────────────────────────

    const handleSendMessage = async () => {
        const text = newMessage.trim();
        if (!text || !channelId) return;

        setNewMessage("");
        setError(null);
        handleTypingStopImmediate();

        const tempId = "temp-" + Date.now();
        const optimisticMsg: any = {
            _tempId: tempId,
            _isOptimistic: true,
            _id: tempId,
            id: tempId,
            channelId,
            senderId: myId,
            sender: {
                _id: myId,
                id: myId,
                name:
                    (currentUser as any)?.name ||
                    (currentUser as any)?.username ||
                    "You",
                avatar:
                    (currentUser as any)?.avatar ||
                    (currentUser as any)?.profile_picture,
            },
            text,
            attachments: [],
            reactions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        scrollToBottom(true);

        try {
            const res = await api.channel.sendMessage(channelId, { text });
            const serverMsg =
                res?.message || res?.data?.message || res?.data || res;
            const serverId = serverMsg?._id || serverMsg?.id;
            if (serverId) {
                setMessages((prev) => {
                    const withoutTemp = prev.filter(
                        (m) => (m._id || m.id) !== tempId,
                    );
                    if (withoutTemp.some((m) => (m._id || m.id) === serverId))
                        return withoutTemp;
                    return [...withoutTemp, serverMsg];
                });
            }
        } catch (err) {
            setMessages((prev) =>
                prev.map((m) =>
                    (m._id || m.id) === tempId ? { ...m, _isFailed: true } : m,
                ),
            );
            setError(getErrorMessage(err) || "Failed to send message");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ── Edit message ───────────────────────────────────────────────────

    const handleStartEdit = (msg: any) => {
        setEditingMessageId(msg._id || msg.id);
        setEditText(msg.text || "");
    };

    const handleSaveEdit = async () => {
        if (!editingMessageId || !editText.trim() || !channelId) return;
        try {
            await api.channel.editMessage(
                channelId,
                editingMessageId,
                editText.trim(),
            );
            setMessages((prev) =>
                prev.map((m) =>
                    (m._id || m.id) === editingMessageId
                        ? { ...m, text: editText.trim(), isEdited: true }
                        : m,
                ),
            );
        } catch (err) {
            setError(getErrorMessage(err) || "Failed to edit message");
        } finally {
            setEditingMessageId(null);
            setEditText("");
        }
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditText("");
    };

    // ── Delete message ─────────────────────────────────────────────────

    const handleDeleteMessage = async (msgId: string) => {
        if (!channelId) return;
        try {
            await api.channel.deleteMessage(channelId, msgId);
            setMessages((prev) =>
                prev.map((m) =>
                    (m._id || m.id) === msgId
                        ? {
                              ...m,
                              text: "",
                              isDeleted: true,
                              deletedAt: new Date().toISOString(),
                          }
                        : m,
                ),
            );
        } catch (err) {
            setError(getErrorMessage(err) || "Failed to delete message");
        }
    };

    // ── Reaction ───────────────────────────────────────────────────────

    const handleAddReaction = async (msgId: string, emoji: string) => {
        if (!channelId) return;
        try {
            const res = await api.channel.addReaction(channelId, msgId, emoji);
            const reactions =
                res?.reactions ||
                res?.message?.reactions ||
                res?.data?.reactions;
            if (reactions) {
                setMessages((prev) =>
                    prev.map((m) =>
                        (m._id || m.id) === msgId ? { ...m, reactions } : m,
                    ),
                );
            }
        } catch {
            // silently fail
        }
    };

    // ── File upload ────────────────────────────────────────────────────

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !channelId) return;

        setIsUploading(true);
        setError(null);
        try {
            const res = await api.channel.uploadAttachment(channelId, file);
            const serverMsg = res?.message || res?.data?.message || res?.data;
            if (serverMsg) {
                setMessages((prev) => [...prev, serverMsg]);
                scrollToBottom(true);
            }
        } catch (err) {
            setError(getErrorMessage(err) || "Failed to upload file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // ── Load more (scroll to top) ──────────────────────────────────────

    const handleScroll = useCallback(() => {
        if (!scrollRef.current || !hasMore || isLoadingMessages) return;
        if (scrollRef.current.scrollTop < 60 && nextCursor) {
            loadMessages(channelId, nextCursor);
        }
    }, [hasMore, isLoadingMessages, nextCursor, channelId, loadMessages]);

    // ── Channel navigation ─────────────────────────────────────────────

    const handleSelectChannel = (ch: any) => {
        const chId = ch._id || ch.id;
        if (chId === channelId) return;
        setShowMobileList(false);
        router.push(`${channelsBasePath}/${chId}`);
    };

    // ── Filtered channels ──────────────────────────────────────────────

    const filteredChannels = useMemo(() => {
        if (!searchQuery.trim()) return channels;
        return channels.filter((ch) =>
            (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [channels, searchQuery]);

    // ── Message grouping helper ────────────────────────────────────────

    const shouldShowSenderInfo = (msg: any, index: number): boolean => {
        if (index === 0) return true;
        const prevMsg = messages[index - 1];
        if (!prevMsg) return true;
        if (prevMsg.isDeleted) return true;
        const prevSenderId = getSenderId(prevMsg);
        const curSenderId = getSenderId(msg);
        if (prevSenderId !== curSenderId) return true;
        const prevTime = new Date(prevMsg.createdAt).getTime();
        const curTime = new Date(msg.createdAt).getTime();
        return curTime - prevTime > FIVE_MINUTES;
    };

    // ── Permissions ────────────────────────────────────────────────────

    const isAnnouncementChannel = currentChannel?.type === "ANNOUNCEMENT";
    const isAdmin =
        currentChannel?.myRole === "admin" ||
        currentChannel?.myRole === "owner" ||
        currentChannel?.isAdmin;
    const canSend = !isAnnouncementChannel || isAdmin;
    const memberCount =
        currentChannel?.memberCount || currentChannel?.members?.length || 0;

    // ── Focus input on channel change ──────────────────────────────────

    useEffect(() => {
        if (!isLoadingMessages && canSend) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [channelId, isLoadingMessages, canSend]);

    // ── Render ─────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#f8f8fb]">
            <div className="mx-auto w-full max-w-7xl px-2 py-4 sm:px-4 sm:py-6">
                <div className="grid h-[calc(100vh-120px)] grid-cols-1 gap-3 md:grid-cols-[320px_1fr]">
                    {/* ── LEFT SIDEBAR: Channel List ──────────────────────────── */}
                    <div
                        className={cn(
                            "flex flex-col rounded-2xl border border-[#e8e9f1] bg-white shadow-sm overflow-hidden",
                            showMobileList ? "flex" : "hidden md:flex",
                        )}
                    >
                        {/* Sidebar Header */}
                        <div className="border-b border-[#f1f2f8] px-4 py-4">
                            <div className="mb-3 flex items-center gap-2">
                                <Hash className="h-5 w-5 text-[#8e78fb]" />
                                <h2 className="text-base font-bold text-[#1f2430]">
                                    Channels
                                </h2>
                                {channels.length > 0 && (
                                    <span className="rounded-full bg-[#f1f2f8] px-2 py-0.5 text-[11px] font-medium text-[#6b7280]">
                                        {channels.length}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-[#6b7280]" />
                                <Input
                                    placeholder="Search channels..."
                                    value={searchQuery}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => setSearchQuery(e.target.value)}
                                    className="h-8 border-[#e8e9f1] bg-[#f8f8fb] text-sm"
                                />
                            </div>
                        </div>

                        {/* Channel List */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoadingChannels ? (
                                <div className="flex h-40 items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-[#8e78fb]" />
                                </div>
                            ) : filteredChannels.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center px-6 text-center">
                                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f2f8]">
                                        <Hash className="h-5 w-5 text-[#6b7280]" />
                                    </div>
                                    <p className="text-sm font-medium text-[#1f2430]">
                                        No channels
                                    </p>
                                    <p className="text-xs text-[#6b7280]">
                                        {searchQuery
                                            ? "No channels match your search"
                                            : "No channels available yet"}
                                    </p>
                                </div>
                            ) : (
                                <div className="py-1">
                                    {filteredChannels.map((ch) => {
                                        const chId = ch._id || ch.id;
                                        const isActive = chId === channelId;
                                        const unread = unreadCounts[chId] || 0;
                                        const emoji = channelIcon(ch);
                                        const isPrivate =
                                            ch.visibility === "PRIVATE";
                                        const isAnnouncement =
                                            ch.type === "ANNOUNCEMENTS";

                                        return (
                                            <button
                                                key={chId}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectChannel(ch)
                                                }
                                                className={cn(
                                                    "flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors",
                                                    isActive
                                                        ? "border-l-2 border-[#8e78fb] bg-purple-50"
                                                        : "border-l-2 border-transparent hover:bg-[#f8f8fb]",
                                                )}
                                            >
                                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-sm">
                                                    {emoji ? (
                                                        <span>{emoji}</span>
                                                    ) : isAnnouncement ? (
                                                        <Megaphone className="h-4 w-4 text-[#8e78fb]" />
                                                    ) : isPrivate ? (
                                                        <Lock className="h-4 w-4 text-[#6b7280]" />
                                                    ) : (
                                                        <Hash className="h-4 w-4 text-[#6b7280]" />
                                                    )}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "min-w-0 flex-1 truncate text-sm",
                                                        isActive
                                                            ? "font-semibold text-[#1f2430]"
                                                            : "text-[#4b5563]",
                                                        unread > 0 &&
                                                            !isActive &&
                                                            "font-semibold text-[#1f2430]",
                                                    )}
                                                >
                                                    {ch.name}
                                                </span>
                                                {unread > 0 && !isActive && (
                                                    <span className="flex-shrink-0 rounded-full bg-[#8e78fb] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                        {unread > 99
                                                            ? "99+"
                                                            : unread}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT PANEL: Chat Area ──────────────────────────────── */}
                    <div
                        className={cn(
                            "flex flex-col rounded-2xl border border-[#e8e9f1] bg-white shadow-sm overflow-hidden",
                            showMobileList ? "hidden md:flex" : "flex",
                        )}
                    >
                        {/* Chat Header */}
                        <div className="flex items-center justify-between border-b border-[#f1f2f8] px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="flex-shrink-0 md:hidden"
                                    onClick={() => setShowMobileList(true)}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>

                                {currentChannel ? (
                                    <>
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50">
                                            {currentChannel.emoji ? (
                                                <span className="text-base">
                                                    {currentChannel.emoji}
                                                </span>
                                            ) : currentChannel.type ===
                                              "ANNOUNCEMENT" ? (
                                                <Megaphone className="h-4 w-4 text-[#8e78fb]" />
                                            ) : (
                                                <Hash className="h-4 w-4 text-[#8e78fb]" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="truncate text-sm font-semibold text-[#1f2430]">
                                                    {currentChannel.name}
                                                </h3>
                                                {currentChannel.visibility ===
                                                    "PRIVATE" && (
                                                    <Lock className="h-3 w-3 flex-shrink-0 text-[#6b7280]" />
                                                )}
                                            </div>
                                            {currentChannel.description && (
                                                <p className="truncate text-xs text-[#6b7280]">
                                                    {currentChannel.description}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-[#6b7280]" />
                                        <span className="text-sm text-[#6b7280]">
                                            Select a channel
                                        </span>
                                    </div>
                                )}
                            </div>

                            {currentChannel && (
                                <div className="flex items-center gap-2">
                                    <div className="hidden items-center gap-1 rounded-full bg-[#f1f2f8] px-2.5 py-1 text-xs text-[#6b7280] sm:flex">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>{memberCount}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        title="Pinned messages"
                                    >
                                        <Pin className="h-4 w-4 text-[#6b7280]" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-4 py-4"
                            onScroll={handleScroll}
                        >
                            {isLoadingMessages && messages.length === 0 ? (
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-[#8e78fb]" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-purple-50">
                                        <Hash className="h-7 w-7 text-[#8e78fb]" />
                                    </div>
                                    <p className="text-base font-semibold text-[#1f2430]">
                                        Welcome to #
                                        {currentChannel?.name || "channel"}
                                    </p>
                                    <p className="mt-1 text-sm text-[#6b7280]">
                                        This is the beginning of the channel.
                                        Say hello! 👋
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {/* Load more indicator */}
                                    {hasMore && (
                                        <div className="mb-3 flex justify-center">
                                            {isLoadingMessages ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-[#8e78fb]" />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        nextCursor &&
                                                        loadMessages(
                                                            channelId,
                                                            nextCursor,
                                                        )
                                                    }
                                                    className="text-xs text-[#8e78fb] hover:underline"
                                                >
                                                    Load older messages
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {messages.map((msg, index) => {
                                        const msgId = msg._id || msg.id;
                                        const senderId = getSenderId(msg);
                                        const isMine = senderId === myId;
                                        const showSender = shouldShowSenderInfo(
                                            msg,
                                            index,
                                        );
                                        const showDate =
                                            index === 0 ||
                                            !isSameDay(
                                                new Date(msg.createdAt),
                                                new Date(
                                                    messages[index - 1]
                                                        ?.createdAt ||
                                                        msg.createdAt,
                                                ),
                                            );
                                        const isSystem =
                                            msg.type === "system" ||
                                            msg.isSystem;
                                        const isDeleted = msg.isDeleted;
                                        const isEditing =
                                            editingMessageId === msgId;
                                        const isHovered =
                                            hoveredMessageId === msgId;
                                        const isOptimistic = msg._isOptimistic;
                                        const isFailed = msg._isFailed;
                                        const attachments =
                                            msg.attachments || [];
                                        const reactions = msg.reactions || [];
                                        const replyCount =
                                            msg.replyCount ||
                                            msg.threadCount ||
                                            0;
                                        const senderName = isMine
                                            ? "You"
                                            : getSenderName(msg);
                                        const senderAvatar =
                                            getSenderAvatar(msg);

                                        return (
                                            <div
                                                key={msgId}
                                                className="flex flex-col"
                                            >
                                                {/* Date separator */}
                                                {showDate && (
                                                    <div className="my-4 flex items-center justify-center">
                                                        <div className="h-px flex-1 bg-[#e8e9f1]" />
                                                        <span className="mx-3 rounded-full bg-[#f1f2f8] px-3 py-1 text-[11px] font-medium text-[#6b7280]">
                                                            {formatDateSeparator(
                                                                msg.createdAt,
                                                            )}
                                                        </span>
                                                        <div className="h-px flex-1 bg-[#e8e9f1]" />
                                                    </div>
                                                )}

                                                {/* System message */}
                                                {isSystem ? (
                                                    <div className="my-2 flex justify-center">
                                                        <p className="text-center text-xs italic text-[#9ca3af]">
                                                            {msg.text}
                                                        </p>
                                                    </div>
                                                ) : isDeleted ? (
                                                    <div
                                                        className={cn(
                                                            "my-1 flex",
                                                            isMine
                                                                ? "justify-end"
                                                                : "justify-start",
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "flex items-start gap-2.5",
                                                                showSender
                                                                    ? "mt-3"
                                                                    : "mt-0.5",
                                                            )}
                                                        >
                                                            {!isMine && (
                                                                <div className="w-8 flex-shrink-0">
                                                                    {showSender && (
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarImage
                                                                                src={
                                                                                    senderAvatar
                                                                                }
                                                                            />
                                                                            <AvatarFallback className="text-[10px]">
                                                                                {senderName
                                                                                    .slice(
                                                                                        0,
                                                                                        2,
                                                                                    )
                                                                                    .toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="rounded-xl bg-[#f8f8fb] px-3.5 py-2">
                                                                <p className="text-xs italic text-[#9ca3af]">
                                                                    This message
                                                                    was deleted
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Regular message */
                                                    <div
                                                        className={cn(
                                                            "group relative flex",
                                                            isMine
                                                                ? "justify-end"
                                                                : "justify-start",
                                                        )}
                                                        onMouseEnter={() =>
                                                            setHoveredMessageId(
                                                                msgId,
                                                            )
                                                        }
                                                        onMouseLeave={() =>
                                                            setHoveredMessageId(
                                                                null,
                                                            )
                                                        }
                                                    >
                                                        <div
                                                            className={cn(
                                                                "flex max-w-[85%] items-start gap-2.5 sm:max-w-[70%]",
                                                                showSender
                                                                    ? "mt-3"
                                                                    : "mt-0.5",
                                                                isMine &&
                                                                    "flex-row-reverse",
                                                            )}
                                                        >
                                                            {/* Avatar (left side for others) */}
                                                            {!isMine && (
                                                                <div className="w-8 flex-shrink-0">
                                                                    {showSender && (
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarImage
                                                                                src={
                                                                                    senderAvatar
                                                                                }
                                                                            />
                                                                            <AvatarFallback className="text-[10px]">
                                                                                {senderName
                                                                                    .slice(
                                                                                        0,
                                                                                        2,
                                                                                    )
                                                                                    .toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Message bubble */}
                                                            <div className="min-w-0">
                                                                {/* Sender name + time */}
                                                                {showSender && (
                                                                    <div
                                                                        className={cn(
                                                                            "mb-1 flex items-baseline gap-2",
                                                                            isMine &&
                                                                                "justify-end",
                                                                        )}
                                                                    >
                                                                        {!isMine && (
                                                                            <span className="text-xs font-semibold text-[#1f2430]">
                                                                                {
                                                                                    senderName
                                                                                }
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[10px] text-[#9ca3af]">
                                                                            {formatMessageTime(
                                                                                msg.createdAt,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <div
                                                                    className={cn(
                                                                        "relative rounded-2xl px-3.5 py-2.5 text-sm",
                                                                        isMine
                                                                            ? "bg-purple-100 text-[#1f2430]"
                                                                            : "bg-[#f1f2f8] text-[#1f2430]",
                                                                        isOptimistic &&
                                                                            "opacity-70",
                                                                        isFailed &&
                                                                            "border border-red-300 opacity-70",
                                                                    )}
                                                                >
                                                                    {/* Editing mode */}
                                                                    {isEditing ? (
                                                                        <div className="flex flex-col gap-2">
                                                                            <textarea
                                                                                value={
                                                                                    editText
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    setEditText(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className="w-full resize-none rounded-lg border border-[#e8e9f1] bg-white p-2 text-sm focus:border-[#8e78fb] focus:outline-none"
                                                                                rows={
                                                                                    2
                                                                                }
                                                                                autoFocus
                                                                                onKeyDown={(
                                                                                    e,
                                                                                ) => {
                                                                                    if (
                                                                                        e.key ===
                                                                                            "Enter" &&
                                                                                        !e.shiftKey
                                                                                    ) {
                                                                                        e.preventDefault();
                                                                                        handleSaveEdit();
                                                                                    }
                                                                                    if (
                                                                                        e.key ===
                                                                                        "Escape"
                                                                                    )
                                                                                        handleCancelEdit();
                                                                                }}
                                                                            />
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={
                                                                                        handleSaveEdit
                                                                                    }
                                                                                    className="rounded bg-[#8e78fb] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#7a65e8]"
                                                                                >
                                                                                    Save
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={
                                                                                        handleCancelEdit
                                                                                    }
                                                                                    className="rounded px-2.5 py-1 text-[11px] font-medium text-[#6b7280] hover:bg-[#f1f2f8]"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            {/* Attachments */}
                                                                            {attachments.length >
                                                                                0 && (
                                                                                <div className="mb-2 space-y-2">
                                                                                    {attachments.map(
                                                                                        (
                                                                                            att: any,
                                                                                            idx: number,
                                                                                        ) => (
                                                                                            <div
                                                                                                key={`${att.url}-${idx}`}
                                                                                            >
                                                                                                {isImageAttachment(
                                                                                                    att,
                                                                                                ) ? (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        className="block"
                                                                                                        onClick={() =>
                                                                                                            setPreviewImageUrl(
                                                                                                                att.url,
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        <img
                                                                                                            src={
                                                                                                                att.url
                                                                                                            }
                                                                                                            alt="Attachment"
                                                                                                            className="max-h-48 rounded-lg object-cover"
                                                                                                        />
                                                                                                    </button>
                                                                                                ) : (
                                                                                                    <div className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs">
                                                                                                        {att.type ===
                                                                                                        "video" ? (
                                                                                                            <Video className="h-4 w-4 text-[#6b7280]" />
                                                                                                        ) : (
                                                                                                            <FileIcon className="h-4 w-4 text-[#6b7280]" />
                                                                                                        )}
                                                                                                        <a
                                                                                                            className="text-[#8e78fb] underline"
                                                                                                            href={
                                                                                                                att.url
                                                                                                            }
                                                                                                            target="_blank"
                                                                                                            rel="noreferrer"
                                                                                                        >
                                                                                                            {att.name ||
                                                                                                                "View attachment"}
                                                                                                        </a>
                                                                                                        {att.size && (
                                                                                                            <span className="text-[#9ca3af]">
                                                                                                                (
                                                                                                                {Math.round(
                                                                                                                    att.size /
                                                                                                                        1024,
                                                                                                                )}
                                                                                                                KB)
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        ),
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {/* Text */}
                                                                            {msg.text && (
                                                                                <p className="whitespace-pre-wrap break-words">
                                                                                    {
                                                                                        msg.text
                                                                                    }
                                                                                </p>
                                                                            )}

                                                                            {/* Edited badge */}
                                                                            {msg.isEdited && (
                                                                                <span className="ml-1 text-[10px] text-[#9ca3af]">
                                                                                    (edited)
                                                                                </span>
                                                                            )}

                                                                            {/* Failed indicator */}
                                                                            {isFailed && (
                                                                                <p className="mt-1 text-[10px] text-red-500">
                                                                                    Failed
                                                                                    to
                                                                                    send
                                                                                    —
                                                                                    click
                                                                                    to
                                                                                    retry
                                                                                </p>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* Reactions bar */}
                                                                {reactions.length >
                                                                    0 &&
                                                                    !isEditing && (
                                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                                            {reactions.map(
                                                                                (
                                                                                    r: any,
                                                                                    idx: number,
                                                                                ) => {
                                                                                    const count =
                                                                                        r.count ||
                                                                                        r
                                                                                            .users
                                                                                            ?.length ||
                                                                                        1;
                                                                                    const hasReacted =
                                                                                        r.users?.includes(
                                                                                            myId,
                                                                                        ) ||
                                                                                        r.userIds?.includes(
                                                                                            myId,
                                                                                        );
                                                                                    return (
                                                                                        <button
                                                                                            key={`${r.emoji}-${idx}`}
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                handleAddReaction(
                                                                                                    msgId,
                                                                                                    r.emoji,
                                                                                                )
                                                                                            }
                                                                                            className={cn(
                                                                                                "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors",
                                                                                                hasReacted
                                                                                                    ? "border-[#8e78fb] bg-purple-50 text-[#8e78fb]"
                                                                                                    : "border-[#e8e9f1] bg-white text-[#6b7280] hover:border-[#8e78fb]",
                                                                                            )}
                                                                                        >
                                                                                            <span>
                                                                                                {
                                                                                                    r.emoji
                                                                                                }
                                                                                            </span>
                                                                                            <span>
                                                                                                {
                                                                                                    count
                                                                                                }
                                                                                            </span>
                                                                                        </button>
                                                                                    );
                                                                                },
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                {/* Thread reply count */}
                                                                {replyCount >
                                                                    0 &&
                                                                    !isEditing && (
                                                                        <button
                                                                            type="button"
                                                                            className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#8e78fb] hover:underline"
                                                                        >
                                                                            <Reply className="h-3 w-3" />
                                                                            {
                                                                                replyCount
                                                                            }{" "}
                                                                            {replyCount ===
                                                                            1
                                                                                ? "reply"
                                                                                : "replies"}
                                                                        </button>
                                                                    )}

                                                                {/* Timestamp below if not first in group */}
                                                                {!showSender &&
                                                                    !isEditing && (
                                                                        <span className="mt-0.5 block text-[10px] text-[#c4c7cd] opacity-0 transition-opacity group-hover:opacity-100">
                                                                            {formatMessageTime(
                                                                                msg.createdAt,
                                                                            )}
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        </div>

                                                        {/* Hover actions */}
                                                        {isHovered &&
                                                            !isEditing &&
                                                            !isOptimistic && (
                                                                <div
                                                                    className={cn(
                                                                        "absolute -top-3 z-10 flex items-center gap-0.5 rounded-lg border border-[#e8e9f1] bg-white px-1 py-0.5 shadow-sm",
                                                                        isMine
                                                                            ? "right-0 mr-2"
                                                                            : "left-10",
                                                                    )}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleAddReaction(
                                                                                msgId,
                                                                                "👍",
                                                                            )
                                                                        }
                                                                        className="rounded p-1 text-[#6b7280] hover:bg-[#f1f2f8] hover:text-[#1f2430]"
                                                                        title="Like"
                                                                    >
                                                                        <Smile className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="rounded p-1 text-[#6b7280] hover:bg-[#f1f2f8] hover:text-[#1f2430]"
                                                                        title="Reply in thread"
                                                                    >
                                                                        <Reply className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    {isMine && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleStartEdit(
                                                                                    msg,
                                                                                )
                                                                            }
                                                                            className="rounded p-1 text-[#6b7280] hover:bg-[#f1f2f8] hover:text-[#1f2430]"
                                                                            title="Edit"
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    )}
                                                                    {(isMine ||
                                                                        isAdmin) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleDeleteMessage(
                                                                                    msgId,
                                                                                )
                                                                            }
                                                                            className="rounded p-1 text-[#6b7280] hover:bg-red-50 hover:text-red-500"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Typing indicator */}
                        {channelTypingUsers.length > 0 && (
                            <div className="border-t border-[#f1f2f8] px-4 py-1.5">
                                <p className="text-xs text-[#6b7280]">
                                    <span className="font-medium">
                                        {channelTypingUsers.length === 1
                                            ? channelTypingUsers[0].username ||
                                              "Someone"
                                            : channelTypingUsers.length === 2
                                              ? `${channelTypingUsers[0].username || "Someone"} and ${channelTypingUsers[1].username || "someone"}`
                                              : `${channelTypingUsers[0].username || "Someone"} and ${channelTypingUsers.length - 1} others`}
                                    </span>{" "}
                                    {channelTypingUsers.length === 1
                                        ? "is"
                                        : "are"}{" "}
                                    typing
                                    <span className="inline-flex w-5 tracking-widest">
                                        <span className="animate-pulse">
                                            ...
                                        </span>
                                    </span>
                                </p>
                            </div>
                        )}

                        {/* Composer */}
                        <div className="border-t border-[#f1f2f8] bg-white px-4 py-3">
                            {error && (
                                <div className="mb-2 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                                    <span>{error}</span>
                                    <button
                                        type="button"
                                        onClick={() => setError(null)}
                                        className="ml-2 text-red-400 hover:text-red-600"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}

                            {canSend ? (
                                <div className="flex items-end gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 flex-shrink-0"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        disabled={isUploading}
                                        title="Attach file"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Paperclip className="h-4 w-4 text-[#6b7280]" />
                                        )}
                                    </Button>
                                    <textarea
                                        ref={inputRef}
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            handleTypingStart();
                                        }}
                                        onBlur={handleTypingStopImmediate}
                                        onKeyDown={handleKeyDown}
                                        placeholder={`Message #${currentChannel?.name || "channel"}...`}
                                        className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-[#e8e9f1] bg-[#f8f8fb] px-3 py-2.5 text-sm text-[#1f2430] placeholder-[#9ca3af] focus:border-[#8e78fb] focus:outline-none focus:ring-1 focus:ring-[#8e78fb]/30"
                                        rows={1}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        className={cn(
                                            "h-9 w-9 flex-shrink-0 rounded-xl p-0",
                                            newMessage.trim()
                                                ? "bg-[#8e78fb] text-white hover:bg-[#7a65e8]"
                                                : "bg-[#f1f2f8] text-[#9ca3af]",
                                        )}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 rounded-xl bg-[#f8f8fb] py-3 text-sm text-[#9ca3af]">
                                    <Megaphone className="h-4 w-4" />
                                    <span>
                                        Only admins can post in this channel
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image preview overlay */}
            {previewImageUrl && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6">
                    <button
                        type="button"
                        className="absolute inset-0"
                        onClick={() => setPreviewImageUrl(null)}
                        aria-label="Close image preview"
                    />
                    <img
                        src={previewImageUrl}
                        alt="Preview"
                        className="relative max-h-full max-w-full rounded-xl"
                    />
                </div>
            )}
        </div>
    );
}
