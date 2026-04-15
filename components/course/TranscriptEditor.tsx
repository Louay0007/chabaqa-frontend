"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardHeader,
    CardContent,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
    Save,
    RotateCcw,
    Download,
    Loader2,
    AlertCircle,
    Plus,
    Trash2,
    Languages,
    FileText,
    ArrowRight,
} from "lucide-react";
import {
    transcriptionApi,
    TranscriptResponse,
    TranscriptSegment,
} from "@/lib/api/transcription.api";

interface TranscriptEditorProps {
    chapterId: string;
    courseId: string;
}

type StatusType = TranscriptResponse["status"] | "not_found";

const LANGUAGE_OPTIONS = [
    { value: "auto", label: "Auto-detect" },
    { value: "en", label: "English" },
    { value: "ar", label: "Arabic" },
    { value: "fr", label: "French" },
];

function statusBadge(status: StatusType) {
    switch (status) {
        case "pending":
            return (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Pending
                </Badge>
            );
        case "processing":
            return (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 animate-pulse">
                    Processing
                </Badge>
            );
        case "done":
            return (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                    Done
                </Badge>
            );
        case "failed":
            return (
                <Badge className="bg-red-100 text-red-800 border-red-300">
                    Failed
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="text-muted-foreground">
                    Not Started
                </Badge>
            );
    }
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

export default function TranscriptEditor({
    chapterId,
    courseId,
}: TranscriptEditorProps) {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [transcript, setTranscript] = useState<TranscriptResponse | null>(
        null,
    );
    const [status, setStatus] = useState<StatusType>("not_found");
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [language, setLanguage] = useState("auto");
    const [isTriggering, setIsTriggering] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pollingInterval, setPollingInterval] = useState<ReturnType<
        typeof setInterval
    > | null>(null);

    const fetchTranscript = useCallback(async () => {
        try {
            const data = await transcriptionApi.getTranscript(chapterId);
            setTranscript(data);
            setStatus(data.status);
            if (data.status === "done") {
                setSegments(data.segments ?? []);
            }
        } catch {
            setTranscript(null);
            setStatus("not_found");
        } finally {
            setLoading(false);
        }
    }, [chapterId]);

    const startPolling = useCallback(() => {
        if (pollingInterval) return;
        const id = setInterval(async () => {
            try {
                const { status: s } =
                    await transcriptionApi.getStatus(chapterId);
                setStatus(s as StatusType);
                if (s === "done" || s === "failed") {
                    clearInterval(id);
                    setPollingInterval(null);
                    if (s === "done") {
                        await fetchTranscript();
                    }
                }
            } catch {
                // ignore polling errors
            }
        }, 5000);
        setPollingInterval(id);
    }, [chapterId, fetchTranscript, pollingInterval]);

    useEffect(() => {
        fetchTranscript();
        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chapterId]);

    useEffect(() => {
        if (status === "pending" || status === "processing") {
            startPolling();
        }
    }, [status, startPolling]);

    const handleTrigger = async (confirmed = false) => {
        if (transcript && transcript.status === "done" && !confirmed) {
            setShowConfirm(true);
            return;
        }
        setShowConfirm(false);
        setIsTriggering(true);
        try {
            await transcriptionApi.triggerTranscription(
                chapterId,
                courseId,
                language === "auto" ? undefined : language,
            );
            setStatus("pending");
            setSegments([]);
            setIsDirty(false);
            startPolling();
            toast({
                title: "Transcription started",
                description: "The transcription job has been queued.",
            });
        } catch {
            toast({
                title: "Failed to start transcription",
                description: "Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsTriggering(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await transcriptionApi.updateSegments(chapterId, segments);
            setIsDirty(false);
            toast({
                title: "Transcript saved",
                description: "All changes have been saved successfully.",
            });
        } catch {
            toast({
                title: "Save failed",
                description: "Could not save the transcript. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updateSegment = (
        index: number,
        field: keyof TranscriptSegment,
        value: string | number,
    ) => {
        setSegments((prev) =>
            prev.map((seg, i) =>
                i === index ? { ...seg, [field]: value } : seg,
            ),
        );
        setIsDirty(true);
    };

    const deleteSegment = (index: number) => {
        setSegments((prev) => prev.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    const addSegment = () => {
        const last = segments[segments.length - 1];
        const newStart = last ? last.end : 0;
        setSegments((prev) => [
            ...prev,
            { start: newStart, end: newStart + 5, text: "" },
        ]);
        setIsDirty(true);
    };

    // ── Loading skeleton ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-16 ml-2" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    // ── Confirm re-transcribe dialog ────────────────────────────────────────────
    if (showConfirm) {
        return (
            <Card className="border-yellow-300 bg-yellow-50">
                <CardHeader>
                    <CardTitle className="text-yellow-800 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Re-transcribe this chapter?
                    </CardTitle>
                    <CardDescription className="text-yellow-700">
                        This will discard the existing transcript and all manual
                        edits. This action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                    <Button
                        variant="destructive"
                        onClick={() => handleTrigger(true)}
                        disabled={isTriggering}
                    >
                        {isTriggering && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Yes, re-transcribe
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowConfirm(false)}
                    >
                        Cancel
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // ── Not found / never started ────────────────────────────────────────────────
    if (status === "not_found") {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">
                            Transcript Editor
                        </CardTitle>
                    </div>
                    <CardDescription>
                        No transcript exists for this chapter yet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Language:
                        </span>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGE_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={() => handleTrigger(false)}
                        disabled={isTriggering}
                    >
                        {isTriggering ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileText className="mr-2 h-4 w-4" />
                        )}
                        Start Transcription
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // ── Pending / processing ─────────────────────────────────────────────────────
    if (status === "pending" || status === "processing") {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-base">
                                Transcript Editor
                            </CardTitle>
                        </div>
                        {statusBadge(status)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-sm font-medium">
                            Transcription running…
                        </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-2 bg-blue-500 rounded-full animate-pulse w-2/3" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        This may take a few minutes. The page will update
                        automatically.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // ── Failed ───────────────────────────────────────────────────────────────────
    if (status === "failed") {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <CardTitle className="text-base text-red-800">
                                Transcription Failed
                            </CardTitle>
                        </div>
                        {statusBadge(status)}
                    </div>
                    {transcript?.errorMessage && (
                        <CardDescription className="text-red-600 mt-1">
                            {transcript.errorMessage}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Language:
                        </span>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGE_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => handleTrigger(false)}
                        disabled={isTriggering}
                    >
                        {isTriggering ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RotateCcw className="mr-2 h-4 w-4" />
                        )}
                        Retry Transcription
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // ── Done — editable table ────────────────────────────────────────────────────
    return (
        <Card>
            {/* Header */}
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">
                            Transcript Editor
                        </CardTitle>
                        {statusBadge(status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Language + Re-transcribe */}
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-36 h-8 text-xs">
                                <Languages className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGE_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTrigger(false)}
                            disabled={isTriggering}
                        >
                            {isTriggering ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Re-transcribe
                        </Button>

                        <Separator orientation="vertical" className="h-6" />

                        {/* Downloads */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                transcriptionApi.downloadTranscript(
                                    chapterId,
                                    "srt",
                                )
                            }
                        >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            SRT
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                transcriptionApi.downloadTranscript(
                                    chapterId,
                                    "vtt",
                                )
                            }
                        >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            VTT
                        </Button>

                        <Separator orientation="vertical" className="h-6" />

                        {/* Save */}
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={!isDirty || isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Save changes
                        </Button>
                    </div>
                </div>

                {isDirty && (
                    <p className="text-xs text-amber-600 mt-1">
                        You have unsaved changes.
                    </p>
                )}
            </CardHeader>

            <Separator />

            {/* Column headings */}
            <div className="grid grid-cols-[110px_16px_110px_1fr_40px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/40">
                <span>Start (s)</span>
                <span />
                <span>End (s)</span>
                <span>Text</span>
                <span />
            </div>

            <Separator />

            {/* Rows */}
            <CardContent className="p-0">
                <ScrollArea className="h-[420px]">
                    <div className="divide-y divide-border">
                        {segments.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                                <FileText className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No segments yet.</p>
                            </div>
                        )}

                        {segments.map((seg, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-[110px_16px_110px_1fr_40px] gap-2 items-center px-4 py-2 hover:bg-muted/30 transition-colors"
                            >
                                {/* Start */}
                                <Input
                                    type="number"
                                    step={0.1}
                                    min={0}
                                    value={seg.start}
                                    onChange={(e) =>
                                        updateSegment(
                                            index,
                                            "start",
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    className="h-8 text-xs tabular-nums"
                                    title={formatTime(seg.start)}
                                />

                                {/* Arrow */}
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

                                {/* End */}
                                <Input
                                    type="number"
                                    step={0.1}
                                    min={0}
                                    value={seg.end}
                                    onChange={(e) =>
                                        updateSegment(
                                            index,
                                            "end",
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    className="h-8 text-xs tabular-nums"
                                    title={formatTime(seg.end)}
                                />

                                {/* Text */}
                                <Input
                                    value={seg.text}
                                    onChange={(e) =>
                                        updateSegment(
                                            index,
                                            "text",
                                            e.target.value,
                                        )
                                    }
                                    className="h-8 text-xs"
                                    placeholder="Segment text…"
                                />

                                {/* Delete */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                    onClick={() => deleteSegment(index)}
                                    title="Delete segment"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Footer actions */}
                <Separator />
                <div className="flex items-center justify-between px-4 py-3">
                    <Button variant="outline" size="sm" onClick={addSegment}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add segment
                    </Button>

                    <span className="text-xs text-muted-foreground">
                        {segments.length} segment
                        {segments.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
