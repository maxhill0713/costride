import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    // Expected tables to check
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

    const existingTables = [];
    const missingTables = [];

    // Check each table by trying to query it
    for (const table of expectedTables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        missingTables.push(table);
      } else {
        existingTables.push(table);
      }
    }

    return Response.json({
      success: true,
      existing_tables: existingTables,
      missing_tables: missingTables,
      total_existing: existingTables.length,
      total_missing: missingTables.length
    });
  } catch (error) {
    console.error('Check tables error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});