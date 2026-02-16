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

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const city = url.searchParams.get('city');
    const type = url.searchParams.get('type');

    let query = supabase.from('gyms').select('*');

    if (status) query = query.eq('status', status);
    if (city) query = query.eq('city', city);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase gyms query error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Get gyms error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});