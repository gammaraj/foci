-- Foci: Collaboration Schema Migration
-- Adds support for sharing projects with collaborators

-- ── User Profiles ─────────────────────────────────────────────
-- Public profile info for displaying collaborator names/avatars
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  email text not null,
  updated_at timestamptz not null default now()
);

-- ── Project Collaborators ─────────────────────────────────────
-- Tracks who has access to which projects and their permission level
create table if not exists public.project_collaborators (
  id uuid default gen_random_uuid() primary key,
  project_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  collaborator_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  
  -- Composite foreign key to projects table
  foreign key (owner_id, project_id) references public.projects(user_id, id) on delete cascade,
  
  -- Prevent duplicate collaborator entries
  unique(project_id, owner_id, collaborator_id)
);

-- ── Collaboration Invites ─────────────────────────────────────
-- Pending invitations that haven't been accepted yet
create table if not exists public.collaboration_invites (
  id uuid default gen_random_uuid() primary key,
  project_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invitee_email text not null,
  invitee_id uuid references auth.users(id) on delete cascade, -- null until user exists
  role text not null default 'editor' check (role in ('viewer', 'editor')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  
  -- Composite foreign key to projects table
  foreign key (owner_id, project_id) references public.projects(user_id, id) on delete cascade
);

-- Partial unique index: one pending invite per email per project
create unique index if not exists idx_collaboration_invites_pending 
  on public.collaboration_invites(project_id, owner_id, invitee_email) 
  where (status = 'pending');

-- ── Indexes for Performance ───────────────────────────────────
create index if not exists idx_project_collaborators_collaborator 
  on public.project_collaborators(collaborator_id);
create index if not exists idx_project_collaborators_project 
  on public.project_collaborators(project_id, owner_id);
create index if not exists idx_collaboration_invites_email 
  on public.collaboration_invites(invitee_email) where status = 'pending';
create index if not exists idx_collaboration_invites_invitee 
  on public.collaboration_invites(invitee_id) where status = 'pending';

-- ── Populate user_profiles from existing auth.users ───────────
insert into public.user_profiles (user_id, email, display_name, avatar_url)
select 
  id, 
  email,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (user_id) do nothing;

-- ── Trigger: Auto-create profile on signup ────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.user_profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Trigger: Link pending invites when user signs up ──────────
create or replace function public.link_pending_invites()
returns trigger as $$
begin
  update public.collaboration_invites
  set invitee_id = new.id
  where lower(invitee_email) = lower(new.email)
    and invitee_id is null
    and status = 'pending';
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_link_invites on auth.users;

create trigger on_auth_user_created_link_invites
  after insert on auth.users
  for each row execute procedure public.link_pending_invites();

-- ── Row Level Security ────────────────────────────────────────

-- Enable RLS on new tables
alter table public.user_profiles enable row level security;
alter table public.project_collaborators enable row level security;
alter table public.collaboration_invites enable row level security;

-- User Profiles: users can manage own profile, anyone authenticated can view
create policy "Users can manage own profile"
  on public.user_profiles for all using (auth.uid() = user_id);

create policy "Authenticated users can view profiles"
  on public.user_profiles for select using (auth.role() = 'authenticated');

-- Project Collaborators: owners can manage, collaborators can view their membership
create policy "Owners can manage collaborators"
  on public.project_collaborators for all using (auth.uid() = owner_id);

create policy "Collaborators can view their membership"
  on public.project_collaborators for select using (auth.uid() = collaborator_id);

-- Collaboration Invites: owners can manage, invitees can view and update
create policy "Owners can manage invites"
  on public.collaboration_invites for all using (auth.uid() = owner_id);

create policy "Invitees can view their invites"
  on public.collaboration_invites for select using (
    auth.uid() = invitee_id 
    OR lower(invitee_email) = lower((select email from auth.users where id = auth.uid()))
  );

create policy "Invitees can update their invites"
  on public.collaboration_invites for update using (
    auth.uid() = invitee_id
    OR lower(invitee_email) = lower((select email from auth.users where id = auth.uid()))
  );

-- ── Update Projects RLS for Collaboration ─────────────────────

-- Drop existing policy
drop policy if exists "Users can manage their own projects" on public.projects;

-- New policies: owners have full control, collaborators can view
create policy "Owners can manage their own projects"
  on public.projects for all using (auth.uid() = user_id);

create policy "Collaborators can view shared projects"
  on public.projects for select using (
    exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = projects.id 
        and pc.owner_id = projects.user_id
        and pc.collaborator_id = auth.uid()
    )
  );

-- ── Update Tasks RLS for Collaboration ────────────────────────

-- Drop existing policy
drop policy if exists "Users can manage their own tasks" on public.tasks;

-- New policies for tasks
create policy "Owners can manage their own tasks"
  on public.tasks for all using (auth.uid() = user_id);

create policy "Collaborators can view tasks in shared projects"
  on public.tasks for select using (
    exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = tasks.project_id
        and pc.owner_id = tasks.user_id
        and pc.collaborator_id = auth.uid()
    )
  );

create policy "Editors can update tasks in shared projects"
  on public.tasks for update using (
    exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = tasks.project_id
        and pc.owner_id = tasks.user_id
        and pc.collaborator_id = auth.uid()
        and pc.role = 'editor'
    )
  );
