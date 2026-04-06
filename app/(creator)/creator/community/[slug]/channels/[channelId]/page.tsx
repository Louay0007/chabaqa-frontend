"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { ArrowLeft, Loader2, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { WanisAssistButton } from "@/components/wanis-assist-button";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    description: z.string().max(200).optional().or(z.literal("")),
    type: z.enum(["TEXT", "ANNOUNCEMENTS"]),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
    emoji: z.string().max(2).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditChannelPage({
    params,
}: {
    params: { slug: string; channelId: string };
}) {
    const router = useRouter();
    const { selectedCommunity } = useCreatorCommunity();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [channel, setChannel] = useState<any>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            type: "TEXT",
            visibility: "PUBLIC",
            emoji: "",
        },
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [channelRes, membersRes] = await Promise.all([
                    api.channel.getById(params.channelId),
                    api.channel.listMembers(params.channelId),
                ]);

                // Unwrap TransformInterceptor envelope: { success, data: { channel } }
                const channelData =
                    (channelRes as any)?.data?.channel ||
                    (channelRes as any)?.channel ||
                    channelRes;
                // Normalise _id → id (backend uses .lean(), no Mongoose id virtual)
                const normalizedChannel = channelData
                    ? {
                          ...channelData,
                          id: channelData._id?.toString() || channelData.id,
                      }
                    : null;

                // Unwrap members: { success, data: { members } }
                const membersData =
                    (membersRes as any)?.data?.members ||
                    (membersRes as any)?.members ||
                    [];

                setChannel(normalizedChannel);
                setMembers(membersData);

                form.reset({
                    name: normalizedChannel?.name || "",
                    description: normalizedChannel?.description || "",
                    type: normalizedChannel?.type || "TEXT",
                    visibility: normalizedChannel?.visibility || "PUBLIC",
                    emoji: normalizedChannel?.emoji || "",
                });
            } catch (error) {
                console.error(error);
                toast.error("Failed to load channel details");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [params.channelId, form]);

    const onSubmit = async (data: FormValues) => {
        try {
            setIsSubmitting(true);
            await api.channel.update(params.channelId, data);
            toast.success("Channel updated successfully");
            router.push(
                `/creator/community/${selectedCommunity?.slug}/channels`,
            );
        } catch (error) {
            console.error(error);
            toast.error("Failed to update channel");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            await api.channel.removeMember(params.channelId, userId);
            setMembers((prev) => prev.filter((m) => m.userId !== userId));
            toast.success("Member removed");
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove member");
        }
    };

    const handleRoleChange = async (userId: string, role: string) => {
        try {
            await api.channel.setMemberRole(params.channelId, userId, role);
            setMembers((prev) =>
                prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
            );
            toast.success("Role updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update role");
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto p-6 space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={`/creator/community/${selectedCommunity?.slug}/channels`}
                >
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Edit Channel
                    </h1>
                    <p className="text-sm text-gray-500">
                        Manage settings and members for {channel?.name}.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="settings" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                </TabsList>

                <TabsContent value="settings">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6 bg-white p-6 rounded-lg border shadow-sm"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Channel Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="emoji"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Emoji Icon</FormLabel>
                                            <FormControl>
                                                <Input
                                                    maxLength={2}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <WanisAssistButton
                                            value={field.value || ""}
                                            onAccept={(text) =>
                                                field.onChange(text)
                                            }
                                            context="channel description"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="TEXT">
                                                        Text Chat
                                                    </SelectItem>
                                                    <SelectItem value="ANNOUNCEMENTS">
                                                        Announcement
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="visibility"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Visibility</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PUBLIC">
                                                        Public
                                                    </SelectItem>
                                                    <SelectItem value="PRIVATE">
                                                        Private
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                                <Link
                                    href={`/creator/community/${selectedCommunity?.slug}/channels`}
                                >
                                    <Button variant="outline" type="button">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="members">
                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                        {members.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No members found in this channel.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {members.map((member) => (
                                    <div
                                        key={member.userId}
                                        className="flex items-center justify-between p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage
                                                    src={member.user?.avatar}
                                                />
                                                <AvatarFallback>
                                                    {member.user?.name?.charAt(
                                                        0,
                                                    ) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">
                                                    {member.user?.name ||
                                                        "Unknown User"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    @
                                                    {member.user?.username ||
                                                        "unknown"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Select
                                                value={member.role}
                                                onValueChange={(val) =>
                                                    handleRoleChange(
                                                        member.userId,
                                                        val,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-[130px] h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="member">
                                                        Member
                                                    </SelectItem>
                                                    <SelectItem value="moderator">
                                                        Moderator
                                                    </SelectItem>
                                                    <SelectItem value="admin">
                                                        Admin
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() =>
                                                    handleRemoveMember(
                                                        member.userId,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
