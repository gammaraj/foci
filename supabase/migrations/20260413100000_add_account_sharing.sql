-- Foci: Account-Level Sharing Migration
-- Allows sharing ALL projects (current and future) with a collaborator

-- ── Account Collaborators ─────────────────────────────────────
-- Tracks account-level sharing where all projects are shared
create table if not exists public.account_collaborators (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  collaborator_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  
  -- Prevent duplicate entries
  unique(owner_id, collaborator_id),
  -- Prevent self-sharing
  check (owner_id != collaborator_id)
);

-- ── Account Invites ───────────────────────────────────────────
-- Pending account-level invitations
create table if not exists public.account_invites (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invitee_email text not null,
  invitee_id uuid references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('viewer', 'editor')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);

-- Partial unique index: one pending invite per email per owner
create unique index if not exists idx_account_invites_pending 
  on public.account_invites(owner_id, invitee_email) 
  where (status = 'pending');

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists idx_account_collaborators_collaborator 
  on public.account_collaborators(collaborator_id);
create index if not exists idx_account_invites_email 
  on public.account_invites(invitee_email) where status = 'pending';
create index if not exists idx_account_invites_invitee 
  on public.account_invites(invitee_id) where status = 'pending';

-- ── Link pending account invites on signup ────────────────────
create or replace function public.link_pending_account_invites()
returns trigger as $$
begin
  update public.account_invites
  set invitee_id = new.id
  where lower(invitee_email) = lower(new.email)
    and invitee_id is null
    and status = 'pending';
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_link_account_invites on auth.users;

create trigger on_auth_user_created_link_account_invites
  after insert on auth.users
  for each row execute procedure public.link_pending_account_invites();

-- ── Row Level Security ────────────────────────────────────────

alter table public.account_collaborators enable row level security;
alter table public.account_invites enable row level security;

-- Account Collaborators: owners can manage, collaborators can view
create policy "Owners can manage account collaborators"
  on public.account_collaborators for all using (auth.uid() = owner_id);

create policy "Collaborators can view their account access"
  on public.account_collaborators for select using (auth.uid() = collaborator_id);

-- Account Invites: owners can manage, invitees can view and update
create policy "Owners can manage account invites"
  on public.account_invites for all using (auth.uid() = owner_id);

create policy "Invitees can view their account invites"
  on public.account_invites for select using (
    auth.uid() = invitee_id 
    OR lower(invitee_email) = lower((select email from auth.users where id = auth.uid()))
  );

create policy "Invitees can update their account invites"
  on public.account_invites for update using (
    auth.uid() = invitee_id
    OR lower(invitee_email) = lower((select email from auth.users where id = auth.uid()))
  );

-- ── Update Projects RLS for Account-Level Sharing ─────────────

-- Add policy for account-level collaborators to view all projects
create policy "Account collaborators can view all owner projects"
  on public.projects for select using (
    exists (
      select 1 from public.account_collaborators ac
      where ac.owner_id = projects.user_id
        and ac.collaborator_id = auth.uid()
    )
  );

-- ── Update Tasks RLS for Account-Level Sharing ────────────────

-- Add policy for account-level collaborators to view all tasks
create policy "Account collaborators can view all owner tasks"
  on public.tasks for select using (
    exists (
      select 1 from public.account_collaborators ac
      where ac.owner_id = tasks.user_id
        and ac.collaborator_id = auth.uid()
    )
  );

-- Add policy for account-level editors to update tasks
create policy "Account editors can update all owner tasks"
  on public.tasks for update using (
    exists (
      select 1 from public.account_collaborators ac
      where ac.owner_id = tasks.user_id
        and ac.collaborator_id = auth.uid()
        and ac.role = 'editor'
    )
  );
