-- Pin favorite projects to the front of the project tab bar
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;
