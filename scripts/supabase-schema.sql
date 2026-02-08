-- Reframe schema: run this once in Supabase Dashboard → SQL Editor
-- Use when you can't run `npm run db:push` locally (e.g. DNS/network blocks db.*.supabase.co)

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id varchar(36) PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name varchar(255),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. profile
CREATE TABLE IF NOT EXISTS profile (
  user_id varchar(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name varchar(255) NOT NULL DEFAULT 'Friend',
  goals jsonb NOT NULL DEFAULT '["stress"]',
  ai_enabled boolean NOT NULL DEFAULT false,
  preferred_checkin_time varchar(5) NOT NULL DEFAULT '09:00',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. daily_checkins
CREATE TABLE IF NOT EXISTS daily_checkins (
  id varchar(64) PRIMARY KEY,
  user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_iso varchar(10) NOT NULL,
  mood_0_to_10 integer NOT NULL,
  energy_0_to_10 integer NOT NULL,
  note text,
  created_at timestamptz NOT NULL
);

-- 4. thought_records
CREATE TABLE IF NOT EXISTS thought_records (
  id varchar(64) PRIMARY KEY,
  user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  situation text NOT NULL,
  thoughts text NOT NULL,
  emotions jsonb NOT NULL DEFAULT '[]',
  distortions jsonb NOT NULL DEFAULT '[]',
  evidence_for text NOT NULL DEFAULT '',
  evidence_against text NOT NULL DEFAULT '',
  reframe text NOT NULL DEFAULT '',
  action_step text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL
);

-- 5. skill_completions
CREATE TABLE IF NOT EXISTS skill_completions (
  id varchar(64) PRIMARY KEY,
  user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id varchar(64) NOT NULL,
  reflection text,
  created_at timestamptz NOT NULL
);

-- 6. safety_events
CREATE TABLE IF NOT EXISTS safety_events (
  id varchar(64) PRIMARY KEY,
  user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category varchar(32) NOT NULL,
  source varchar(32) NOT NULL,
  created_at timestamptz NOT NULL
);

-- 7. saved_insights
CREATE TABLE IF NOT EXISTS saved_insights (
  id varchar(64) PRIMARY KEY,
  user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz NOT NULL
);
