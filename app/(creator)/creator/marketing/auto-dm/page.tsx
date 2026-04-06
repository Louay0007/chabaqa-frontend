"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Save,
    Bot,
    ToggleLeft,
    ToggleRight,
    Eye,
    EyeOff,
    Info,
    CheckCircle2,
} from "lucide-react";
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context";
import { communitiesApi } from "@/lib/api/communities.api";
import { useToast } from "@/hooks/use-toast";
import { WanisAssistButton } from "@/components/wanis-assist-button";

const DEFAULT_TEMPLATE = `Hi {{memberName}}! 👋

Welcome to {{communityName}}! I'm so excited to have you here.

Feel free to explore all the content — courses, resources, and everything else we've built for you. Don't hesitate to reply here if you have any questions or just want to say hi.

Looking forward to seeing you grow here! 🚀

— {{creatorName}}`;

const TEMPLATE_VARIABLES = [
    { variable: "{{memberName}}", label: "Member Name", preview: "Alex" },
    {
        variable: "{{communityName}}",
        label: "Community Name",
        preview: "My Community",
    },
    { variable: "{{creatorName}}", label: "Your Name", preview: "You" },
];

function resolvePreview(template: string, communityName: string): string {
    return template
        .replace(/\{\{memberName\}\}/gi, "Alex")
        .replace(/\{\{communityName\}\}/gi, communityName || "My Community")
        .replace(/\{\{creatorName\}\}/gi, "You");
}

function getCountColour(count: number): string {
    if (count > 1800) return "text-red-500";
    if (count > 1500) return "text-yellow-500";
    return "text-gray-400";
}

export default function AutoDmPage() {
    const {
        selectedCommunityId,
        selectedCommunity,
        isLoading: isLoadingCommunities,
    } = useCreatorCommunity();
    const { toast } = useToast();

    const [enabled, setEnabled] = useState(false);
    const [message, setMessage] = useState(DEFAULT_TEMPLATE);
    const [showPreview, setShowPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);

    useEffect(() => {
        if (!selectedCommunity) return;
        const settings = selectedCommunity.settings;
        setEnabled(settings?.welcomeDmEnabled ?? false);
        setMessage(settings?.welcomeDmMessage?.trim() || DEFAULT_TEMPLATE);
        setIsDirty(false);
        setSavedAt(null);
    }, [selectedCommunity]);

    const handleToggle = useCallback(() => {
        setEnabled((prev) => !prev);
        setIsDirty(true);
    }, []);

    const handleMessageChange = useCallback((value: string) => {
        if (value.length <= 2000) {
            setMessage(value);
            setIsDirty(true);
        }
    }, []);

    const insertVariable = useCallback(
        (variable: string) => {
            const textarea = document.getElementById(
                "welcome-dm-textarea",
            ) as HTMLTextAreaElement | null;
            if (!textarea) {
                setMessage((prev) => prev + variable);
                setIsDirty(true);
                return;
            }
            const start = textarea.selectionStart ?? message.length;
            const end = textarea.selectionEnd ?? message.length;
            const updated =
                message.slice(0, start) + variable + message.slice(end);
            if (updated.length <= 2000) {
                setMessage(updated);
                setIsDirty(true);
                requestAnimationFrame(() => {
                    textarea.focus();
                    const newPos = start + variable.length;
                    textarea.setSelectionRange(newPos, newPos);
                });
            }
        },
        [message],
    );

    const handleSave = useCallback(async () => {
        if (!selectedCommunityId) {
            toast({
                title: "No community selected",
                description:
                    "Please select a community from the top of the sidebar first.",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            await communitiesApi.updateSettings(selectedCommunityId, {
                welcomeDmEnabled: enabled,
                welcomeDmMessage: message.trim(),
            } as any);

            setIsDirty(false);
            setSavedAt(new Date());
            toast({
                title: "Auto DM saved",
                description: enabled
                    ? "New members will automatically receive your welcome message."
                    : "Auto DM is disabled. New members will not receive a welcome message.",
            });
        } catch (err: any) {
            toast({
                title: "Failed to save",
                description:
                    err?.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }, [selectedCommunityId, enabled, message, toast]);

    const previewText = resolvePreview(message, selectedCommunity?.name || "");
    const charCount = message.length;
    const countColour = getCountColour(charCount);
    const communityName = selectedCommunity?.name || "—";

    if (isLoadingCommunities) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-pulse">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-200" />
                        <div className="space-y-2">
                            <div className="w-28 h-5 rounded bg-gray-200" />
                            <div className="w-64 h-4 rounded bg-gray-100" />
                        </div>
                    </div>
                    <div className="w-32 h-9 rounded-lg bg-gray-200" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 flex justify-between items-center">
                    <div className="space-y-2 flex-1">
                        <div className="w-40 h-5 rounded bg-gray-200" />
                        <div className="w-72 h-4 rounded bg-gray-100" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-200 ml-6" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                    <div className="w-36 h-5 rounded bg-gray-200" />
                    <div className="flex gap-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="w-32 h-7 rounded-full bg-gray-100"
                            />
                        ))}
                    </div>
                    <div className="w-full h-48 rounded-xl bg-gray-100" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-100">
                        <Bot className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Auto DM
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Send an automatic welcome message to every new
                            member who joins{" "}
                            <span className="font-medium text-gray-700">
                                {communityName}
                            </span>
                            .
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8e78fb] text-white text-sm font-medium hover:bg-[#7c65f0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isSaving ? "Saving…" : "Save Changes"}
                </button>
            </div>

            {savedAt && !isDirty && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Settings saved at {savedAt.toLocaleTimeString()}.
                </div>
            )}

            {/* Enable / disable toggle */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Enable Welcome DM
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            When turned on, your welcome message is
                            automatically sent as a Direct Message every time
                            someone joins this community.
                        </p>
                    </div>
                    <button
                        onClick={handleToggle}
                        className="flex-shrink-0 ml-6"
                        aria-label={
                            enabled ? "Disable Auto DM" : "Enable Auto DM"
                        }
                    >
                        {enabled ? (
                            <ToggleRight className="w-10 h-10 text-[#8e78fb]" />
                        ) : (
                            <ToggleLeft className="w-10 h-10 text-gray-300" />
                        )}
                    </button>
                </div>

                <div className="mt-4">
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            enabled
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                        }`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        {enabled
                            ? "Active — new members will receive a welcome DM"
                            : "Inactive — no auto DM will be sent"}
                    </span>
                </div>
            </div>

            {/* Message editor */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Welcome Message
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Write your message below. Use the variable buttons
                            to personalise it dynamically.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowPreview((prev) => !prev)}
                        className="flex items-center gap-1.5 text-sm text-[#8e78fb] hover:text-[#7c65f0] transition-colors"
                    >
                        {showPreview ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                        {showPreview ? "Hide preview" : "Preview"}
                    </button>
                </div>

                {/* Variable chips */}
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-400 self-center mr-1">
                        Insert:
                    </span>
                    {TEMPLATE_VARIABLES.map(({ variable, label }) => (
                        <button
                            key={variable}
                            onClick={() => insertVariable(variable)}
                            className="px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-xs font-mono hover:bg-purple-100 transition-colors"
                        >
                            {variable}
                            <span className="ml-1.5 text-purple-400 font-sans font-normal">
                                {label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Textarea */}
                <div className="relative">
                    <textarea
                        id="welcome-dm-textarea"
                        value={message}
                        onChange={(e) => handleMessageChange(e.target.value)}
                        rows={12}
                        placeholder="Write your welcome message here…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8e78fb] focus:ring-2 focus:ring-purple-100 outline-none resize-y font-mono text-sm text-gray-800 placeholder:text-gray-300 bg-gray-50 transition-colors"
                    />
                    <WanisAssistButton
                        value={message}
                        onAccept={(newText) => handleMessageChange(newText)}
                        context="Auto-DM welcome message sent to new community members"
                    />
                    <span
                        className={`absolute bottom-3 right-3 text-xs ${countColour}`}
                    >
                        {charCount} / 2000
                    </span>
                </div>

                {/* Info callout */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-xs">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                        Variables are replaced with real values when the message
                        is sent. <strong>{"{{memberName}}"}</strong> becomes the
                        member&apos;s display name,{" "}
                        <strong>{"{{communityName}}"}</strong> becomes{" "}
                        <em>{communityName}</em>, and{" "}
                        <strong>{"{{creatorName}}"}</strong> becomes your name.
                    </span>
                </div>
            </div>

            {/* Live preview panel */}
            {showPreview && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                    <h2 className="text-base font-semibold text-gray-900">
                        Message Preview
                        <span className="ml-2 text-xs font-normal text-gray-400">
                            (as seen by a new member named &quot;Alex&quot;)
                        </span>
                    </h2>

                    <div className="bg-gray-50 rounded-xl p-4 max-w-md">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8e78fb] to-[#f48fb1] flex items-center justify-center text-white text-xs font-bold">
                                {(selectedCommunity?.creator?.name ||
                                    "C")[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-800">
                                    {selectedCommunity?.creator?.name || "You"}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                    Just now
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#1f2430] text-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {previewText}
                        </div>
                    </div>

                    <p className="text-xs text-gray-400">
                        The member will also receive a push notification and see
                        this in their <strong>Messages</strong> inbox.
                    </p>
                </div>
            )}

            {/* How it works callout */}
            <div className="rounded-2xl border border-dashed border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    How Auto DM works
                </h3>
                <ol className="space-y-2 text-sm text-gray-500 list-decimal list-inside">
                    <li>
                        A new member joins <strong>{communityName}</strong>{" "}
                        (free join, invite link, or after payment).
                    </li>
                    <li>
                        Chabaqa automatically opens a Direct Message thread
                        between you and the new member.
                    </li>
                    <li>
                        Your welcome message is delivered instantly — appearing
                        in their Messages inbox.
                    </li>
                    <li>
                        The member receives a push notification and an in-app
                        badge.
                    </li>
                    <li>They can reply directly to you in the same thread.</li>
                </ol>
                <p className="mt-4 text-xs text-gray-400">
                    Auto DMs are sent as real Direct Messages — members can
                    reply, and you will see their reply in your Messages inbox.
                </p>
            </div>
        </div>
    );
}
