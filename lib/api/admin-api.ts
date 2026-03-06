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
    twoFactorEnabled?: boolean;
  };
  roles?: string[];
  permissions?: string[];
  capabilities?: AdminCapabilities;
  rememberMe?: boolean;
}

export interface AdminCapabilities {
  dashboard: boolean;
  users: boolean;
  communities: boolean;
  contentModeration: boolean;
  financial: boolean;
  analytics: boolean;
  security: boolean;
  communication: boolean;
  liveSupport: boolean;
  settings: boolean;
}

export interface AdminSessionResponse {
  admin: {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string | Date;
    twoFactorEnabled?: boolean;
  };
  roles: string[];
  permissions: string[];
  capabilities: AdminCapabilities;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
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
  status?: string | string[];
  plan?: string | string[];
  planTier?: string;
  creatorId?: string;
  subscriberId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  cancelAtPeriodEnd?: boolean;
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
  reference?: string;
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
  status?: string | string[];
  method?: string | string[];
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

export interface AdminPayoutBankCredentials {
  rib?: string | null;
  bankName?: string | null;
  ownerName?: string | null;
  countryCode?: string | null;
}

export interface AdminPayoutDetails {
  _id: string;
  creator: {
    _id: string;
    username: string;
    email: string;
  };
  community: {
    _id: string;
    name: string;
    slug?: string;
  };
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  method: 'bank_transfer' | 'paypal' | 'stripe';
  initiatedAt: string;
  processedAt?: string;
  transactionReference?: string | null;
  notes?: string | null;
  createdBy?: {
    _id: string;
    name: string;
  };
  bankCredentials?: AdminPayoutBankCredentials | null;
  bankAccount?: AdminPayoutBankCredentials | null;
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

export interface LiveSupportAdminFilters {
  view?: 'available' | 'mine' | 'closed';
  search?: string;
  page?: number;
  limit?: number;
}

// Communication Management Types
export interface CreateEmailCampaignDto {
  title: string;
  subject: string;
  content: string;
  type: 'announcement' | 'newsletter' | 'promotion' | 'event_reminder' | 'course_update' | 'custom';
  audienceTarget: 'all_users' | 'community_members' | 'active_users' | 'inactive_users' | 'specific_users' | 'user_role';
  communityId?: string;
  specificUserIds?: string[];
  targetRoles?: string[];
  scheduledAt?: Date;
  templateId?: string;
  isHtml?: boolean;
  trackOpens?: boolean;
  trackClicks?: boolean;
  personalizationVariables?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Temporary compatibility input for legacy admin UI forms.
export interface LegacyCreateEmailCampaignDto {
  name: string;
  subject: string;
  content: string;
  targetAudience: 'all' | 'creators' | 'members' | 'custom';
  customAudienceIds?: string[];
  scheduledAt?: Date;
  templateId?: string;
}

export interface BulkMessageDto {
  title: string;
  content: string;
  channel: 'email' | 'in_app' | 'both';
  audienceTarget: 'all_users' | 'community_members' | 'active_users' | 'inactive_users' | 'specific_users' | 'user_role';
  communityId?: string;
  specificUserIds?: string[];
  targetRoles?: string[];
  personalizationVariables?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateEmailTemplateDto {
  name: string;
  description: string;
  category: 'welcome' | 'announcement' | 'newsletter' | 'transactional' | 'marketing' | 'notification' | 'custom';
  subject: string;
  content: string;
  variables?: string[];
  isActive?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

const getResponseRoot = (response: any) => response || {};
const getResponseData = (response: any) => {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return response.data;
  }
  return response?.data;
};

const toArray = <T = any>(value: any): T[] => {
  if (Array.isArray(value)) return value as T[];
  return [];
};

const legacyAudienceToCanonical = (
  targetAudience?: 'all' | 'creators' | 'members' | 'custom',
): {
  audienceTarget: CreateEmailCampaignDto['audienceTarget'];
  specificUserIds?: string[];
  targetRoles?: string[];
} => {
  switch (targetAudience) {
    case 'creators':
      return { audienceTarget: 'user_role', targetRoles: ['creator'] };
    case 'members':
      return { audienceTarget: 'user_role', targetRoles: ['user'] };
    case 'custom':
      return { audienceTarget: 'specific_users' };
    case 'all':
    default:
      return { audienceTarget: 'all_users' };
  }
};

const normalizeCampaign = (campaign: any) => {
  if (!campaign) return campaign;

  const metadata = campaign.metadata || {};
  const rawAudienceTarget = metadata.audienceTarget || metadata.targetAudience || 'all_users';
  const targetAudience =
    rawAudienceTarget === 'user_role'
      ? metadata?.targetRoles?.includes?.('creator')
        ? 'creators'
        : 'members'
      : rawAudienceTarget === 'specific_users'
      ? 'custom'
      : rawAudienceTarget === 'community_members'
      ? 'members'
      : rawAudienceTarget === 'active_users' || rawAudienceTarget === 'inactive_users'
      ? 'all'
      : rawAudienceTarget === 'all_users'
      ? 'all'
      : rawAudienceTarget;
  const customAudienceIds = metadata.specificUserIds || metadata.customAudienceIds || [];

  const createdBy =
    campaign.creatorId && typeof campaign.creatorId === 'object'
      ? campaign.creatorId
      : campaign.createdBy && typeof campaign.createdBy === 'object'
      ? campaign.createdBy
      : null;

  return {
    ...campaign,
    _id: campaign._id?.toString?.() || campaign._id,
    name: campaign.name || campaign.title,
    title: campaign.title || campaign.name,
    targetAudience,
    customAudienceIds,
    createdBy: createdBy
      ? {
          _id: createdBy._id?.toString?.() || createdBy._id || '',
          name: createdBy.name || createdBy.username || 'Admin',
          email: createdBy.email || '',
        }
      : {
          _id: '',
          name: 'Admin',
          email: '',
        },
    analytics: {
      sent: campaign.totalRecipients || campaign.sentCount || 0,
      delivered: campaign.sentCount || 0,
      opened: campaign.openCount || 0,
      clicked: campaign.clickCount || 0,
      bounced: toArray(campaign.recipients).filter((r: any) => r?.status === 'bounced').length,
      unsubscribed: 0,
    },
  };
};

const toCanonicalCampaignPayload = (
  data: CreateEmailCampaignDto | LegacyCreateEmailCampaignDto,
): CreateEmailCampaignDto => {
  if ('audienceTarget' in data) {
    return {
      ...data,
      type: data.type || 'custom',
    };
  }

  const mapping = legacyAudienceToCanonical(data.targetAudience);

  return {
    title: data.name,
    subject: data.subject,
    content: data.content,
    type: 'custom',
    audienceTarget: mapping.audienceTarget,
    specificUserIds:
      mapping.audienceTarget === 'specific_users' ? data.customAudienceIds || [] : undefined,
    targetRoles: mapping.targetRoles,
    scheduledAt: data.scheduledAt,
    templateId: data.templateId,
    isHtml: true,
    trackOpens: true,
    trackClicks: true,
  };
};

const toCanonicalCampaignPatchPayload = (data: any): Record<string, any> => {
  if ('audienceTarget' in data || 'title' in data || 'type' in data) {
    return { ...data };
  }

  const payload: Record<string, any> = {};
  if ('name' in data) payload.title = data.name;
  if ('subject' in data) payload.subject = data.subject;
  if ('content' in data) payload.content = data.content;
  if ('scheduledAt' in data) payload.scheduledAt = data.scheduledAt;
  if ('templateId' in data) payload.templateId = data.templateId;
  if ('targetAudience' in data) {
    const mapping = legacyAudienceToCanonical(data.targetAudience);
    payload.audienceTarget = mapping.audienceTarget;
    if (mapping.targetRoles) payload.targetRoles = mapping.targetRoles;
    if (mapping.audienceTarget === 'specific_users') {
      payload.specificUserIds = data.customAudienceIds || [];
    }
  }
  return payload;
};

const toCanonicalBulkMessagePayload = (data: any): BulkMessageDto => {
  if (data?.audienceTarget) {
    return data as BulkMessageDto;
  }

  const legacy = data || {};
  return {
    title: legacy.subject || 'Bulk Message',
    content: legacy.message || '',
    channel: 'both',
    audienceTarget: 'specific_users',
    specificUserIds: legacy.recipientIds || [],
    metadata: legacy.priority ? { priority: legacy.priority } : undefined,
  };
};

const toCanonicalTemplatePayload = (data: any): CreateEmailTemplateDto => ({
  name: data.name,
  description: data.description || `Template: ${data.name}`,
  category: data.category || 'custom',
  subject: data.subject,
  content: data.content,
  variables: data.variables || [],
  isActive: data.isActive !== false,
  tags: data.tags || [],
  metadata: data.metadata || {},
});

const toCanonicalTemplatePatchPayload = (data: any): Record<string, any> => {
  const payload: Record<string, any> = {};
  if ('name' in data) payload.name = data.name;
  if ('description' in data) payload.description = data.description;
  if ('category' in data) payload.category = data.category;
  if ('subject' in data) payload.subject = data.subject;
  if ('content' in data) payload.content = data.content;
  if ('variables' in data) payload.variables = data.variables || [];
  if ('isActive' in data) payload.isActive = data.isActive;
  if ('tags' in data) payload.tags = data.tags || [];
  if ('metadata' in data) payload.metadata = data.metadata || {};
  return payload;
};

const normalizeAuditLog = (log: any) => {
  const adminUser = log?.adminUser && typeof log.adminUser === 'object' ? log.adminUser : null;

  return {
    ...log,
    _id: log?._id?.toString?.() || log?._id,
    action: log?.action || 'unknown',
    entityType: log?.entityType || 'Unknown',
    entityId: log?.entityId?.toString?.() || log?.entityId || '',
    adminUser: {
      _id: adminUser?._id?.toString?.() || log?.adminUserId?.toString?.() || '',
      name: adminUser?.name || adminUser?.userId || 'Admin User',
    },
    ipAddress: log?.ipAddress || 'N/A',
    userAgent: log?.userAgent || '',
    changes: log?.newData || log?.metadata || null,
    timestamp: log?.timestamp || log?.createdAt || new Date().toISOString(),
    status: log?.status || 'success',
  };
};

const normalizeSecurityEvent = (event: any) => ({
  _id: event?.id || event?._id || '',
  eventType: event?.type || event?.eventType || 'unknown',
  severity: event?.severity || 'low',
  description: event?.description || event?.title || '',
  ipAddress: event?.metadata?.ipAddress || event?.ipAddress,
  userId: event?.adminUserId || event?.userId,
  resolved: Boolean(event?.resolved),
  resolvedBy: event?.resolvedBy
    ? {
        _id: event.resolvedBy?.toString?.() || event.resolvedBy,
        name: 'Admin',
      }
    : undefined,
  resolution: event?.resolutionNotes || event?.resolution,
  createdAt: event?.timestamp || event?.createdAt || new Date().toISOString(),
  resolvedAt: event?.resolvedAt,
});

const normalizeSecurityMetrics = (stats: any) => {
  const bySeverity = stats?.alertsBySeverity || {};
  const byType = stats?.alertsByType || {};
  return {
    totalEvents: stats?.totalAlerts || 0,
    unresolvedEvents: stats?.unresolvedAlerts || 0,
    criticalEvents: bySeverity.critical || 0,
    failedLoginAttempts:
      (byType.multiple_failed_attempts || 0) + (byType.suspicious_login || 0),
    suspiciousActivities:
      (byType.unusual_activity_pattern || 0) +
      (byType.geographic_anomaly || 0) +
      (byType.privilege_escalation || 0),
  };
};

// ==================== API CLIENT ====================

export const adminApi = {
  // ==================== AUTH ====================
  auth: {
    login: (data: AdminLoginDto) =>
      apiClient.post<AdminLoginResponse>('/admin/login', data),

    verify2FA: (data: AdminVerify2FADto) =>
      apiClient.post<AdminLoginResponse>('/admin/verify-2fa', data),

    me: () =>
      apiClient.get<AdminSessionResponse>('/admin/me'),

    refreshToken: (refreshToken?: string) =>
      apiClient.post<AdminSessionResponse>('/admin/refresh', refreshToken ? { refresh_token: refreshToken } : {}),

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
    getRevenueDashboard: async (query: RevenueDashboardQuery) => {
      const response = await apiClient.get('/admin/financial/revenue-dashboard', query);
      const payload = getResponseData(response) || {};
      return {
        ...response,
        data: {
          ...payload,
          monthlyRevenue: payload.subscriptionRevenue || 0,
          revenueGrowth: payload.growthRate || 0,
          totalTransactions: payload.transactionCount || 0,
          activeSubscriptions: payload.activeSubscriptions || 0,
        },
      };
    },

    getSubscriptions: async (filters: SubscriptionFilters) => {
      const response = await apiClient.get('/admin/financial/subscriptions', filters);
      const payload = getResponseData(response) || {};
      const subscriptions = toArray(payload?.data || payload?.subscriptions).map((subscription: any) => {
        const creator = subscription?.creator || subscription?.creatorId || null;
        const subscriber = subscription?.user || subscription?.subscriber || subscription?.subscriberId || null;

        return {
          ...subscription,
          user: subscriber
            ? {
                _id: subscriber?._id || '',
                username: subscriber?.username || subscriber?.name || subscriber?.email || 'Unknown user',
                email: subscriber?.email || '',
              }
            : null,
          creator: creator
            ? {
                _id: creator?._id || '',
                username: creator?.username || creator?.name || creator?.email || 'Unknown creator',
              }
            : null,
          community: subscription?.community || null,
          planTier: subscription?.planTier || subscription?.plan || '',
          nextBillingDate: subscription?.nextBillingDate || subscription?.nextBillingAt || null,
          startDate: subscription?.startDate || subscription?.currentPeriodStart || subscription?.createdAt,
          endDate: subscription?.endDate || subscription?.currentPeriodEnd || null,
        };
      });

      return {
        ...response,
        data: {
          subscriptions,
          total: payload?.total || 0,
          page: payload?.page || filters?.page || 1,
          limit: payload?.limit || filters?.limit || 20,
          totalPages: payload?.totalPages || 1,
        },
      };
    },

    getTransactions: async (filters: TransactionFilters) => {
      const response = await apiClient.get('/admin/financial/transactions', filters);
      const payload = getResponseData(response) || {};
      const rawTransactions = toArray(payload?.data || payload?.transactions);
      const transactions = rawTransactions.map((tx: any) => ({
        ...tx,
        user: tx.user || tx.userId || null,
      }));
      return {
        ...response,
        data: {
          transactions,
          total: payload?.total || 0,
          page: payload?.page || filters?.page || 1,
          limit: payload?.limit || filters?.limit || 20,
          totalPages: payload?.totalPages || 1,
        },
      };
    },

    calculatePayout: (data: CalculatePayoutDto) =>
      apiClient.post('/admin/financial/payouts/calculate', data),

    initiatePayout: (data: InitiatePayoutDto) =>
      apiClient.post('/admin/financial/payouts/initiate', data),

    getPayouts: async (filters: PayoutFilters) => {
      const response = await apiClient.get('/admin/financial/payouts', filters);
      const payload = getResponseData(response) || {};
      const payouts = toArray(payload?.data || payload?.payouts).map((payout: any) => ({
        ...payout,
        creator: payout.creator || (payout.creatorId ? {
          _id: payout.creatorId?._id || '',
          username: payout.creatorId?.username || payout.creatorId?.name || payout.creatorId?.email || 'Unknown creator',
          email: payout.creatorId?.email || '',
        } : null),
        community: payout.community || payout.communityId || null,
        initiatedAt: payout.initiatedAt || payout.requestedAt || payout.createdAt,
      }));
      return {
        ...response,
        data: {
          payouts,
          total: payload?.total || 0,
          page: payload?.page || filters?.page || 1,
          limit: payload?.limit || filters?.limit || 20,
          totalPages: payload?.totalPages || 1,
        },
      };
    },

    getPayoutSummary: (startDate?: string, endDate?: string) =>
      apiClient.get('/admin/financial/payouts/summary', { startDate, endDate }),

    getPayoutById: (id: string) =>
      apiClient.get<AdminPayoutDetails>(`/admin/financial/payouts/${id}`),

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
    getRevenueByContentType: async (query: FinancialAnalyticsQuery) => {
      const response = await apiClient.get('/admin/financial/analytics/revenue-by-content-type', query);
      const payload = getResponseData(response) || {};
      const entries = Object.entries(payload) as Array<[string, number]>;
      const totalRevenue = entries.reduce((sum, [, value]) => sum + (Number(value) || 0), 0);
      const normalized = entries.map(([contentType, revenue]) => ({
        contentType,
        revenue: Number(revenue) || 0,
        percentage: totalRevenue > 0 ? ((Number(revenue) || 0) / totalRevenue) * 100 : 0,
      }));
      return {
        ...response,
        data: normalized,
      };
    },

    getTopCreators: async (query: FinancialAnalyticsQuery, limit?: number) => {
      const response = await apiClient.get('/admin/financial/analytics/top-creators', { ...query, limit });
      const payload = toArray(getResponseData(response));
      const normalized = payload.map((creator: any) => ({
        _id: creator.creatorId,
        username: creator.creatorName,
        totalRevenue: creator.totalRevenue || 0,
        totalSales: creator.transactionCount || 0,
      }));
      return {
        ...response,
        data: normalized,
      };
    },

    getRevenueGrowth: async (query: FinancialAnalyticsQuery) => {
      const response = await apiClient.get('/admin/financial/analytics/revenue-growth', query);
      const payload = getResponseData(response) || {};
      const normalized = [
        {
          period: 'Previous',
          revenue: payload.previousPeriodRevenue || 0,
          growth: 0,
        },
        {
          period: 'Current',
          revenue: payload.currentPeriodRevenue || 0,
          growth: payload.growthRate || 0,
        },
      ];
      return {
        ...response,
        data: normalized,
      };
    },

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
    getAuditLogs: async (filters: AuditLogFilters) => {
      const response = await apiClient.get('/admin/security/audit-trail', filters);
      const root = getResponseRoot(response);
      const payload = getResponseData(response);
      const logs = toArray(payload).map(normalizeAuditLog);
      const pagination = root.pagination || {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        total: logs.length,
        totalPages: 1,
      };

      return {
        ...response,
        data: {
          data: logs,
          pagination,
          total: pagination.total || logs.length,
        },
      };
    },

    getAuditLogById: async (id: string) => {
      const response = await adminApi.security.getAuditLogs({ page: 1, limit: 200 });
      const records = toArray((response as any)?.data?.data);
      const record = records.find((entry: any) => entry._id === id);
      return {
        ...response,
        data: record || null,
      };
    },

    getSecurityEvents: async (filters: SecurityEventFilters = {}) => {
      const response = await apiClient.get('/admin/security/alerts', {
        severity: filters.severity,
        type: filters.eventType,
        resolved: filters.resolved,
      });
      const payload = getResponseData(response);
      const normalized = toArray(payload).map(normalizeSecurityEvent);

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const pageData = normalized.slice(startIndex, startIndex + limit);

      return {
        ...response,
        data: {
          data: pageData,
          total: normalized.length,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(normalized.length / limit)),
        },
      };
    },

    getSecurityEventById: async (id: string) => {
      const response = await adminApi.security.getSecurityEvents({ page: 1, limit: 500 });
      const records = toArray((response as any)?.data?.data);
      const record = records.find((entry: any) => entry._id === id);
      return {
        ...response,
        data: record || null,
      };
    },

    resolveSecurityEvent: (id: string, resolution: string) =>
      apiClient.put(`/admin/security/alerts/${id}/resolve`, { notes: resolution }),

    getSecurityMetrics: async () => {
      const response = await apiClient.get('/admin/security/statistics');
      const payload = getResponseData(response);
      return {
        ...response,
        data: normalizeSecurityMetrics(payload),
      };
    },

    exportAuditLogs: async (
      filters: AuditLogFilters,
      format: 'csv' | 'json' | 'pdf' = 'csv',
    ) => {
      const response = await apiClient.post('/admin/security/audit-trail/export', {
        format: format === 'pdf' ? 'csv' : format,
        filters,
      });
      const payload = getResponseData(response);
      return {
        ...response,
        data: {
          content: payload?.content || payload || '',
        },
      };
    },
  },

  // ==================== COMMUNICATION MANAGEMENT ====================
  communication: {
    createEmailCampaign: async (data: CreateEmailCampaignDto | LegacyCreateEmailCampaignDto) => {
      const payload = toCanonicalCampaignPayload(data);
      const response = await apiClient.post('/admin/communication/campaigns', payload);
      return {
        ...response,
        data: normalizeCampaign(getResponseData(response)),
      };
    },

    getEmailCampaigns: async (filters: any = {}) => {
      const response = await apiClient.get('/admin/communication/campaigns', filters);
      const payload = getResponseData(response) || {};
      const campaigns = toArray(payload?.data || payload?.campaigns).map(normalizeCampaign);
      return {
        ...response,
        data: {
          campaigns,
          total: payload?.total || campaigns.length,
          page: payload?.page || filters?.page || 1,
          limit: payload?.limit || filters?.limit || 20,
          totalPages:
            payload?.totalPages ||
            Math.max(1, Math.ceil((payload?.total || campaigns.length) / (payload?.limit || filters?.limit || 20))),
          hasNextPage: payload?.hasNextPage ?? false,
          hasPrevPage: payload?.hasPrevPage ?? false,
        },
      };
    },

    getEmailCampaignById: async (id: string) => {
      const response = await apiClient.get(`/admin/communication/campaigns/${id}`);
      const campaign = normalizeCampaign(getResponseData(response));
      return {
        ...response,
        data: {
          campaign,
        },
      };
    },

    updateEmailCampaign: async (
      id: string,
      data: Partial<CreateEmailCampaignDto | LegacyCreateEmailCampaignDto>,
    ) => {
      const payload = toCanonicalCampaignPatchPayload(data as any);
      const response = await apiClient.put(`/admin/communication/campaigns/${id}`, payload);
      return {
        ...response,
        data: normalizeCampaign(getResponseData(response)),
      };
    },

    deleteEmailCampaign: (id: string) =>
      apiClient.delete(`/admin/communication/campaigns/${id}`),

    sendEmailCampaign: async (id: string) => {
      const response = await apiClient.post(`/admin/communication/campaigns/${id}/send`);
      return {
        ...response,
        data: normalizeCampaign(getResponseData(response)),
      };
    },

    sendBulkMessage: (data: BulkMessageDto) =>
      apiClient.post('/admin/communication/bulk-message', toCanonicalBulkMessagePayload(data)),

    getEmailTemplates: async () => {
      const response = await apiClient.get('/admin/communication/templates');
      const payload = getResponseData(response);
      const templates = toArray(payload).map((template: any) => ({
        ...template,
        _id: template?._id?.toString?.() || template?._id,
      }));
      return {
        ...response,
        data: {
          templates,
        },
      };
    },

    createEmailTemplate: (data: any) =>
      apiClient.post('/admin/communication/templates', toCanonicalTemplatePayload(data)),

    updateEmailTemplate: (id: string, data: any) =>
      apiClient.put(`/admin/communication/templates/${id}`, toCanonicalTemplatePatchPayload(data)),

    deleteEmailTemplate: (id: string) =>
      apiClient.delete(`/admin/communication/templates/${id}`),

    getCampaignAnalytics: async (filters: any) => {
      const [metrics, campaignPerformance, deliveryStatus, engagement] = await Promise.all([
        apiClient.get('/admin/communication/analytics/metrics', filters),
        apiClient.get('/admin/communication/analytics/campaign-performance', filters),
        apiClient.get('/admin/communication/analytics/delivery-status', filters),
        apiClient.get('/admin/communication/analytics/engagement', filters),
      ]);

      return {
        data: {
          metrics: getResponseData(metrics),
          campaignPerformance: getResponseData(campaignPerformance),
          deliveryStatus: getResponseData(deliveryStatus),
          engagement: getResponseData(engagement),
        },
      };
    },
  },

  support: {
    listTickets: (filters: LiveSupportAdminFilters = {}) =>
      apiClient.get('/live-support/admin/tickets', filters),

    getMessages: (ticketId: string, params?: { cursor?: string; limit?: number }) =>
      apiClient.get(`/live-support/admin/tickets/${ticketId}/messages`, params),

    claimTicket: (ticketId: string) =>
      apiClient.post(`/live-support/admin/tickets/${ticketId}/claim`),

    sendMessage: (ticketId: string, text: string) =>
      apiClient.post(`/live-support/admin/tickets/${ticketId}/message`, { text }),

    closeTicket: (ticketId: string) =>
      apiClient.post(`/live-support/admin/tickets/${ticketId}/close`),

    getQueueCounts: () =>
      apiClient.get('/live-support/admin/queue-counts'),
  },
};

export default adminApi;
