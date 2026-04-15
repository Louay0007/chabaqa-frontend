"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { storageApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/app/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Image as ImageIcon,
    Video,
    Link as LinkIcon,
    Smile,
    Loader2,
    X,
    Calendar,
    Clock,
} from "lucide-react";
import type { Post } from "@/lib/api/types";
import { WanisAssistButton } from "@/components/wanis-assist-button";

// Common emojis for quick access
const COMMON_EMOJIS = [
    "😀",
    "😂",
    "😍",
    "🎉",
    "🔥",
    "👍",
    "❤️",
    "🚀",
    "✨",
    "💯",
];

interface CreatePostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    communityId: string;
    onPostSaved: () => void;
    mode?: "create" | "edit";
    postToEdit?: Post | null;
    showTrigger?: boolean;
}

export function CreatePostDialog({
    open,
    onOpenChange,
    communityId,
    onPostSaved,
    mode = "create",
    postToEdit = null,
    showTrigger = true,
}: CreatePostDialogProps) {
    const { toast } = useToast();
    const { user: authUser } = useAuthContext();
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkTitle, setLinkTitle] = useState("");
    // Scheduling state
    const [publishMode, setPublishMode] = useState<"publish" | "schedule">("publish");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
    const isEditing = mode === "edit" && !!postToEdit;

    const resetForm = () => {
        setContent("");
        setTitle("");
        setTags([]);
        setTagInput("");
        setShowEmojiPicker(false);
        setUploadedFiles([]);
        setLinkUrl("");
        setLinkTitle("");
        setPublishMode("publish");
        setScheduledDate("");
        setScheduledTime("");
    };

    useEffect(() => {
        if (!open) return;
        if (isEditing && postToEdit) {
            setContent(postToEdit.content || "");
            setTitle(postToEdit.title || "");
            setTags(Array.isArray(postToEdit.tags) ? postToEdit.tags : []);
            setTagInput("");
            setShowEmojiPicker(false);
            setLinkUrl("");
            setLinkTitle("");
            // Restore scheduling state when editing a scheduled post
            if (postToEdit.status === "scheduled" && postToEdit.scheduledAt) {
                setPublishMode("schedule");
                const d = new Date(postToEdit.scheduledAt);
                setScheduledDate(d.toISOString().split("T")[0]);
                setScheduledTime(d.toTimeString().slice(0, 5));
            } else {
                setPublishMode("publish");
                setScheduledDate("");
                setScheduledTime("");
            }
            const initialFiles = [
                ...(postToEdit.images || []).map((url) => ({
                    type: "photo",
                    url,
                    originalName: url,
                })),
                ...(postToEdit.videos || []).map((url) => ({
                    type: "video",
                    url,
                    originalName: url,
                })),
                ...(postToEdit.links || []).map((link) => ({
                    type: "link",
                    url: link.url,
                    title: link.title || link.url,
                    originalName: link.title || link.url,
                })),
            ];
            setUploadedFiles(initialFiles);
            return;
        }
        resetForm();
    }, [open, isEditing, postToEdit]);

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleEmojiClick = (emoji: string) => {
        const el = contentTextareaRef.current;
        if (!el) {
            setContent((prev) => prev + emoji);
            return;
        }

        const start = el.selectionStart ?? content.length;
        const end = el.selectionEnd ?? content.length;
        const next = content.slice(0, start) + emoji + content.slice(end);
        setContent(next);

        // restore cursor position after state update
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + emoji.length;
            el.setSelectionRange(pos, pos);
        });
    };

    const handlePhotoUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = e.currentTarget.files;
        if (!files || files.length === 0) {
            return;
        }

        setIsLoading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!file.type.startsWith("image/")) {
                    toast({
                        title: "Invalid file",
                        description: `${file.name} is not an image file`,
                        variant: "destructive",
                    });
                    continue;
                }

                const uploadedFile = await storageApi.upload(file);
                setUploadedFiles((prev) => [
                    ...prev,
                    { ...uploadedFile, type: "photo" },
                ]);

                toast({
                    title: "Success",
                    description: `${file.name} uploaded successfully`,
                });
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            toast({
                title: "Upload failed",
                description: error?.message || "Failed to upload file",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleVideoUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = e.currentTarget.files;
        if (!files || files.length === 0) {
            return;
        }

        setIsLoading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!file.type.startsWith("video/")) {
                    toast({
                        title: "Invalid file",
                        description: `${file.name} is not a video file`,
                        variant: "destructive",
                    });
                    continue;
                }

                const uploadedFile = await storageApi.upload(file);
                setUploadedFiles((prev) => [
                    ...prev,
                    { ...uploadedFile, type: "video" },
                ]);

                toast({
                    title: "Success",
                    description: `${file.name} uploaded successfully`,
                });
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            toast({
                title: "Upload failed",
                description: error?.message || "Failed to upload file",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            if (videoInputRef.current) videoInputRef.current.value = "";
        }
    };

    const handleAddLink = () => {
        if (linkUrl.trim()) {
            setUploadedFiles((prev) => [
                ...prev,
                {
                    url: linkUrl,
                    type: "link",
                    title: linkTitle || linkUrl,
                    filename: linkUrl,
                },
            ]);
            toast({
                title: "Success",
                description: "Link added successfully",
            });
            setLinkUrl("");
            setLinkTitle("");
        }
    };

    const handleRemoveFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const validateScheduledAt = (): string | null => {
        if (publishMode !== "schedule") return null;
        if (!scheduledDate || !scheduledTime) {
            return "Please select both a date and time for the scheduled post.";
        }
        const scheduled = new Date(`${scheduledDate}T${scheduledTime}`);
        const minDate = new Date(Date.now() + 5 * 60 * 1000);
        const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        if (isNaN(scheduled.getTime())) {
            return "The scheduled date/time is invalid.";
        }
        if (scheduled < minDate) {
            return "Scheduled time must be at least 5 minutes in the future.";
        }
        if (scheduled > maxDate) {
            return "Scheduled time cannot be more than 30 days in the future.";
        }
        return null;
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast({
                title: "Error",
                description: "Post content cannot be empty",
                variant: "destructive",
            });
            return;
        }

        const scheduleError = validateScheduledAt();
        if (scheduleError) {
            toast({
                title: "Invalid schedule",
                description: scheduleError,
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const images = uploadedFiles
                .filter((f) => f.type === "photo" && f.url)
                .map((f) => f.url);

            const videos = uploadedFiles
                .filter((f) => f.type === "video" && f.url)
                .map((f) => f.url);

            const links = uploadedFiles
                .filter((f) => f.type === "link" && f.url)
                .map((f) => ({
                    url: f.url,
                    title: f.title || undefined,
                }));

            const scheduledAtIso =
                publishMode === "schedule" && scheduledDate && scheduledTime
                    ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
                    : undefined;

            const payload = {
                title: title || undefined,
                content,
                communityId,
                tags,
                thumbnail: images[0],
                images: images.length > 0 ? images : undefined,
                videos: videos.length > 0 ? videos : undefined,
                links: links.length > 0 ? links : undefined,
                publishMode,
                ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
            };

            if (isEditing && postToEdit) {
                await api.posts.update(postToEdit.id, payload);
            } else {
                await api.posts.create(payload);
            }

            const isScheduled = publishMode === "schedule";
            toast({
                title: "Success",
                description: isEditing
                    ? "Post updated successfully"
                    : isScheduled
                    ? `Post scheduled for ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}`
                    : "Post published successfully",
            });

            resetForm();
            onOpenChange(false);
            onPostSaved();
        } catch (error: any) {
            console.error("Post save error:", error);
            toast({
                title: "Error",
                description:
                    error?.response?.data?.message ||
                    (isEditing
                        ? "Failed to update post"
                        : "Failed to create post"),
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const todayStr = new Date().toISOString().split("T")[0];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        {isEditing ? "Edit Post" : "Create Post"}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Post" : "Create New Post"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update your post content and attachments"
                            : "Share your thoughts with your community"}
                    </DialogDescription>
                </DialogHeader>

                {/* User Avatar Section */}
                {authUser && (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <Avatar className="h-12 w-12">
                            <AvatarImage
                                src={
                                    authUser.avatar ||
                                    "/placeholder.svg?height=48&width=48"
                                }
                            />
                            <AvatarFallback>
                                {authUser.name
                                    ? authUser.name
                                          .split(" ")
                                          .map((n: string) => n[0])
                                          .join("")
                                    : "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">
                                {authUser.name || "You"}
                            </p>
                            <p className="text-sm text-gray-600">
                                Creating a post
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Title (Optional) */}
                    <div>
                        <label className="text-sm font-medium">
                            Title (Optional)
                        </label>
                        <Input
                            placeholder="Give your post a title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="text-sm font-medium">Content *</label>
                        <Textarea
                            placeholder="Share your progress, ask questions, or celebrate wins..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            ref={contentTextareaRef}
                            rows={6}
                            className="resize-none"
                        />
                        <WanisAssistButton
                            value={content}
                            onAccept={(newText) => setContent(newText)}
                            context="This is a community post"
                            disabled={isLoading}
                            className="mt-2"
                        />
                    </div>

                    {/* Media Controls */}
                    <div className="flex gap-2 flex-wrap bg-gray-50 p-3 rounded-lg">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="hover:bg-blue-50 hover:text-blue-600"
                        >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Photo
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => videoInputRef.current?.click()}
                            disabled={isLoading}
                            className="hover:bg-red-50 hover:text-red-600"
                        >
                            <Video className="h-4 w-4 mr-2" />
                            Video
                        </Button>
                        <input
                            ref={videoInputRef}
                            type="file"
                            multiple
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                        />

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`hover:bg-yellow-50 hover:text-yellow-600 ${showEmojiPicker ? "bg-yellow-100" : ""}`}
                        >
                            <Smile className="h-4 w-4 mr-2" />
                            Emoji
                        </Button>

                        <div className="flex-1" />
                    </div>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm font-medium mb-3">
                                Quick Emojis
                            </p>
                            <div className="grid grid-cols-10 gap-2">
                                {COMMON_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleEmojiClick(emoji)}
                                        className="text-2xl hover:bg-white p-2 rounded transition"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Link Section */}
                    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                        <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium">
                                Add Link
                            </span>
                        </div>
                        <div className="space-y-2">
                            <Input
                                placeholder="https://example.com"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                type="url"
                            />
                            <Input
                                placeholder="Link title (optional)"
                                value={linkTitle}
                                onChange={(e) => setLinkTitle(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleAddLink}
                                disabled={!linkUrl.trim()}
                            >
                                Add Link
                            </Button>
                        </div>
                    </div>

                    {/* Uploaded Files Preview */}
                    {uploadedFiles.length > 0 && (
                        <div className="border rounded-lg p-4 space-y-2">
                            <p className="text-sm font-medium">
                                Attached Media
                            </p>
                            <div className="space-y-2">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {file.type === "photo" && (
                                                <ImageIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                            )}
                                            {file.type === "video" && (
                                                <Video className="h-4 w-4 text-red-600 flex-shrink-0" />
                                            )}
                                            {file.type === "link" && (
                                                <LinkIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                                            )}
                                            <span className="text-sm truncate">
                                                {file.originalName ||
                                                    file.title ||
                                                    file.url}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleRemoveFile(index)
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    <div>
                        <label className="text-sm font-medium">Tags</label>
                        <div className="flex gap-2 mt-2">
                            <Input
                                placeholder="Add tag and press Enter"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddTag}
                            >
                                Add
                            </Button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-2">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-1 hover:text-red-600"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Schedule Section */}
                    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium">
                                Publishing Options
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={publishMode === "publish" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPublishMode("publish")}
                            >
                                Publish Now
                            </Button>
                            <Button
                                type="button"
                                variant={publishMode === "schedule" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPublishMode("schedule")}
                            >
                                <Clock className="h-3 w-3 mr-1" />
                                Schedule
                            </Button>
                        </div>
                        {publishMode === "schedule" && (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">
                                    Choose a date and time at least 5 minutes from now (max 30 days ahead).
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        min={todayStr}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                                {scheduledDate && scheduledTime && (
                                    <p className="text-xs text-purple-600 font-medium">
                                        Will publish on:{" "}
                                        {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !content.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isEditing ? "Saving..." : publishMode === "schedule" ? "Scheduling..." : "Publishing..."}
                            </>
                        ) : isEditing ? (
                            "Save Changes"
                        ) : publishMode === "schedule" ? (
                            <>
                                <Clock className="h-4 w-4 mr-2" />
                                Schedule Post
                            </>
                        ) : (
                            "Publish Post"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
