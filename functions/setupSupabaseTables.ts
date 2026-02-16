import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

Deno.serve(async (req) => {
  try {
    // Execute the complete SQL setup
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- PROFILES TABLE
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY,
          email TEXT,
          full_name TEXT,
          avatar_url TEXT,
          account_type TEXT DEFAULT 'user',
          role TEXT DEFAULT 'user',
          primary_gym_id UUID,
          streak_variant TEXT DEFAULT 'default',
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          total_workouts INTEGER DEFAULT 0,
          total_weight_moved NUMERIC DEFAULT 0,
          profile_privacy TEXT DEFAULT 'public',
          show_activity BOOLEAN DEFAULT true,
          training_split TEXT,
          training_days JSONB DEFAULT '[]',
          custom_workouts JSONB DEFAULT '{}',
          equipped_badges JSONB DEFAULT '[]',
          status TEXT,
          bio TEXT,
          location TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- WORKOUTS TABLE
        CREATE TABLE IF NOT EXISTS workouts (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          exercise_name TEXT NOT NULL,
          weight NUMERIC,
          reps INTEGER,
          sets INTEGER,
          duration INTEGER,
          workout_date DATE NOT NULL,
          workout_name TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- GYMS TABLE
        CREATE TABLE IF NOT EXISTS gyms (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          city TEXT,
          postcode TEXT,
          latitude NUMERIC NOT NULL,
          longitude NUMERIC NOT NULL,
          google_place_id TEXT UNIQUE,
          admin_id UUID,
          owner_email TEXT,
          type TEXT,
          status TEXT DEFAULT 'approved',
          join_code TEXT UNIQUE,
          qr_code TEXT,
          members_count INTEGER DEFAULT 0,
          amenities JSONB DEFAULT '[]',
          equipment JSONB DEFAULT '[]',
          logo_url TEXT,
          image_url TEXT,
          gallery JSONB DEFAULT '[]',
          rating NUMERIC,
          price TEXT,
          reward_offer TEXT,
          distance_km NUMERIC,
          verified BOOLEAN DEFAULT false,
          specializes_in JSONB DEFAULT '[]',
          banned_members JSONB DEFAULT '[]',
          language TEXT DEFAULT 'en',
          claim_status TEXT DEFAULT 'unclaimed',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- POSTS TABLE
        CREATE TABLE IF NOT EXISTS posts (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          member_name TEXT,
          member_avatar TEXT,
          content TEXT,
          image_url TEXT,
          video_url TEXT,
          post_type TEXT DEFAULT 'normal',
          exercise TEXT,
          weight NUMERIC,
          gym_id UUID,
          likes INTEGER DEFAULT 0,
          comments JSONB DEFAULT '[]',
          reactions JSONB DEFAULT '{}',
          is_favourite BOOLEAN DEFAULT false,
          is_system_generated BOOLEAN DEFAULT false,
          gym_join BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- CHECK-INS TABLE
        CREATE TABLE IF NOT EXISTS check_ins (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          user_name TEXT,
          gym_id UUID,
          gym_name TEXT,
          check_in_date TIMESTAMP WITH TIME ZONE NOT NULL,
          first_visit BOOLEAN DEFAULT false,
          is_rest_day BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- FRIENDS TABLE
        CREATE TABLE IF NOT EXISTS friends (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          friend_id UUID NOT NULL,
          friend_name TEXT,
          friend_avatar TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- GOALS TABLE
        CREATE TABLE IF NOT EXISTS goals (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          user_name TEXT,
          title TEXT NOT NULL,
          description TEXT,
          goal_type TEXT DEFAULT 'numerical',
          target_value NUMERIC NOT NULL,
          current_value NUMERIC DEFAULT 0,
          unit TEXT,
          exercise TEXT,
          frequency_period TEXT,
          deadline DATE,
          reminder_enabled BOOLEAN DEFAULT true,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- LIFTS TABLE
        CREATE TABLE IF NOT EXISTS lifts (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          member_name TEXT,
          exercise TEXT NOT NULL,
          weight_lbs NUMERIC NOT NULL,
          reps INTEGER,
          is_pr BOOLEAN DEFAULT false,
          lift_date DATE,
          notes TEXT,
          video_url TEXT,
          gym_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- GYM MEMBERSHIPS TABLE
        CREATE TABLE IF NOT EXISTS gym_memberships (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          user_name TEXT,
          user_email TEXT,
          gym_id UUID NOT NULL,
          gym_name TEXT,
          status TEXT DEFAULT 'active',
          join_date DATE,
          expiry_date DATE,
          membership_type TEXT DEFAULT 'monthly',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- NOTIFICATIONS TABLE
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          title TEXT,
          message TEXT,
          type TEXT,
          read BOOLEAN DEFAULT false,
          link TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- CHALLENGES TABLE
        CREATE TABLE IF NOT EXISTS challenges (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          category TEXT DEFAULT 'lifting',
          is_app_challenge BOOLEAN DEFAULT false,
          gym_id UUID,
          gym_name TEXT,
          competing_gym_id UUID,
          competing_gym_name TEXT,
          exercise TEXT,
          goal_type TEXT,
          target_value NUMERIC,
          reward TEXT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          participants JSONB DEFAULT '[]',
          status TEXT DEFAULT 'upcoming',
          winner_id UUID,
          winner_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- EVENTS TABLE
        CREATE TABLE IF NOT EXISTS events (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          gym_id UUID NOT NULL,
          gym_name TEXT,
          title TEXT NOT NULL,
          description TEXT,
          event_date TIMESTAMP WITH TIME ZONE NOT NULL,
          image_url TEXT,
          attendees INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Additional tables
        CREATE TABLE IF NOT EXISTS gym_members (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID,
          name TEXT NOT NULL,
          nickname TEXT,
          avatar_url TEXT,
          join_date DATE,
          weight_class TEXT,
          gym_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS messages (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          sender_id UUID NOT NULL,
          sender_name TEXT,
          receiver_id UUID NOT NULL,
          receiver_name TEXT,
          content TEXT NOT NULL,
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS groups (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          creator_id UUID NOT NULL,
          members JSONB DEFAULT '[]',
          image_url TEXT,
          member_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          subscriber_name TEXT,
          subscription_type TEXT NOT NULL,
          status TEXT DEFAULT 'trial',
          start_date DATE,
          end_date DATE,
          amount NUMERIC,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS referrals (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          referrer_id UUID NOT NULL,
          referred_id UUID NOT NULL,
          gym_id UUID,
          status TEXT DEFAULT 'pending',
          reward_amount NUMERIC,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS achievements (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          user_name TEXT,
          gym_id UUID,
          achievement_type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          points INTEGER DEFAULT 10,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS gym_stats (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          gym_id UUID NOT NULL,
          gym_name TEXT NOT NULL,
          total_members INTEGER DEFAULT 0,
          active_members INTEGER DEFAULT 0,
          total_lifts INTEGER DEFAULT 0,
          total_weight_moved NUMERIC DEFAULT 0,
          challenges_won INTEGER DEFAULT 0,
          community_rank INTEGER,
          engagement_score NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS gym_classes (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          gym_id UUID NOT NULL,
          gym_name TEXT,
          name TEXT NOT NULL,
          description TEXT,
          instructor TEXT,
          schedule JSONB DEFAULT '[]',
          duration_minutes INTEGER,
          max_capacity INTEGER,
          difficulty TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS coaches (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          gym_id UUID NOT NULL,
          gym_name TEXT,
          user_email TEXT NOT NULL,
          name TEXT NOT NULL,
          bio TEXT,
          avatar_url TEXT,
          specialties JSONB DEFAULT '[]',
          certifications JSONB DEFAULT '[]',
          experience_years INTEGER,
          rating NUMERIC,
          total_clients INTEGER DEFAULT 0,
          can_post BOOLEAN DEFAULT false,
          can_manage_events BOOLEAN DEFAULT true,
          can_manage_classes BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS rewards (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          gym_id UUID NOT NULL,
          gym_name TEXT,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          points_required INTEGER DEFAULT 0,
          requirement TEXT DEFAULT 'points',
          value TEXT,
          icon TEXT,
          active BOOLEAN DEFAULT true,
          claimed_by JSONB DEFAULT '[]',
          premium_only BOOLEAN DEFAULT false,
          quantity_limited BOOLEAN DEFAULT false,
          max_quantity INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS payment_methods (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          user_email TEXT,
          type TEXT NOT NULL,
          card_last_four TEXT,
          card_brand TEXT,
          expiry_month TEXT,
          expiry_year TEXT,
          paypal_email TEXT,
          is_default BOOLEAN DEFAULT false,
          billing_name TEXT,
          billing_address TEXT,
          billing_postcode TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS payments (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          gym_id UUID NOT NULL,
          gym_name TEXT,
          amount NUMERIC NOT NULL,
          currency TEXT DEFAULT 'GBP',
          payment_method_id UUID,
          payment_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          membership_type TEXT,
          receipt_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS claimed_bonuses (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          reward_id UUID NOT NULL,
          gym_id UUID,
          claimed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS challenge_participants (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          challenge_id UUID NOT NULL,
          user_id UUID NOT NULL,
          user_name TEXT,
          progress NUMERIC DEFAULT 0,
          rank INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS gym_ratings (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          gym_id UUID NOT NULL,
          user_id UUID NOT NULL,
          rating INTEGER NOT NULL,
          review TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS brand_discount_codes (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          brand_name TEXT NOT NULL,
          brand_logo TEXT,
          discount_code TEXT NOT NULL,
          discount_description TEXT,
          terms TEXT,
          expiry_date DATE,
          category TEXT,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS workout_logs (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          workout_name TEXT,
          exercises JSONB DEFAULT '[]',
          total_duration INTEGER,
          total_weight NUMERIC,
          workout_date DATE NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS polls (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          gym_id UUID NOT NULL,
          creator_id UUID NOT NULL,
          question TEXT NOT NULL,
          options JSONB DEFAULT '[]',
          votes JSONB DEFAULT '{}',
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts(user_id);
        CREATE INDEX IF NOT EXISTS workouts_date_idx ON workouts(workout_date DESC);
        CREATE INDEX IF NOT EXISTS gyms_location_idx ON gyms(latitude, longitude);
        CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
        CREATE INDEX IF NOT EXISTS check_ins_user_id_idx ON check_ins(user_id);
        CREATE INDEX IF NOT EXISTS friends_user_id_idx ON friends(user_id);
        CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id);
        CREATE INDEX IF NOT EXISTS lifts_user_id_idx ON lifts(user_id);
        CREATE INDEX IF NOT EXISTS gym_memberships_user_id_idx ON gym_memberships(user_id);
        CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
      `
    });

    if (error) {
      console.error('Supabase setup error:', error);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      message: 'All Supabase tables created successfully!',
      data 
    });

  } catch (error) {
    console.error('Setup error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});