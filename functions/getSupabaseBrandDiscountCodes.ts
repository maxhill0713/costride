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
    const active = url.searchParams.get('active');

    let query = supabase.from('brand_discount_codes').select('*').order('created_date', { ascending: false });

    if (active !== null) query = query.eq('active', active === 'true');

    const { data, error } = await query;

    if (error) {
      console.error('Supabase brand discount codes query error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Get brand discount codes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});