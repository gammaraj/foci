-- Fix RLS for account sharing profile lookups

-- Drop and recreate the view profiles policy to be more explicit
drop policy if exists "Authenticated users can view profiles" on public.user_profiles;

-- Allow authenticated users to view all profiles (needed for joins)
create policy "Authenticated users can view all profiles"
  on public.user_profiles 
  for select 
  using (auth.role() = 'authenticated');

-- Also allow viewing profiles in context of account collaborations
create policy "Users can view account collaborator profiles"
  on public.user_profiles 
  for select
  using (
    exists (
      select 1 from public.account_collaborators ac
      where ac.collaborator_id = user_profiles.user_id
      and ac.owner_id = auth.uid()
    )
  );

-- Allow viewing profiles in context of project collaborations
create policy "Users can view project collaborator profiles"
  on public.user_profiles 
  for select
  using (
    exists (
      select 1 from public.project_collaborators pc
      where pc.collaborator_id = user_profiles.user_id
      and pc.owner_id = auth.uid()
    )
  );
