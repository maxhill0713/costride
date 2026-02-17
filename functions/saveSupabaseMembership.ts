import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const membershipData = {
      ...body,
      user_id: body.user_id || user.id,
      user_name: body.user_name || user.full_name,
      user_email: body.user_email || user.email
    };

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/gym_memberships`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_KEY')}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(membershipData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save membership');
    }

    const data = await response.json();
    return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error('Save membership error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});