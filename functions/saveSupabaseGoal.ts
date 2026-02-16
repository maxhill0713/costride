import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper to ensure user profile exists in Supabase profiles table
const ensureProfileExists = async (user) => {
  try {
    const checkProfileResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/profiles?id=eq.${user.id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_KEY')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const existingProfiles = await checkProfileResponse.json();
    
    if (!Array.isArray(existingProfiles) || existingProfiles.length === 0) {
      const createProfileResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/profiles`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_KEY')}`,
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

      if (!createProfileResponse.ok) {
        console.warn('Could not create profile in Supabase:', await createProfileResponse.json());
      }
    }
  } catch (err) {
    console.warn('Error ensuring profile exists:', err);
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure profile exists in Supabase (handle legacy users)
    await ensureProfileExists(user);

    const body = await req.json();
    const { title, description, goal_type, target_value, current_value, unit, exercise, frequency_period, deadline, reminder_enabled, status } = body;

    const goalData = {
      user_id: user.id,
      user_name: user.full_name,
      title,
      description,
      goal_type: goal_type || 'numerical',
      target_value,
      current_value: current_value || 0,
      unit,
      exercise,
      frequency_period,
      deadline,
      reminder_enabled: reminder_enabled !== false,
      status: status || 'active'
    };

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/goals`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_KEY')}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(goalData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save goal');
    }

    const data = await response.json();
    return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error('Save goal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});