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

    return Response.json({ workoutLog });
  } catch (error) {
    console.error('Error creating workout log:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});