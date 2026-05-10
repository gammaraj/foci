-- Fix foreign key constraints that incorrectly reference user_profiles(id)
-- They should reference user_profiles(user_id) which is the actual primary key

-- Drop and recreate project_collaborators_owner_id_fkey
DO $$ 
BEGIN
  -- Drop if exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'project_collaborators_owner_id_fkey' 
             AND table_name = 'project_collaborators') THEN
    ALTER TABLE project_collaborators 
      DROP CONSTRAINT project_collaborators_owner_id_fkey;
  END IF;
  
  -- Recreate with correct reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'project_collaborators_owner_id_fkey' 
                 AND table_name = 'project_collaborators') THEN
    ALTER TABLE project_collaborators
      ADD CONSTRAINT project_collaborators_owner_id_fkey 
        FOREIGN KEY (owner_id) 
        REFERENCES user_profiles(user_id) 
        ON DELETE CASCADE;
  END IF;
END $$;

-- Drop and recreate account_collaborators_owner_id_fkey
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'account_collaborators_owner_id_fkey' 
             AND table_name = 'account_collaborators') THEN
    ALTER TABLE account_collaborators
      DROP CONSTRAINT account_collaborators_owner_id_fkey;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'account_collaborators_owner_id_fkey' 
                 AND table_name = 'account_collaborators') THEN
    ALTER TABLE account_collaborators
      ADD CONSTRAINT account_collaborators_owner_id_fkey
        FOREIGN KEY (owner_id)
        REFERENCES user_profiles(user_id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- Drop and recreate account_invites_owner_id_fkey
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'account_invites_owner_id_fkey' 
             AND table_name = 'account_invites') THEN
    ALTER TABLE account_invites
      DROP CONSTRAINT account_invites_owner_id_fkey;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'account_invites_owner_id_fkey' 
                 AND table_name = 'account_invites') THEN
    ALTER TABLE account_invites
      ADD CONSTRAINT account_invites_owner_id_fkey
        FOREIGN KEY (owner_id)
        REFERENCES user_profiles(user_id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- Drop and recreate account_invites_invitee_id_fkey
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'account_invites_invitee_id_fkey' 
             AND table_name = 'account_invites') THEN
    ALTER TABLE account_invites
      DROP CONSTRAINT account_invites_invitee_id_fkey;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'account_invites_invitee_id_fkey' 
                 AND table_name = 'account_invites') THEN
    ALTER TABLE account_invites
      ADD CONSTRAINT account_invites_invitee_id_fkey
        FOREIGN KEY (invitee_id)
        REFERENCES user_profiles(user_id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- collaboration_invites_owner_id_fkey
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'collaboration_invites_owner_id_fkey' 
             AND table_name = 'collaboration_invites') THEN
    ALTER TABLE collaboration_invites
      DROP CONSTRAINT collaboration_invites_owner_id_fkey;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'collaboration_invites_owner_id_fkey' 
                 AND table_name = 'collaboration_invites') THEN
    ALTER TABLE collaboration_invites
      ADD CONSTRAINT collaboration_invites_owner_id_fkey
        FOREIGN KEY (owner_id)
        REFERENCES user_profiles(user_id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- collaboration_invites_invitee_id_fkey
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'collaboration_invites_invitee_id_fkey' 
             AND table_name = 'collaboration_invites') THEN
    ALTER TABLE collaboration_invites
      DROP CONSTRAINT collaboration_invites_invitee_id_fkey;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'collaboration_invites_invitee_id_fkey' 
                 AND table_name = 'collaboration_invites') THEN
    ALTER TABLE collaboration_invites
      ADD CONSTRAINT collaboration_invites_invitee_id_fkey
        FOREIGN KEY (invitee_id)
        REFERENCES user_profiles(user_id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_project_collaborators_owner_id 
  ON project_collaborators(owner_id);
CREATE INDEX IF NOT EXISTS idx_account_collaborators_owner_id 
  ON account_collaborators(owner_id);
CREATE INDEX IF NOT EXISTS idx_account_invites_owner_id 
  ON account_invites(owner_id);
CREATE INDEX IF NOT EXISTS idx_account_invites_invitee_id 
  ON account_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_owner_id 
  ON collaboration_invites(owner_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_invitee_id 
  ON collaboration_invites(invitee_id);
