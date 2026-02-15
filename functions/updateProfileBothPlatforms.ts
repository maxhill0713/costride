import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileData = await req.json();

    // Update Base44 User entity
    const base44UpdateData = {
      full_name: profileData.full_name,
      // Add other Base44 User fields as needed
    };
    
    await base44.auth.updateMe(base44UpdateData);

    // Update Supabase profile
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    // Prepare Supabase update (exclude Base44-specific fields)
    const supabaseUpdateData = { ...profileData };
    delete supabaseUpdateData.id;
    delete supabaseUpdateData.email;
    delete supabaseUpdateData.role;
    delete supabaseUpdateData.created_date;
    delete supabaseUpdateData.updated_date;
    delete supabaseUpdateData.created_by;

    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(supabaseUpdateData),
    });

    if (!supabaseResponse.ok) {
      const error = await supabaseResponse.text();
      console.error('Supabase update failed:', error);
      return Response.json({ error: 'Failed to update Supabase profile' }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Profile updated on both platforms' });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});