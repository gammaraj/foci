-- Lightweight task content type (task | note | question)

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'task';

ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_kind_check;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_kind_check CHECK (kind IN ('task', 'note', 'question'));

CREATE INDEX IF NOT EXISTS idx_tasks_kind ON public.tasks(user_id, kind) WHERE kind <> 'task';
