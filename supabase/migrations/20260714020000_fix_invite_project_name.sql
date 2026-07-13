-- Pending invitees could not see project names (RLS only allows owners/collaborators).
-- Snapshot the name on the invite and allow invitees to read that project for pending invites.

ALTER TABLE public.collaboration_invites
  ADD COLUMN IF NOT EXISTS project_name text;

UPDATE public.collaboration_invites ci
SET project_name = p.name
FROM public.projects p
WHERE ci.project_name IS NULL
  AND p.id = ci.project_id
  AND p.user_id = ci.owner_id;

-- Invitees may SELECT projects they have a pending invite for (name embed in getReceivedInvites)
DROP POLICY IF EXISTS "Invitees can view pending invite projects" ON public.projects;
CREATE POLICY "Invitees can view pending invite projects"
  ON public.projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.collaboration_invites ci
      WHERE ci.project_id = projects.id
        AND ci.owner_id = projects.user_id
        AND ci.status = 'pending'
        AND ci.expires_at > now()
        AND (
          ci.invitee_id = auth.uid()
          OR lower(ci.invitee_email) = lower(public.current_user_email())
        )
    )
  );

-- Listing of received project invites with names (avoids embed/RLS gaps)
CREATE OR REPLACE FUNCTION public.list_my_received_project_invites()
RETURNS TABLE (
  id uuid,
  project_id text,
  project_name text,
  owner_id uuid,
  owner_email text,
  owner_display_name text,
  role text,
  status text,
  created_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    ci.id,
    ci.project_id,
    coalesce(ci.project_name, p.name, 'Project') AS project_name,
    ci.owner_id,
    up.email AS owner_email,
    up.display_name AS owner_display_name,
    ci.role,
    ci.status,
    ci.created_at,
    ci.expires_at
  FROM public.collaboration_invites ci
  LEFT JOIN public.projects p
    ON p.id = ci.project_id AND p.user_id = ci.owner_id
  LEFT JOIN public.user_profiles up
    ON up.user_id = ci.owner_id
  WHERE ci.status = 'pending'
    AND ci.expires_at > now()
    AND (
      ci.invitee_id = auth.uid()
      OR lower(ci.invitee_email) = lower(public.current_user_email())
    );
$$;

REVOKE ALL ON FUNCTION public.list_my_received_project_invites() FROM public;
GRANT EXECUTE ON FUNCTION public.list_my_received_project_invites() TO authenticated;
