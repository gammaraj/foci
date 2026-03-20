-- Add color, due_date, archived, and order columns to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS due_date text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sort_order integer;
