import { apiClient, ApiSuccessResponse } from "./client";

export enum LiveRoomStatus {
    SCHEDULED = "scheduled",
    LIVE = "live",
    ENDED = "ended",
    CANCELLED = "cancelled",
}

export enum LiveRoomType {
    BROADCAST = "broadcast",
    MEETING = "meeting",
}

export interface LiveRoom {
    _id: string;
    roomId: string;
    communityId: string;
    hostId: string;
    title: string;
    description?: string;
    roomType: LiveRoomType;
    status: LiveRoomStatus;
    thumbnailUrl?: string;
    scheduledAt?: string;
    startedAt?: string;
    endedAt?: string;
    liveKitRoomName?: string;
    wsUrl?: string;
    isPublic: boolean;
    maxParticipants: number;
    recordingEnabled: boolean;
    viewerCount: number;
    peakViewerCount: number;
    chatEnabled: boolean;
    allowScreenShare: boolean;
    allowQuestions: boolean;
    reactionsEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLiveRoomPayload {
    title: string;
    description?: string;
    roomType?: LiveRoomType;
    scheduledAt?: string; // ISO date string
    maxParticipants?: number;
    isPublic?: boolean;
    chatEnabled?: boolean;
    allowScreenShare?: boolean;
    allowQuestions?: boolean;
    reactionsEnabled?: boolean;
    recordingEnabled?: boolean;
}

export interface LiveRoomTokenResult {
    token: string;
    wsUrl: string;
}

export const liveStreamingApi = {
    /** Create a live room (creator only) */
    create: (
        communityId: string,
        payload: CreateLiveRoomPayload,
    ): Promise<ApiSuccessResponse<LiveRoom>> =>
        apiClient.post(`/live-rooms/${communityId}`, payload),

    /** Start a scheduled room (creator only) */
    start: (
        communityId: string,
        roomId: string,
    ): Promise<ApiSuccessResponse<LiveRoom>> =>
        apiClient.post(`/live-rooms/${communityId}/${roomId}/start`),

    /** End a live room (creator only) */
    end: (
        communityId: string,
        roomId: string,
    ): Promise<ApiSuccessResponse<{ message: string }>> =>
        apiClient.post(`/live-rooms/${communityId}/${roomId}/end`),

    /** Cancel a scheduled room (creator only) */
    cancel: (
        communityId: string,
        roomId: string,
    ): Promise<ApiSuccessResponse<{ message: string }>> =>
        apiClient.delete(`/live-rooms/${communityId}/${roomId}`),

    /** Get a specific room by roomId */
    getRoom: (
        communityId: string,
        roomId: string,
    ): Promise<ApiSuccessResponse<LiveRoom>> =>
        apiClient.get(`/live-rooms/${communityId}/${roomId}`),

    /** Get all rooms for a community (optional status filter) */
    getRooms: (
        communityId: string,
        status?: LiveRoomStatus,
    ): Promise<ApiSuccessResponse<LiveRoom[]>> =>
        apiClient.get(
            `/live-rooms/${communityId}${status ? `?status=${status}` : ""}`,
        ),

    /** Get upcoming scheduled streams */
    getUpcoming: (
        communityId: string,
    ): Promise<ApiSuccessResponse<LiveRoom[]>> =>
        apiClient.get(`/live-rooms/${communityId}/schedule/upcoming`),

    /** Get currently active live stream */
    getActive: (
        communityId: string,
    ): Promise<ApiSuccessResponse<LiveRoom | null>> =>
        apiClient.get(`/live-rooms/${communityId}/stream/active`),

    /** Get past/ended streams */
    getPast: (communityId: string): Promise<ApiSuccessResponse<LiveRoom[]>> =>
        apiClient.get(`/live-rooms/${communityId}/history/past`),

    /** Get a LiveKit join token */
    getToken: (
        communityId: string,
        roomId: string,
        role: "host" | "speaker" | "viewer",
    ): Promise<{ success: boolean; token: string; wsUrl: string }> =>
        apiClient.get(
            `/live-rooms/${communityId}/${roomId}/token?role=${role}`,
        ),
};
