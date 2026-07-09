-- Default and last-used task view preferences per user
alter table public.user_preferences
  add column if not exists default_task_view text not null default 'card'
    check (default_task_view in ('card', 'bucket', 'list', 'calendar')),
  add column if not exists last_task_view text
    check (last_task_view is null or last_task_view in ('card', 'bucket', 'list', 'calendar')),
  add column if not exists task_view_explicit boolean not null default false;
