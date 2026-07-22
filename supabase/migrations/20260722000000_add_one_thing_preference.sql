-- Date-scoped "The One Thing" daily task pick per user
alter table public.user_preferences
  add column if not exists one_thing_task_id text,
  add column if not exists one_thing_date text
    check (one_thing_date is null or one_thing_date ~ '^\d{4}-\d{2}-\d{2}$');
