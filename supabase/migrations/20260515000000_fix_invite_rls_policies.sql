-- Fix RLS policies to use user_profiles instead of auth.users for email lookups

-- Drop existing policies on account_invites
DROP POLICY IF EXISTS "Invitees can view their account invites" ON account_invites;
DROP POLICY IF EXISTS "Invitees can update their account invites" ON account_invites;

-- Drop existing policies on collaboration_invites
DROP POLICY IF EXISTS "Invitees can view their invites" ON collaboration_invites;
DROP POLICY IF EXISTS "Invitees can update their invites" ON collaboration_invites;

-- Recreate account_invites policies using user_profiles
CREATE POLICY "Invitees can view their account invites"
  ON account_invites
  FOR SELECT
  TO public
  USING (
    auth.uid() = invitee_id 
    OR 
    lower(invitee_email) = lower((
      SELECT email 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Invitees can update their account invites"
  ON account_invites
  FOR UPDATE
  TO public
  USING (
    auth.uid() = invitee_id 
    OR 
    lower(invitee_email) = lower((
      SELECT email 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    ))
  );

-- Recreate collaboration_invites policies using user_profiles
CREATE POLICY "Invitees can view their invites"
  ON collaboration_invites
  FOR SELECT
  TO public
  USING (
    auth.uid() = invitee_id 
    OR 
    lower(invitee_email) = lower((
      SELECT email 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Invitees can update their invites"
  ON collaboration_invites
  FOR UPDATE
  TO public
  USING (
    auth.uid() = invitee_id 
    OR 
    lower(invitee_email) = lower((
      SELECT email 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    ))
  );
