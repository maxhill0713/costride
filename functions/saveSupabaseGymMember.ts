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
    const { event, data } = body;

    // Handle automation payloads - data contains the actual entity record
    let memberData = data || body;
    
    // Ensure required fields exist
    if (!memberData.name) {
      throw new Error('name field is required for gym member');
    }

    // Map fields to Supabase schema
    const supabaseMember = {
      id: memberData.id || event?.entity_id,
      name: memberData.name,
      nickname: memberData.nickname || null,
      avatar_url: memberData.avatar_url || null,
      join_date: memberData.join_date || null,
      weight_class: memberData.weight_class || null,
      gym_id: memberData.gym_id || null,
      created_by: user.email,
      created_at: memberData.created_date || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    );

    const { data: result, error } = await supabase
      .from('gym_members')
      .insert([supabaseMember])
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