import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, goal_type, target_value, current_value, unit, exercise, frequency_period, deadline, reminder_enabled, status } = body;

    const goalData = {
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
    };

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/goals`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(goalData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save goal');
    }

    const data = await response.json();
    return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error('Save goal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});