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

    const body = await req.json();
    const { name, address, latitude, longitude, google_place_id, city, postcode, type } = body;

    if (!name || !latitude || !longitude) {
      return Response.json({ error: 'Name, latitude, and longitude are required' }, { status: 400 });
    }

    // Check if gym already exists
    const { data: existingGym } = await supabase
      .from('gyms')
      .select('*')
      .eq('google_place_id', google_place_id)
      .single();

    if (existingGym) {
      return Response.json({ success: true, data: existingGym, message: 'Gym already exists' });
    }

    // Save to Supabase gyms table
    const { data, error } = await supabase
      .from('gyms')
      .insert({
        name,
        address,
        latitude,
        longitude,
        google_place_id,
        city,
        postcode,
        type,
        admin_id: user.id,
        status: 'approved'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Save gym error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});