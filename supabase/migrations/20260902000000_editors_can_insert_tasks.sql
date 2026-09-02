-- Editors may INSERT tasks owned by the project/account owner.
-- user_id stays the owner's; viewers still cannot write; delete stays owner-only.

DROP POLICY IF EXISTS "Editors can insert tasks in shared projects" ON public.tasks;
CREATE POLICY "Editors can insert tasks in shared projects"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = tasks.project_id
        AND pc.owner_id = tasks.user_id
        AND pc.collaborator_id = auth.uid()
        AND pc.role = 'editor'
    )
  );

DROP POLICY IF EXISTS "Account editors can insert tasks for owner" ON public.tasks;
CREATE POLICY "Account editors can insert tasks for owner"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_collaborators ac
      WHERE ac.owner_id = tasks.user_id
        AND ac.collaborator_id = auth.uid()
        AND ac.role = 'editor'
    )
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.user_id = tasks.user_id
        AND p.id = tasks.project_id
    )
  );
