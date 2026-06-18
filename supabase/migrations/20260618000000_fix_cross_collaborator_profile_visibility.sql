-- Fix: collaborators sharing the same project or account could not see
-- each other's profiles. This caused collaborator-list UIs to show incomplete
-- or broken profile data when listing fellow collaborators.

create policy "Fellow project collaborators can view each other's profiles"
  on public.user_profiles
  for select
  using (
    -- Both the viewer and the profile owner are collaborators on the same project
    exists (
      select 1
      from public.project_collaborators pc1
      join public.project_collaborators pc2
        on pc1.project_id = pc2.project_id
       and pc1.owner_id   = pc2.owner_id
      where pc1.collaborator_id = auth.uid()
        and pc2.collaborator_id = user_profiles.user_id
    )
    or
    -- Both are collaborators on the same account
    exists (
      select 1
      from public.account_collaborators ac1
      join public.account_collaborators ac2
        on ac1.owner_id = ac2.owner_id
      where ac1.collaborator_id = auth.uid()
        and ac2.collaborator_id = user_profiles.user_id
    )
  );
