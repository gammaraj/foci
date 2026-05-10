-- Fix foreign keys on invite tables to properly reference user_profiles instead of auth.users
-- This resolves "permission denied for table users" errors when querying invites

-- ══════════════════════════════════════════════════════════════
-- ACCOUNT_INVITES: Fix foreign keys
-- ══════════════════════════════════════════════════════════════

-- Drop existing foreign key to auth.users for owner_id
ALTER TABLE public.account_invites DROP CONSTRAINT IF EXISTS account_invites_owner_id_users_fkey;
ALTER TABLE public.account_invites DROP CONSTRAINT IF EXISTS account_invites_owner_id_fkey;
ALTER TABLE public.account_invites DROP CONSTRAINT IF EXISTS account_invites_owner_profile_fkey;

-- Drop existing foreign key to auth.users for invitee_id  
ALTER TABLE public.account_invites DROP CONSTRAINT IF EXISTS account_invites_invitee_id_users_fkey;
ALTER TABLE public.account_invites DROP CONSTRAINT IF EXISTS account_invites_invitee_id_fkey;
ALTER TABLE public.account_invites DROP CONSTRAINT IF EXISTS account_invites_invitee_profile_fkey;

-- Create new foreign keys that reference user_profiles(user_id)
ALTER TABLE public.account_invites
  ADD CONSTRAINT account_invites_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES public.user_profiles(user_id)
    ON DELETE CASCADE;

ALTER TABLE public.account_invites
  ADD CONSTRAINT account_invites_invitee_id_fkey
    FOREIGN KEY (invitee_id)
    REFERENCES public.user_profiles(user_id)
    ON DELETE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- COLLABORATION_INVITES: Fix foreign keys
-- ══════════════════════════════════════════════════════════════

-- Drop existing foreign key to auth.users for owner_id
ALTER TABLE public.collaboration_invites DROP CONSTRAINT IF EXISTS collaboration_invites_owner_id_users_fkey;
ALTER TABLE public.collaboration_invites DROP CONSTRAINT IF EXISTS collaboration_invites_owner_id_fkey;
ALTER TABLE public.collaboration_invites DROP CONSTRAINT IF EXISTS collaboration_invites_owner_profile_fkey;

-- Drop existing foreign key to auth.users for invitee_id
ALTER TABLE public.collaboration_invites DROP CONSTRAINT IF EXISTS collaboration_invites_invitee_id_users_fkey;
ALTER TABLE public.collaboration_invites DROP CONSTRAINT IF EXISTS collaboration_invites_invitee_id_fkey;
ALTER TABLE public.collaboration_invites DROP CONSTRAINT IF EXISTS collaboration_invites_invitee_profile_fkey;

-- Create new foreign keys that reference user_profiles(user_id)
ALTER TABLE public.collaboration_invites
  ADD CONSTRAINT collaboration_invites_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES public.user_profiles(user_id)
    ON DELETE CASCADE;

ALTER TABLE public.collaboration_invites
  ADD CONSTRAINT collaboration_invites_invitee_id_fkey
    FOREIGN KEY (invitee_id)
    REFERENCES public.user_profiles(user_id)
    ON DELETE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- ACCOUNT_COLLABORATORS: Fix foreign keys
-- ══════════════════════════════════════════════════════════════

-- Drop existing foreign keys to auth.users
ALTER TABLE public.account_collaborators DROP CONSTRAINT IF EXISTS account_collaborators_owner_id_users_fkey;
ALTER TABLE public.account_collaborators DROP CONSTRAINT IF EXISTS account_collaborators_owner_id_fkey;
ALTER TABLE public.account_collaborators DROP CONSTRAINT IF EXISTS account_collaborators_owner_profile_fkey;

ALTER TABLE public.account_collaborators DROP CONSTRAINT IF EXISTS account_collaborators_collaborator_id_users_fkey;
ALTER TABLE public.account_collaborators DROP CONSTRAINT IF EXISTS account_collaborators_collaborator_id_fkey;

-- Create new foreign keys that reference user_profiles(user_id)
ALTER TABLE public.account_collaborators
  ADD CONSTRAINT account_collaborators_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES public.user_profiles(user_id)
    ON DELETE CASCADE;

ALTER TABLE public.account_collaborators
  ADD CONSTRAINT account_collaborators_collaborator_id_fkey
    FOREIGN KEY (collaborator_id)
    REFERENCES public.user_profiles(user_id)
    ON DELETE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- PROJECT_COLLABORATORS: Fix foreign keys
-- ══════════════════════════════════════════════════════════════

-- Drop existing foreign keys to auth.users
ALTER TABLE public.project_collaborators DROP CONSTRAINT IF EXISTS project_collaborators_owner_id_users_fkey;
ALTER TABLE public.project_collaborators DROP CONSTRAINT IF EXISTS project_collaborators_owner_id_fkey;
ALTER TABLE public.project_collaborators DROP CONSTRAINT IF EXISTS project_collaborators_owner_profile_fkey;

ALTER TABLE public.project_collaborators DROP CONSTRAINT IF EXISTS project_collaborators_collaborator_id_users_fkey;
ALTER TABLE public.project_collaborators DROP CONSTRAINT IF EXISTS project_collaborators_collaborator_id_fkey;

-- Create new foreign keys that reference user_profiles(user_id)
ALTER TABLE public.project_collaborators
  ADD CONSTRAINT project_collaborators_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES public.user_profiles(user_id)
    ON DELETE CASCADE;

ALTER TABLE public.project_collaborators
  ADD CONSTRAINT project_collaborators_collaborator_id_fkey
    FOREIGN KEY (collaborator_id)
    REFERENCES public.user_profiles(user_id)
    ON DELETE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- Ensure indexes exist for performance
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_account_invites_owner_id ON public.account_invites(owner_id);
CREATE INDEX IF NOT EXISTS idx_account_invites_invitee_id ON public.account_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_owner_id ON public.collaboration_invites(owner_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_invitee_id ON public.collaboration_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_account_collaborators_owner_id ON public.account_collaborators(owner_id);
CREATE INDEX IF NOT EXISTS idx_account_collaborators_collaborator_id ON public.account_collaborators(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_owner_id ON public.project_collaborators(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_collaborator_id ON public.project_collaborators(collaborator_id);
