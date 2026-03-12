-- Migrate daily_goal_data date columns from toDateString() format
-- (e.g. "Wed Mar 12 2026") to ISO format ("2026-03-12") for
-- consistent cross-browser behavior.

-- Convert the `date` column
UPDATE public.daily_goal_data
SET date = to_char(date::date, 'YYYY-MM-DD')
WHERE date ~ '^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{1,2} \d{4}$';

-- Convert the `last_streak_update` column
UPDATE public.daily_goal_data
SET last_streak_update = to_char(last_streak_update::date, 'YYYY-MM-DD')
WHERE last_streak_update IS NOT NULL
  AND last_streak_update ~ '^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{1,2} \d{4}$';
