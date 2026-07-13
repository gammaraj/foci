-- Drop legacy duplicate FK so PostgREST can embed user_profiles unambiguously.
-- Canonical FK is account_collaborators_collaborator_id_fkey (→ user_profiles.user_id).

ALTER TABLE public.account_collaborators
DROP CONSTRAINT IF EXISTS account_collaborators_collaborator_profile_fkey;
