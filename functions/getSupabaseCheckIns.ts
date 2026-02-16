import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || user.id;
    const gymId = url.searchParams.get('gym_id');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let filters = '';
    if (userId) filters += `user_id=eq.${userId}`;
    if (gymId) filters += `${filters ? '&' : ''}gym_id=eq.${gymId}`;

    const queryUrl = `${Deno.env.get('SUPABASE_URL')}/rest/v1/check_ins?${filters}&order=check_in_date.desc&limit=${limit}`;

    const response = await fetch(queryUrl, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get check-ins');
    }

    const data = await response.json();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Get check-ins error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});