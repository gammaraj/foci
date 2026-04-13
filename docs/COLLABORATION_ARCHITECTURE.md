# Foci Collaboration Architecture

> **Status:** Design Phase  
> **Author:** GitHub Copilot  
> **Date:** April 13, 2026

This document outlines the architecture for adding task collaboration to Foci, enabling users to share tasks and projects with collaborators.

---

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Database Schema](#database-schema)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [API & Storage Layer](#api--storage-layer)
6. [User Flows](#user-flows)
7. [UI Components](#ui-components)
8. [Real-time Sync](#real-time-sync)
9. [Migration Strategy](#migration-strategy)
10. [Implementation Phases](#implementation-phases)

---

## Overview

### Goals
- Allow users to invite collaborators to specific **projects** (not individual tasks)
- Collaborators can view and edit tasks within shared projects
- Maintain Foci's simplicity — no team management overhead
- Preserve the single-user experience for non-shared projects

### Non-Goals (v1)
- Team/workspace management
- Role hierarchies beyond owner/editor/viewer
- Real-time collaborative editing (Google Docs-style)
- Comments or activity feeds
- Mobile push notifications for collaborator changes

---

## Design Principles

1. **Project-level sharing** — Share entire projects, not individual tasks. Simpler mental model.
2. **Invitation-based** — No public links. Collaborators must accept an invite.
3. **Owner control** — Only owners can invite/remove collaborators and delete the project.
4. **Graceful degradation** — If collaboration features fail, personal tasks still work.
5. **Backwards compatible** — Existing users unaffected; collaboration is opt-in.

---

## Database Schema

### New Tables

```sql
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
  foreign key (owner_id, project_id) references public.projects(user_id, id) on delete cascade,
  
  -- One pending invite per email per project
  unique(project_id, owner_id, invitee_email) where (status = 'pending')
);

-- ── User Profiles (for collaborator display) ──────────────────
-- Public profile info for displaying collaborator names/avatars
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  email text not null,
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_project_collaborators_collaborator on public.project_collaborators(collaborator_id);
create index idx_project_collaborators_project on public.project_collaborators(project_id, owner_id);
create index idx_collaboration_invites_email on public.collaboration_invites(invitee_email) where status = 'pending';
create index idx_collaboration_invites_invitee on public.collaboration_invites(invitee_id) where status = 'pending';
```

### Schema Relationships

```
┌─────────────────┐     ┌─────────────────────────┐     ┌─────────────────┐
│   auth.users    │────▶│   project_collaborators │◀────│     projects    │
│                 │     │                         │     │                 │
│  id (owner)     │     │  owner_id               │     │  user_id (PK)   │
│  id (collab)    │     │  collaborator_id        │     │  id (PK)        │
└─────────────────┘     │  project_id             │     └─────────────────┘
        │               │  role                   │              │
        │               └─────────────────────────┘              │
        │                                                        │
        ▼                                                        ▼
┌─────────────────┐                                    ┌─────────────────┐
│  user_profiles  │                                    │      tasks      │
│                 │                                    │                 │
│  display_name   │                                    │  user_id (PK)   │
│  avatar_url     │                                    │  id (PK)        │
│  email          │                                    │  project_id     │
└─────────────────┘                                    └─────────────────┘
```

---

## Row Level Security (RLS)

### Updated Projects Policy

```sql
-- Drop existing policy
drop policy if exists "Users can manage their own projects" on public.projects;

-- New policy: owners OR collaborators can access
create policy "Users can access owned or shared projects"
  on public.projects for select using (
    auth.uid() = user_id  -- owner
    OR exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = id 
        and pc.owner_id = user_id
        and pc.collaborator_id = auth.uid()
    )
  );

-- Only owners can insert/update/delete projects
create policy "Only owners can modify projects"
  on public.projects for insert with check (auth.uid() = user_id);

create policy "Only owners can update projects"
  on public.projects for update using (auth.uid() = user_id);

create policy "Only owners can delete projects"
  on public.projects for delete using (auth.uid() = user_id);
```

### Updated Tasks Policy

```sql
-- Drop existing policy
drop policy if exists "Users can manage their own tasks" on public.tasks;

-- Viewers and editors can SELECT tasks in shared projects
create policy "Users can view tasks in accessible projects"
  on public.tasks for select using (
    auth.uid() = user_id  -- owner's own tasks
    OR exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = tasks.project_id
        and pc.owner_id = tasks.user_id
        and pc.collaborator_id = auth.uid()
    )
  );

-- Only owners can INSERT tasks
create policy "Owners can insert tasks"
  on public.tasks for insert with check (auth.uid() = user_id);

-- Owners OR editors can UPDATE tasks
create policy "Owners and editors can update tasks"
  on public.tasks for update using (
    auth.uid() = user_id
    OR exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = tasks.project_id
        and pc.owner_id = tasks.user_id
        and pc.collaborator_id = auth.uid()
        and pc.role = 'editor'
    )
  );

-- Only owners can DELETE tasks
create policy "Only owners can delete tasks"
  on public.tasks for delete using (auth.uid() = user_id);
```

### Project Collaborators Policy

```sql
alter table public.project_collaborators enable row level security;

-- Owners can manage collaborators
create policy "Owners can manage collaborators"
  on public.project_collaborators for all using (auth.uid() = owner_id);

-- Collaborators can view their own membership
create policy "Collaborators can view their membership"
  on public.project_collaborators for select using (auth.uid() = collaborator_id);
```

### Collaboration Invites Policy

```sql
alter table public.collaboration_invites enable row level security;

-- Owners can manage their invites
create policy "Owners can manage invites"
  on public.collaboration_invites for all using (auth.uid() = owner_id);

-- Invitees can view and update their invites (accept/decline)
create policy "Invitees can view their invites"
  on public.collaboration_invites for select using (
    auth.uid() = invitee_id 
    OR invitee_email = (select email from auth.users where id = auth.uid())
  );

create policy "Invitees can update their invites"
  on public.collaboration_invites for update using (
    auth.uid() = invitee_id
    OR invitee_email = (select email from auth.users where id = auth.uid())
  );
```

### User Profiles Policy

```sql
alter table public.user_profiles enable row level security;

-- Users can manage their own profile
create policy "Users can manage own profile"
  on public.user_profiles for all using (auth.uid() = user_id);

-- Anyone authenticated can view profiles (for collaborator display)
create policy "Authenticated users can view profiles"
  on public.user_profiles for select using (auth.role() = 'authenticated');
```

---

## API & Storage Layer

### Extended StorageAdapter Interface

```typescript
// src/lib/storage/types.ts

export interface CollaboratorInfo {
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'viewer' | 'editor';
  addedAt: string;
}

export interface CollaborationInvite {
  id: string;
  projectId: string;
  projectName: string;
  ownerEmail: string;
  ownerName?: string;
  role: 'viewer' | 'editor';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface StorageAdapter {
  // ... existing methods ...

  // ── Collaboration ─────────────────────────────────────
  
  // Get collaborators for a project (owner only)
  getProjectCollaborators(projectId: string): Promise<CollaboratorInfo[]>;
  
  // Invite a collaborator by email
  inviteCollaborator(projectId: string, email: string, role: 'viewer' | 'editor'): Promise<void>;
  
  // Remove a collaborator
  removeCollaborator(projectId: string, collaboratorId: string): Promise<void>;
  
  // Update collaborator role
  updateCollaboratorRole(projectId: string, collaboratorId: string, role: 'viewer' | 'editor'): Promise<void>;
  
  // Get pending invites I've sent (owner)
  getSentInvites(projectId: string): Promise<CollaborationInvite[]>;
  
  // Cancel a pending invite
  cancelInvite(inviteId: string): Promise<void>;
  
  // Get invites I've received
  getReceivedInvites(): Promise<CollaborationInvite[]>;
  
  // Accept an invite
  acceptInvite(inviteId: string): Promise<void>;
  
  // Decline an invite
  declineInvite(inviteId: string): Promise<void>;
  
  // Get shared projects (projects I collaborate on but don't own)
  getSharedProjects(): Promise<Project[]>;
  
  // Leave a shared project
  leaveProject(projectId: string, ownerId: string): Promise<void>;
}
```

### LocalStorageAdapter

For unauthenticated users, collaboration methods throw an error or return empty arrays:

```typescript
// src/lib/storage/local.ts

class LocalStorageAdapter implements StorageAdapter {
  // Collaboration not available without authentication
  async getProjectCollaborators(): Promise<CollaboratorInfo[]> {
    return [];
  }
  
  async inviteCollaborator(): Promise<void> {
    throw new Error('Sign in to invite collaborators');
  }
  
  // ... etc
}
```

### SupabaseStorageAdapter

```typescript
// src/lib/storage/supabase.ts (additions)

async getProjectCollaborators(projectId: string): Promise<CollaboratorInfo[]> {
  const userId = await this.getUserId();
  
  const { data, error } = await this.supabase
    .from('project_collaborators')
    .select(`
      collaborator_id,
      role,
      created_at,
      user_profiles!collaborator_id (
        email,
        display_name,
        avatar_url
      )
    `)
    .eq('project_id', projectId)
    .eq('owner_id', userId);
    
  if (error) throw error;
  
  return data.map(row => ({
    userId: row.collaborator_id,
    email: row.user_profiles.email,
    displayName: row.user_profiles.display_name,
    avatarUrl: row.user_profiles.avatar_url,
    role: row.role,
    addedAt: row.created_at,
  }));
}

async inviteCollaborator(projectId: string, email: string, role: 'viewer' | 'editor'): Promise<void> {
  const userId = await this.getUserId();
  
  // Check if user exists
  const { data: existingUser } = await this.supabase
    .from('user_profiles')
    .select('user_id')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  
  const { error } = await this.supabase
    .from('collaboration_invites')
    .insert({
      project_id: projectId,
      owner_id: userId,
      invitee_email: email.toLowerCase(),
      invitee_id: existingUser?.user_id ?? null,
      role,
    });
    
  if (error) {
    if (error.code === '23505') { // unique violation
      throw new Error('An invite has already been sent to this email');
    }
    throw error;
  }
  
  // TODO: Send email notification via Supabase Edge Function
}

async acceptInvite(inviteId: string): Promise<void> {
  const userId = await this.getUserId();
  
  // Get invite details
  const { data: invite, error: fetchError } = await this.supabase
    .from('collaboration_invites')
    .select('*')
    .eq('id', inviteId)
    .single();
    
  if (fetchError || !invite) throw new Error('Invite not found');
  if (invite.status !== 'pending') throw new Error('Invite is no longer valid');
  if (new Date(invite.expires_at) < new Date()) throw new Error('Invite has expired');
  
  // Create collaborator entry
  const { error: insertError } = await this.supabase
    .from('project_collaborators')
    .insert({
      project_id: invite.project_id,
      owner_id: invite.owner_id,
      collaborator_id: userId,
      role: invite.role,
    });
    
  if (insertError) throw insertError;
  
  // Update invite status
  await this.supabase
    .from('collaboration_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', inviteId);
}

async getSharedProjects(): Promise<Project[]> {
  const userId = await this.getUserId();
  
  const { data, error } = await this.supabase
    .from('project_collaborators')
    .select(`
      role,
      projects!inner (
        id,
        user_id,
        name,
        description,
        color,
        due_date,
        archived,
        sort_order,
        created_at
      )
    `)
    .eq('collaborator_id', userId);
    
  if (error) throw error;
  
  return data.map(row => ({
    id: row.projects.id,
    name: row.projects.name,
    description: row.projects.description,
    color: row.projects.color,
    dueDate: row.projects.due_date,
    archived: row.projects.archived,
    order: row.projects.sort_order,
    createdAt: row.projects.created_at,
    // Additional metadata for shared projects
    _isShared: true,
    _ownerId: row.projects.user_id,
    _myRole: row.role,
  }));
}
```

---

## User Flows

### Flow 1: Inviting a Collaborator

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Owner opens project settings                                │
│     └── Click "Share" button on project card or in sidebar      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Share dialog opens                                          │
│     ├── Shows current collaborators (if any)                    │
│     ├── Input field for email address                           │
│     └── Role selector: Viewer / Editor                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Owner enters email and clicks "Invite"                      │
│     ├── Validation: valid email format                          │
│     ├── Check: not already a collaborator                       │
│     └── Check: not the owner's own email                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. System creates invite record                                │
│     ├── If user exists: link invitee_id                         │
│     ├── Send email notification (Edge Function)                 │
│     └── Show success toast: "Invite sent to alice@example.com"  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Accepting an Invite

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Invitee receives notification                               │
│     ├── Email with "Accept Invite" link                         │
│     └── OR sees badge on notification bell in app               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Invitee clicks notification / opens invites panel           │
│     └── Shows: "Bob invited you to collaborate on 'Work Tasks'" │
│         with Accept / Decline buttons                           │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  3a. Click "Accept"     │     │  3b. Click "Decline"    │
│  └── Create collaborator│     │  └── Update invite      │
│      entry, show project│     │      status to declined │
└─────────────────────────┘     └─────────────────────────┘
```

### Flow 3: Working with Shared Projects

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar shows:                                                 │
│  ├── MY PROJECTS                                                │
│  │   ├── Work Tasks ★                                           │
│  │   └── Personal                                               │
│  │                                                              │
│  └── SHARED WITH ME                                             │
│      └── Team Sprint 👥 (from bob@...) [Editor]                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Collaborator selects shared project                            │
│  ├── Sees all tasks in that project                             │
│  ├── Can complete/uncomplete tasks (editor)                     │
│  ├── Can edit task details (editor)                             │
│  ├── Cannot create new tasks (owner only)                       │
│  └── Cannot delete tasks (owner only)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## UI Components

### 1. ShareProjectModal

```typescript
// src/components/ShareProjectModal.tsx

interface ShareProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

// Features:
// - Email input with validation
// - Role selector (Viewer/Editor)
// - List of current collaborators with remove button
// - List of pending invites with cancel button
```

### 2. InvitesPanel (in NotificationBell)

```typescript
// Extend existing NotificationBell.tsx

// Add tab or section for collaboration invites:
// - Badge count shows pending invites
// - Each invite shows: project name, owner, role offered
// - Accept/Decline buttons
```

### 3. Sidebar Updates

```typescript
// Update project list in sidebar to show:
// - Separator between "My Projects" and "Shared With Me"
// - Shared projects show owner info and my role
// - Shared indicator icon (👥 or similar)
```

### 4. Task Permissions Indicators

```typescript
// In TaskList.tsx, show visual cues:
// - "View only" badge for viewer role
// - Disable edit controls for viewers
// - Show "Shared project" indicator
```

### Component Hierarchy

```
App
├── Sidebar
│   ├── MyProjects (existing)
│   └── SharedProjects (new section)
│
├── NotificationBell
│   └── InvitesPanel (new)
│
├── TaskList
│   └── (permission-aware rendering)
│
└── Modals
    └── ShareProjectModal (new)
```

---

## Real-time Sync

For v1, use **polling** instead of Supabase Realtime:

```typescript
// Poll for updates every 30 seconds when viewing a shared project
useEffect(() => {
  if (!isSharedProject) return;
  
  const interval = setInterval(() => {
    refreshTasks();
  }, 30000);
  
  return () => clearInterval(interval);
}, [isSharedProject]);
```

### Future Enhancement (v2)
Use Supabase Realtime subscriptions for instant updates:

```typescript
const subscription = supabase
  .channel(`project:${projectId}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'tasks',
    filter: `project_id=eq.${projectId}`
  }, handleChange)
  .subscribe();
```

---

## Migration Strategy

### Migration File: `20260414000000_add_collaboration.sql`

```sql
-- 1. Create new tables
-- (see Database Schema section above)

-- 2. Create user_profiles from existing auth.users
insert into public.user_profiles (user_id, email, display_name)
select id, email, raw_user_meta_data->>'full_name'
from auth.users
on conflict (user_id) do nothing;

-- 3. Create trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Update RLS policies
-- (see RLS section above)
```

### Rollback Plan

```sql
-- Drop new tables (safe - no data loss for existing features)
drop table if exists public.project_collaborators cascade;
drop table if exists public.collaboration_invites cascade;
drop table if exists public.user_profiles cascade;

-- Restore original RLS policies
-- (keep original policies as backup before migration)
```

---

## Implementation Phases

### Phase 1: Foundation (3-4 days)
- [ ] Database migration with new tables
- [ ] Updated RLS policies
- [ ] User profiles table + auto-creation trigger
- [ ] Extended StorageAdapter interface
- [ ] SupabaseStorageAdapter collaboration methods

### Phase 2: Core UI (3-4 days)
- [ ] ShareProjectModal component
- [ ] Sidebar "Shared With Me" section
- [ ] Permission-aware task rendering
- [ ] InvitesPanel in NotificationBell

### Phase 3: Invite Flow (2-3 days)
- [ ] Invite creation and validation
- [ ] Accept/decline functionality
- [ ] Email notifications (Supabase Edge Function)
- [ ] Pending invites management

### Phase 4: Polish (2-3 days)
- [ ] Loading states and error handling
- [ ] Offline support considerations
- [ ] Tests (unit + e2e for invite flow)
- [ ] Documentation

### Total Estimate: 10-14 days

---

## Security Considerations

1. **RLS is the primary access control** — all queries go through Supabase client
2. **Email enumeration** — don't reveal if an email exists in the system
3. **Invite expiration** — 7-day expiry prevents stale invites
4. **Rate limiting** — limit invite creation (e.g., 10/hour per user)
5. **Owner verification** — always verify ownership server-side before operations

---

## Open Questions

1. **Can editors create tasks?** Current design: No (only owners). Should this change?
2. **Notifications for task changes?** Not in v1, but consider for v2
3. **Maximum collaborators per project?** Suggest limit of 10 for v1
4. **What happens when owner deletes their account?** Cascade delete all shared access

---

## Appendix: Type Definitions

```typescript
// Extended Project type for shared projects
interface SharedProject extends Project {
  _isShared: true;
  _ownerId: string;
  _ownerEmail: string;
  _ownerName?: string;
  _myRole: 'viewer' | 'editor';
}

// Discriminated union for sidebar rendering
type ProjectListItem = Project | SharedProject;

function isSharedProject(p: ProjectListItem): p is SharedProject {
  return '_isShared' in p && p._isShared === true;
}
```
