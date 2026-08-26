-- Operator user list for /admin. Keep the email allowlist in sync with src/lib/admin.ts.

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  task_count integer,
  streak integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF lower(trim(coalesce(public.current_user_email(), ''))) NOT IN (
    'gangabathina@gmail.com'
  ) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    up.display_name,
    u.last_sign_in_at,
    u.created_at,
    coalesce(t.task_count, 0)::integer,
    coalesce(d.streak, 0)::integer
  FROM auth.users u
  LEFT JOIN public.user_profiles up ON up.user_id = u.id
  LEFT JOIN (
    SELECT tasks.user_id, count(*)::integer AS task_count
    FROM public.tasks
    GROUP BY tasks.user_id
  ) t ON t.user_id = u.id
  LEFT JOIN public.daily_goal_data d ON d.user_id = u.id
  WHERE u.email IS NOT NULL
  ORDER BY u.last_sign_in_at DESC NULLS LAST, u.created_at DESC
  LIMIT 200;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
