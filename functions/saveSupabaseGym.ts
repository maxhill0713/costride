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

    const body = await req.json();
    
    const { data, error } = await supabase
      .from('gyms')
      .insert({
        ...body,
        owner_email: body.owner_email || user.email,
        admin_id: body.admin_id || user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase gym insert error:', error);
      return Response.json({ error: error.message || 'Failed to insert gym' }, { status: 400 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Save gym error:', error.message, error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});