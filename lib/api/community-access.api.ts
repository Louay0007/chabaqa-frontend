import { apiClient, ApiSuccessResponse } from './client';
import type { CommunityRole, CommunityPermissionValue, CommunityStaffRole } from '../permissions';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CommunityAccessInfo {
  role: CommunityRole;
  permissions: CommunityPermissionValue[];
}

export interface CommunityStaffMember {
  _id: string;
  communityId: string;
  userId: string;
  role: CommunityStaffRole;
  status: 'active' | 'disabled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    profileImage?: string;
  };
}

// ── API ────────────────────────────────────────────────────────────────────

export const communityAccessApi = {
  /**
   * Get the current user's role & permissions for a community.
   * GET /communities/:communityId/me/access
   */
  getMyAccess: async (communityId: string): Promise<CommunityAccessInfo> => {
    const res = await apiClient.get<ApiSuccessResponse<CommunityAccessInfo>>(
      `/communities/${communityId}/me/access`,
    );
    return (res as any)?.data ?? res;
  },

  /**
   * List all staff members for a community.
   * GET /communities/:communityId/staff
   */
  listStaff: async (communityId: string): Promise<CommunityStaffMember[]> => {
    const res = await apiClient.get<ApiSuccessResponse<CommunityStaffMember[]>>(
      `/communities/${communityId}/staff`,
    );
    return (res as any)?.data ?? res ?? [];
  },

  /**
   * Assign a staff role to a user.
   * POST /communities/:communityId/staff
   */
  assignStaff: async (
    communityId: string,
    userId: string,
    role: CommunityStaffRole,
  ): Promise<CommunityStaffMember> => {
    const res = await apiClient.post<ApiSuccessResponse<CommunityStaffMember>>(
      `/communities/${communityId}/staff`,
      { userId, role },
    );
    return (res as any)?.data ?? res;
  },

  /**
   * Update a staff member's role.
   * PATCH /communities/:communityId/staff/:userId
   */
  updateStaffRole: async (
    communityId: string,
    userId: string,
    role: CommunityStaffRole,
  ): Promise<CommunityStaffMember> => {
    const res = await apiClient.patch<ApiSuccessResponse<CommunityStaffMember>>(
      `/communities/${communityId}/staff/${userId}`,
      { role },
    );
    return (res as any)?.data ?? res;
  },

  /**
   * Remove a staff member.
   * DELETE /communities/:communityId/staff/:userId
   */
  removeStaff: async (communityId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/communities/${communityId}/staff/${userId}`);
  },
};
