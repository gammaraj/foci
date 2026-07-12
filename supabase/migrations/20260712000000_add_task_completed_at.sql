-- When a task was completed (for Done today / completion history)

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS completed_at bigint;

CREATE INDEX IF NOT EXISTS idx_tasks_completed_at
  ON public.tasks(user_id, completed_at)
  WHERE completed_at IS NOT NULL;
