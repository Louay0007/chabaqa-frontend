"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { api } from "@/lib/api";
import { type Channel } from "@/lib/api/types";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    GripVertical,
    Plus,
    Hash,
    Settings,
    Lock,
    Volume2,
    Archive,
} from "lucide-react";

function SortableChannelItem({
    channel,
    onArchive,
}: {
    channel: Channel;
    onArchive: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: channel.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-4 mb-2 bg-white border rounded-lg shadow-sm ${
                isDragging ? "opacity-50 ring-2 ring-primary ring-offset-2" : ""
            }`}
        >
            <div className="flex items-center gap-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-gray-400 hover:text-gray-600 p-1"
                >
                    <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-xl">
                    {channel.emoji || (
                        <Hash className="h-5 w-5 text-gray-500" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm text-gray-900">
                            {channel.name}
                        </h3>
                        {channel.visibility === "PRIVATE" && (
                            <Lock className="h-3 w-3 text-gray-400" />
                        )}
                        {channel.type === "ANNOUNCEMENTS" && (
                            <Volume2 className="h-3 w-3 text-blue-500" />
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        {channel.description || "No description"}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Link href={`./channels/${channel.id}`}>
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onArchive(channel.id)}
                >
                    <Archive className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default function CreatorChannelsPage() {
    const { selectedCommunityId, selectedCommunity } = useCreatorCommunity();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedCommunityId) {
            fetchChannels();
        }
    }, [selectedCommunityId]);

    const fetchChannels = async () => {
        try {
            setLoading(true);
            const res = await api.channel.listByCommunity(selectedCommunityId!);
            // Unwrap TransformInterceptor envelope: { success, data: { channels } }
            const data = (res as any)?.data || res;
            // Normalise _id → id because the backend uses .lean() which omits the Mongoose id virtual
            const sorted = ((data?.channels || []) as any[])
                .map((c) => ({ ...c, id: c._id?.toString() || c.id }))
                .sort((a: Channel, b: Channel) => a.position - b.position);
            setChannels(sorted.filter((c: Channel) => !c.isArchived));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = channels.findIndex((c) => c.id === active.id);
            const newIndex = channels.findIndex((c) => c.id === over.id);
            const newChannels = arrayMove(channels, oldIndex, newIndex);

            setChannels(newChannels);

            // Save order
            try {
                await api.channel.reorder(
                    selectedCommunityId!,
                    newChannels.map((c) => c.id),
                );
            } catch (err) {
                console.error("Failed to save order", err);
                fetchChannels(); // revert on error
            }
        }
    };

    const handleArchive = async (id: string) => {
        if (!confirm("Are you sure you want to archive this channel?")) return;
        try {
            await api.channel.archive(id);
            setChannels(channels.filter((c) => c.id !== id));
        } catch (err) {
            console.error("Failed to archive channel", err);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4 max-w-4xl mx-auto">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Channels
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your community channels. Drag and drop to
                        reorder.
                    </p>
                </div>
                <Link href={`./channels/new`}>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Channel
                    </Button>
                </Link>
            </div>

            {channels.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg border-gray-200">
                    <Hash className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No channels yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Create your first channel to start chatting.
                    </p>
                    <Link href={`./channels/new`}>
                        <Button variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Channel
                        </Button>
                    </Link>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={channels.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {channels.map((channel) => (
                                <SortableChannelItem
                                    key={channel.id}
                                    channel={channel}
                                    onArchive={handleArchive}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}
