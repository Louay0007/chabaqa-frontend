/**
 * Community Management Integration Tests
 * Tests community approval workflow and management features
 */

import { adminApi } from '@/lib/api/admin-api';

// Mock the API client
jest.mock('@/lib/api/admin-api');

describe('Community Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Community List Operations', () => {
    it('should fetch communities with filters', async () => {
      const mockCommunities = {
        communities: [
          {
            _id: 'comm-1',
            name: 'Test Community 1',
            status: 'approved',
            creator: { _id: 'user-1', username: 'creator1' },
            memberCount: 100,
            createdAt: new Date('2024-01-01'),
          },
          {
            _id: 'comm-2',
            name: 'Test Community 2',
            status: 'pending',
            creator: { _id: 'user-2', username: 'creator2' },
            memberCount: 0,
            createdAt: new Date('2024-01-02'),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      (adminApi.communities.getCommunities as jest.Mock).mockResolvedValue(mockCommunities);

      const filters = {
        page: 1,
        limit: 10,
        status: 'approved' as const,
      };

      const result = await adminApi.communities.getCommunities(filters);

      expect(adminApi.communities.getCommunities).toHaveBeenCalledWith(filters);
      expect(result.communities).toHaveLength(2);
    });

    it('should fetch pending approvals', async () => {
      const mockPending = {
        communities: [
          {
            _id: 'comm-3',
            name: 'Pending Community',
            status: 'pending',
            creator: { _id: 'user-3', username: 'creator3' },
            createdAt: new Date('2024-01-03'),
          },
        ],
        total: 1,
      };

      (adminApi.communities.getPendingApprovals as jest.Mock).mockResolvedValue(mockPending);

      const result = await adminApi.communities.getPendingApprovals({});

      expect(adminApi.communities.getPendingApprovals).toHaveBeenCalled();
      expect(result.communities).toHaveLength(1);
      expect(result.communities[0].status).toBe('pending');
    });
  });

  describe('Community Approval Workflow', () => {
    it('should approve a community', async () => {
      const mockResponse = {
        success: true,
        message: 'Community approved successfully',
        community: {
          _id: 'comm-1',
          status: 'approved',
        },
      };

      (adminApi.communities.approveCommunity as jest.Mock).mockResolvedValue(mockResponse);

      const approvalData = {
        approvalNotes: 'Meets all requirements',
        featured: true,
        verified: true,
      };

      const result = await adminApi.communities.approveCommunity('comm-1', approvalData);

      expect(adminApi.communities.approveCommunity).toHaveBeenCalledWith('comm-1', approvalData);
      expect(result.success).toBe(true);
      expect(result.community.status).toBe('approved');
    });

    it('should reject a community with reason', async () => {
      const mockResponse = {
        success: true,
        message: 'Community rejected',
      };

      (adminApi.communities.rejectCommunity as jest.Mock).mockResolvedValue(mockResponse);

      const rejectionData = {
        rejectionReason: 'Does not meet quality standards',
        notifyCreator: true,
      };

      const result = await adminApi.communities.rejectCommunity('comm-1', rejectionData);

      expect(adminApi.communities.rejectCommunity).toHaveBeenCalledWith('comm-1', rejectionData);
      expect(result.success).toBe(true);
    });

    it('should perform bulk approval', async () => {
      const mockResponse = {
        success: true,
        approved: 3,
        failed: 0,
      };

      (adminApi.communities.bulkApproval as jest.Mock).mockResolvedValue(mockResponse);

      const bulkData = {
        communityIds: ['comm-1', 'comm-2', 'comm-3'],
        action: 'approve' as const,
        notes: 'Bulk approval',
      };

      const result = await adminApi.communities.bulkApproval(bulkData);

      expect(adminApi.communities.bulkApproval).toHaveBeenCalledWith(bulkData);
      expect(result.approved).toBe(3);
    });
  });

  describe('Community Moderation', () => {
    it('should update community moderation settings', async () => {
      const mockResponse = {
        success: true,
        community: {
          _id: 'comm-1',
          featured: true,
          verified: true,
          active: true,
        },
      };

      (adminApi.communities.moderateCommunity as jest.Mock).mockResolvedValue(mockResponse);

      const moderationData = {
        featured: true,
        verified: true,
        active: true,
        moderationNotes: 'High quality community',
      };

      const result = await adminApi.communities.moderateCommunity('comm-1', moderationData);

      expect(adminApi.communities.moderateCommunity).toHaveBeenCalledWith('comm-1', moderationData);
      expect(result.community.featured).toBe(true);
      expect(result.community.verified).toBe(true);
    });
  });

  describe('Community Analytics', () => {
    it('should fetch community analytics', async () => {
      const mockAnalytics = {
        totalCommunities: 100,
        activeCommunities: 85,
        pendingApprovals: 5,
        growth: 10.5,
      };

      (adminApi.communities.getAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      const result = await adminApi.communities.getAnalytics(undefined, 'month');

      expect(adminApi.communities.getAnalytics).toHaveBeenCalledWith(undefined, 'month');
      expect(result.totalCommunities).toBe(100);
      expect(result.pendingApprovals).toBe(5);
    });

    it('should fetch detailed community analytics', async () => {
      const mockDetailedAnalytics = {
        communityId: 'comm-1',
        members: 150,
        activeMembers: 120,
        contentCount: 50,
        engagement: 75.5,
      };

      (adminApi.communities.getDetailedAnalytics as jest.Mock).mockResolvedValue(mockDetailedAnalytics);

      const result = await adminApi.communities.getDetailedAnalytics('comm-1', 'month');

      expect(adminApi.communities.getDetailedAnalytics).toHaveBeenCalledWith('comm-1', 'month');
      expect(result.communityId).toBe('comm-1');
      expect(result.members).toBe(150);
    });
  });
});
