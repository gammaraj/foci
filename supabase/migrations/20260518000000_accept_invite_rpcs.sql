-- Secure invite acceptance: invitees cannot INSERT collaborators directly due to RLS

create or replace function public.accept_collaboration_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.collaboration_invites%rowtype;
  caller_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv from public.collaboration_invites where id = invite_id;
  if not found then
    raise exception 'Invite not found';
  end if;
  if inv.status <> 'pending' then
    raise exception 'Invite is no longer valid';
  end if;
  if inv.expires_at < now() then
    raise exception 'Invite has expired';
  end if;

  select email into caller_email
  from public.user_profiles
  where user_id = auth.uid();

  if inv.invitee_id is distinct from auth.uid()
     and (caller_email is null or lower(inv.invitee_email) <> lower(caller_email)) then
    raise exception 'Unauthorized';
  end if;

  insert into public.project_collaborators (project_id, owner_id, collaborator_id, role)
  values (inv.project_id, inv.owner_id, auth.uid(), inv.role)
  on conflict (project_id, owner_id, collaborator_id) do nothing;

  update public.collaboration_invites
  set status = 'accepted', accepted_at = now(), invitee_id = auth.uid()
  where id = invite_id;
end;
$$;

create or replace function public.accept_account_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.account_invites%rowtype;
  caller_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv from public.account_invites where id = invite_id;
  if not found then
    raise exception 'Invite not found';
  end if;
  if inv.status <> 'pending' then
    raise exception 'Invite is no longer pending';
  end if;
  if inv.expires_at < now() then
    raise exception 'Invite has expired';
  end if;

  select email into caller_email
  from public.user_profiles
  where user_id = auth.uid();

  if inv.invitee_id is distinct from auth.uid()
     and (caller_email is null or lower(inv.invitee_email) <> lower(caller_email)) then
    raise exception 'Unauthorized';
  end if;

  insert into public.account_collaborators (owner_id, collaborator_id, role)
  values (inv.owner_id, auth.uid(), inv.role)
  on conflict (owner_id, collaborator_id) do nothing;

  update public.account_invites
  set status = 'accepted', accepted_at = now(), invitee_id = auth.uid()
  where id = invite_id;
end;
$$;

revoke all on function public.accept_collaboration_invite(uuid) from public;
revoke all on function public.accept_account_invite(uuid) from public;
grant execute on function public.accept_collaboration_invite(uuid) to authenticated;
grant execute on function public.accept_account_invite(uuid) to authenticated;
