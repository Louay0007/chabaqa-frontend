import { apiClient, PaginationParams } from './client';

// ============================================================================
// Type Definitions
// ============================================================================

export type EmailCampaignStatus =
    | 'draft'
    | 'scheduled'
    | 'sending'
    | 'sent'
    | 'failed'
    | 'cancelled';

export type EmailCampaignType =
    | 'announcement'
    | 'newsletter'
    | 'promotion'
    | 'event_reminder'
    | 'course_update'
    | 'inactive_user_reactivation'
    | 'custom';

export type InactivityPeriod =
    | 'last_7_days'
    | 'last_15_days'
    | 'last_30_days'
    | 'last_60_days'
    | 'more_than_60_days';

export type ContentType =
    | 'event'
    | 'challenge'
    | 'cours'
    | 'product'
    | 'session'
    | 'all';

export interface EmailRecipient {
    userId: string;
    email: string;
    name: string;
    status: 'pending' | 'sent' | 'failed' | 'bounced';
    sentAt?: string;
    errorMessage?: string;
    opened: boolean;
    openedAt?: string;
    clickCount: number;
    clickedAt?: string[];
    personalizedContent?: string;
    personalizedSubject?: string;
}

export interface EmailCampaign {
    _id: string;
    title: string;
    subject: string;
    content: string;
    communityId: string;
    creatorId: {
        _id: string;
        name: string;
        email: string;
    };
    type: EmailCampaignType;
    status: EmailCampaignStatus;
    recipients: EmailRecipient[];
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    openCount: number;
    clickCount: number;
    isHtml: boolean;
    templateId?: string;
    templateData?: Record<string, any>;
    trackOpens: boolean;
    trackClicks: boolean;
    isInactiveUserCampaign?: boolean;
    targetInactivityPeriod?: InactivityPeriod;
    targetDaysThreshold?: number;
    targetAllInactive?: boolean;
    scheduledAt?: string;
    sentAt?: string;
    createdAt: string;
    updatedAt?: string;
    metadata?: Record<string, any>;
}

export interface CampaignStats {
    totalCampaigns: number;
    totalEmailsSent: number;
    totalEmailsFailed: number;
    totalOpens: number;
    totalClicks: number;
    averageOpenRate: number;
    averageClickRate: number;
    reactivationCampaigns: number;
    reactivationSuccessRate: number;
}

export interface InactiveUserStats {
    totalMembers: number;
    activeUsers: number;
    inactive7d: number;
    inactive15d: number;
    inactive30d: number;
    inactive60dPlus: number;
    totalInactiveUsers: number;
    breakdown: any[];
}

export interface UserLoginActivity {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    communityId: string;
    lastLoginAt: string;
    daysSinceLastLogin: number;
    inactivityStatus: 'active' | 'inactive_7d' | 'inactive_15d' | 'inactive_30d' | 'inactive_60d_plus';
    isReactivationTarget: boolean;
    lastReactivationEmailSent?: string;
    reactivationEmailCount: number;
    joinedAt: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateEmailCampaignDto {
    title: string;
    subject: string;
    content: string;
    communityId: string;
    type?: EmailCampaignType;
    isHtml?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    scheduledAt?: string;
    metadata?: Record<string, any>;
}

export interface CreateInactiveUserCampaignDto {
    title: string;
    subject: string;
    content: string;
    communityId: string;
    inactivityPeriod: InactivityPeriod;
    targetAllInactive?: boolean;
    maxRecipients?: number;
    isHtml?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    scheduledAt?: string;
    metadata?: Record<string, any>;
}

export interface CreateContentReminderDto {
    title: string;
    subject: string;
    content: string;
    communityId: string;
    contentType: ContentType;
    contentId?: string;
    scheduledAt?: string;
    isHtml?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    metadata?: Record<string, any>;
}

export interface UpdateEmailCampaignDto {
    title?: string;
    subject?: string;
    content?: string;
    status?: EmailCampaignStatus;
    scheduledAt?: string;
    isHtml?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    metadata?: Record<string, any>;
}

export interface EmailCampaignQueryParams extends PaginationParams {
    status?: EmailCampaignStatus;
    type?: EmailCampaignType;
    inactiveUserCampaigns?: boolean;
    search?: string;
}

export interface InactiveUserQueryParams {
    period?: InactivityPeriod;
    limit?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface GetCampaignsResponse {
    campaigns: EmailCampaign[];
    total: number;
    page: number;
    limit: number;
}

export interface SendCampaignResponse {
    message: string;
    campaignId: string;
}

export interface CreateContentReminderResponse {
    campaignId: string;
}

export interface CancelCampaignResponse {
    message: string;
    campaignId: string;
}

export interface DuplicateCampaignResponse {
    title?: string;
}

export interface GetCampaignRecipientsResponse {
    recipients: EmailRecipient[];
    total: number;
    page: number;
    limit: number;
}

export interface SendTestEmailResponse {
    message: string;
    toEmail: string;
}

export interface InactivityPeriodInfo {
    value: string;
    label: string;
    days: number;
}

export interface GetInactivityPeriodsResponse {
    periods: InactivityPeriodInfo[];
}

// ============================================================================
// API Client Methods
// ============================================================================

export const emailCampaignsApi = {
    /**
     * Get all campaigns for a community with pagination and filters
     */
    async getCommunityCampaigns(
        communityId: string,
        params?: EmailCampaignQueryParams
    ): Promise<GetCampaignsResponse> {
        const response = await apiClient.get<any>(
            `/email-campaigns/community/${communityId}`,
            params
        );
        // Unwrap common shapes:
        // 1) { success, message, data: { campaigns, total, page, limit } }
        // 2) { campaigns, total, page, limit }
        // 3) direct campaigns payload (rare)
        if (response?.data?.campaigns) return response.data as GetCampaignsResponse;
        if (response?.data?.data?.campaigns) return response.data.data as GetCampaignsResponse;
        if (response?.campaigns) return response as GetCampaignsResponse;
        return response as GetCampaignsResponse;
    },

    /**
     * Get campaign statistics for a community
     */
    async getCampaignStats(communityId: string): Promise<CampaignStats> {
        const response = await apiClient.get<any>(
            `/email-campaigns/community/${communityId}/stats`
        );
        // Unwrap common shapes
        if (response?.data) return response.data as CampaignStats;
        return response as CampaignStats;
    },

    /**
     * Get inactive user statistics for a community
     */
    async getInactiveUserStats(communityId: string): Promise<InactiveUserStats> {
        return apiClient.get<InactiveUserStats>(
            `/email-campaigns/community/${communityId}/inactive-stats`
        );
    },

    /**
     * Get inactive users for a community
     */
    async getInactiveUsers(
        communityId: string,
        params?: InactiveUserQueryParams
    ): Promise<UserLoginActivity[]> {
        return apiClient.get<UserLoginActivity[]>(
            `/email-campaigns/community/${communityId}/inactive-users`,
            params
        );
    },

    /**
     * Get a specific campaign by ID
     */
    async getCampaign(campaignId: string): Promise<EmailCampaign> {
        return apiClient.get<EmailCampaign>(`/email-campaigns/${campaignId}`);
    },

    /**
     * Create a regular email campaign
     */
    async createCampaign(data: CreateEmailCampaignDto): Promise<EmailCampaign> {
        return apiClient.post<EmailCampaign>('/email-campaigns', data);
    },

    /**
     * Create an inactive user reactivation campaign
     */
    async createInactiveUserCampaign(
        data: CreateInactiveUserCampaignDto
    ): Promise<EmailCampaign> {
        return apiClient.post<EmailCampaign>('/email-campaigns/inactive-users', data);
    },

    /**
     * Update a campaign (only works for draft campaigns)
     */
    async updateCampaign(
        campaignId: string,
        data: UpdateEmailCampaignDto
    ): Promise<EmailCampaign> {
        return apiClient.put<EmailCampaign>(`/email-campaigns/${campaignId}`, data);
    },

    /**
     * Delete a campaign (only works for draft campaigns)
     */
    async deleteCampaign(campaignId: string): Promise<void> {
        return apiClient.delete<void>(`/email-campaigns/${campaignId}`);
    },

    /**
     * Send a campaign to all recipients
     */
    async sendCampaign(campaignId: string): Promise<SendCampaignResponse> {
        return apiClient.post<SendCampaignResponse>(
            `/email-campaigns/${campaignId}/send`
        );
    },

    /**
     * Create and send a content reminder campaign
     */
    async createContentReminder(
        data: CreateContentReminderDto
    ): Promise<CreateContentReminderResponse> {
        return apiClient.post<CreateContentReminderResponse>(
            '/email-campaigns/content-reminder',
            data
        );
    },

    /**
     * Cancel a scheduled campaign
     */
    async cancelCampaign(campaignId: string): Promise<CancelCampaignResponse> {
        return apiClient.post<CancelCampaignResponse>(
            `/email-campaigns/${campaignId}/cancel`
        );
    },

    /**
     * Duplicate/copy a campaign
     */
    async duplicateCampaign(
        campaignId: string,
        newTitle?: string
    ): Promise<EmailCampaign> {
        return apiClient.post<EmailCampaign>(
            `/email-campaigns/${campaignId}/duplicate`,
            { title: newTitle }
        );
    },

    /**
     * Get campaign recipients with pagination and filters
     */
    async getCampaignRecipients(
        campaignId: string,
        params?: {
            page?: number;
            limit?: number;
            status?: string;
            opened?: boolean;
        }
    ): Promise<GetCampaignRecipientsResponse> {
        return apiClient.get<GetCampaignRecipientsResponse>(
            `/email-campaigns/${campaignId}/recipients`,
            params
        );
    },

    /**
     * Send a test email
     */
    async sendTestEmail(data: {
        toEmail: string;
        subject: string;
        content: string;
        communityId?: string;
        isHtml?: boolean;
    }): Promise<SendTestEmailResponse> {
        return apiClient.post<SendTestEmailResponse>(
            '/email-campaigns/test-email',
            data
        );
    },

    /**
     * Get available inactivity periods
     */
    async getInactivityPeriods(): Promise<GetInactivityPeriodsResponse> {
        return apiClient.get<GetInactivityPeriodsResponse>(
            '/email-campaigns/inactivity-periods'
        );
    },
};
