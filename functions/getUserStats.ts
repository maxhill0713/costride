import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || user.id;

    // Get all workouts for user
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('workout_date', { ascending: false });

    if (workoutsError) throw workoutsError;

    // Calculate stats
    const totalWorkouts = workouts.length;
    const totalWeight = workouts.reduce((sum, w) => sum + (w.weight * w.sets * w.reps || 0), 0);
    
    // Calculate streak
    const uniqueDates = [...new Set(workouts.map(w => w.workout_date))].sort().reverse();
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const date = uniqueDates[i];
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (date === expectedDateStr || date === today) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate PRs by exercise
    const prsByExercise = {};
    workouts.forEach(workout => {
      const exercise = workout.exercise_name;
      if (!prsByExercise[exercise] || workout.weight > prsByExercise[exercise].weight) {
        prsByExercise[exercise] = {
          weight: workout.weight,
          reps: workout.reps,
          date: workout.workout_date
        };
      }
    });

    // Weekly activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyWorkouts = workouts.filter(w => 
      new Date(w.workout_date) >= sevenDaysAgo
    ).length;

    return Response.json({
      success: true,
      stats: {
        totalWorkouts,
        totalWeightMoved: Math.round(totalWeight),
        currentStreak,
        weeklyWorkouts,
        personalRecords: prsByExercise,
        lastWorkout: workouts[0]?.workout_date || null
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});