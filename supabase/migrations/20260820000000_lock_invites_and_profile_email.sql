-- Security: stop invite retargeting, profile-email spoofing, and email enumeration.
-- Invitees may no longer UPDATE invite rows; accept/decline go through RPCs.
-- Profile email is pinned to auth.users. Invite lookup stays server-side.

-- ── Auth email for authorization (never user_profiles.email) ───────────────

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT email::text
  FROM auth.users
  WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.invitee_is_caller(p_invitee_id uuid, p_invitee_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND public.current_user_email() IS NOT NULL
    AND lower(trim(p_invitee_email)) = lower(public.current_user_email())
    AND (p_invitee_id IS NULL OR p_invitee_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.invitee_is_caller(uuid, text) FROM public;

-- ── Pin profile email to auth.users ────────────────────────────────────────

UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.user_id = au.id
  AND au.email IS NOT NULL
  AND up.email IS DISTINCT FROM au.email;

CREATE OR REPLACE FUNCTION public.protect_user_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_email text;
BEGIN
  SELECT email::text INTO auth_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF auth_email IS NOT NULL THEN
    NEW.email := auth_email;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.email := OLD.email;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_profile_email ON public.user_profiles;
CREATE TRIGGER protect_user_profile_email
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_user_profile_email();

CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
  SET email = NEW.email, updated_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE PROCEDURE public.handle_user_email_change();

-- Break remaining duplicate emails (spoofed rows) so the unique index can apply
UPDATE public.user_profiles up
SET email = split_part(up.email, '@', 1) || '+dup-' || replace(up.user_id::text, '-', '') || '@' || split_part(up.email, '@', 2)
WHERE up.user_id IN (
  SELECT user_id FROM (
    SELECT user_id, row_number() OVER (PARTITION BY lower(email) ORDER BY user_id) AS rn
    FROM public.user_profiles
  ) d
  WHERE d.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_lower_key
  ON public.user_profiles (lower(email));

REVOKE UPDATE ON TABLE public.user_profiles FROM anon, authenticated, public;
GRANT UPDATE (display_name, avatar_url, updated_at) ON TABLE public.user_profiles TO authenticated;

-- ── Pin search_path on signup triggers ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.user_profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_pending_invites()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.collaboration_invites
  SET invitee_id = NEW.id
  WHERE lower(invitee_email) = lower(NEW.email)
    AND invitee_id IS NULL
    AND status = 'pending';
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_pending_account_invites()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.account_invites
  SET invitee_id = NEW.id
  WHERE lower(invitee_email) = lower(NEW.email)
    AND invitee_id IS NULL
    AND status = 'pending';
  RETURN NEW;
END;
$$;

-- ── Invitees cannot UPDATE invite rows ─────────────────────────────────────

DROP POLICY IF EXISTS "Invitees can update their invites" ON public.collaboration_invites;
DROP POLICY IF EXISTS "Invitees can update their account invites" ON public.account_invites;

-- ── Editors cannot reassign task owner or project ──────────────────────────

CREATE OR REPLACE FUNCTION public.protect_non_owner_task_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_id = auth.uid() THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.project_id IS DISTINCT FROM OLD.project_id THEN
    RAISE EXCEPTION 'Editors cannot change task owner or project';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_non_owner_task_identity ON public.tasks;
CREATE TRIGGER protect_non_owner_task_identity
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_non_owner_task_identity();

DROP POLICY IF EXISTS "Editors can update tasks in shared projects" ON public.tasks;
CREATE POLICY "Editors can update tasks in shared projects"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = tasks.project_id
        AND pc.owner_id = tasks.user_id
        AND pc.collaborator_id = auth.uid()
        AND pc.role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = tasks.project_id
        AND pc.owner_id = tasks.user_id
        AND pc.collaborator_id = auth.uid()
        AND pc.role = 'editor'
    )
  );

DROP POLICY IF EXISTS "Account editors can update all owner tasks" ON public.tasks;
CREATE POLICY "Account editors can update all owner tasks"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.account_collaborators ac
      WHERE ac.owner_id = tasks.user_id
        AND ac.collaborator_id = auth.uid()
        AND ac.role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_collaborators ac
      WHERE ac.owner_id = tasks.user_id
        AND ac.collaborator_id = auth.uid()
        AND ac.role = 'editor'
    )
  );

DELETE FROM public.project_collaborators WHERE owner_id = collaborator_id;
ALTER TABLE public.project_collaborators
  DROP CONSTRAINT IF EXISTS project_collaborators_no_self;
ALTER TABLE public.project_collaborators
  ADD CONSTRAINT project_collaborators_no_self CHECK (owner_id <> collaborator_id);

-- ── Accept / decline RPCs (auth.users email, immutable invite target) ──────

CREATE OR REPLACE FUNCTION public.accept_collaboration_invite(invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.collaboration_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv FROM public.collaboration_invites WHERE id = invite_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;
  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Invite is no longer valid';
  END IF;
  IF inv.expires_at < now() THEN
    RAISE EXCEPTION 'Invite has expired';
  END IF;
  IF inv.owner_id = auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF NOT public.invitee_is_caller(inv.invitee_id, inv.invitee_email) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.project_collaborators (project_id, owner_id, collaborator_id, role)
  VALUES (inv.project_id, inv.owner_id, auth.uid(), inv.role)
  ON CONFLICT (project_id, owner_id, collaborator_id) DO NOTHING;

  UPDATE public.collaboration_invites
  SET status = 'accepted', accepted_at = now(), invitee_id = auth.uid()
  WHERE id = invite_id
    AND owner_id = inv.owner_id
    AND project_id = inv.project_id
    AND role = inv.role
    AND lower(invitee_email) = lower(inv.invitee_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_account_invite(invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.account_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv FROM public.account_invites WHERE id = invite_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;
  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Invite is no longer pending';
  END IF;
  IF inv.expires_at < now() THEN
    RAISE EXCEPTION 'Invite has expired';
  END IF;
  IF inv.owner_id = auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF NOT public.invitee_is_caller(inv.invitee_id, inv.invitee_email) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.account_collaborators (owner_id, collaborator_id, role)
  VALUES (inv.owner_id, auth.uid(), inv.role)
  ON CONFLICT (owner_id, collaborator_id) DO NOTHING;

  UPDATE public.account_invites
  SET status = 'accepted', accepted_at = now(), invitee_id = auth.uid()
  WHERE id = invite_id
    AND owner_id = inv.owner_id
    AND role = inv.role
    AND lower(invitee_email) = lower(inv.invitee_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_collaboration_invite(invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.collaboration_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv FROM public.collaboration_invites WHERE id = invite_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;
  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Invite is no longer valid';
  END IF;
  IF NOT public.invitee_is_caller(inv.invitee_id, inv.invitee_email) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.collaboration_invites
  SET status = 'declined', invitee_id = auth.uid()
  WHERE id = invite_id
    AND status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_account_invite(invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.account_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv FROM public.account_invites WHERE id = invite_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;
  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Invite is no longer valid';
  END IF;
  IF NOT public.invitee_is_caller(inv.invitee_id, inv.invitee_email) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.account_invites
  SET status = 'declined', invitee_id = auth.uid()
  WHERE id = invite_id
    AND status = 'pending';
END;
$$;

REVOKE ALL ON FUNCTION public.decline_collaboration_invite(uuid) FROM public;
REVOKE ALL ON FUNCTION public.decline_account_invite(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.decline_collaboration_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_account_invite(uuid) TO authenticated;

-- ── Create-invite RPCs (no client-visible email → user_id lookup) ──────────

CREATE OR REPLACE FUNCTION public.create_collaboration_invite(
  p_project_id text,
  p_invitee_email text,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
  invitee uuid;
  project_label text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_role IS NULL OR p_role NOT IN ('viewer', 'editor') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  normalized := lower(trim(p_invitee_email));
  IF normalized IS NULL OR normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF normalized = lower(public.current_user_email()) THEN
    RAISE EXCEPTION 'You cannot invite yourself';
  END IF;

  SELECT name INTO project_label
  FROM public.projects
  WHERE id = p_project_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  SELECT user_id INTO invitee
  FROM public.user_profiles
  WHERE lower(email) = normalized
  LIMIT 1;

  IF invitee IS NOT NULL AND invitee = auth.uid() THEN
    RAISE EXCEPTION 'You cannot invite yourself';
  END IF;

  INSERT INTO public.collaboration_invites (
    project_id, owner_id, invitee_email, invitee_id, project_name, role
  ) VALUES (
    p_project_id, auth.uid(), normalized, invitee, project_label, p_role
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'An invite is already pending for this email';
END;
$$;

CREATE OR REPLACE FUNCTION public.create_account_invite(
  p_invitee_email text,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
  invitee uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_role IS NULL OR p_role NOT IN ('viewer', 'editor') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  normalized := lower(trim(p_invitee_email));
  IF normalized IS NULL OR normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF normalized = lower(public.current_user_email()) THEN
    RAISE EXCEPTION 'You cannot share your account with yourself';
  END IF;

  SELECT user_id INTO invitee
  FROM public.user_profiles
  WHERE lower(email) = normalized
  LIMIT 1;

  IF invitee IS NOT NULL THEN
    IF invitee = auth.uid() THEN
      RAISE EXCEPTION 'You cannot share your account with yourself';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.account_collaborators
      WHERE owner_id = auth.uid() AND collaborator_id = invitee
    ) THEN
      RAISE EXCEPTION 'This user already has access to your account';
    END IF;
  END IF;

  INSERT INTO public.account_invites (owner_id, invitee_email, invitee_id, role)
  VALUES (auth.uid(), normalized, invitee, p_role);
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'An invite is already pending for this email';
END;
$$;

REVOKE ALL ON FUNCTION public.create_collaboration_invite(text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.create_account_invite(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_collaboration_invite(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_account_invite(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.resolve_invitee_id(text) FROM PUBLIC, anon, authenticated;
