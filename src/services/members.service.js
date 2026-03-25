import { base44 } from '@/api/base44Client';

export const membersService = {
  getForDashboard: ({ gymId, atRiskDays, chartRange }) =>
    base44.functions.invoke('getDashboardStats', { gymId, atRiskDays, chartRange }).then(r => r.data),

  getPage: ({ gymId, filter = 'all', sort = 'recentlyActive', search = '', page = 1, pageSize = 25 }) =>
    base44.functions.invoke('getDashboardMembers', { gymId, filter, sort, search, page, pageSize }).then(r => r.data),

  ban: (gymId, userId) =>
    base44.entities.Gym.update(gymId, { banned_members: { $push: userId } }),

  unban: (gymId, userId) =>
    base44.entities.Gym.update(gymId, { banned_members: { $pull: userId } }),
};
