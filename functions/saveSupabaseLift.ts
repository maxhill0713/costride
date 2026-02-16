import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper to ensure user exists in Supabase users table
const ensureUserExists = async (user) => {
  try {
    const checkUserResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/users?id=eq.${user.id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const existingUsers = await checkUserResponse.json();
    
    // If user doesn't exist, create them
    if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
      const createUserResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            avatar_url: user.avatar_url
          })
        }
      );

      if (!createUserResponse.ok) {
        console.warn('Could not create user in Supabase:', await createUserResponse.json());
      }
    }
  } catch (err) {
    console.warn('Error ensuring user exists:', err);
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in Supabase
    await ensureUserExists(user);

    const body = await req.json();
    const { member_id, member_name, exercise, weight_lbs, reps, is_pr, lift_date, notes, video_url, gym_id } = body;

    const liftData = {
      member_id: member_id || user.id,
      member_name: member_name || user.full_name,
      exercise,
      weight_lbs,
      reps,
      is_pr,
      lift_date: lift_date || new Date().toISOString().split('T')[0],
      notes,
      video_url,
      gym_id
    };

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/lifts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(liftData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save lift');
    }

    const data = await response.json();
    return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error('Save lift error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});