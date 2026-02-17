import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const achievementData = {
      ...body,
      created_by: user.email,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/achievements`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_KEY')}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(achievementData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save achievement');
    }

    const data = await response.json();
    return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error('Save achievement error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});