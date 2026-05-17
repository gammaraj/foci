-- Security hardening: restrict user_profiles visibility and add invite helper RPC

-- Remove overly permissive profile visibility policies
drop policy if exists "Authenticated users can view profiles" on public.user_profiles;
drop policy if exists "Authenticated users can view all profiles" on public.user_profiles;

-- Collaborators can view profiles of project/account owners they work with
create policy "Collaborators can view owner profiles"
  on public.user_profiles
  for select
  using (
    exists (
      select 1 from public.project_collaborators pc
      where pc.owner_id = user_profiles.user_id
        and pc.collaborator_id = auth.uid()
    )
    or exists (
      select 1 from public.account_collaborators ac
      where ac.owner_id = user_profiles.user_id
        and ac.collaborator_id = auth.uid()
    )
  );

-- Invitees can view profiles of users who sent them a pending invite
create policy "Invitees can view inviter profiles"
  on public.user_profiles
  for select
  using (
    exists (
      select 1 from public.collaboration_invites ci
      where ci.owner_id = user_profiles.user_id
        and ci.status = 'pending'
        and (
          ci.invitee_id = auth.uid()
          or lower(ci.invitee_email) = lower((
            select up.email from public.user_profiles up where up.user_id = auth.uid()
          ))
        )
    )
    or exists (
      select 1 from public.account_invites ai
      where ai.owner_id = user_profiles.user_id
        and ai.status = 'pending'
        and (
          ai.invitee_id = auth.uid()
          or lower(ai.invitee_email) = lower((
            select up.email from public.user_profiles up where up.user_id = auth.uid()
          ))
        )
    )
  );

-- Resolve invitee user id by email (for invite flows only; avoids global profile SELECT)
create or replace function public.resolve_invitee_id(invitee_email text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select user_id
  from public.user_profiles
  where lower(email) = lower(trim(invitee_email))
  limit 1;
$$;

revoke all on function public.resolve_invitee_id(text) from public;
grant execute on function public.resolve_invitee_id(text) to authenticated;
