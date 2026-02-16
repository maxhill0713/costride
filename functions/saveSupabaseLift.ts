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
    const { member_id, member_name, exercise, weight_lbs, reps, is_pr, lift_date, notes, video_url, gym_id } = body;

    const { data, error } = await supabase
      .from('lifts')
      .insert({
        member_id: member_id || user.id,
        member_name: member_name || user.full_name,
        exercise,
        weight_lbs,
        reps,
        is_pr,
        lift_date: lift_date || new Date().toISOString().split('T')[0],
        notes,
        video_url,
        gym_id
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase lift insert error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Save lift error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});