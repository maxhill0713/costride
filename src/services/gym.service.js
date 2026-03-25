import { base44 } from '@/api/base44Client';

export const gymService = {
  getById: (gymId) =>
    base44.entities.Gym.filter({ id: gymId }).then(r => r[0]),

  getApproved: (limit = 100) =>
    base44.entities.Gym.filter({ status: 'approved' }, 'name', limit),

  getForOwner: (ownerEmail) =>
    base44.entities.Gym.filter({ owner_email: ownerEmail }),

  getForCoach: async (coachEmail) => {
    const coachRecords = await base44.entities.Coach.filter({ user_email: coachEmail });
    if (!coachRecords.length) return [];
    const gymIds = [...new Set(coachRecords.map(c => c.gym_id))];
    const results = await Promise.allSettled(gymIds.map(id => base44.entities.Gym.filter({ id })));
    return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  },

  update: (gymId, data) => base44.entities.Gym.update(gymId, data),

  getMembership: (userId, gymId) =>
    base44.entities.GymMembership.filter({ user_id: userId, gym_id: gymId, status: 'active' }).then(r => r[0]),

  getMembershipsForUser: (userId) =>
    base44.entities.GymMembership.filter({ user_id: userId, status: 'active' }),
};
