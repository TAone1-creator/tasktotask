-- Diet meals table (planned diet entries per day of week)
CREATE TABLE IF NOT EXISTS public.diet_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'supper')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  name TEXT NOT NULL,
  description TEXT,
  calories INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diet_meals_user_id ON public.diet_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_meals_day ON public.diet_meals(day_of_week);

-- Row Level Security
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own diet meals" ON public.diet_meals FOR ALL USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_diet_meals_updated_at BEFORE UPDATE ON public.diet_meals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
