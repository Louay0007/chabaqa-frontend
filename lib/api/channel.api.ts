import { apiClient } from './client';

export const channelApi = {
  // Channel CRUD
  create: (dto: {
    communityId: string;
    name: string;
    description?: string;
    type?: string;
    visibility?: string;
    emoji?: string;
    allowedRoles?: string[];
  }) => apiClient.post<any>('/channel', dto),

  listByCommunity: (communityId: string) =>
    apiClient.get<any>(`/channel/community/${communityId}`),

  getById: (channelId: string) =>
    apiClient.get<any>(`/channel/${channelId}`),

  update: (channelId: string, dto: Record<string, any>) =>
    apiClient.patch<any>(`/channel/${channelId}`, dto),

  archive: (channelId: string) =>
    apiClient.delete<any>(`/channel/${channelId}`),

  reorder: (communityId: string, orderedIds: string[]) =>
    apiClient.patch<any>(`/channel/community/${communityId}/reorder`, { orderedIds }),

  // Membership
  addMembers: (channelId: string, userIds: string[]) =>
    apiClient.post<any>(`/channel/${channelId}/members`, { userIds }),

  removeMember: (channelId: string, userId: string) =>
    apiClient.delete<any>(`/channel/${channelId}/members/${userId}`),

  setMemberRole: (channelId: string, userId: string, role: string) =>
    apiClient.patch<any>(`/channel/${channelId}/members/${userId}/role`, { role }),

  muteMember: (channelId: string, userId: string, muted: boolean) =>
    apiClient.patch<any>(`/channel/${channelId}/members/${userId}/mute`, { muted }),

  listMembers: (channelId: string) =>
    apiClient.get<any>(`/channel/${channelId}/members`),

  updateMyNotifications: (channelId: string, level: string) =>
    apiClient.patch<any>(`/channel/${channelId}/me/notifications`, { level }),

  // Messages
  listMessages: (channelId: string, params?: { cursor?: string; limit?: number }) =>
    apiClient.get<any>(`/channel/${channelId}/messages`, params),

  sendMessage: (channelId: string, dto: { text?: string; parentMessageId?: string }) =>
    apiClient.post<any>(`/channel/${channelId}/messages`, dto),

  uploadAttachment: (channelId: string, file: File) =>
    apiClient.uploadFile<any>(`/channel/${channelId}/attachments`, file, 'file'),

  editMessage: (channelId: string, messageId: string, text: string) =>
    apiClient.patch<any>(`/channel/${channelId}/messages/${messageId}`, { text }),

  deleteMessage: (channelId: string, messageId: string) =>
    apiClient.delete<any>(`/channel/${channelId}/messages/${messageId}`),

  pinMessage: (channelId: string, messageId: string) =>
    apiClient.patch<any>(`/channel/${channelId}/messages/${messageId}/pin`, {}),

  unpinMessage: (channelId: string, messageId: string) =>
    apiClient.delete<any>(`/channel/${channelId}/messages/${messageId}/pin`),

  listPinnedMessages: (channelId: string) =>
    apiClient.get<any>(`/channel/${channelId}/messages/pinned`),

  addReaction: (channelId: string, messageId: string, emoji: string) =>
    apiClient.post<any>(`/channel/${channelId}/messages/${messageId}/reactions`, { emoji }),

  listThreadReplies: (channelId: string, messageId: string, params?: { cursor?: string }) =>
    apiClient.get<any>(`/channel/${channelId}/messages/${messageId}/thread`, params),

  sendThreadReply: (channelId: string, parentMessageId: string, dto: { text: string }) =>
    apiClient.post<any>(`/channel/${channelId}/messages/${parentMessageId}/thread`, dto),

  // Read state
  markAsRead: (channelId: string) =>
    apiClient.patch<any>(`/channel/${channelId}/read`, {}),

  getUnreadCounts: (communityId: string) =>
    apiClient.get<any>(`/channel/community/${communityId}/unread`),

  // Search
  searchMessages: (communityId: string, query: string, channelId?: string) =>
    apiClient.get<any>(`/channel/community/${communityId}/search`, { q: query, ...(channelId ? { channelId } : {}) }),
};
