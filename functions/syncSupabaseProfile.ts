import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    // Fetch profile from Supabase
    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!supabaseResponse.ok) {
      return Response.json({ error: 'Failed to fetch Supabase profile' }, { status: 500 });
    }

    const supabaseProfiles = await supabaseResponse.json();
    const supabaseProfile = supabaseProfiles.length > 0 ? supabaseProfiles[0] : null;

    // Merge Supabase profile with Base44 user data
    const mergedProfile = {
      ...user,
      ...supabaseProfile,
      id: user.id, // Ensure Base44 ID is preserved
      email: user.email,
      full_name: user.full_name,
    };

    return Response.json(mergedProfile);
  } catch (error) {
    console.error('Sync Supabase Profile Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});