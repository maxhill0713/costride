import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workout_type, duration_minutes, notes, exercises, gym_id } = await req.json();

    if (!workout_type) {
      return Response.json({ error: 'Workout type is required' }, { status: 400 });
    }

    // Check if user has checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCheckIn = await base44.entities.CheckIn.filter({
      user_id: user.id,
      check_in_date: { $gte: today.toISOString() }
    });

    if (todayCheckIn.length === 0) {
      return Response.json({ error: 'You must check in to the gym before logging a workout' }, { status: 400 });
    }

    const workoutLog = await base44.entities.WorkoutLog.create({
      user_id: user.id,
      user_name: user.full_name,
      workout_type,
      duration_minutes: duration_minutes || 0,
      notes: notes || '',
      exercises: exercises || [],
      gym_id: gym_id || null,
      intensity: 'moderate',
      calories_burned: 0
    });

    // Increment user streak
    const newStreak = (user.current_streak || 0) + 1;

    // ── Monthly challenge progress update ──────────────────────────────────
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const prevProgress = user.monthly_challenge_progress || {};
    const isNewMonth = prevProgress.month !== currentMonth;

    const newMonthlyProgress = {
      month: currentMonth,
      streak_master: Math.min(7, newStreak),
      discipline_builder: isNewMonth ? 1 : (prevProgress.discipline_builder || 0) + 1,
      weekend_warrior: isNewMonth
        ? (isWeekend ? 1 : 0)
        : (prevProgress.weekend_warrior || 0) + (isWeekend ? 1 : 0),
    };

    await base44.auth.updateMe({
      current_streak: newStreak,
      monthly_challenge_progress: newMonthlyProgress,
    });

    return Response.json({ workoutLog, newStreak });
  } catch (error) {
    console.error('Error creating workout log:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});