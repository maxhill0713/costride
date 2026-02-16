import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gym_id, gym_name } = await req.json();

    if (!gym_id) {
      return Response.json({ error: 'gym_id is required' }, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY')
    );

    const checkInData = {
      user_id: user.id,
      user_name: user.full_name,
      gym_id: gym_id,
      gym_name: gym_name || '',
      check_in_date: new Date().toISOString(),
      first_visit: false,
      is_rest_day: false
    };

    const { data, error } = await supabase
      .from('check_ins')
      .insert([checkInData])
      .select();

    if (error) {
      console.error('Supabase check-in error:', error);
      throw error;
    }

    return Response.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});