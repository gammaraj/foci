-- Add priority field to tasks table
-- Priority: 1 (High), 2 (Medium), 3 (Low), NULL (None/default)

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS priority smallint;

-- Add a check constraint to ensure valid priority values
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_priority_check CHECK (priority IS NULL OR priority IN (1, 2, 3));

-- Create an index for faster filtering by priority
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(user_id, priority) WHERE priority IS NOT NULL;
