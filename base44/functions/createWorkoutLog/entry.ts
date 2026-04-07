import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. workout_type validated against an allowlist — previously any string was stored.
// 3. duration_minutes capped (can't store negative/absurd values).
// 4. exercises array contents sanitised.
// 5. Raw error.message suppressed.

const VALID_WORKOUT_TYPES = [
  'strength', 'cardio', 'hiit', 'yoga', 'pilates', 'crossfit',
  'boxing', 'cycling', 'swimming', 'powerlifting', 'bodybuilding',
  'stretching', 'mobility', 'sport', 'other',
];

function sanitise(str, maxLen = 500) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workout_type, duration_minutes, notes, exercises, gym_id } = await req.json();

    if (!workout_type || !VALID_WORKOUT_TYPES.includes(workout_type)) {
      return Response.json({ error: `workout_type must be one of: ${VALID_WORKOUT_TYPES.join(', ')}` }, { status: 400 });
    }
    const safeDuration = typeof duration_minutes === 'number' && isFinite(duration_minutes) && duration_minutes >= 0
      ? Math.min(duration_minutes, 1440) : 0;

    // Sanitise exercises array
    const safeExercises = Array.isArray(exercises)
      ? exercises.slice(0, 50).map(e => ({
          exercise:  sanitise(e?.exercise, 100),
          setsReps:  sanitise(e?.setsReps, 50),
          weight:    sanitise(e?.weight, 20),
        }))
      : [];

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCheckIn = await base44.entities.CheckIn.filter({
      user_id:       user.id,
      check_in_date: { $gte: today.toISOString() },
    });
    if (todayCheckIn.length === 0) {
      return Response.json({ error: 'You must check in to the gym before logging a workout' }, { status: 400 });
    }

    const workoutLog = await base44.entities.WorkoutLog.create({
      user_id:          user.id,
      user_name:        user.full_name,
      workout_type,
      duration_minutes: safeDuration,
      notes:            sanitise(notes, 1000),
      exercises:        safeExercises,
      gym_id:           gym_id || null,
      intensity:        'moderate',
      calories_burned:  0,
    });

    const newStreak = (user.current_streak || 0) + 1;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const isWeekend = [0, 6].includes(now.getDay());
    const prevProgress = user.monthly_challenge_progress || {};
    const isNewMonth = prevProgress.month !== currentMonth;

    const newMonthlyProgress = {
      month:              currentMonth,
      witness_my_gains:   isNewMonth ? 0 : (prevProgress.witness_my_gains || 0),
      discipline_builder: isNewMonth ? 1 : (prevProgress.discipline_builder || 0) + 1,
      weekend_warrior:    isNewMonth
        ? (isWeekend ? 1 : 0)
        : (prevProgress.weekend_warrior || 0) + (isWeekend ? 1 : 0),
    };

    await base44.auth.updateMe({
      current_streak:             newStreak,
      monthly_challenge_progress: newMonthlyProgress,
    });

    return Response.json({ workoutLog, newStreak });
  } catch (error) {
    console.error('Error creating workout log:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});