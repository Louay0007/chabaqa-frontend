import { apiClient } from "./client";

export interface TranscriptSegment {
    start: number;
    end: number;
    text: string;
}

export interface TranscriptResponse {
    _id: string;
    chapterId: string;
    courseId: string;
    language: string;
    status: "pending" | "processing" | "done" | "failed";
    segments: TranscriptSegment[];
    fullText: string;
    srtContent: string;
    vttContent: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SearchResult {
    chapterId: string;
    courseId: string;
    segments: TranscriptSegment[];
}

export const transcriptionApi = {
    getTranscript: (chapterId: string): Promise<TranscriptResponse> =>
        apiClient.get(`/transcription/${chapterId}`),

    getStatus: (chapterId: string): Promise<{ status: string }> =>
        apiClient.get(`/transcription/${chapterId}/status`),

    triggerTranscription: (
        chapterId: string,
        courseId: string,
        language?: string,
        videoStorageKey?: string,
    ): Promise<void> =>
        apiClient.post("/transcription/trigger", {
            chapterId,
            courseId,
            language,
            ...(videoStorageKey ? { videoStorageKey } : {}),
        }),

    downloadTranscript: (chapterId: string, format: "srt" | "vtt"): void => {
        const base = process.env.NEXT_PUBLIC_API_URL ?? "/api";
        window.open(
            `${base}/transcription/${chapterId}/download?format=${format}`,
            "_blank",
        );
    },

    updateSegments: (
        chapterId: string,
        segments: TranscriptSegment[],
    ): Promise<void> =>
        apiClient.put(`/transcription/${chapterId}/segments`, { segments }),

    searchTranscripts: (
        courseId: string,
        query: string,
    ): Promise<SearchResult[]> =>
        apiClient.get(
            `/transcription/search?courseId=${encodeURIComponent(courseId)}&q=${encodeURIComponent(query)}`,
        ),
};
