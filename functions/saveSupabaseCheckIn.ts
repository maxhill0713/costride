import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const hexToUuid = (hex) => {
  if (!hex || typeof hex !== 'string') return hex;
  if (hex.includes('-') && hex.length === 36) return hex;
  const cleanHex = hex.replace(/-/g, '');
  const paddedHex = cleanHex.padEnd(32, '0');
  return `${paddedHex.slice(0, 8)}-${paddedHex.slice(8, 12)}-${paddedHex.slice(12, 16)}-${paddedHex.slice(16, 20)}-${paddedHex.slice(20, 32)}`.toLowerCase();
};

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
    
    // If profile doesn't exist, create it (legacy user)
    if (!Array.isArray(existingProfiles) || existingProfiles.length === 0) {
      const createProfileResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/profiles`,
        {
          method: 'POST',
          headers: {
            'apikey': Deno.env.get('SUPABASE_SERVICE_KEY'),
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
    // Check if secrets are set
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials - URL:', !!supabaseUrl, 'KEY:', !!supabaseKey);
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure profile exists in Supabase (handle legacy users)
    await ensureProfileExists(user);

    const body = await req.json();
    let { gym_id, gym_name, check_in_date, first_visit, is_rest_day } = body;

    // If gym_id not provided, try to use user's primary gym
    if (!gym_id && user.primary_gym_id) {
      gym_id = user.primary_gym_id;
    }

    // If still no gym_id, try to get from Supabase profile
    if (!gym_id) {
      const userProfile = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/profiles?id=eq.${hexToUuid(user.id)}`,
        {
          headers: {
            'apikey': Deno.env.get('SUPABASE_SERVICE_KEY'),
            'Content-Type': 'application/json'
          }
        }
      );
      const profiles = await userProfile.json();
      if (profiles.length > 0 && profiles[0].primary_gym_id) {
        gym_id = profiles[0].primary_gym_id;
      }
    }

    if (!gym_id) {
      return Response.json({ error: 'gym_id is required. Please join a gym first.' }, { status: 400 });
    }

    const checkInData = {
      user_id: hexToUuid(user.id),
      user_name: user.full_name,
      gym_id: hexToUuid(gym_id),
      gym_name: gym_name || '',
      check_in_date: check_in_date || new Date().toISOString(),
      first_visit: first_visit || false,
      is_rest_day: is_rest_day || false
    };

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/check_ins`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_SERVICE_KEY'),
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(checkInData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save check-in');
    }

    const data = await response.json();
    return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error('Save check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});