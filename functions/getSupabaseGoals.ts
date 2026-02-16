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
    const status = url.searchParams.get('status');

    let filters = `user_id=eq.${userId}`;
    if (status) filters += `&status=eq.${status}`;

    const queryUrl = `${Deno.env.get('SUPABASE_URL')}/rest/v1/goals?${filters}&order=created_at.desc`;

    const response = await fetch(queryUrl, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get goals');
    }

    const data = await response.json();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Get goals error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});