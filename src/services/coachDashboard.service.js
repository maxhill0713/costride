/**
 * Coach Dashboard Data Service
 * Central source of truth for all derived client metrics.
 * Import this in TabCoachToday, TabCoachMembers, TabCoachSchedule, TabCoachContent.
 */

import { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subDays, isToday, isSameDay, differenceInDays, startOfDay } from 'date-fns';

// ─── RETENTION SCORE ──────────────────────────────────────────────────────────
/**
 * Calculate a retention score 0-100 for a client based on their check-in history.
 * Higher = healthier engagement.
 */
export function calcRetentionScore(userId, checkIns, now = new Date()) {
  const uci    = checkIns.filter(c => c.user_id === userId);
  const ms     = d => now - new Date(d.check_in_date);
  const r30    = uci.filter(c => ms(c) < 30 * 864e5).length;
  const p30    = uci.filter(c => ms(c) >= 30 * 864e5 && ms(c) < 60 * 864e5).length;
  const r7     = uci.filter(c => ms(c) < 7  * 864e5).length;
  const sorted = [...uci].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const daysAgo = sorted[0] ? Math.floor(ms(sorted[0]) / 864e5) : 999;

  let score = 100;
  // Recency penalty
  if      (daysAgo >= 999) score -= 60;
  else if (daysAgo > 21)   score -= 45;
  else if (daysAgo > 14)   score -= 30;
  else if (daysAgo > 7)    score -= 15;
  // Frequency penalty
  if      (r30 === 0)      score -= 25;
  else if (r30 <= 2)       score -= 15;
  // Trend
  const trend = p30 > 0
    ? (r30 > p30 * 1.1 ? 'up' : r30 < p30 * 0.7 ? 'down' : 'stable')
    : (r30 >= 2 ? 'up' : 'stable');

  score = Math.max(0, Math.min(100, score));

  const status = score >= 65 ? 'safe' : score >= 35 ? 'risk' : 'danger';

  return { score, status, trend, daysAgo, r30, r7, p30 };
}

// ─── CLIENT STATUS ────────────────────────────────────────────────────────────
/**
 * Determine client status label based on check-in history and upcoming bookings.
 * Returns: 'Healthy' | 'Needs Attention' | 'At Risk'
 */
export function getClientStatus(userId, checkIns, bookings = [], now = new Date()) {
  const rs = calcRetentionScore(userId, checkIns, now);
  const upcoming = bookings.filter(b =>
    b.client_id === userId &&
    b.status === 'confirmed' &&
    new Date(b.session_date) > now
  );
  const hasUpcoming = upcoming.length > 0;

  if (rs.daysAgo <= 3 && hasUpcoming) return 'Healthy';
  if (rs.daysAgo >= 7 || rs.r7 === 0) {
    // Check for no-shows
    const noShows7 = bookings.filter(b =>
      b.client_id === userId &&
      b.status === 'no_show' &&
      (now - new Date(b.session_date)) < 7 * 864e5
    ).length;
    if (noShows7 >= 2 || rs.daysAgo >= 7) return 'At Risk';
  }
  if (rs.daysAgo >= 4 || !hasUpcoming) return 'Needs Attention';
  return 'Healthy';
}

// ─── VISITS PER WEEK ──────────────────────────────────────────────────────────
export function calcVisitsPerWeek(userId, checkIns, now = new Date(), weeks = 4) {
  const windowMs = weeks * 7 * 864e5;
  const visits   = checkIns.filter(c =>
    c.user_id === userId && (now - new Date(c.check_in_date)) < windowMs
  ).length;
  return Math.round((visits / weeks) * 10) / 10;
}

// ─── LAST VISIT ───────────────────────────────────────────────────────────────
export function getLastVisit(userId, checkIns) {
  const visits = checkIns
    .filter(c => c.user_id === userId)
    .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  if (!visits.length) return null;
  return new Date(visits[0].check_in_date);
}

// ─── WORKOUT ENGAGEMENT ───────────────────────────────────────────────────────
export function calcWorkoutEngagement(userId, assignedWorkouts) {
  const mine = assignedWorkouts.filter(w => w.member_id === userId);
  if (!mine.length) return { total: 0, completed: 0, pct: 0, lowEngagement: false };
  const completed   = mine.filter(w => w.is_activated).length;
  const pct         = Math.round((completed / mine.length) * 100);
  return { total: mine.length, completed, pct, lowEngagement: pct < 40 };
}

// ─── NO-SHOW RATE ─────────────────────────────────────────────────────────────
export function calcNoShowRate(userId, bookings, days = 30) {
  const now      = new Date();
  const recent   = bookings.filter(b =>
    b.client_id === userId && (now - new Date(b.session_date)) < days * 864e5
  );
  if (!recent.length) return 0;
  const noShows  = recent.filter(b => b.status === 'no_show').length;
  return Math.round((noShows / recent.length) * 100);
}

// ─── INSIGHTS GENERATOR ───────────────────────────────────────────────────────
/**
 * Generate actionable insights for a client profile page.
 */
export function generateClientInsights(userId, checkIns, bookings, assignedWorkouts, now = new Date()) {
  const rs          = calcRetentionScore(userId, checkIns, now);
  const engagement  = calcWorkoutEngagement(userId, assignedWorkouts);
  const noShowRate  = calcNoShowRate(userId, bookings);
  const upcoming    = bookings.filter(b =>
    b.client_id === userId && b.status === 'confirmed' && new Date(b.session_date) > now
  );
  const insights = [];

  if (rs.daysAgo > 7 && rs.daysAgo < 999) {
    insights.push({
      id: 'no_visit', severity: 'high',
      title: `No visit in ${rs.daysAgo} days`,
      body: 'High churn risk. A proactive check-in message can significantly reduce dropout.',
      action: 'Message', key: 'message',
    });
  }
  if (rs.daysAgo >= 999) {
    insights.push({
      id: 'never_visited', severity: 'high',
      title: 'Client has never visited',
      body: 'Reach out to help them get started.',
      action: 'Message', key: 'message',
    });
  }
  if (!upcoming.length) {
    insights.push({
      id: 'no_booking', severity: 'high',
      title: 'No upcoming session booked',
      body: 'Clients without bookings are 3× more likely to churn.',
      action: 'Book session', key: 'book',
    });
  }
  if (engagement.lowEngagement && engagement.total > 0) {
    insights.push({
      id: 'low_workout', severity: 'medium',
      title: `Workout completion at ${engagement.pct}%`,
      body: 'Only ' + engagement.completed + ' of ' + engagement.total + ' assigned workouts completed.',
      action: 'Reassign', key: 'assign',
    });
  }
  if (noShowRate > 20) {
    insights.push({
      id: 'no_show_rate', severity: 'medium',
      title: `${noShowRate}% no-show rate`,
      body: 'Consider a check-in reminder policy or reschedule the session time.',
      action: 'Message', key: 'message',
    });
  }
  if (rs.trend === 'down' && rs.p30 > 0) {
    const dropPct = Math.round((1 - rs.r30 / rs.p30) * 100);
    insights.push({
      id: 'declining', severity: 'medium',
      title: `Visits dropped ${dropPct}% vs last month`,
      body: `${rs.r30} sessions this month vs ${rs.p30} last month.`,
      action: 'Follow up', key: 'message',
    });
  }

  return insights;
}

// ─── ENRICH MEMBERSHIPS ───────────────────────────────────────────────────────
/**
 * Takes raw membership records and enriches them with computed metrics.
 * Returns enriched array sorted by risk score ascending (worst first).
 */
export function enrichMemberships(memberships, checkIns, bookings = [], assignedWorkouts = [], now = new Date()) {
  return memberships.map(m => {
    const rs         = calcRetentionScore(m.user_id, checkIns, now);
    const status     = getClientStatus(m.user_id, checkIns, bookings, now);
    const lastVisit  = getLastVisit(m.user_id, checkIns);
    const vpw        = calcVisitsPerWeek(m.user_id, checkIns, now);
    const engagement = calcWorkoutEngagement(m.user_id, assignedWorkouts);
    const noShowRate = calcNoShowRate(m.user_id, bookings);

    return {
      ...m,
      rs,
      clientStatus: status,
      lastVisitDate: lastVisit,
      visitsPerWeek: vpw,
      workoutEngagement: engagement,
      noShowRate,
    };
  }).sort((a, b) => a.rs.score - b.rs.score);
}

// ─── TODAY'S SESSION STATS ────────────────────────────────────────────────────
export function enrichSessionsForToday(classes, checkIns, bookings = [], now = new Date()) {
  return classes.map(cls => {
    const capacity = cls.max_capacity || cls.capacity || 20;
    const clsBookings = bookings.filter(b => b.session_id === cls.id);
    const booked   = clsBookings.filter(b => ['confirmed','attended'].includes(b.status)).length;

    // Use check-ins as attended proxy if no booking system yet
    const todayCI  = checkIns.filter(c => isToday(new Date(c.check_in_date)));
    const attended = clsBookings.filter(b => b.status === 'attended').length || todayCI.length;
    const noShows  = clsBookings.filter(b => b.status === 'no_show').length;
    const fill     = booked > 0 ? Math.round((booked / capacity) * 100) : Math.round((attended / capacity) * 100);

    return { ...cls, capacity, booked, attended, noShows, fill, clsBookings };
  });
}

// ─── REACT HOOKS ─────────────────────────────────────────────────────────────

/**
 * Fetch all data needed for the coach dashboard.
 * Pass gymId and coachId.
 */
export function useCoachDashboardData({ gymId, coachId, enabled = true }) {
  const qo = { staleTime: 2 * 60 * 1000, enabled: !!gymId && enabled };

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['coachBookings', gymId],
    queryFn: () => base44.entities.Booking.filter({ gym_id: gymId }, '-session_date', 200),
    ...qo,
  });

  const { data: assignedWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['coachAssignedWorkouts', gymId, coachId],
    queryFn: async () => {
      if (coachId) {
        return base44.entities.AssignedWorkout.filter({ coach_id: coachId }, '-assigned_date', 200);
      }
      return [];
    },
    ...qo,
    enabled: !!gymId && !!coachId && enabled,
  });

  return {
    bookings,
    assignedWorkouts,
    isLoading: bookingsLoading || workoutsLoading,
  };
}

/**
 * Hook to create/update bookings with automatic cache invalidation.
 */
export function useBookingMutations(gymId) {
  const queryClient = useQueryClient();
  const inv = () => queryClient.invalidateQueries({ queryKey: ['coachBookings', gymId] });

  const createBooking = useMutation({
    mutationFn: data => base44.entities.Booking.create({ ...data, gym_id: gymId }),
    onSuccess: inv,
  });

  const updateBooking = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: inv,
  });

  const markAttended = useMutation({
    mutationFn: (bookingId) => base44.entities.Booking.update(bookingId, { status: 'attended' }),
    onSuccess: inv,
  });

  const markNoShow = useMutation({
    mutationFn: (bookingId) => base44.entities.Booking.update(bookingId, { status: 'no_show' }),
    onSuccess: inv,
  });

  return { createBooking, updateBooking, markAttended, markNoShow };
}

/**
 * Hook to manage assigned workouts.
 */
export function useWorkoutAssignmentMutations(gymId, coachId) {
  const queryClient = useQueryClient();
  const inv = () => queryClient.invalidateQueries({ queryKey: ['coachAssignedWorkouts', gymId, coachId] });

  const assignWorkout = useMutation({
    mutationFn: ({ memberId, memberName, workoutData }) =>
      base44.entities.AssignedWorkout.create({
        member_id: memberId,
        coach_id: coachId,
        workout_data: workoutData,
        assigned_date: new Date().toISOString(),
        is_activated: false,
      }),
    onSuccess: inv,
  });

  return { assignWorkout };
}

// ─── FILTER HELPERS ───────────────────────────────────────────────────────────
export function filterClientsByStatus(enrichedMembers, filter) {
  switch (filter) {
    case 'at_risk':
      return enrichedMembers.filter(m => m.clientStatus === 'At Risk');
    case 'needs_attention':
      return enrichedMembers.filter(m => m.clientStatus === 'Needs Attention');
    case 'healthy':
      return enrichedMembers.filter(m => m.clientStatus === 'Healthy');
    case 'no_booking_this_week': {
      const now = new Date();
      return enrichedMembers.filter(m => m.rs.r7 === 0);
    }
    case 'low_engagement':
      return enrichedMembers.filter(m => m.workoutEngagement.lowEngagement);
    default:
      return enrichedMembers;
  }
}