import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    // Query information_schema to get all tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }

    const tables = data?.map(t => t.table_name) || [];

    // Expected tables
    const expectedTables = [
      'gym_members',
      'lifts',
      'check_ins',
      'posts',
      'goals',
      'gyms',
      'events',
      'challenges',
      'notifications',
      'gym_memberships',
      'messages',
      'friends',
      'achievements',
      'gym_stats',
      'gym_classes',
      'coaches',
      'rewards',
      'payment_methods',
      'payments',
      'subscriptions',
      'referrals',
      'groups',
      'polls',
      'workout_logs',
      'claimed_bonuses',
      'challenge_participants',
      'gym_ratings',
      'brand_discount_codes'
    ];

    const existingTables = tables.filter(t => expectedTables.includes(t));
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));

    return Response.json({
      success: true,
      total_tables: tables.length,
      existing_expected_tables: existingTables,
      missing_tables: missingTables,
      all_tables: tables
    });
  } catch (error) {
    console.error('Check tables error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});