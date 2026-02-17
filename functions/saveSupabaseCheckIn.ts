import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const hexToUuid = (hex) => {
  if (!hex || typeof hex !== 'string') return hex;
  if (hex.includes('-') && hex.length === 36) return hex;
  const cleanHex = hex.replace(/-/g, '');
  const paddedHex = cleanHex.padEnd(32, '0');
  return `${paddedHex.slice(0, 8)}-${paddedHex.slice(8, 12)}-${paddedHex.slice(12, 16)}-${paddedHex.slice(16, 20)}-${paddedHex.slice(20, 32)}`.toLowerCase();
};



Deno.serve(async (req) => {
  try {
    // Check if secrets are set
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials - URL:', !!supabaseUrl, 'KEY:', !!supabaseKey);
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let { gym_id, gym_name, check_in_date, first_visit, is_rest_day } = body;

    // Require gym_id in payload
    if (!gym_id) {
      return Response.json({ error: 'gym_id is required in the request body' }, { status: 400 });
    }

    const checkInData = {
      user_id: hexToUuid(user.id),
      user_name: user.full_name,
      gym_id: hexToUuid(gym_id),
      gym_name: gym_name || '',
      check_in_date: check_in_date || new Date().toISOString(),
      first_visit: first_visit || false,
      is_rest_day: is_rest_day || false
    };

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/check_ins`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_SERVICE_KEY'),
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(checkInData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save check-in');
    }

    const data = await response.json();
    return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error('Save check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});