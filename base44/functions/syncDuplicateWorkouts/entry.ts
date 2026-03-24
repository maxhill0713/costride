import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [LOW]:
// 1. SDK version bumped.
// 2. Raw error.message suppressed.
// (Scoped to current user's own data via base44.auth.updateMe — already correct)

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workoutTypes = user.custom_workout_types || {};

    const workoutGroups = {};
    Object.keys(workoutTypes).forEach(dayKey => {
      const workout     = workoutTypes[dayKey];
      const workoutName = workout.name;
      if (!workoutGroups[workoutName]) workoutGroups[workoutName] = [];
      workoutGroups[workoutName].push({ dayKey, workout });
    });

    const updatedWorkoutTypes = { ...workoutTypes };

    Object.values(workoutGroups).forEach(group => {
      if (group.length > 1) {
        const mostComplete = group.reduce((prev, current) => {
          const prevCount    = prev.workout.exercises?.length    || 0;
          const currentCount = current.workout.exercises?.length || 0;
          return currentCount > prevCount ? current : prev;
        });
        group.forEach(({ dayKey }) => {
          updatedWorkoutTypes[dayKey] = { ...mostComplete.workout };
        });
      }
    });

    await base44.auth.updateMe({ custom_workout_types: updatedWorkoutTypes });

    return Response.json({
      success: true,
      synced:  Object.keys(workoutGroups).filter(name => workoutGroups[name].length > 1),
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});