import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    // SQL to create all necessary tables
    const sqlStatements = [
      // Workout Logs table
      `CREATE TABLE IF NOT EXISTS workout_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        workout_name TEXT NOT NULL,
        exercises JSONB,
        notes TEXT,
        workout_date DATE NOT NULL,
        created_by TEXT,
        created_date TIMESTAMPTZ DEFAULT NOW(),
        updated_date TIMESTAMPTZ DEFAULT NOW()
      );`,

      // Brand Discount Codes table
      `CREATE TABLE IF NOT EXISTS brand_discount_codes (
        id UUID PRIMARY KEY,
        brand_name TEXT NOT NULL,
        discount_description TEXT,
        code TEXT,
        valid_until DATE,
        category TEXT,
        gym_id UUID,
        premium_only BOOLEAN DEFAULT false,
        created_by TEXT,
        created_date TIMESTAMPTZ DEFAULT NOW(),
        updated_date TIMESTAMPTZ DEFAULT NOW()
      );`,

      // Challenge Participants table
      `CREATE TABLE IF NOT EXISTS challenge_participants (
        id UUID PRIMARY KEY,
        challenge_id UUID NOT NULL,
        user_id UUID NOT NULL,
        user_name TEXT,
        progress_value NUMERIC DEFAULT 0,
        completed BOOLEAN DEFAULT false,
        joined_date TIMESTAMPTZ,
        created_by TEXT,
        created_date TIMESTAMPTZ DEFAULT NOW(),
        updated_date TIMESTAMPTZ DEFAULT NOW()
      );`,

      // Gym Members table
      `CREATE TABLE IF NOT EXISTS gym_members (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        nickname TEXT,
        avatar_url TEXT,
        join_date DATE,
        weight_class TEXT,
        gym_id UUID,
        created_by TEXT,
        created_date TIMESTAMPTZ DEFAULT NOW(),
        updated_date TIMESTAMPTZ DEFAULT NOW()
      );`,

      // Gyms table
      `CREATE TABLE IF NOT EXISTS gyms (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        owner_email TEXT,
        admin_id UUID,
        google_place_id TEXT,
        latitude NUMERIC,
        longitude NUMERIC,
        join_code TEXT,
        qr_code TEXT,
        address TEXT,
        city TEXT,
        postcode TEXT,
        type TEXT,
        language TEXT,
        rating NUMERIC,
        members_count INTEGER,
        amenities JSONB,
        equipment JSONB,
        image_url TEXT,
        logo_url TEXT,
        gallery JSONB,
        price TEXT,
        reward_offer TEXT,
        distance_km NUMERIC,
        verified BOOLEAN DEFAULT false,
        specializes_in JSONB,
        banned_members JSONB,
        status TEXT,
        claim_status TEXT,
        created_by TEXT,
        created_date TIMESTAMPTZ DEFAULT NOW(),
        updated_date TIMESTAMPTZ DEFAULT NOW()
      );`,

      // Profiles table
      `CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        username TEXT,
        bio TEXT,
        account_type TEXT,
        role TEXT,
        primary_gym_id UUID,
        onboarding_completed BOOLEAN DEFAULT false,
        streak_count INTEGER DEFAULT 0,
        last_check_in_date DATE,
        created_date TIMESTAMPTZ DEFAULT NOW(),
        updated_date TIMESTAMPTZ DEFAULT NOW()
      );`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON workout_logs(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(workout_date);`,
      `CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);`,
      `CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_gym_members_gym_id ON gym_members(gym_id);`,
      `CREATE INDEX IF NOT EXISTS idx_gyms_status ON gyms(status);`,
      `CREATE INDEX IF NOT EXISTS idx_gyms_claim_status ON gyms(claim_status);`,
      `CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);`
    ];

    const results = [];
    for (const sql of sqlStatements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.error('SQL Error:', sql, error);
          results.push({ sql: sql.substring(0, 50) + '...', error: error.message });
        } else {
          results.push({ sql: sql.substring(0, 50) + '...', success: true });
        }
      } catch (err) {
        console.error('Execute error:', err);
        results.push({ sql: sql.substring(0, 50) + '...', error: err.message });
      }
    }

    return Response.json({ 
      success: true, 
      message: 'Table creation attempted',
      results 
    });
  } catch (error) {
    console.error('Create tables error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});