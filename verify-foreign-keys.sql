-- Verify all foreign keys to user_profiles exist
-- Run this in Supabase SQL Editor to confirm the migrations worked

SELECT 
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('project_collaborators', 'account_collaborators', 'collaboration_invites', 'account_invites')
  AND ccu.table_name = 'user_profiles'
ORDER BY tc.table_name, tc.constraint_name;

-- Expected results:
-- project_collaborators_owner_profile_fkey (owner_id → user_profiles.user_id)
-- account_collaborators_owner_profile_fkey (owner_id → user_profiles.user_id)
-- collaboration_invites_owner_id_fkey (owner_id → user_profiles.user_id)
-- collaboration_invites_invitee_id_fkey (invitee_id → user_profiles.user_id)
-- account_invites_owner_profile_fkey (owner_id → user_profiles.user_id)
-- account_invites_invitee_profile_fkey (invitee_id → user_profiles.user_id)
