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
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    const requiredTables = [
      'profiles',
      'workouts',
      'gyms',
      'posts',
      'check_ins',
      'friends',
      'goals',
      'lifts',
      'gym_memberships',
      'notifications',
      'challenges',
      'events'
    ];

    const results = {};

    // Test each table
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          results[table] = { status: 'error', message: error.message };
        } else {
          results[table] = { status: 'success', message: 'Table exists and is accessible' };
        }
      } catch (err) {
        results[table] = { status: 'error', message: err.message };
      }
    }

    const allSuccess = Object.values(results).every(r => r.status === 'success');

    return Response.json({
      success: allSuccess,
      message: allSuccess ? 'All tables created successfully!' : 'Some tables are missing or have errors',
      tables: results,
      supabaseUrl: Deno.env.get('SUPABASE_URL')
    });
  } catch (error) {
    console.error('Test Supabase setup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});