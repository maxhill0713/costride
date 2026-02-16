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
    const userId = url.searchParams.get('user_id') || user.id;
    const gymId = url.searchParams.get('gym_id');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let query = supabase.from('check_ins').select('*').order('check_in_date', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (gymId) query = query.eq('gym_id', gymId);
    
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase check-ins query error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Get check-ins error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});