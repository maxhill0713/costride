import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admin users
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    // Fetch all users using service role
    const allUsers = await base44.asServiceRole.entities.User.list();

    if (!allUsers || allUsers.length === 0) {
      return Response.json({ success: true, message: 'No users to sync', synced: 0 });
    }

    let syncedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Sync each user to Supabase
    for (const userData of allUsers) {
      try {
        const profileData = {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          created_at: userData.created_date || new Date().toISOString()
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

        if (supabaseResponse.ok) {
          syncedCount++;
        } else if (supabaseResponse.status === 409) {
          // Profile already exists
          skippedCount++;
        } else {
          const errorText = await supabaseResponse.text();
          errors.push(`User ${userData.id}: ${errorText}`);
        }
      } catch (error) {
        errors.push(`User ${userData.id}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      message: 'Sync completed',
      synced: syncedCount,
      skipped: skippedCount,
      total: allUsers.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Sync All Users Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});