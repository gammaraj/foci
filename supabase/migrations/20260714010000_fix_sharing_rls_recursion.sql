-- Fix RLS recursion that breaks account sharing UI:
-- account_invites invitee policies SELECT user_profiles,
-- while user_profiles invitee policies SELECT account_invites.
-- That loop makes pending-invite loads fail and can blank collaborator embeds.

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT email
  FROM public.user_profiles
  WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_user_email() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;

-- Owner-safe collaborator listing (joins profiles without client-side embed/RLS pitfalls)
CREATE OR REPLACE FUNCTION public.list_my_account_collaborators()
RETURNS TABLE (
  collaborator_id uuid,
  role text,
  created_at timestamptz,
  email text,
  display_name text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    ac.collaborator_id,
    ac.role,
    ac.created_at,
    up.email,
    up.display_name,
    up.avatar_url
  FROM public.account_collaborators ac
  LEFT JOIN public.user_profiles up ON up.user_id = ac.collaborator_id
  WHERE ac.owner_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.list_my_account_collaborators() FROM public;
GRANT EXECUTE ON FUNCTION public.list_my_account_collaborators() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_my_project_collaborators(p_project_id text)
RETURNS TABLE (
  collaborator_id uuid,
  role text,
  created_at timestamptz,
  email text,
  display_name text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    pc.collaborator_id,
    pc.role,
    pc.created_at,
    up.email,
    up.display_name,
    up.avatar_url
  FROM public.project_collaborators pc
  LEFT JOIN public.user_profiles up ON up.user_id = pc.collaborator_id
  WHERE pc.owner_id = auth.uid()
    AND pc.project_id = p_project_id;
$$;

REVOKE ALL ON FUNCTION public.list_my_project_collaborators(text) FROM public;
GRANT EXECUTE ON FUNCTION public.list_my_project_collaborators(text) TO authenticated;

-- Re-create invitee policies using security definer email lookup (no RLS recursion)
DROP POLICY IF EXISTS "Invitees can view their account invites" ON public.account_invites;
CREATE POLICY "Invitees can view their account invites"
  ON public.account_invites
  FOR SELECT
  USING (
    auth.uid() = invitee_id
    OR lower(invitee_email) = lower(public.current_user_email())
  );

DROP POLICY IF EXISTS "Invitees can update their account invites" ON public.account_invites;
CREATE POLICY "Invitees can update their account invites"
  ON public.account_invites
  FOR UPDATE
  USING (
    auth.uid() = invitee_id
    OR lower(invitee_email) = lower(public.current_user_email())
  );

DROP POLICY IF EXISTS "Invitees can view their invites" ON public.collaboration_invites;
CREATE POLICY "Invitees can view their invites"
  ON public.collaboration_invites
  FOR SELECT
  USING (
    auth.uid() = invitee_id
    OR lower(invitee_email) = lower(public.current_user_email())
  );

DROP POLICY IF EXISTS "Invitees can update their invites" ON public.collaboration_invites;
CREATE POLICY "Invitees can update their invites"
  ON public.collaboration_invites
  FOR UPDATE
  USING (
    auth.uid() = invitee_id
    OR lower(invitee_email) = lower(public.current_user_email())
  );

-- Ensure owners can still read collaborator profiles (re-assert after hardening)
DROP POLICY IF EXISTS "Users can view account collaborator profiles" ON public.user_profiles;
CREATE POLICY "Users can view account collaborator profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.account_collaborators ac
      WHERE ac.collaborator_id = user_profiles.user_id
        AND ac.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view project collaborator profiles" ON public.user_profiles;
CREATE POLICY "Users can view project collaborator profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.collaborator_id = user_profiles.user_id
        AND pc.owner_id = auth.uid()
    )
  );

-- Avoid recursion in invitee→inviter profile policy too
DROP POLICY IF EXISTS "Invitees can view inviter profiles" ON public.user_profiles;
CREATE POLICY "Invitees can view inviter profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collaboration_invites ci
      WHERE ci.owner_id = user_profiles.user_id
        AND ci.status = 'pending'
        AND (
          ci.invitee_id = auth.uid()
          OR lower(ci.invitee_email) = lower(public.current_user_email())
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.account_invites ai
      WHERE ai.owner_id = user_profiles.user_id
        AND ai.status = 'pending'
        AND (
          ai.invitee_id = auth.uid()
          OR lower(ai.invitee_email) = lower(public.current_user_email())
        )
    )
  );
