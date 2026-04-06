"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { WanisAssistButton } from "@/components/wanis-assist-button";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    description: z.string().max(200).optional(),
    type: z.enum(["TEXT", "ANNOUNCEMENTS"]),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
    emoji: z.string().max(2).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewChannelPage() {
    const router = useRouter();
    const { selectedCommunityId, selectedCommunity } = useCreatorCommunity();
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const onSubmit = async (data: FormValues) => {
        if (!selectedCommunityId) {
            toast.error("No community selected");
            return;
        }

        try {
            setIsSubmitting(true);
            await api.channel.create({
                communityId: selectedCommunityId,
                ...data,
            });
            toast.success("Channel created successfully");
            router.push(
                `/creator/community/${selectedCommunity?.slug}/channels`,
            );
        } catch (error) {
            console.error(error);
            toast.error("Failed to create channel");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
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
                        Create Channel
                    </h1>
                    <p className="text-sm text-gray-500">
                        Add a new channel to your community space.
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Channel Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g. general"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Keep it short and descriptive.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="emoji"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Emoji Icon (Optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g. 💬"
                                        maxLength={2}
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    An emoji to represent this channel.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="What is this channel about?"
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <WanisAssistButton
                                    value={field.value || ""}
                                    onAccept={(text) => field.onChange(text)}
                                    context="community channel description"
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
                                    <FormLabel>Channel Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
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
                                    <FormDescription>
                                        Announcements restrict posting to admins
                                        only.
                                    </FormDescription>
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
                                                <SelectValue placeholder="Select visibility" />
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
                                    <FormDescription>
                                        Private channels require role access.
                                    </FormDescription>
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
                            Create Channel
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
