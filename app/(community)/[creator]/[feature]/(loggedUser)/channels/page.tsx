"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChannelLayout } from "./layout";
import { Hash, Loader2 } from "lucide-react";

export default function ChannelsPage() {
    const router = useRouter();
    const params = useParams();
    const creator = Array.isArray(params?.creator)
        ? params.creator[0]
        : params?.creator;
    const feature = Array.isArray(params?.feature)
        ? params.feature[0]
        : params?.feature;
    const { channels, isLoading } = useChannelLayout();

    useEffect(() => {
        if (isLoading || channels.length === 0) return;
        // Try to restore last visited channel
        const lastChannelId =
            typeof window !== "undefined"
                ? localStorage.getItem(`lastChannel_${feature}`)
                : null;
        const target =
            lastChannelId &&
            channels.find(
                (c) => c.id === lastChannelId || c._id === lastChannelId,
            )
                ? lastChannelId
                : channels[0]?.id || channels[0]?._id;
        if (target) {
            router.replace(`/${creator}/${feature}/channels/${target}`);
        }
    }, [isLoading, channels, creator, feature, router]);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (channels.length === 0) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-purple-100 p-4">
                    <Hash className="h-8 w-8 text-purple-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                    No channels yet
                </h2>
                <p className="max-w-md text-gray-500">
                    Channels are where your community conversations happen. Once
                    the creator sets up channels, they'll appear here.
                </p>
            </div>
        );
    }

    return null; // Will redirect above
}
