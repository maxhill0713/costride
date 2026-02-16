import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const codeData = {
      ...body,
      created_by: user.email,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/brand_discount_codes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(codeData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save discount code');
    }

    const data = await response.json();
    return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error('Save brand discount code error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});