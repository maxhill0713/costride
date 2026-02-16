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

    const body = await req.json();
    const { workouts, workout_date, workout_name, notes } = body;

    if (!workouts || !Array.isArray(workouts)) {
      return Response.json({ error: 'Workouts array required' }, { status: 400 });
    }

    // Prepare workout records
    const workoutRecords = workouts.map(exercise => ({
      user_id: user.id,
      exercise_name: exercise.exercise_name,
      weight: exercise.weight,
      reps: exercise.reps,
      sets: exercise.sets,
      duration: exercise.duration,
      workout_date: workout_date || new Date().toISOString().split('T')[0],
      workout_name: workout_name || exercise.workout_name,
      notes: notes || exercise.notes
    }));

    // Batch insert all workouts
    const { data, error } = await supabase
      .from('workouts')
      .insert(workoutRecords)
      .select();

    if (error) {
      console.error('Supabase batch insert error:', error);
      throw error;
    }

    return Response.json({ 
      success: true, 
      data,
      count: data.length 
    });
  } catch (error) {
    console.error('Save batch workouts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});