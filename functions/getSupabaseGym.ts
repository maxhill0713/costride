import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { gym_id } = await req.json();

    if (!gym_id) {
      return Response.json({ error: 'gym_id required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gym_id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Check if user can access this gym - approved gyms are public, otherwise must be owner
    if (data.status !== 'approved' && (!user || (data.owner_email !== user.email && data.admin_id !== user.id))) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching gym:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});