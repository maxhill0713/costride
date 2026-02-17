import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    const { data, error } = await supabase
      .from('gyms')
      .insert({
        name: body.name,
        address: body.address,
        city: body.city,
        google_place_id: body.google_place_id,
        latitude: body.latitude,
        longitude: body.longitude,
        type: body.type,
        claim_status: body.claim_status || 'unclaimed',
        admin_id: body.admin_id || null,
        owner_email: body.owner_email || null,
        verified: body.verified || false,
        status: body.status || 'approved',
        members_count: body.members_count || 0,
        image_url: body.image_url || null,
        created_by: user.email
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase gym insert error:', error);
      return Response.json({ error: error.message || 'Failed to insert gym' }, { status: 400 });
    }

    // Auto-create membership for gym creator
    await supabase
      .from('gym_memberships')
      .insert({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        gym_id: data.id,
        gym_name: data.name,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        membership_type: 'lifetime'
      });

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Save gym error:', error.message, error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});