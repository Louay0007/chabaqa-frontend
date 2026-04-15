"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { WanisAssistButton } from "@/components/wanis-assist-button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { emailCampaignsApi } from "@/lib/api/email-campaigns.api";
import { useToast } from "@/components/ui/use-toast";
import { buildCampaignPayload } from "./campaign-form-utils";
import { useQuery } from "@tanstack/react-query";
import { crmApi } from "@/lib/api/crm.api";

const formSchema = z
    .object({
        title: z.string().min(1, "Campaign title is required"),
        type: z.enum(["announcement", "content-reminder", "inactive-users"]),
        subject: z.string().min(1, "Subject line is required"),
        content: z.string().min(1, "Email content is required"),
        sendingTime: z.enum(["now", "scheduled"]),
        scheduledDate: z.string().optional(),
        scheduledTime: z.string().optional(),
        inactivityPeriod: z
            .enum([
                "last_7_days",
                "last_15_days",
                "last_30_days",
                "last_60_days",
                "more_than_60_days",
            ])
            .optional(),
        contentType: z
            .enum(["event", "challenge", "cours", "product", "session", "all"])
            .optional(),
        contentId: z.string().optional(),
        isHtml: z.boolean().optional(),
        trackOpens: z.boolean().optional(),
        trackClicks: z.boolean().optional(),
    })
    .superRefine((values, ctx) => {
        if (values.sendingTime === "scheduled") {
            if (!values.scheduledDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["scheduledDate"],
                    message: "Scheduled date is required",
                });
            }
            if (!values.scheduledTime) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["scheduledTime"],
                    message: "Scheduled time is required",
                });
            }
        }

        if (values.type === "inactive-users" && !values.inactivityPeriod) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["inactivityPeriod"],
                message: "Inactivity period is required",
            });
        }

        if (values.type === "content-reminder" && !values.contentType) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["contentType"],
                message: "Content type is required",
            });
        }
    });

interface CreateCampaignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCampaignCreated?: () => void;
}

export function CreateCampaignDialog({
    open,
    onOpenChange,
    onCampaignCreated,
}: CreateCampaignDialogProps) {
    const { selectedCommunityId } = useCreatorCommunity();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // A/B test state
    const [abEnabled, setAbEnabled] = useState(false);
    const [abSubject, setAbSubject] = useState("");
    const [abContent, setAbContent] = useState("");
    const [abSplitRatio, setAbSplitRatio] = useState(50);

    // Segment state
    const [selectedSegmentId, setSelectedSegmentId] = useState<string>("none");

    // Template picker state
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);

    const { data: segments = [] } = useQuery({
        queryKey: ["segments", selectedCommunityId],
        queryFn: () => crmApi.listSegments(selectedCommunityId!),
        enabled: !!selectedCommunityId,
    });

    const { data: templates = [] } = useQuery({
        queryKey: ["email-templates", selectedCommunityId],
        queryFn: () => crmApi.listTemplates(selectedCommunityId!),
        enabled: !!selectedCommunityId && showTemplatePicker,
    });

    const segList = Array.isArray(segments) ? segments : (segments as any)?.data ?? [];
    const tmplList = Array.isArray(templates) ? templates : (templates as any)?.data ?? [];

    const defaultValues = useMemo(
        () => ({
            title: "",
            type: "announcement" as const,
            subject: "",
            content: "",
            sendingTime: "now" as const,
            scheduledDate: "",
            scheduledTime: "",
            inactivityPeriod: undefined,
            contentType: undefined,
            contentId: "",
            isHtml: true,
            trackOpens: true,
            trackClicks: true,
        }),
        [],
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!selectedCommunityId) {
            toast({
                title: "Error",
                description: "No community selected",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = buildCampaignPayload(values, selectedCommunityId);
            // Attach segment + A/B test extras
            const extra: any = {};
            if (selectedSegmentId && selectedSegmentId !== "none") extra.segmentId = selectedSegmentId;
            if (abEnabled && abSubject && abContent) {
                extra.abTest = {
                    variantBSubject: abSubject,
                    variantBContent: abContent,
                    splitRatio: abSplitRatio / 100,
                };
            }
            if (payload.request === "createCampaign") {
                await emailCampaignsApi.createCampaign({ ...payload.data, ...extra });
            } else if (payload.request === "createInactiveUserCampaign") {
                await emailCampaignsApi.createInactiveUserCampaign(
                    payload.data,
                );
            } else {
                await emailCampaignsApi.createContentReminder(payload.data);
            }

            toast({
                title: "Success",
                description: "Campaign created successfully",
            });
            form.reset(defaultValues);
            onOpenChange(false);
            onCampaignCreated?.();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to create campaign",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>
                        Create a campaign for your community members
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Campaign Title</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter campaign title..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Campaign Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select campaign type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="announcement">
                                                Regular Announcement
                                            </SelectItem>
                                            <SelectItem value="content-reminder">
                                                Content Reminder
                                            </SelectItem>
                                            <SelectItem value="inactive-users">
                                                Inactive Users
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject Line</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter email subject..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Variables: {"{{userName}}"},{" "}
                                        {"{{communityName}}"},{" "}
                                        {"{{currentDate}}"}, {"{{currentYear}}"}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Content</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Write your email content..."
                                            className="h-32"
                                            {...field}
                                        />
                                    </FormControl>
                                    <WanisAssistButton
                                        value={field.value}
                                        onAccept={(newText) =>
                                            field.onChange(newText)
                                        }
                                        context="Email campaign content for community members"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="sendingTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>When to send</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select when to send" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="now">
                                                Send Now
                                            </SelectItem>
                                            <SelectItem value="scheduled">
                                                Schedule for Later
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {form.watch("sendingTime") === "scheduled" && (
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="scheduledDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="scheduledTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Time</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {form.watch("type") === "inactive-users" && (
                            <FormField
                                control={form.control}
                                name="inactivityPeriod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Inactive Period</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select inactive period" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="last_7_days">
                                                    7 days
                                                </SelectItem>
                                                <SelectItem value="last_15_days">
                                                    15 days
                                                </SelectItem>
                                                <SelectItem value="last_30_days">
                                                    30 days
                                                </SelectItem>
                                                <SelectItem value="last_60_days">
                                                    60 days
                                                </SelectItem>
                                                <SelectItem value="more_than_60_days">
                                                    More than 60 days
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {form.watch("type") === "content-reminder" && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="contentType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Content Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select content type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="event">
                                                        Event
                                                    </SelectItem>
                                                    <SelectItem value="challenge">
                                                        Challenge
                                                    </SelectItem>
                                                    <SelectItem value="cours">
                                                        Course
                                                    </SelectItem>
                                                    <SelectItem value="product">
                                                        Product
                                                    </SelectItem>
                                                    <SelectItem value="session">
                                                        Session
                                                    </SelectItem>
                                                    <SelectItem value="all">
                                                        General Content
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="contentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Content ID (Optional)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Specific content ID..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <DialogFooter>
                            {/* Segment Picker */}
                            <div className="w-full space-y-2 mb-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Audience Segment (optional)</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => setShowTemplatePicker((p) => !p)}
                                    >
                                        {showTemplatePicker ? "Hide templates" : "Use template"}
                                    </Button>
                                </div>
                                <select
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={selectedSegmentId}
                                    onChange={(e) => setSelectedSegmentId(e.target.value)}
                                >
                                    <option value="none">All members (no segment filter)</option>
                                    {segList.map((s: any) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} ({s.estimatedSize} contacts)
                                        </option>
                                    ))}
                                </select>

                                {showTemplatePicker && (
                                    <div className="rounded-lg border p-3 max-h-48 overflow-y-auto space-y-1">
                                        {tmplList.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">No templates saved yet.</p>
                                        ) : tmplList.map((t: any) => (
                                            <button
                                                key={t._id}
                                                type="button"
                                                className="w-full text-left rounded px-3 py-2 text-sm hover:bg-muted transition-colors"
                                                onClick={() => {
                                                    form.setValue("subject", t.subject);
                                                    form.setValue("content", t.content);
                                                    setShowTemplatePicker(false);
                                                    toast({ title: `Template "${t.name}" loaded` });
                                                }}
                                            >
                                                <span className="font-medium">{t.name}</span>
                                                <span className="text-xs text-muted-foreground ml-2">{t.subject}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* A/B Test toggle */}
                                <div className="flex items-center gap-3 pt-2">
                                    <Switch
                                        checked={abEnabled}
                                        onCheckedChange={setAbEnabled}
                                        id="ab-toggle"
                                    />
                                    <label htmlFor="ab-toggle" className="text-sm font-medium cursor-pointer">
                                        Enable A/B Split Test
                                    </label>
                                </div>

                                {abEnabled && (
                                    <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Variant B</p>
                                        <Input
                                            placeholder="Variant B subject line"
                                            value={abSubject}
                                            onChange={(e) => setAbSubject(e.target.value)}
                                        />
                                        <Textarea
                                            rows={3}
                                            placeholder="Variant B email content"
                                            value={abContent}
                                            onChange={(e) => setAbContent(e.target.value)}
                                        />
                                        <div>
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>Variant A: {abSplitRatio}%</span>
                                                <span>Variant B: {100 - abSplitRatio}%</span>
                                            </div>
                                            <Slider
                                                min={10}
                                                max={90}
                                                step={10}
                                                value={[abSplitRatio]}
                                                onValueChange={([v]) => setAbSplitRatio(v)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="bg-chabaqa-primary hover:bg-chabaqa-primary/90"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? "Creating..."
                                    : "Create Campaign"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
