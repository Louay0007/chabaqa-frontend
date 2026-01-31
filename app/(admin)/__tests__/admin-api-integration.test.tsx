/**
 * Admin API Integration Tests
 * Tests the admin API client integration
 */

import { adminApi } from '@/lib/api/admin-api';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Admin API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication API', () => {
    it('should have login endpoint', () => {
      expect(adminApi.auth.login).toBeDefined();
      expect(typeof adminApi.auth.login).toBe('function');
    });

    it('should have verify2FA endpoint', () => {
      expect(adminApi.auth.verify2FA).toBeDefined();
      expect(typeof adminApi.auth.verify2FA).toBe('function');
    });

    it('should have refreshToken endpoint', () => {
      expect(adminApi.auth.refreshToken).toBeDefined();
      expect(typeof adminApi.auth.refreshToken).toBe('function');
    });

    it('should have logout endpoint', () => {
      expect(adminApi.auth.logout).toBeDefined();
      expect(typeof adminApi.auth.logout).toBe('function');
    });
  });

  describe('User Management API', () => {
    it('should have all user management endpoints', () => {
      expect(adminApi.users.getUsers).toBeDefined();
      expect(adminApi.users.getUserDetails).toBeDefined();
      expect(adminApi.users.suspendUser).toBeDefined();
      expect(adminApi.users.activateUser).toBeDefined();
      expect(adminApi.users.resetPassword).toBeDefined();
      expect(adminApi.users.updateNotes).toBeDefined();
      expect(adminApi.users.getAnalytics).toBeDefined();
    });
  });

  describe('Community Management API', () => {
    it('should have all community management endpoints', () => {
      expect(adminApi.communities.getCommunities).toBeDefined();
      expect(adminApi.communities.getCommunityDetails).toBeDefined();
      expect(adminApi.communities.getPendingApprovals).toBeDefined();
      expect(adminApi.communities.approveCommunity).toBeDefined();
      expect(adminApi.communities.rejectCommunity).toBeDefined();
      expect(adminApi.communities.bulkApproval).toBeDefined();
      expect(adminApi.communities.moderateCommunity).toBeDefined();
      expect(adminApi.communities.getAnalytics).toBeDefined();
    });
  });

  describe('Content Moderation API', () => {
    it('should have all content moderation endpoints', () => {
      expect(adminApi.contentModeration.getQueue).toBeDefined();
      expect(adminApi.contentModeration.getQueueStats).toBeDefined();
      expect(adminApi.contentModeration.getContentDetails).toBeDefined();
      expect(adminApi.contentModeration.moderateContent).toBeDefined();
      expect(adminApi.contentModeration.bulkModerate).toBeDefined();
      expect(adminApi.contentModeration.updatePriority).toBeDefined();
      expect(adminApi.contentModeration.assignContent).toBeDefined();
    });
  });

  describe('Financial Management API', () => {
    it('should have all financial management endpoints', () => {
      expect(adminApi.financial.getRevenueDashboard).toBeDefined();
      expect(adminApi.financial.getSubscriptions).toBeDefined();
      expect(adminApi.financial.getTransactions).toBeDefined();
      expect(adminApi.financial.calculatePayout).toBeDefined();
      expect(adminApi.financial.initiatePayout).toBeDefined();
      expect(adminApi.financial.getPayouts).toBeDefined();
      expect(adminApi.financial.processPayout).toBeDefined();
      expect(adminApi.financial.bulkProcessPayouts).toBeDefined();
      expect(adminApi.financial.updatePayoutStatus).toBeDefined();
      expect(adminApi.financial.cancelPayout).toBeDefined();
      expect(adminApi.financial.generateReport).toBeDefined();
    });
  });

  describe('Analytics API', () => {
    it('should have all analytics endpoints', () => {
      expect(adminApi.analytics.getDashboard).toBeDefined();
      expect(adminApi.analytics.getPlatformStatistics).toBeDefined();
      expect(adminApi.analytics.getEngagementMetrics).toBeDefined();
      expect(adminApi.analytics.getRetentionAnalysis).toBeDefined();
      expect(adminApi.analytics.exportAnalytics).toBeDefined();
      expect(adminApi.analytics.createAlert).toBeDefined();
      expect(adminApi.analytics.getAlerts).toBeDefined();
      expect(adminApi.analytics.updateAlert).toBeDefined();
      expect(adminApi.analytics.deleteAlert).toBeDefined();
    });
  });

  describe('Security Audit API', () => {
    it('should have all security audit endpoints', () => {
      expect(adminApi.security.getAuditLogs).toBeDefined();
      expect(adminApi.security.getAuditLogById).toBeDefined();
      expect(adminApi.security.getSecurityEvents).toBeDefined();
      expect(adminApi.security.getSecurityEventById).toBeDefined();
      expect(adminApi.security.resolveSecurityEvent).toBeDefined();
      expect(adminApi.security.getSecurityMetrics).toBeDefined();
      expect(adminApi.security.exportAuditLogs).toBeDefined();
    });
  });

  describe('Communication Management API', () => {
    it('should have all communication management endpoints', () => {
      expect(adminApi.communication.createEmailCampaign).toBeDefined();
      expect(adminApi.communication.getEmailCampaigns).toBeDefined();
      expect(adminApi.communication.getEmailCampaignById).toBeDefined();
      expect(adminApi.communication.updateEmailCampaign).toBeDefined();
      expect(adminApi.communication.deleteEmailCampaign).toBeDefined();
      expect(adminApi.communication.sendEmailCampaign).toBeDefined();
      expect(adminApi.communication.sendBulkMessage).toBeDefined();
      expect(adminApi.communication.getEmailTemplates).toBeDefined();
      expect(adminApi.communication.createEmailTemplate).toBeDefined();
      expect(adminApi.communication.updateEmailTemplate).toBeDefined();
      expect(adminApi.communication.deleteEmailTemplate).toBeDefined();
    });
  });
});
