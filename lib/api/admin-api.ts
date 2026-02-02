/**
 * Admin API Client
 * Comprehensive API client for all admin module endpoints
 */

import { apiClient } from '../api-client';

// ==================== TYPES & INTERFACES ====================

// Admin Auth Types
export interface AdminLoginDto {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AdminVerify2FADto {
  email: string;
  verificationCode: string;
}

export interface AdminLoginResponse {
  access_token: string;
  refresh_token: string;
  requires2FA?: boolean;
  message?: string;
  admin?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  };
  rememberMe?: boolean;
}

// User Management Types
export interface UserFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'suspended' | 'deleted';
  roles?: string;
  searchTerm?: string;
  registeredFrom?: string;
  registeredTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserDetails {
  user: any;
  activityHistory: any[];
  subscriptions: any[];
  communities: any[];
  statistics: {
    totalSpent: number;
    totalCommunities: number;
    totalCourses: number;
    accountAge: number;
  };
}

export interface SuspendUserDto {
  reason: string;
  endDate?: Date;
  notifyUser?: boolean;
}

export interface ActivateUserDto {
  reason: string;
  notifyUser?: boolean;
}

export interface ResetUserPasswordDto {
  sendEmail?: boolean;
  temporaryPassword?: string;
}

// Community Management Types
export interface CommunityFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  searchTerm?: string;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApproveCommunityDto {
  approvalNotes?: string;
  featured?: boolean;
  verified?: boolean;
}

export interface RejectCommunityDto {
  rejectionReason: string;
  notifyCreator?: boolean;
}

export interface BulkCommunityApprovalDto {
  communityIds: string[];
  action: 'approve' | 'reject';
  reason?: string;
  notes?: string;
}

export interface CommunityModerationDto {
  featured?: boolean;
  verified?: boolean;
  isActive?: boolean;
  adminNotes?: string;
}

// Content Moderation Types
export interface ContentModerationFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'flagged';
  contentType?: 'post' | 'comment' | 'course' | 'event' | 'product';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  reportedFrom?: string;
  reportedTo?: string;
}

export interface ModerateContentDto {
  action: 'approve' | 'reject' | 'flag' | 'escalate';
  reason?: string;
  notes?: string;
  notifyUser?: boolean;
}

export interface BulkModerateContentDto {
  itemIds: string[];
  action: 'approve' | 'reject' | 'flag';
  reason?: string;
  notes?: string;
}

// Financial Management Types
export interface RevenueDashboardQuery {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

export interface SubscriptionFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'cancelled' | 'expired';
  planTier?: string;
  creatorId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  userId?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CalculatePayoutDto {
  communityId: string;
  creatorId: string;
  startDate: string;
  endDate: string;
}

export interface InitiatePayoutDto {
  communityId: string;
  creatorId: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'paypal' | 'stripe';
  notes?: string;
}

export interface PayoutFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  method?: 'bank_transfer' | 'paypal' | 'stripe';
  creatorId?: string;
  communityId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProcessPayoutDto {
  transactionReference?: string;
  notes?: string;
}

export interface UpdatePayoutStatusDto {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
}

// Analytics Types
export interface AnalyticsPeriodDto {
  startDate?: string;
  endDate?: string;
  granularity?: 'day' | 'week' | 'month' | 'year';
}

export interface FinancialAnalyticsQuery {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

// Security Audit Types
export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  adminUserId?: string;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SecurityEventFilters {
  page?: number;
  limit?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  eventType?: string;
  resolved?: boolean;
  startDate?: string;
  endDate?: string;
}

// Communication Management Types
export interface CreateEmailCampaignDto {
  name: string;
  subject: string;
  content: string;
  targetAudience: 'all' | 'creators' | 'members' | 'custom';
  customAudienceIds?: string[];
  scheduledAt?: Date;
  templateId?: string;
}

export interface BulkMessageDto {
  subject: string;
  message: string;
  recipientIds: string[];
  priority?: 'low' | 'normal' | 'high';
}

// ==================== API CLIENT ====================

export const adminApi = {
  // ==================== AUTH ====================
  auth: {
    login: (data: AdminLoginDto) =>
      apiClient.post<AdminLoginResponse>('/admin/login', data),

    verify2FA: (data: AdminVerify2FADto) =>
      apiClient.post<AdminLoginResponse>('/admin/verify-2fa', data),

    refreshToken: (refreshToken: string) =>
      apiClient.post('/admin/refresh', { refresh_token: refreshToken }),

    logout: () =>
      apiClient.post('/admin/logout'),

    forgotPassword: (email: string) =>
      apiClient.post('/admin/forgot-password', { email }),

    resetPassword: (data: { email: string; verificationCode: string; newPassword: string }) =>
      apiClient.post('/admin/reset-password', data),
  },

  // ==================== USER MANAGEMENT ====================
  users: {
    getUsers: (filters: UserFilters) =>
      apiClient.get('/admin/users', filters),

    createUser: (data: any) =>
      apiClient.post('/admin/users', data),

    updateUser: (userId: string, data: any) =>
      apiClient.put(`/admin/users/${userId}`, data),

    deleteUser: (userId: string) =>
      apiClient.delete(`/admin/users/${userId}`),

    getUserDetails: (userId: string) =>
      apiClient.get<UserDetails>(`/admin/users/${userId}`),

    suspendUser: (userId: string, data: SuspendUserDto) =>
      apiClient.put(`/admin/users/${userId}/suspend`, data),

    activateUser: (userId: string, data: ActivateUserDto) =>
      apiClient.put(`/admin/users/${userId}/activate`, data),

    resetPassword: (userId: string, data: ResetUserPasswordDto) =>
      apiClient.post(`/admin/users/${userId}/reset-password`, data),

    updateNotes: (userId: string, notes: string) =>
      apiClient.put(`/admin/users/${userId}/notes`, { notes }),

    getAnalytics: (period?: string) =>
      apiClient.get('/admin/users/analytics/overview', { period }),

    getGrowthMetrics: (period?: string) =>
      apiClient.get('/admin/users/analytics/growth', { period }),

    getRetentionAnalysis: () =>
      apiClient.get('/admin/users/analytics/retention'),

    getLifetimeValue: () =>
      apiClient.get('/admin/users/analytics/lifetime-value'),
  },

  // ==================== COMMUNITY MANAGEMENT ====================
  communities: {
    getCommunities: (filters: CommunityFilters) =>
      apiClient.get('/admin/communities', filters),

    getCommunityDetails: (communityId: string) =>
      apiClient.get(`/admin/communities/${communityId}`),

    getPendingApprovals: (filters: CommunityFilters) =>
      apiClient.get('/admin/communities/pending-approvals', filters),

    approveCommunity: (communityId: string, data: ApproveCommunityDto) =>
      apiClient.put(`/admin/communities/${communityId}/approve`, data),

    rejectCommunity: (communityId: string, data: RejectCommunityDto) =>
      apiClient.put(`/admin/communities/${communityId}/reject`, data),

    bulkApproval: (data: BulkCommunityApprovalDto) =>
      apiClient.post('/admin/communities/bulk-approval', data),

    moderateCommunity: (communityId: string, data: CommunityModerationDto) =>
      apiClient.put(`/admin/communities/${communityId}/moderate`, data),

    getAnalytics: (communityId?: string, period?: string) =>
      apiClient.get('/admin/communities/analytics', { communityId, period }),

    getDetailedAnalytics: (communityId: string, period?: string, startDate?: string, endDate?: string) =>
      apiClient.get(`/admin/communities/${communityId}/detailed-analytics`, { period, startDate, endDate }),

    getAnalyticsSummary: (filters: any) =>
      apiClient.get('/admin/communities/analytics/summary', filters),

    compareCommunities: (communityA: string, communityB: string, period?: string) =>
      apiClient.get('/admin/communities/analytics/compare', { communityA, communityB, period }),
  },

  // ==================== CONTENT MODERATION ====================
  contentModeration: {
    getQueue: (filters: ContentModerationFilters) =>
      apiClient.get('/admin/content-moderation/queue', filters),

    getQueueStats: () =>
      apiClient.get('/admin/content-moderation/queue/stats'),

    getAnalytics: (filters: any) =>
      apiClient.get('/admin/content-moderation/analytics', filters),

    getContentDetails: (itemId: string) =>
      apiClient.get(`/admin/content-moderation/queue/${itemId}`),

    moderateContent: (itemId: string, data: ModerateContentDto) =>
      apiClient.post(`/admin/content-moderation/queue/${itemId}/moderate`, data),

    bulkModerate: (data: BulkModerateContentDto) =>
      apiClient.post('/admin/content-moderation/queue/bulk-moderate', data),

    updatePriority: (itemId: string, priority: string) =>
      apiClient.put(`/admin/content-moderation/queue/${itemId}/priority`, { priority }),

    assignContent: (itemId: string, assignedTo: string) =>
      apiClient.post(`/admin/content-moderation/queue/${itemId}/assign`, { assignedTo }),
  },

  // ==================== FINANCIAL MANAGEMENT ====================
  financial: {
    getRevenueDashboard: (query: RevenueDashboardQuery) =>
      apiClient.get('/admin/financial/revenue-dashboard', query),

    getSubscriptions: (filters: SubscriptionFilters) =>
      apiClient.get('/admin/financial/subscriptions', filters),

    getTransactions: (filters: TransactionFilters) =>
      apiClient.get('/admin/financial/transactions', filters),

    calculatePayout: (data: CalculatePayoutDto) =>
      apiClient.post('/admin/financial/payouts/calculate', data),

    initiatePayout: (data: InitiatePayoutDto) =>
      apiClient.post('/admin/financial/payouts/initiate', data),

    getPayouts: (filters: PayoutFilters) =>
      apiClient.get('/admin/financial/payouts', filters),

    getPayoutSummary: (startDate?: string, endDate?: string) =>
      apiClient.get('/admin/financial/payouts/summary', { startDate, endDate }),

    getPayoutById: (id: string) =>
      apiClient.get(`/admin/financial/payouts/${id}`),

    processPayout: (id: string, data: ProcessPayoutDto) =>
      apiClient.post(`/admin/financial/payouts/${id}/process`, data),

    bulkProcessPayouts: (payoutIds: string[], notes?: string) =>
      apiClient.post('/admin/financial/payouts/bulk-process', { payoutIds, notes }),

    updatePayoutStatus: (id: string, data: UpdatePayoutStatusDto) =>
      apiClient.patch(`/admin/financial/payouts/${id}/status`, data),

    cancelPayout: (id: string, reason: string) =>
      apiClient.post(`/admin/financial/payouts/${id}/cancel`, { reason }),

    generateReport: (data: { startDate: string; endDate: string; includeDetails?: boolean }) =>
      apiClient.post('/admin/financial/reports/generate', data),

    // Financial Analytics
    getRevenueByContentType: (query: FinancialAnalyticsQuery) =>
      apiClient.get('/admin/financial/analytics/revenue-by-content-type', query),

    getTopCreators: (query: FinancialAnalyticsQuery, limit?: number) =>
      apiClient.get('/admin/financial/analytics/top-creators', { ...query, limit }),

    getRevenueGrowth: (query: FinancialAnalyticsQuery) =>
      apiClient.get('/admin/financial/analytics/revenue-growth', query),

    getPayoutAnalytics: (query: FinancialAnalyticsQuery) =>
      apiClient.get('/admin/financial/analytics/payout-analytics', query),

    getTransactionAnalytics: (query: FinancialAnalyticsQuery) =>
      apiClient.get('/admin/financial/analytics/transaction-analytics', query),

    getPlatformFeesAnalytics: (query: FinancialAnalyticsQuery) =>
      apiClient.get('/admin/financial/analytics/platform-fees', query),

    getFinancialHealth: (query: FinancialAnalyticsQuery) =>
      apiClient.get('/admin/financial/analytics/financial-health', query),
  },

  // ==================== ANALYTICS DASHBOARD ====================
  analytics: {
    getDashboard: (period: AnalyticsPeriodDto) =>
      apiClient.get('/admin/analytics-dashboard', period),

    getPlatformStatistics: (period: AnalyticsPeriodDto) =>
      apiClient.get('/admin/analytics-dashboard/statistics', period),

    getEngagementMetrics: (period: AnalyticsPeriodDto) =>
      apiClient.get('/admin/analytics-dashboard/engagement', period),

    getRetentionAnalysis: (period: AnalyticsPeriodDto) =>
      apiClient.get('/admin/analytics-dashboard/retention', period),

    exportAnalytics: (data: any) =>
      apiClient.post('/admin/analytics-dashboard/export', data),

    // Alerts
    createAlert: (data: any) =>
      apiClient.post('/admin/analytics-dashboard/alerts', data),

    getAlerts: () =>
      apiClient.get('/admin/analytics-dashboard/alerts'),

    getAlertById: (id: string) =>
      apiClient.get(`/admin/analytics-dashboard/alerts/${id}`),

    updateAlert: (id: string, data: any) =>
      apiClient.put(`/admin/analytics-dashboard/alerts/${id}`, data),

    deleteAlert: (id: string) =>
      apiClient.delete(`/admin/analytics-dashboard/alerts/${id}`),

    checkAlerts: () =>
      apiClient.post('/admin/analytics-dashboard/alerts/check'),
  },

  // ==================== SECURITY AUDIT ====================
  security: {
    getAuditLogs: (filters: AuditLogFilters) =>
      apiClient.get('/admin/security-audit/audit-logs', filters),

    getAuditLogById: (id: string) =>
      apiClient.get(`/admin/security-audit/audit-logs/${id}`),

    getSecurityEvents: (filters: SecurityEventFilters) =>
      apiClient.get('/admin/security-audit/security-events', filters),

    getSecurityEventById: (id: string) =>
      apiClient.get(`/admin/security-audit/security-events/${id}`),

    resolveSecurityEvent: (id: string, resolution: string) =>
      apiClient.post(`/admin/security-audit/security-events/${id}/resolve`, { resolution }),

    getSecurityMetrics: (startDate?: string, endDate?: string) =>
      apiClient.get('/admin/security-audit/metrics', { startDate, endDate }),

    exportAuditLogs: (filters: AuditLogFilters, format: 'csv' | 'json' | 'pdf' = 'csv') =>
      apiClient.post('/admin/security-audit/audit-logs/export', { ...filters, format }),
  },

  // ==================== COMMUNICATION MANAGEMENT ====================
  communication: {
    createEmailCampaign: (data: CreateEmailCampaignDto) =>
      apiClient.post('/admin/communication/email-campaigns', data),

    getEmailCampaigns: (filters: any) =>
      apiClient.get('/admin/communication/email-campaigns', filters),

    getEmailCampaignById: (id: string) =>
      apiClient.get(`/admin/communication/email-campaigns/${id}`),

    updateEmailCampaign: (id: string, data: Partial<CreateEmailCampaignDto>) =>
      apiClient.put(`/admin/communication/email-campaigns/${id}`, data),

    deleteEmailCampaign: (id: string) =>
      apiClient.delete(`/admin/communication/email-campaigns/${id}`),

    sendEmailCampaign: (id: string) =>
      apiClient.post(`/admin/communication/email-campaigns/${id}/send`),

    sendBulkMessage: (data: BulkMessageDto) =>
      apiClient.post('/admin/communication/bulk-message', data),

    getEmailTemplates: () =>
      apiClient.get('/admin/communication/email-templates'),

    createEmailTemplate: (data: any) =>
      apiClient.post('/admin/communication/email-templates', data),

    updateEmailTemplate: (id: string, data: any) =>
      apiClient.put(`/admin/communication/email-templates/${id}`, data),

    deleteEmailTemplate: (id: string) =>
      apiClient.delete(`/admin/communication/email-templates/${id}`),

    getCampaignAnalytics: (filters: any) =>
      apiClient.get('/admin/communication/analytics', filters),
  },
};

export default adminApi;
