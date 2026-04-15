"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
    transcriptionApi,
    TranscriptResponse,
    TranscriptSegment,
} from "@/lib/api/transcription.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Search,
    Download,
    Loader2,
    AlertCircle,
    CheckCircle2,
    FileText,
    RotateCcw,
    Captions,
} from "lucide-react";

interface TranscriptPanelProps {
    chapterId: string;
    courseId: string;
    currentTime: number;
    onSeek: (seconds: number) => void;
}

function formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const regex = new RegExp(
        `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part) ? (
            <mark
                key={i}
                className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5"
            >
                {part}
            </mark>
        ) : (
            part
        ),
    );
}

type FetchState = "idle" | "loading" | "success" | "not_found" | "error";

export default function TranscriptPanel({
    chapterId,
    courseId,
    currentTime,
    onSeek,
}: TranscriptPanelProps) {
    const [fetchState, setFetchState] = useState<FetchState>("idle");
    const [transcript, setTranscript] = useState<TranscriptResponse | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [isRetrying, setIsRetrying] = useState(false);

    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const activeSegmentRef = useRef<HTMLDivElement | null>(null);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    const fetchFullTranscript = useCallback(async () => {
        try {
            const data = await transcriptionApi.getTranscript(chapterId);
            setTranscript(data);
            setFetchState("success");
            if (data.status === "pending" || data.status === "processing") {
                startPolling();
            } else {
                stopPolling();
            }
        } catch (err: unknown) {
            const status = (err as { status?: number })?.status;
            if (status === 404) {
                setFetchState("not_found");
            } else {
                setFetchState("error");
            }
        }
    }, [chapterId]);

    const startPolling = useCallback(() => {
        stopPolling();
        pollIntervalRef.current = setInterval(async () => {
            try {
                const { status } = await transcriptionApi.getStatus(chapterId);
                if (status === "done" || status === "failed") {
                    stopPolling();
                    await fetchFullTranscript();
                } else {
                    setTranscript((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  status: status as TranscriptResponse["status"],
                              }
                            : prev,
                    );
                }
            } catch {
                stopPolling();
            }
        }, 5000);
    }, [chapterId, fetchFullTranscript, stopPolling]);

    useEffect(() => {
        setFetchState("loading");
        fetchFullTranscript();
        return () => stopPolling();
    }, [chapterId]);

    // Auto-scroll active segment
    useEffect(() => {
        if (searchQuery.trim()) return;
        if (activeSegmentRef.current) {
            activeSegmentRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [currentTime, searchQuery]);

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await transcriptionApi.triggerTranscription(chapterId, courseId);
            setFetchState("loading");
            await fetchFullTranscript();
        } finally {
            setIsRetrying(false);
        }
    };

    const filteredSegments: TranscriptSegment[] =
        transcript?.segments.filter((seg) =>
            searchQuery.trim()
                ? seg.text.toLowerCase().includes(searchQuery.toLowerCase())
                : true,
        ) ?? [];

    const activeIndex =
        transcript?.segments.findIndex(
            (seg) => currentTime >= seg.start && currentTime < seg.end,
        ) ?? -1;

    // ─── Status badge ───────────────────────────────────────────────────────────
    const renderStatusBadge = () => {
        if (!transcript) return null;
        switch (transcript.status) {
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 gap-1">
                        <Loader2 className="h-3 w-3" />
                        Pending
                    </Badge>
                );
            case "processing":
                return (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300 gap-1 animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processing
                    </Badge>
                );
            case "done":
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-300 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Done
                    </Badge>
                );
            case "failed":
                return (
                    <Badge className="bg-red-100 text-red-800 border-red-300 gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                    </Badge>
                );
        }
    };

    // ─── Loading skeleton ────────────────────────────────────────────────────────
    if (fetchState === "loading") {
        return (
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-9 w-full" />
                    <Separator />
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex gap-3 items-start py-1">
                            <Skeleton className="h-5 w-12 rounded-full shrink-0 mt-0.5" />
                            <Skeleton className="h-5 w-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    // ─── Not found ───────────────────────────────────────────────────────────────
    if (fetchState === "not_found") {
        return (
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Captions className="h-4 w-4 text-muted-foreground" />
                        Transcript
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3 text-muted-foreground">
                        <FileText className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium">
                            No transcript available
                        </p>
                        <p className="text-xs max-w-xs">
                            Transcription hasn't started for this chapter yet.
                            Ask the course creator to generate it.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ─── Generic error ────────────────────────────────────────────────────────────
    if (fetchState === "error") {
        return (
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Captions className="h-4 w-4 text-muted-foreground" />
                        Transcript
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3 text-muted-foreground">
                        <AlertCircle className="h-10 w-10 text-red-400 opacity-70" />
                        <p className="text-sm font-medium text-red-600">
                            Failed to load transcript
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setFetchState("loading");
                                fetchFullTranscript();
                            }}
                        >
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                            Try again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ─── Pending / Processing ────────────────────────────────────────────────────
    const isInProgress =
        transcript?.status === "pending" || transcript?.status === "processing";
    if (isInProgress) {
        return (
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Captions className="h-4 w-4 text-muted-foreground" />
                            Transcript
                        </CardTitle>
                        {renderStatusBadge()}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                Transcription in progress…
                            </p>
                            <p className="text-xs text-muted-foreground">
                                This may take a few minutes. The transcript will
                                appear automatically when ready.
                            </p>
                        </div>
                        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-1/2" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ─── Failed ──────────────────────────────────────────────────────────────────
    if (transcript?.status === "failed") {
        return (
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Captions className="h-4 w-4 text-muted-foreground" />
                            Transcript
                        </CardTitle>
                        {renderStatusBadge()}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                        <AlertCircle className="h-10 w-10 text-red-400" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-red-600">
                                Transcription failed
                            </p>
                            {transcript.errorMessage && (
                                <p className="text-xs text-muted-foreground max-w-xs">
                                    {transcript.errorMessage}
                                </p>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetry}
                            disabled={isRetrying}
                        >
                            {isRetrying ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Retry transcription
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ─── Done – main panel ───────────────────────────────────────────────────────
    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Captions className="h-4 w-4 text-muted-foreground" />
                        Transcript
                        {renderStatusBadge()}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() =>
                                transcriptionApi.downloadTranscript(
                                    chapterId,
                                    "srt",
                                )
                            }
                        >
                            <Download className="h-3.5 w-3.5" />
                            SRT
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() =>
                                transcriptionApi.downloadTranscript(
                                    chapterId,
                                    "vtt",
                                )
                            }
                        >
                            <Download className="h-3.5 w-3.5" />
                            VTT
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search transcript…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-sm"
                    />
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                    <div className="p-3 space-y-0.5">
                        {filteredSegments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
                                <Search className="h-8 w-8 opacity-30" />
                                <p className="text-sm">
                                    No segments match your search.
                                </p>
                            </div>
                        ) : (
                            filteredSegments.map((seg, i) => {
                                const originalIndex =
                                    transcript?.segments.indexOf(seg) ?? i;
                                const isActive =
                                    originalIndex === activeIndex &&
                                    !searchQuery.trim();

                                return (
                                    <div
                                        key={`${seg.start}-${i}`}
                                        id={
                                            isActive
                                                ? "active-segment"
                                                : undefined
                                        }
                                        ref={isActive ? activeSegmentRef : null}
                                        onClick={() => onSeek(seg.start)}
                                        className={[
                                            "flex gap-3 items-start px-2 py-2 rounded-md cursor-pointer transition-all group",
                                            isActive
                                                ? "border-l-2 border-blue-500 bg-blue-50 pl-3 dark:bg-blue-950/30"
                                                : "hover:bg-muted/60 border-l-2 border-transparent",
                                        ].join(" ")}
                                    >
                                        <Badge
                                            variant="outline"
                                            className={[
                                                "text-xs font-mono shrink-0 mt-0.5 px-1.5 py-0",
                                                isActive
                                                    ? "bg-blue-500 text-white border-blue-500"
                                                    : "text-muted-foreground group-hover:border-foreground/40",
                                            ].join(" ")}
                                        >
                                            {formatTimestamp(seg.start)}
                                        </Badge>
                                        <p
                                            className={[
                                                "text-sm leading-relaxed",
                                                isActive
                                                    ? "text-blue-900 dark:text-blue-100 font-medium"
                                                    : "text-foreground",
                                            ].join(" ")}
                                        >
                                            {searchQuery.trim()
                                                ? highlightMatch(
                                                      seg.text,
                                                      searchQuery,
                                                  )
                                                : seg.text}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
