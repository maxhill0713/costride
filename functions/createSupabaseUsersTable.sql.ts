-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  account_type TEXT DEFAULT 'user',
  primary_gym_id TEXT,
  training_days TEXT[] DEFAULT ARRAY[]::TEXT[],
  streak_variant TEXT DEFAULT 'default',
  weekly_goal INTEGER DEFAULT 3,
  custom_workout_types JSONB,
  last_friends_view TIMESTAMP WITH TIME ZONE,
  streak_freezes_available INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::TEXT = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::TEXT = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::TEXT = id);