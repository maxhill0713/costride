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
      Deno.env.get('SUPABASE_ANON_KEY')
    );

    const body = await req.json();
    const { exercise_name, weight, reps, sets, duration, workout_date, workout_name, notes } = body;

    // Save to Supabase workouts table
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        exercise_name,
        weight,
        reps,
        sets,
        duration,
        workout_date,
        workout_name,
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Save workout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});