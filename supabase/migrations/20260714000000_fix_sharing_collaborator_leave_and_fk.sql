-- Drop legacy duplicate FK so PostgREST can embed user_profiles unambiguously.
-- Canonical FK is project_collaborators_collaborator_id_fkey (→ user_profiles.user_id).
ALTER TABLE public.project_collaborators
DROP CONSTRAINT IF EXISTS project_collaborators_collaborator_profile_fkey;

-- Collaborators may remove their own access (leave shared project / account).
DROP POLICY IF EXISTS "Collaborators can leave project" ON public.project_collaborators;
CREATE POLICY "Collaborators can leave project"
  ON public.project_collaborators
  FOR DELETE
  USING (auth.uid() = collaborator_id);

DROP POLICY IF EXISTS "Collaborators can leave account" ON public.account_collaborators;
CREATE POLICY "Collaborators can leave account"
  ON public.account_collaborators
  FOR DELETE
  USING (auth.uid() = collaborator_id);
