import { base44 } from '@/api/base44Client';

export const workoutsService = {
  getForUser: (userId) =>
    base44.entities.WorkoutLog.filter({ user_id: userId }, '-completed_date'),

  getForGym: (gymId, limit = 500) =>
    base44.entities.WorkoutLog.filter({ gym_id: gymId }, '-completed_date', limit),

  create: (data) => base44.entities.WorkoutLog.create(data),

  update: (id, data) => base44.entities.WorkoutLog.update(id, data),

  getPRs: (userId, exercise, limit = 100) => {
    const filter = exercise && exercise !== 'all'
      ? { member_id: userId, exercise, is_pr: true }
      : { member_id: userId, is_pr: true };
    return base44.entities.Lift.filter(filter, '-weight_lbs', limit);
  },
};
