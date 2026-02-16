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

    const checkInData = {
      user_id: user.id,
      user_name: user.full_name,
      gym_id,
      gym_name: gym_name || '',
      check_in_date: new Date().toISOString(),
      first_visit: false,
      is_rest_day: false
    };

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/check_ins`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(checkInData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create check-in');
    }

    const data = await response.json();
    return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error('Check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});