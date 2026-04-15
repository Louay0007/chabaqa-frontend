import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export interface ContactActivity {
    _id: string;
    communityId: string;
    userId: string;
    type: 'email_open' | 'email_click' | 'purchase' | 'login' | 'content_view' | 'tag_added' | 'unsubscribed' | 'imported';
    campaignId?: string;
    metadata: Record<string, any>;
    occurredAt: string;
}

export interface ContactProfile {
    _id: string;
    communityId: string;
    userId: string;
    tags: string[];
    leadScore: number;
    notes: string;
    customFields: Record<string, any>;
    updatedAt: string;
}

export interface AudienceSegment {
    _id: string;
    communityId: string;
    name: string;
    description: string;
    filters: SegmentFilter[];
    estimatedSize: number;
    lastCalculatedAt?: string;
    createdAt: string;
}

export interface SegmentFilter {
    field: 'inactivity_days' | 'purchase_count' | 'tag' | 'email_open_rate' | 'login_count' | 'joined_days_ago' | 'lead_score';
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'not_contains';
    value: any;
}

export interface EmailTemplate {
    _id: string;
    communityId: string;
    name: string;
    category: 'announcement' | 'newsletter' | 'promotion' | 'welcome' | 'reminder' | 'custom';
    subject: string;
    content: string;
    thumbnail?: string;
    variables: string[];
    isGlobal: boolean;
    usageCount: number;
    createdAt: string;
}

export interface EmailSuppression {
    _id: string;
    communityId: string;
    email: string;
    reason: 'unsubscribed' | 'bounced' | 'spam_complaint' | 'manual';
    source: 'link' | 'api' | 'import' | 'bounce_webhook';
    createdAt: string;
}

export interface DeliverabilityHealth {
    score: number;
    status: 'healthy' | 'warning' | 'critical';
    bounceRate: number;
    spamRate: number;
    unsubscribeRate: number;
    avgOpenRate: number;
    avgClickRate: number;
    totalSent: number;
}

export interface DeliverabilitySnapshot {
    _id: string;
    communityId: string;
    date: string;
    sent: number;
    delivered: number;
    bounced: number;
    spamComplaints: number;
    unsubscribes: number;
    openRate: number;
    clickRate: number;
    deliverabilityScore: number;
}

// ============================================================================
// CRM API
// ============================================================================

function unwrap<T>(response: any): T {
    if (response?.data?.data !== undefined) return response.data.data as T;
    if (response?.data !== undefined) return response.data as T;
    return response as T;
}

export const crmApi = {
    // ── Contact Activity Timeline ─────────────────────────────────────────
    async getContactTimeline(
        communityId: string,
        userId: string,
        params?: { page?: number; limit?: number; types?: string }
    ) {
        const response = await apiClient.get<any>(
            `/contact-activity/${communityId}/user/${userId}`,
            params
        );
        return unwrap<{ items: ContactActivity[]; total: number; page: number; limit: number }>(response);
    },

    // ── Contact Profiles ─────────────────────────────────────────────────
    async listContacts(
        communityId: string,
        params?: { tags?: string; minScore?: number; maxScore?: number; page?: number; limit?: number }
    ) {
        const response = await apiClient.get<any>(`/contact-profiles/${communityId}`, params);
        return unwrap<{ items: ContactProfile[]; total: number; page: number; limit: number }>(response);
    },

    async getContactProfile(communityId: string, userId: string) {
        const response = await apiClient.get<any>(`/contact-profiles/${communityId}/${userId}`);
        return unwrap<ContactProfile>(response);
    },

    async updateContactProfile(communityId: string, userId: string, patch: Partial<Pick<ContactProfile, 'tags' | 'notes' | 'customFields' | 'leadScore'>>) {
        const response = await apiClient.patch<any>(`/contact-profiles/${communityId}/${userId}`, patch);
        return unwrap<ContactProfile>(response);
    },

    async recalculateScore(communityId: string, userId: string) {
        const response = await apiClient.post<any>(`/contact-profiles/${communityId}/${userId}/recalculate-score`, {});
        return unwrap<{ score: number }>(response);
    },

    // ── Audience Segments ─────────────────────────────────────────────────
    async listSegments(communityId: string) {
        const response = await apiClient.get<any>(`/audience-segments/${communityId}`);
        return unwrap<AudienceSegment[]>(response);
    },

    async createSegment(dto: { communityId: string; name: string; description?: string; filters: SegmentFilter[] }) {
        const response = await apiClient.post<any>('/audience-segments', dto);
        return unwrap<AudienceSegment>(response);
    },

    async evaluateSegment(id: string) {
        const response = await apiClient.post<any>(`/audience-segments/${id}/evaluate`, {});
        return unwrap<{ count: number; sample: string[] }>(response);
    },

    async deleteSegment(id: string) {
        return apiClient.delete<void>(`/audience-segments/${id}`);
    },

    // ── Email Templates ───────────────────────────────────────────────────
    async listTemplates(communityId: string) {
        const response = await apiClient.get<any>(`/email-templates/${communityId}`);
        return unwrap<EmailTemplate[]>(response);
    },

    async getTemplate(communityId: string, id: string) {
        const response = await apiClient.get<any>(`/email-templates/${communityId}/${id}`);
        return unwrap<EmailTemplate>(response);
    },

    async createTemplate(dto: Omit<EmailTemplate, '_id' | 'usageCount' | 'createdAt'>) {
        const response = await apiClient.post<any>('/email-templates', dto);
        return unwrap<EmailTemplate>(response);
    },

    async updateTemplate(id: string, patch: Partial<Omit<EmailTemplate, '_id' | 'communityId' | 'creatorId' | 'usageCount' | 'createdAt'>>) {
        const response = await apiClient.put<any>(`/email-templates/${id}`, patch);
        return unwrap<EmailTemplate>(response);
    },

    async deleteTemplate(id: string) {
        return apiClient.delete<void>(`/email-templates/${id}`);
    },

    async useTemplate(id: string) {
        const response = await apiClient.post<any>(`/email-templates/${id}/use`, {});
        return unwrap<EmailTemplate>(response);
    },

    // ── Suppression ───────────────────────────────────────────────────────
    async listSuppressions(communityId: string, params?: { page?: number; limit?: number }) {
        const response = await apiClient.get<any>(`/email-suppression/${communityId}`, params);
        return unwrap<{ items: EmailSuppression[]; total: number; page: number; limit: number }>(response);
    },

    async removeSuppression(communityId: string, email: string) {
        return apiClient.delete<void>(`/email-suppression/${communityId}/${encodeURIComponent(email)}`);
    },

    // ── Import / Export ───────────────────────────────────────────────────
    async importContacts(communityId: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<any>(`/contacts/${communityId}/import`, formData);
        return unwrap<{ imported: number; skipped: number; errors: string[] }>(response);
    },

    exportContactsUrl(communityId: string, params?: { segment?: string; tags?: string }) {
        const base = process.env.NEXT_PUBLIC_API_URL || '';
        const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
        return `${base}/contacts/${communityId}/export${qs}`;
    },

    // ── Deliverability ────────────────────────────────────────────────────
    async getDeliverabilityHealth(communityId: string) {
        const response = await apiClient.get<any>(`/email-deliverability/${communityId}/summary`);
        return unwrap<DeliverabilityHealth>(response);
    },

    async getDeliverabilityHistory(communityId: string, days = 30) {
        const response = await apiClient.get<any>(`/email-deliverability/${communityId}/history`, { days });
        return unwrap<DeliverabilitySnapshot[]>(response);
    },

    // ── A/B Test ──────────────────────────────────────────────────────────
    async getCampaignAbTest(campaignId: string) {
        const response = await apiClient.get<any>(`/email-campaigns/${campaignId}`);
        return unwrap<any>(response);
    },

    async pickAbTestWinner(campaignId: string, winner: 'A' | 'B') {
        const response = await apiClient.post<any>(`/email-campaigns/${campaignId}/ab-test/pick-winner`, { winner });
        return unwrap<any>(response);
    },
};
