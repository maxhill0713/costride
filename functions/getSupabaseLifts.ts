import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const memberId = url.searchParams.get('member_id');
    const gymId = url.searchParams.get('gym_id');
    const exercise = url.searchParams.get('exercise');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let filters = '';
    if (memberId) filters += `member_id=eq.${memberId}`;
    if (gymId) filters += `${filters ? '&' : ''}gym_id=eq.${gymId}`;
    if (exercise) filters += `${filters ? '&' : ''}exercise=eq.${exercise}`;

    const queryUrl = `${Deno.env.get('SUPABASE_URL')}/rest/v1/lifts?${filters}&order=lift_date.desc&limit=${limit}`;

    const response = await fetch(queryUrl, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get lifts');
    }

    const data = await response.json();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Get lifts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});