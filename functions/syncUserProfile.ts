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

    // Upsert user profile to Supabase
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        account_type: user.account_type || 'user',
        role: user.role || 'user',
        primary_gym_id: user.primary_gym_id,
        streak_variant: user.streak_variant || 'default',
        current_streak: user.current_streak || 0,
        longest_streak: user.longest_streak || 0,
        total_workouts: user.total_workouts || 0,
        profile_privacy: user.profile_privacy || 'public',
        show_activity: user.show_activity !== false,
        training_split: user.training_split,
        training_days: user.training_days || [],
        custom_workouts: user.custom_workouts || {},
        equipped_badges: user.equipped_badges || []
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Sync user profile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});