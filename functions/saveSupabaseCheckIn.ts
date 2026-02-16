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
    const { gym_id, gym_name, check_in_date, first_visit, is_rest_day } = body;

    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.id,
        user_name: user.full_name,
        gym_id,
        gym_name,
        check_in_date: check_in_date || new Date().toISOString(),
        first_visit: first_visit || false,
        is_rest_day: is_rest_day || false
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase check-in insert error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Save check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});