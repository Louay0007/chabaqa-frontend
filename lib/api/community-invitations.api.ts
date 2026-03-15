import { apiClient, PaginationParams } from './client';

// ============================================================================
// Type Definitions
// ============================================================================

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface CommunityInvitation {
  _id: string;
  email: string;
  name: string;
  communityId: string;
  creatorId: string;
  token: string;
  status: InvitationStatus;
  personalMessage: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
  resendCount: number;
  lastResentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  revoked: number;
  conversionRate: number;
}

export interface ImportContactsResult {
  created: number;
  skipped: number;
  skippedEmails: string[];
}

export interface ContactEntry {
  email: string;
  name?: string;
}

export interface ImportContactsDto {
  contacts: ContactEntry[];
  communityId: string;
  personalMessage?: string;
}

export interface InviteSingleDto {
  email: string;
  name?: string;
  communityId: string;
  personalMessage?: string;
}

export interface InvitationQueryParams {
  page?: number;
  limit?: number;
  status?: 'all' | InvitationStatus;
  search?: string;
}

export interface InvitationListResponse {
  invitations: CommunityInvitation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TokenValidation {
  valid: boolean;
  isExpired: boolean;
  isAccepted: boolean;
  isRevoked: boolean;
  email: string;
  communityId: string;
  communityName: string;
  communitySlug: string;
  communityAvatar: string;
  creatorName: string;
  personalMessage: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  communityId: string;
  communitySlug: string;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE = '/community-invitations';

export const communityInvitationsApi = {
  // ---- Creator actions ----

  /** Bulk import contacts and send invitation emails */
  importContacts: (dto: ImportContactsDto) =>
    apiClient.post<ImportContactsResult>(`${BASE}/import`, dto),

  /** Invite a single contact */
  inviteSingle: (dto: InviteSingleDto) =>
    apiClient.post<CommunityInvitation>(`${BASE}/single`, dto),

  /** List invitations for a community (paginated + filterable) */
  getInvitations: (communityId: string, params?: InvitationQueryParams) =>
    apiClient.get<InvitationListResponse>(`${BASE}/${communityId}`, params),

  /** Get invitation statistics for a community */
  getStats: (communityId: string) =>
    apiClient.get<InvitationStats>(`${BASE}/${communityId}/stats`),

  /** Resend an invitation email */
  resendInvitation: (invitationId: string) =>
    apiClient.post<CommunityInvitation>(`${BASE}/${invitationId}/resend`),

  /** Revoke an invitation */
  revokeInvitation: (invitationId: string) =>
    apiClient.patch<CommunityInvitation>(`${BASE}/${invitationId}/revoke`),

  /** Delete an invitation */
  deleteInvitation: (invitationId: string) =>
    apiClient.delete<void>(`${BASE}/${invitationId}`),

  // ---- Public / Accept flow ----

  /** Validate an invitation token (public, no auth required) */
  validateToken: (token: string) =>
    apiClient.get<TokenValidation>(`${BASE}/accept/${token}`),

  /** Accept an invitation and join the community */
  acceptInvitation: (token: string) =>
    apiClient.post<AcceptInvitationResult>(`${BASE}/accept/${token}`),
};
