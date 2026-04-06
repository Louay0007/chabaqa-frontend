import { apiClient } from "./client";
import type { ApiSuccessResponse, PaginatedResponse } from "./client";
import type {
    LandingPage,
    PageLead,
    PageAnalytics,
    Funnel,
} from "@/lib/landing-pages/types";

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateLandingPageData {
    title: string;
    slug?: string;
    description?: string;
    communityId?: string;
    templateId?: string;
    pageType?: "standalone" | "community-home" | "funnel-step";
    seo?: {
        title?: string;
        description?: string;
        keywords?: string[];
        noIndex?: boolean;
    };
}

export interface UpdateLandingPageData {
    title?: string;
    slug?: string;
    description?: string;
    blocks?: Record<string, any>[];
    seo?: {
        title?: string;
        description?: string;
        keywords?: string[];
        ogImage?: string;
        noIndex?: boolean;
    };
    favicon?: string;
    thumbnail?: string;
    pageType?: "standalone" | "community-home" | "funnel-step";
    isPrimaryHome?: boolean;
    status?: "draft" | "published" | "archived";
    settings?: {
        passwordProtected?: boolean;
        password?: string;
        trackingPixels?: { meta?: string; google?: string };
    };
}

export interface PublishSettings {
    customDomain?: string;
    passwordProtected?: boolean;
    password?: string;
}

export interface LeadsQueryParams {
    page?: number;
    limit?: number;
    score?: string;
    source?: string;
    search?: string;
    status?: string;
}

export interface CreateFunnelData {
    name: string;
    description?: string;
    steps?: Record<string, any>[];
    connections?: Record<string, any>[];
}

// ─── Landing Pages API ────────────────────────────────────────────────────────

export const landingPagesApi = {
    getAll: async (): Promise<ApiSuccessResponse<LandingPage[]>> => {
        return apiClient.get<ApiSuccessResponse<LandingPage[]>>(
            "/landing-pages",
        );
    },

    create: async (
        data: CreateLandingPageData,
    ): Promise<ApiSuccessResponse<LandingPage>> => {
        return apiClient.post<ApiSuccessResponse<LandingPage>>(
            "/landing-pages",
            data,
        );
    },

    getById: async (id: string): Promise<ApiSuccessResponse<LandingPage>> => {
        return apiClient.get<ApiSuccessResponse<LandingPage>>(
            `/landing-pages/${id}`,
        );
    },

    update: async (
        id: string,
        data: UpdateLandingPageData,
    ): Promise<ApiSuccessResponse<LandingPage>> => {
        return apiClient.patch<ApiSuccessResponse<LandingPage>>(
            `/landing-pages/${id}`,
            data,
        );
    },

    delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
        return apiClient.delete<ApiSuccessResponse<void>>(
            `/landing-pages/${id}`,
        );
    },

    publish: async (
        id: string,
        settings?: PublishSettings,
    ): Promise<ApiSuccessResponse<LandingPage>> => {
        return apiClient.post<ApiSuccessResponse<LandingPage>>(
            `/landing-pages/${id}/publish`,
            settings ?? {},
        );
    },

    unpublish: async (id: string): Promise<ApiSuccessResponse<LandingPage>> => {
        return apiClient.post<ApiSuccessResponse<LandingPage>>(
            `/landing-pages/${id}/unpublish`,
        );
    },

    duplicate: async (id: string): Promise<ApiSuccessResponse<LandingPage>> => {
        return apiClient.post<ApiSuccessResponse<LandingPage>>(
            `/landing-pages/${id}/duplicate`,
        );
    },

    // Analytics
    getAnalytics: async (
        id: string,
        timeRange: "7d" | "30d" | "90d" | "all" = "30d",
    ): Promise<ApiSuccessResponse<PageAnalytics>> => {
        return apiClient.get<ApiSuccessResponse<PageAnalytics>>(
            `/landing-pages/${id}/analytics`,
            { timeRange } as Record<string, any>,
        );
    },

    // Leads
    getLeads: async (
        id: string,
        params?: LeadsQueryParams,
    ): Promise<PaginatedResponse<PageLead>> => {
        return apiClient.get<PaginatedResponse<PageLead>>(
            `/landing-pages/${id}/leads`,
            params as Record<string, any>,
        );
    },

    exportLeads: async (
        id: string,
        format: "csv" | "json" = "csv",
    ): Promise<Blob> => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
        const token =
            typeof window !== "undefined"
                ? localStorage.getItem("accessToken")
                : null;
        const response = await fetch(
            `${baseUrl}/landing-pages/${id}/leads/export?format=${format}`,
            {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                credentials: "include",
            },
        );
        if (!response.ok) throw new Error("Export failed");
        return response.blob();
    },

    deleteLead: async (
        pageId: string,
        leadId: string,
    ): Promise<ApiSuccessResponse<void>> => {
        return apiClient.delete<ApiSuccessResponse<void>>(
            `/landing-pages/${pageId}/leads/${leadId}`,
        );
    },

    // Public (no auth)
    submitLead: async (
        pageId: string,
        data: Record<string, any>,
    ): Promise<ApiSuccessResponse<{ leadId: string }>> => {
        return apiClient.post<ApiSuccessResponse<{ leadId: string }>>(
            `/landing-pages/public/${pageId}/submit`,
            data,
        );
    },

    trackView: async (
        pageId: string,
        data: { sessionId: string; referrer?: string; device?: string },
    ): Promise<void> => {
        try {
            await apiClient.post(`/landing-pages/public/${pageId}/view`, data);
        } catch {
            // Non-critical: swallow tracking failures
        }
    },

    trackExit: async (
        pageId: string,
        sessionId: string,
        duration: number,
        converted?: boolean,
    ): Promise<void> => {
        try {
            await apiClient.post(
                `/landing-pages/public/${pageId}/view/${sessionId}/exit`,
                { duration, converted },
            );
        } catch {
            // Non-critical
        }
    },
};

// ─── Community Home Page API ─────────────────────────────────────────────────

export interface CommunityHomePageData {
    page: any;
    community: any;
}

export const communityHomePageApi = {
    /**
     * Get or create a community home page draft
     */
    async getOrCreateDraft(communityId: string): Promise<any> {
        const response = await apiClient.post<ApiSuccessResponse<any>>(
            `/communities/${communityId}/home-page`,
            {},
        );
        return response.data;
    },

    /**
     * Get community home page for editing
     */
    async getForEditing(communityId: string): Promise<any> {
        const response = await apiClient.get<ApiSuccessResponse<any>>(
            `/communities/${communityId}/home-page/edit`,
        );
        return response.data;
    },

    /**
     * Update community home page
     */
    async update(communityId: string, data: any): Promise<any> {
        const response = await apiClient.patch<ApiSuccessResponse<any>>(
            `/communities/${communityId}/home-page`,
            data,
        );
        return response.data;
    },

    /**
     * Publish community home page
     */
    async publish(communityId: string, settings?: any): Promise<any> {
        const response = await apiClient.post<ApiSuccessResponse<any>>(
            `/communities/${communityId}/home-page/publish`,
            settings || {},
        );
        return response.data;
    },

    /**
     * Unpublish community home page
     */
    async unpublish(communityId: string): Promise<any> {
        const response = await apiClient.post<ApiSuccessResponse<any>>(
            `/communities/${communityId}/home-page/unpublish`,
            {},
        );
        return response.data;
    },

    /**
     * Get community home page analytics
     */
    async getAnalytics(communityId: string, timeRange?: string): Promise<any> {
        const params = timeRange ? `?timeRange=${timeRange}` : "";
        const response = await apiClient.get<ApiSuccessResponse<any>>(
            `/communities/${communityId}/home-page/analytics${params}`,
        );
        return response.data;
    },

    /**
     * Get public community home page by slug
     */
    async getPublicBySlug(slug: string): Promise<CommunityHomePageData | null> {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/communities/${slug}/home-page`,
                {
                    cache: "force-cache",
                    next: { revalidate: 60 },
                },
            );
            if (!response.ok) return null;
            const json = await response.json();
            return json.data || json;
        } catch {
            return null;
        }
    },

    /**
     * Get all community home pages for the authenticated creator
     */
    async getAllForCreator(): Promise<any[]> {
        const response = await apiClient.get<ApiSuccessResponse<any[]>>(
            "/landing-pages/community-homes",
        );
        return response.data ?? [];
    },
};

// ─── Funnels API ──────────────────────────────────────────────────────────────

export const funnelsApi = {
    getAll: async (): Promise<ApiSuccessResponse<Funnel[]>> => {
        return apiClient.get<ApiSuccessResponse<Funnel[]>>("/funnels");
    },

    create: async (
        data: CreateFunnelData,
    ): Promise<ApiSuccessResponse<Funnel>> => {
        return apiClient.post<ApiSuccessResponse<Funnel>>("/funnels", data);
    },

    getById: async (id: string): Promise<ApiSuccessResponse<Funnel>> => {
        return apiClient.get<ApiSuccessResponse<Funnel>>(`/funnels/${id}`);
    },

    update: async (
        id: string,
        data: Partial<Funnel> & {
            steps?: any[];
            connections?: any[];
            status?: string;
        },
    ): Promise<ApiSuccessResponse<Funnel>> => {
        return apiClient.patch<ApiSuccessResponse<Funnel>>(
            `/funnels/${id}`,
            data,
        );
    },

    delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
        return apiClient.delete<ApiSuccessResponse<void>>(`/funnels/${id}`);
    },

    getAnalytics: async (
        id: string,
    ): Promise<ApiSuccessResponse<Funnel["analytics"]>> => {
        return apiClient.get<ApiSuccessResponse<Funnel["analytics"]>>(
            `/funnels/${id}/analytics`,
        );
    },
};
