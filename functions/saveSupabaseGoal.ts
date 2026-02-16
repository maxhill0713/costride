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
    const { title, description, goal_type, target_value, current_value, unit, exercise, frequency_period, deadline, reminder_enabled, status } = body;

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        user_name: user.full_name,
        title,
        description,
        goal_type: goal_type || 'numerical',
        target_value,
        current_value: current_value || 0,
        unit,
        exercise,
        frequency_period,
        deadline,
        reminder_enabled: reminder_enabled !== false,
        status: status || 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase goal insert error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Save goal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});