"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/app/providers/auth-provider";
import { useCommunityGuard } from "@/hooks/use-community-guard";
import { PageShell } from "@/components/creator-dashboard";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    Calendar,
    Clock,
    Edit,
    Trash2,
    Loader2,
    ArrowLeft,
    Image as ImageIcon,
    Video,
    Link as LinkIcon,
    Plus,
} from "lucide-react";
import type { Post } from "@/lib/api/types";
import { CreatePostDialog } from "../components/create-post-dialog";

export default function ScheduledPostsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user: authUser, loading: authLoading, isAuthenticated } = useAuthContext();
    const { guard, selectedCommunityId, selectedCommunity, isLoading: communityLoading } = useCommunityGuard();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [editDialog, setEditDialog] = useState<{
        open: boolean;
        post: Post | null;
    }>({ open: false, post: null });

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/signin?redirect=/creator/posts/scheduled");
        }
    }, [authLoading, isAuthenticated, router]);

    const loadScheduledPosts = useCallback(async () => {
        if (communityLoading || !selectedCommunityId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await api.posts.getScheduled(selectedCommunityId);
            const data = (response as any)?.data;
            setPosts(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error("Failed to load scheduled posts:", error);
            toast({
                title: "Error",
                description: "Failed to load scheduled posts",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [communityLoading, selectedCommunityId, toast]);

    useEffect(() => {
        void loadScheduledPosts();
    }, [loadScheduledPosts]);

    const handleCancelSchedule = async (postId: string) => {
        setCancellingId(postId);
        try {
            await api.posts.cancelSchedule(postId);
            toast({
                title: "Cancelled",
                description: "The scheduled post has been moved to drafts.",
            });
            await loadScheduledPosts();
        } catch (error: any) {
            toast({
                title: "Error",
                description:
                    error?.response?.data?.message || "Failed to cancel scheduled post",
                variant: "destructive",
            });
        } finally {
            setCancellingId(null);
        }
    };

    const formatScheduledDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getTimeUntil = (dateStr: string): string => {
        const diff = new Date(dateStr).getTime() - Date.now();
        if (diff <= 0) return "Overdue";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
        }
        if (hours < 24) return `in ${hours} hour${hours !== 1 ? "s" : ""}`;
        const days = Math.floor(hours / 24);
        return `in ${days} day${days !== 1 ? "s" : ""}`;
    };

    if (guard) return guard;

    return (
        <PageShell className="max-w-4xl mx-auto space-y-8 p-5">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/creator/posts")}
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Posts
                </Button>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Scheduled Posts</h1>
                    <p className="text-gray-600 mt-1">
                        Manage upcoming posts for{" "}
                        {selectedCommunity?.name ?? "your community"}
                    </p>
                </div>
                <Button
                    onClick={() => setEditDialog({ open: true, post: null })}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Scheduled Post
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : posts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-1">
                            No scheduled posts
                        </p>
                        <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
                            Schedule a post to automatically publish it at a
                            chosen date and time.
                        </p>
                        <Button
                            onClick={() =>
                                setEditDialog({ open: true, post: null })
                            }
                            variant="outline"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Scheduled Post
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Card key={post.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="text-base truncate">
                                            {post.title || (
                                                <span className="italic text-gray-400">
                                                    Untitled post
                                                </span>
                                            )}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                            {post.content}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="bg-purple-100 text-purple-700 whitespace-nowrap flex-shrink-0"
                                    >
                                        <Clock className="h-3 w-3 mr-1" />
                                        Scheduled
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                                        {/* Scheduled time */}
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {post.scheduledAt
                                                    ? formatScheduledDate(post.scheduledAt)
                                                    : "Unknown time"}
                                            </span>
                                        </div>
                                        {/* Countdown */}
                                        {post.scheduledAt && (
                                            <span
                                                className={
                                                    new Date(post.scheduledAt).getTime() < Date.now()
                                                        ? "text-red-500"
                                                        : "text-green-600"
                                                }
                                            >
                                                {getTimeUntil(post.scheduledAt)}
                                            </span>
                                        )}
                                        {/* Media indicators */}
                                        {(post.images?.length ?? 0) > 0 && (
                                            <div className="flex items-center gap-1">
                                                <ImageIcon className="h-3.5 w-3.5" />
                                                <span>
                                                    {post.images!.length} image
                                                    {post.images!.length !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        )}
                                        {(post.videos?.length ?? 0) > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Video className="h-3.5 w-3.5" />
                                                <span>
                                                    {post.videos!.length} video
                                                    {post.videos!.length !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        )}
                                        {(post.links?.length ?? 0) > 0 && (
                                            <div className="flex items-center gap-1">
                                                <LinkIcon className="h-3.5 w-3.5" />
                                                <span>
                                                    {post.links!.length} link
                                                    {post.links!.length !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setEditDialog({
                                                    open: true,
                                                    post,
                                                })
                                            }
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    disabled={cancellingId === post.id}
                                                >
                                                    {cancellingId === post.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Cancel
                                                        </>
                                                    )}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Cancel scheduled post?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This post will be moved
                                                        to drafts and will no
                                                        longer be published
                                                        automatically. You can
                                                        still edit and publish
                                                        it manually.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                        Keep scheduled
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() =>
                                                            handleCancelSchedule(post.id)
                                                        }
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        Cancel post
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit / Create dialog */}
            <CreatePostDialog
                open={editDialog.open}
                onOpenChange={(open) => {
                    if (!open) setEditDialog({ open: false, post: null });
                    else setEditDialog((prev) => ({ ...prev, open: true }));
                }}
                communityId={selectedCommunityId || ""}
                onPostSaved={() => {
                    setEditDialog({ open: false, post: null });
                    void loadScheduledPosts();
                }}
                mode={editDialog.post ? "edit" : "create"}
                postToEdit={editDialog.post}
                showTrigger={false}
            />
        </PageShell>
    );
}
