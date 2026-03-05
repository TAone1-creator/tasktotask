-- Workout exercises table (planned exercises per day of week)
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'abs', 'cardio', 'full_body')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  name TEXT NOT NULL,
  sets INTEGER,
  reps TEXT,
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workout_exercises_user_id ON public.workout_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_day ON public.workout_exercises(day_of_week);

-- Row Level Security
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own workout exercises" ON public.workout_exercises FOR ALL USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_workout_exercises_updated_at BEFORE UPDATE ON public.workout_exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
