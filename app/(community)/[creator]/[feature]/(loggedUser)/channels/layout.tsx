"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useChannelSocket } from "@/lib/channel-socket-context";
import type { Channel } from "@/lib/api/types";

interface ChannelLayoutContextType {
    channels: Channel[];
    isLoading: boolean;
    totalUnread: number;
    communityId: string | null;
    refreshChannels: () => Promise<void>;
}

const ChannelLayoutContext = createContext<ChannelLayoutContextType>({
    channels: [],
    isLoading: true,
    totalUnread: 0,
    communityId: null,
    refreshChannels: async () => {},
});

export const useChannelLayout = () => useContext(ChannelLayoutContext);

export default function ChannelsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const feature = Array.isArray(params?.feature)
        ? params.feature[0]
        : params?.feature;
    const { socket, joinCommunity } = useChannelSocket();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalUnread, setTotalUnread] = useState(0);
    const [communityId, setCommunityId] = useState<string | null>(null);

    // Keep a ref to the latest channels so socket handlers never capture stale state
    const channelsRef = useRef<Channel[]>([]);
    useEffect(() => {
        channelsRef.current = channels;
    }, [channels]);

    // Resolve communityId from the feature (community) slug
    useEffect(() => {
        if (!feature) return;
        let cancelled = false;
        api.communities
            .getBySlug(feature)
            .then((res: any) => {
                if (cancelled) return;
                const community = res?.data || res;
                const id = community?._id || community?.id || "";
                if (id) setCommunityId(id);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [feature]);

    const refreshChannels = useCallback(async () => {
        if (!communityId) return;
        try {
            setIsLoading(true);
            const res = await api.channel.listByCommunity(communityId);
            // Handle both { channels: [...] } and { data: { channels: [...] } } response shapes
            const data = res?.data || res;
            const list: Channel[] = data?.channels || data || [];
            const total: number = data?.totalUnread ?? 0;
            setChannels(Array.isArray(list) ? list : []);
            setTotalUnread(total);
        } catch (e) {
            console.error("Failed to load channels", e);
        } finally {
            setIsLoading(false);
        }
    }, [communityId]);

    useEffect(() => {
        refreshChannels();
    }, [refreshChannels]);

    // Join community room so we receive channel CRUD events
    useEffect(() => {
        if (communityId) joinCommunity(communityId);
    }, [communityId, joinCommunity]);

    // Socket events for real-time channel list updates.
    // NOTE: `channels` is intentionally NOT in the dep array — we use channelsRef
    // to avoid constantly tearing down and re-registering listeners on every
    // channel list mutation.
    useEffect(() => {
        if (!socket) return;

        const handleChannelCreated = (channel: Channel) => {
            setChannels((prev) => {
                const exists = prev.some(
                    (c) =>
                        (c.id || (c as any)._id) ===
                        (channel.id || (channel as any)._id),
                );
                if (exists) return prev;
                return [...prev, channel].sort(
                    (a, b) => a.position - b.position,
                );
            });
        };

        const handleChannelUpdated = (channel: Channel) => {
            setChannels((prev) =>
                prev.map((c) =>
                    (c.id || (c as any)._id) ===
                    (channel.id || (channel as any)._id)
                        ? { ...c, ...channel }
                        : c,
                ),
            );
        };

        const handleChannelDeleted = ({ channelId }: { channelId: string }) => {
            setChannels((prev) =>
                prev.filter((c) => (c.id || (c as any)._id) !== channelId),
            );
        };

        const handleUnreadUpdate = ({
            channelId,
            unreadCount,
        }: {
            channelId: string;
            unreadCount: number;
        }) => {
            // Update the channels list with the new unread count
            setChannels((prev) => {
                const updated = prev.map((c) =>
                    (c.id || (c as any)._id) === channelId
                        ? { ...c, unreadCount }
                        : c,
                );
                // Recompute totalUnread from the freshly-updated list to avoid stale closure
                const newTotal = updated.reduce(
                    (sum, c) => sum + (c.unreadCount ?? 0),
                    0,
                );
                setTotalUnread(newTotal);
                return updated;
            });
        };

        socket.on("channel:created", handleChannelCreated);
        socket.on("channel:updated", handleChannelUpdated);
        socket.on("channel:deleted", handleChannelDeleted);
        socket.on("channel:unread:update", handleUnreadUpdate);

        return () => {
            socket.off("channel:created", handleChannelCreated);
            socket.off("channel:updated", handleChannelUpdated);
            socket.off("channel:deleted", handleChannelDeleted);
            socket.off("channel:unread:update", handleUnreadUpdate);
        };
        // Only re-register when the socket instance itself changes, not on every
        // channels state update.
    }, [socket]);

    return (
        <ChannelLayoutContext.Provider
            value={{
                channels,
                isLoading,
                totalUnread,
                communityId,
                refreshChannels,
            }}
        >
            {children}
        </ChannelLayoutContext.Provider>
    );
}
