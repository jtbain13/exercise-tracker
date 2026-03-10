-- Exercise Tracker - Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database

-- 1. Exercises table (your exercise library)
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'Other',
  muscle_group TEXT,
  type TEXT NOT NULL DEFAULT 'strength', -- 'strength' or 'cardio'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Workouts table (one per session)
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  name TEXT, -- optional label like "Push Day" or "CALI-1 Bench"
  notes TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Sets table (one row per set performed)
CREATE TABLE sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 1,
  reps INTEGER,
  weight REAL, -- lbs
  duration_seconds INTEGER, -- for timed exercises
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Cardio log (separate from strength sets)
CREATE TABLE cardio_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  distance_miles REAL,
  duration_minutes REAL,
  elevation_ft REAL,
  vest_weight_lbs REAL,
  ruck_weight_lbs REAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_workouts_date ON workouts(date DESC);
CREATE INDEX idx_sets_workout ON sets(workout_id);
CREATE INDEX idx_sets_exercise ON sets(exercise_id);
CREATE INDEX idx_cardio_date ON cardio_log(date DESC);
CREATE INDEX idx_cardio_workout ON cardio_log(workout_id);

-- Seed with common exercises
INSERT INTO exercises (name, category, muscle_group, type) VALUES
  -- Push
  ('BB Bench Press', 'Push', 'Chest', 'strength'),
  ('DB Bench Press', 'Push', 'Chest', 'strength'),
  ('OHP', 'Push', 'Shoulders', 'strength'),
  ('DB Shoulder Press', 'Push', 'Shoulders', 'strength'),
  ('Push-ups', 'Push', 'Chest', 'strength'),
  ('Dips', 'Push', 'Chest', 'strength'),
  ('Pike Push-ups', 'Push', 'Shoulders', 'strength'),
  ('Lateral Raises', 'Push', 'Shoulders', 'strength'),
  -- Pull
  ('Pull-ups', 'Pull', 'Back', 'strength'),
  ('Inverted Rows', 'Pull', 'Back', 'strength'),
  ('DB Row', 'Pull', 'Back', 'strength'),
  ('BB Deadlift', 'Pull', 'Back', 'strength'),
  ('BB Romanian Deadlift', 'Pull', 'Hamstrings', 'strength'),
  ('Hammer Curl', 'Pull', 'Biceps', 'strength'),
  -- Legs
  ('BB Back Squat', 'Legs', 'Quads', 'strength'),
  ('BW Squats', 'Legs', 'Quads', 'strength'),
  ('Lunges', 'Legs', 'Quads', 'strength'),
  ('Single Leg Calf Raise', 'Legs', 'Calves', 'strength'),
  -- Core
  ('Plank', 'Core', 'Core', 'strength'),
  ('Hollow Body Hold', 'Core', 'Core', 'strength'),
  ('V Ups', 'Core', 'Core', 'strength'),
  ('Flutter Kicks', 'Core', 'Core', 'strength'),
  ('Plank Shoulder Taps', 'Core', 'Core', 'strength'),
  ('Situp + Reach', 'Core', 'Core', 'strength'),
  ('Sit-ups', 'Core', 'Core', 'strength'),
  -- Cardio
  ('Running', 'Cardio', NULL, 'cardio'),
  ('Walking', 'Cardio', NULL, 'cardio'),
  ('Hiking', 'Cardio', NULL, 'cardio'),
  ('Rucking', 'Cardio', NULL, 'cardio'),
  ('Cycling', 'Cardio', NULL, 'cardio'),
  ('Stairmaster', 'Cardio', NULL, 'cardio'),
  ('Rowing', 'Cardio', NULL, 'cardio');

-- Enable Row Level Security (optional - enable if you add auth later)
-- ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cardio_log ENABLE ROW LEVEL SECURITY;

-- Public access policies (for no-auth setup)
-- If you want the app to work without login, run these:
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardio_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sets" ON sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cardio_log" ON cardio_log FOR ALL USING (true) WITH CHECK (true);
