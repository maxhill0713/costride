import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event, data, payload_too_large } = body;

    // Handle automation payloads
    let memberData = data || body;
    if (!memberData.id && event?.entity_id) {
      memberData.id = event.entity_id;
    }

    memberData = {
      ...memberData,
      created_by: user.email,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    );

    const { data: result, error } = await supabase
      .from('gym_members')
      .insert([memberData])
      .select();

    if (error) {
      throw new Error(error.message || 'Failed to save gym member');
    }

    return Response.json({ success: true, data: Array.isArray(result) ? result[0] : result });
  } catch (error) {
    console.error('Save gym member error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});