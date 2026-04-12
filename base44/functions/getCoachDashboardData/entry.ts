import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Coach Dashboard Data Function
 * Returns enriched client data for the coach dashboard including:
 * - Bookings for the gym
 * - Assigned workouts for the coach
 * - Computed metrics (last visit, visits/week, status, engagement)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body   = await req.json().catch(() => ({}));
    const { gymId, limit = 200 } = body;

    if (!gymId) return Response.json({ error: 'gymId is required' }, { status: 400 });

    // Resolve coachId server-side from the authenticated user's email — never trust client-supplied coachId
    const coachRecords = await base44.asServiceRole.entities.Coach.filter({
      gym_id:     gymId,
      user_email: user.email,
    });
    const verifiedCoachId = coachRecords[0]?.id || null;

    // Fetch bookings, check-ins, and assigned workouts in parallel
    const [bookings, checkIns, assignedWorkouts] = await Promise.all([
      base44.asServiceRole.entities.Booking.filter({ gym_id: gymId }, '-session_date', limit),
      base44.asServiceRole.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', limit),
      verifiedCoachId
        ? base44.asServiceRole.entities.AssignedWorkout.filter({ coach_id: verifiedCoachId }, '-assigned_date', limit)
        : Promise.resolve([]),
    ]);

    const now = new Date();

    // Build per-client metrics
    const clientMetrics = {};

    // Group check-ins by user
    const ciByUser = {};
    checkIns.forEach(ci => {
      if (!ciByUser[ci.user_id]) ciByUser[ci.user_id] = [];
      ciByUser[ci.user_id].push(ci);
    });

    // Group bookings by client
    const bookingsByClient = {};
    bookings.forEach(b => {
      if (!bookingsByClient[b.client_id]) bookingsByClient[b.client_id] = [];
      bookingsByClient[b.client_id].push(b);
    });

    // Group assigned workouts by member
    const workoutsByMember = {};
    assignedWorkouts.forEach(w => {
      if (!workoutsByMember[w.member_id]) workoutsByMember[w.member_id] = [];
      workoutsByMember[w.member_id].push(w);
    });

    // Compute metrics for each known client
    const allClientIds = new Set([
      ...Object.keys(ciByUser),
      ...Object.keys(bookingsByClient),
    ]);

    allClientIds.forEach(userId => {
      const uci    = ciByUser[userId] || [];
      const ubk    = bookingsByClient[userId] || [];
      const uwk    = workoutsByMember[userId] || [];
      const ms     = d => now - new Date(d.check_in_date);

      const r30    = uci.filter(c => ms(c) < 30 * 864e5).length;
      const p30    = uci.filter(c => ms(c) >= 30 * 864e5 && ms(c) < 60 * 864e5).length;
      const r7     = uci.filter(c => ms(c) < 7  * 864e5).length;
      const sorted = [...uci].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
      const daysAgo = sorted[0] ? Math.floor(ms(sorted[0]) / 864e5) : 999;

      let score = 100;
      if      (daysAgo >= 999) score -= 60;
      else if (daysAgo > 21)   score -= 45;
      else if (daysAgo > 14)   score -= 30;
      else if (daysAgo > 7)    score -= 15;
      if      (r30 === 0)      score -= 25;
      else if (r30 <= 2)       score -= 15;
      score = Math.max(0, Math.min(100, score));

      const rsStatus = score >= 65 ? 'safe' : score >= 35 ? 'risk' : 'danger';
      const trend    = p30 > 0
        ? (r30 > p30 * 1.1 ? 'up' : r30 < p30 * 0.7 ? 'down' : 'stable')
        : (r30 >= 2 ? 'up' : 'stable');

      const upcoming  = ubk.filter(b => b.status === 'confirmed' && new Date(b.session_date) > now);
      const noShows7  = ubk.filter(b => b.status === 'no_show' && (now - new Date(b.session_date)) < 7 * 864e5).length;

      let clientStatus = 'Healthy';
      if (daysAgo <= 3 && upcoming.length > 0) clientStatus = 'Healthy';
      else if (daysAgo >= 7 || noShows7 >= 2)  clientStatus = 'At Risk';
      else if (daysAgo >= 4 || !upcoming.length) clientStatus = 'Needs Attention';

      // Workout engagement
      const totalWorkouts     = uwk.length;
      const completedWorkouts = uwk.filter(w => w.is_activated).length;
      const workoutPct        = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

      clientMetrics[userId] = {
        userId,
        retentionScore: score,
        retentionStatus: rsStatus,
        trend,
        daysAgo,
        r7, r30, p30,
        clientStatus,
        upcomingBookings: upcoming.length,
        noShowsLast7Days: noShows7,
        lastVisit: sorted[0]?.check_in_date || null,
        visitsPerWeek: Math.round((r30 / 4.3) * 10) / 10,
        workoutTotal: totalWorkouts,
        workoutCompleted: completedWorkouts,
        workoutPct,
        lowWorkoutEngagement: totalWorkouts > 0 && workoutPct < 40,
      };
    });

    // Today's summary
    const todayBookings = bookings.filter(b => {
      const bd = new Date(b.session_date);
      return bd.toDateString() === now.toDateString();
    });
    const todayNoShows = todayBookings.filter(b => b.status === 'no_show').length;
    const todayAttended = todayBookings.filter(b => b.status === 'attended').length;

    return Response.json({
      bookings,
      assignedWorkouts,
      clientMetrics,
      summary: {
        totalBookings: bookings.length,
        todayBookings: todayBookings.length,
        todayNoShows,
        todayAttended,
        atRiskCount: Object.values(clientMetrics).filter(m => m.clientStatus === 'At Risk').length,
        needsAttentionCount: Object.values(clientMetrics).filter(m => m.clientStatus === 'Needs Attention').length,
        healthyCount: Object.values(clientMetrics).filter(m => m.clientStatus === 'Healthy').length,
      },
    });
  } catch (error) {
    console.error('getCoachDashboardData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});