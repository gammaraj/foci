-- Persistent user motto / custom quote (replaces rotating daily quote when set)
alter table public.user_preferences
  add column if not exists custom_quote text
    check (custom_quote is null or char_length(custom_quote) <= 160);

-- Include custom_quote in guest → cloud migration (full replace of migrate_guest_workspace)
create or replace function public.migrate_guest_workspace(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing int;
  pref jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select count(*)::int into existing from public.tasks where user_id = uid;
  if existing > 0 then
    return;
  end if;

  if payload ? 'projects' and jsonb_typeof(payload->'projects') = 'array'
     and jsonb_array_length(payload->'projects') > 0 then
    insert into public.projects as p (
      id, user_id, name, description, color, due_date, archived, sort_order, is_favorite, created_at
    )
    select
      coalesce(x.id, gen_random_uuid()::text),
      uid,
      coalesce(x.name, 'Project'),
      x.description,
      x.color,
      x.due_date,
      coalesce(x.archived, false),
      x.sort_order,
      coalesce(x.is_favorite, false),
      coalesce(x.created_at, 0)
    from jsonb_to_recordset(payload->'projects') as x(
      id text,
      name text,
      description text,
      color text,
      due_date text,
      archived boolean,
      sort_order integer,
      is_favorite boolean,
      created_at bigint
    )
    on conflict (user_id, id) do update set
      name = excluded.name,
      description = excluded.description,
      color = excluded.color,
      due_date = excluded.due_date,
      archived = excluded.archived,
      sort_order = excluded.sort_order,
      is_favorite = excluded.is_favorite;
  end if;

  if payload ? 'tasks' and jsonb_typeof(payload->'tasks') = 'array'
     and jsonb_array_length(payload->'tasks') > 0 then
    insert into public.tasks as t (
      id, user_id, title, completed, sessions, time_spent, created_at, completed_at,
      project_id, subtasks, description, due_date, "order", archived_at, recurrence,
      priority, blocked, someday, kind
    )
    select
      coalesce(x.id, gen_random_uuid()::text),
      uid,
      coalesce(x.title, 'Task'),
      coalesce(x.completed, false),
      coalesce(x.sessions, 0),
      coalesce(x.time_spent, 0),
      coalesce(x.created_at, (extract(epoch from now()) * 1000)::bigint),
      x.completed_at,
      coalesce(x.project_id, '__general__'),
      coalesce(x.subtasks, '[]'::jsonb),
      x.description,
      x.due_date,
      x."order",
      x.archived_at,
      x.recurrence,
      x.priority,
      coalesce(x.blocked, false),
      coalesce(x.someday, false),
      coalesce(x.kind, 'task')
    from jsonb_to_recordset(payload->'tasks') as x(
      id text,
      title text,
      completed boolean,
      sessions integer,
      time_spent bigint,
      created_at bigint,
      completed_at bigint,
      project_id text,
      subtasks jsonb,
      description text,
      due_date text,
      "order" integer,
      archived_at bigint,
      recurrence text,
      priority integer,
      blocked boolean,
      someday boolean,
      kind text
    )
    on conflict (user_id, id) do update set
      title = excluded.title,
      completed = excluded.completed,
      sessions = excluded.sessions,
      time_spent = excluded.time_spent,
      completed_at = excluded.completed_at,
      project_id = excluded.project_id,
      subtasks = excluded.subtasks,
      description = excluded.description,
      due_date = excluded.due_date,
      "order" = excluded."order",
      archived_at = excluded.archived_at,
      recurrence = excluded.recurrence,
      priority = excluded.priority,
      blocked = excluded.blocked,
      someday = excluded.someday,
      kind = excluded.kind;
  end if;

  if payload ? 'settings' and jsonb_typeof(payload->'settings') = 'object' then
    insert into public.settings as s (
      user_id, work_duration, break_duration, inactivity_threshold, daily_goal,
      auto_start_enabled, notifications_enabled, alarm_enabled, alarm_sound, updated_at
    )
    values (
      uid,
      coalesce((payload->'settings'->>'work_duration')::bigint, 1800000),
      coalesce((payload->'settings'->>'break_duration')::bigint, 300000),
      coalesce((payload->'settings'->>'inactivity_threshold')::bigint, 60000),
      coalesce((payload->'settings'->>'daily_goal')::int, 3),
      coalesce((payload->'settings'->>'auto_start_enabled')::boolean, false),
      coalesce((payload->'settings'->>'notifications_enabled')::boolean, true),
      coalesce((payload->'settings'->>'alarm_enabled')::boolean, true),
      coalesce(payload->'settings'->>'alarm_sound', 'digital'),
      now()
    )
    on conflict (user_id) do update set
      work_duration = excluded.work_duration,
      break_duration = excluded.break_duration,
      inactivity_threshold = excluded.inactivity_threshold,
      daily_goal = excluded.daily_goal,
      auto_start_enabled = excluded.auto_start_enabled,
      notifications_enabled = excluded.notifications_enabled,
      alarm_enabled = excluded.alarm_enabled,
      alarm_sound = excluded.alarm_sound,
      updated_at = excluded.updated_at;
  end if;

  if payload ? 'daily_goal' and jsonb_typeof(payload->'daily_goal') = 'object' then
    insert into public.daily_goal_data as d (
      user_id, date, session_count, streak, last_streak_update, updated_at
    )
    values (
      uid,
      coalesce(payload->'daily_goal'->>'date', to_char(now(), 'YYYY-MM-DD')),
      coalesce((payload->'daily_goal'->>'session_count')::int, 0),
      coalesce((payload->'daily_goal'->>'streak')::int, 0),
      payload->'daily_goal'->>'last_streak_update',
      now()
    )
    on conflict (user_id) do update set
      date = excluded.date,
      session_count = excluded.session_count,
      streak = excluded.streak,
      last_streak_update = excluded.last_streak_update,
      updated_at = excluded.updated_at;
  end if;

  if payload ? 'streak_history' and jsonb_typeof(payload->'streak_history') = 'array'
     and jsonb_array_length(payload->'streak_history') > 0 then
    insert into public.streak_history as sh (
      user_id, date_key, session_count, goal_met, recorded_at
    )
    select
      uid,
      x.date_key,
      coalesce(x.session_count, 0),
      coalesce(x.goal_met, false),
      coalesce(x.recorded_at, (extract(epoch from now()) * 1000)::bigint)
    from jsonb_to_recordset(payload->'streak_history') as x(
      date_key text,
      session_count integer,
      goal_met boolean,
      recorded_at bigint
    )
    where x.date_key is not null
    on conflict (user_id, date_key) do update set
      session_count = excluded.session_count,
      goal_met = excluded.goal_met,
      recorded_at = excluded.recorded_at;
  end if;

  pref := coalesce(payload->'preferences', '{}'::jsonb);
  if pref <> '{}'::jsonb then
    insert into public.user_preferences as up (
      user_id,
      selected_project_id,
      default_task_view,
      last_task_view,
      task_view_explicit,
      one_thing_task_id,
      one_thing_date,
      custom_quote
    )
    values (
      uid,
      coalesce(pref->>'selected_project_id', '__general__'),
      coalesce(pref->>'default_task_view', 'card'),
      pref->>'last_task_view',
      coalesce((pref->>'task_view_explicit')::boolean, false),
      pref->>'one_thing_task_id',
      pref->>'one_thing_date',
      nullif(trim(pref->>'custom_quote'), '')
    )
    on conflict (user_id) do update set
      selected_project_id = case
        when pref ? 'selected_project_id' then excluded.selected_project_id
        else up.selected_project_id
      end,
      default_task_view = case
        when pref ? 'default_task_view' then excluded.default_task_view
        else up.default_task_view
      end,
      last_task_view = case
        when pref ? 'last_task_view' then excluded.last_task_view
        else up.last_task_view
      end,
      task_view_explicit = case
        when pref ? 'task_view_explicit' then excluded.task_view_explicit
        else up.task_view_explicit
      end,
      one_thing_task_id = case
        when pref ? 'one_thing_task_id' then excluded.one_thing_task_id
        else up.one_thing_task_id
      end,
      one_thing_date = case
        when pref ? 'one_thing_date' then excluded.one_thing_date
        else up.one_thing_date
      end,
      custom_quote = case
        when pref ? 'custom_quote' then excluded.custom_quote
        else up.custom_quote
      end;
  end if;
end;
$$;
