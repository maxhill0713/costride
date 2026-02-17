import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    if (payload.event.type !== 'create') {
      return Response.json({ success: true, message: 'Not a create event' });
    }

    const userData = payload.data;
    const userId = payload.event.entity_id;

    if (!userId || !userData) {
      return Response.json({ error: 'Missing user data' }, { status: 400 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    // Create profile in Supabase
    const profileData = {
      id: userId,
      email: userData.email,
      full_name: userData.full_name,
      created_at: new Date().toISOString()
    };

    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(profileData),
    });

    if (!supabaseResponse.ok) {
      const error = await supabaseResponse.text();
      console.error('Supabase creation failed:', error);
      return Response.json({ error: 'Failed to create Supabase profile' }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Supabase profile created' });
  } catch (error) {
    console.error('Create Supabase Profile Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});