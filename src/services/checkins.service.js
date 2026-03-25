import { base44 } from '@/api/base44Client';

export const checkInsService = {
  getForUser: (userId, limit = 100) =>
    base44.entities.CheckIn.filter({ user_id: userId }, '-check_in_date', limit),

  getForGym: (gymId, limit = 200) =>
    base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', limit),

  getForFriends: (friendIds, daysBack = 7, limit = 100) => {
    if (!friendIds.length) return Promise.resolve([]);
    const since = new Date(Date.now() - daysBack * 86400000).toISOString();
    return base44.entities.CheckIn.filter(
      { user_id: { $in: friendIds }, check_in_date: { $gte: since } },
      '-check_in_date',
      limit
    );
  },

  create: (data) => base44.entities.CheckIn.create(data),
};
