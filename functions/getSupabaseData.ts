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
      Deno.env.get('SUPABASE_ANON_KEY')
    );

    const url = new URL(req.url);
    const table = url.searchParams.get('table');
    const userId = url.searchParams.get('userId') || user.id;
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    if (!table) {
      return Response.json({ error: 'Table parameter required' }, { status: 400 });
    }

    let query = supabase.from(table).select('*');

    // Filter by user for user-specific tables
    if (['workouts', 'posts'].includes(table)) {
      query = query.eq('user_id', userId);
    }

    // Sort by created_at descending
    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Get Supabase data error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});