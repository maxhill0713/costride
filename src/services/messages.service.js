import { base44 } from '@/api/base44Client';

export const messagesService = {
  getThread: (userId) =>
    base44.entities.Message.filter(
      { $or: [{ sender_id: userId }, { receiver_id: userId }] },
      '-created_date',
      100
    ),

  send: (messageData) => base44.entities.Message.create(messageData),

  markRead: (messageId) => base44.entities.Message.update(messageId, { read: true }),

  searchUsers: (query, limit = 20) =>
    base44.functions.invoke('searchUsers', { query, limit }).then(r => r.data?.users || []),
};
