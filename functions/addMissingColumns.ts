import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const sql = `
-- Add columns to check_ins table
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS gym_id uuid;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS gym_name text;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS check_in_date timestamp;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS first_visit boolean DEFAULT false;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS is_rest_day boolean DEFAULT false;

-- Add columns to lifts table
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS member_id uuid;
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS member_name text;
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS exercise text;
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS weight_lbs numeric;
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS reps numeric;
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS is_pr boolean;
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS lift_date date;
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE lifts ADD COLUMN IF NOT EXISTS gym_id uuid;

-- Add columns to gyms table
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS google_place_id text;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS postcode text;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS admin_id uuid;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';

-- Add columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_type text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_value numeric;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_value numeric;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS exercise text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS frequency_period text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS deadline date;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS reminder_enabled boolean;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS status text;

-- Add columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS member_id uuid;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS member_name text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS member_avatar text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS exercise text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS weight numeric;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS gym_id uuid;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}';

-- Add columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add columns to workout_logs table
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS created_date timestamp;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS updated_date timestamp;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS workout_date date;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS exercises jsonb;
    `;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to execute SQL');
    }

    return Response.json({ success: true, message: 'All columns added successfully' });
  } catch (error) {
    console.error('Error adding columns:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});