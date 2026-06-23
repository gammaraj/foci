-- Blocked/waiting and someday/maybe task flags

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS someday boolean NOT NULL DEFAULT false;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_not_blocked_and_someday CHECK (NOT (blocked AND someday));

CREATE INDEX IF NOT EXISTS idx_tasks_blocked ON public.tasks(user_id, blocked) WHERE blocked = true;
CREATE INDEX IF NOT EXISTS idx_tasks_someday ON public.tasks(user_id, someday) WHERE someday = true;
