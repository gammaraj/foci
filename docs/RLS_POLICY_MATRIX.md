# Supabase RLS Policy Matrix

> Last updated: September 2026 (after `20260902000000_editors_can_insert_tasks.sql`)

This document describes the **current** Row Level Security policies across all 11 public tables. Collaboration roles are **`viewer`** and **`editor`** only (no admin role).

---

## Core tables (single-user, owner-only access)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `settings` | owner | owner | owner | owner |
| `daily_goal_data` | owner | owner | owner | owner |
| `streak_history` | owner | owner | owner | owner |
| `user_preferences` | owner | owner | owner | owner |

All four use a single `FOR ALL` policy: `auth.uid() = user_id`. Account collaborators **cannot** read these tables — timer settings and streak data are private to the account owner.

---

## Projects & Tasks (shared via collaboration)

| Table | Owner | Project collaborator | Account collaborator |
|-------|-------|----------------------|----------------------|
| `projects` | Full CRUD | SELECT only | SELECT only |
| `tasks` | Full CRUD | SELECT; INSERT + UPDATE if `editor`; no DELETE | SELECT; INSERT + UPDATE if `editor`; no DELETE |

### Active policies

**`projects`**
- `"Owners can manage their own projects"` — `FOR ALL`, `auth.uid() = user_id`
- `"Collaborators can view shared projects"` — `FOR SELECT`, project collaborator membership
- `"Account collaborators can view all owner projects"` — `FOR SELECT`, account collaborator membership

**`tasks`**
- `"Owners can manage their own tasks"` — `FOR ALL`, `auth.uid() = user_id`
- `"Collaborators can view tasks in shared projects"` — `FOR SELECT`, project collaborator membership
- `"Editors can update tasks in shared projects"` — `FOR UPDATE` with `USING` + `WITH CHECK`, `role = 'editor'` in `project_collaborators`
- `"Editors can insert tasks in shared projects"` — `FOR INSERT` with `WITH CHECK`, `role = 'editor'` in `project_collaborators`; `user_id` must be the owner
- `"Account collaborators can view all owner tasks"` — `FOR SELECT`, account collaborator membership
- `"Account editors can update all owner tasks"` — `FOR UPDATE` with `USING` + `WITH CHECK`, `role = 'editor'` in `account_collaborators`
- `"Account editors can insert tasks for owner"` — `FOR INSERT` with `WITH CHECK`, `role = 'editor'` in `account_collaborators` and the project must belong to the owner

A `BEFORE UPDATE` trigger (`protect_non_owner_task_identity`) blocks non-owners from changing `user_id` or `project_id`.

---

## User Profiles

| Policy | Operation | Rule |
|--------|-----------|------|
| `"Users can manage own profile"` | ALL | `auth.uid() = user_id` |
| `"Users can view project collaborator profiles"` | SELECT | Owner can see profiles of their project collaborators |
| `"Users can view account collaborator profiles"` | SELECT | Owner can see profiles of their account collaborators |
| `"Collaborators can view owner profiles"` | SELECT | Collaborator can see profile of any project/account owner they work with |
| `"Invitees can view inviter profiles"` | SELECT | Pending project or account invite from that profile user |
| `"Fellow project collaborators can view each other's profiles"` | SELECT | Both users are collaborators on the same project or account |

Email is **not** client-writable. `protect_user_profile_email` pins `user_profiles.email` to `auth.users.email`. Column grants allow UPDATE of `display_name`, `avatar_url`, and `updated_at` only. Unique index on `lower(email)`. Authorization helpers read email from `auth.users` via `current_user_email()`, not from the profile row.

---

## Project Collaboration tables

| Table | Owner | Collaborator |
|-------|-------|--------------|
| `project_collaborators` | Full CRUD | SELECT own row only (and DELETE own row to leave) |
| `collaboration_invites` | Full CRUD | SELECT invites addressed to them |

### Active policies

**`project_collaborators`**
- `"Owners can manage collaborators"` — `FOR ALL`, `auth.uid() = owner_id`
- `"Collaborators can view their membership"` — `FOR SELECT`, `auth.uid() = collaborator_id`
- CHECK `owner_id <> collaborator_id`

**`collaboration_invites`**
- `"Owners can manage invites"` — `FOR ALL`, `auth.uid() = owner_id`
- `"Invitees can view their invites"` — `FOR SELECT`, `invitee_id` or email match via `current_user_email()`
- Invitees **cannot** UPDATE or INSERT. Decline uses `decline_collaboration_invite`.

---

## Account Collaboration tables

| Table | Owner | Account collaborator |
|-------|-------|----------------------|
| `account_collaborators` | Full CRUD | SELECT own row only (and DELETE own row to leave) |
| `account_invites` | Full CRUD | SELECT invites addressed to them |

### Active policies

**`account_collaborators`**
- `"Owners can manage account collaborators"` — `FOR ALL`, `auth.uid() = owner_id`
- `"Collaborators can view their account access"` — `FOR SELECT`, `auth.uid() = collaborator_id`

**`account_invites`**
- `"Owners can manage account invites"` — `FOR ALL`, `auth.uid() = owner_id`
- `"Invitees can view their account invites"` — `FOR SELECT`, `invitee_id` or email match
- Invitees **cannot** UPDATE. Decline uses `decline_account_invite`.

---

## Invite RPCs

Defined in `20260518000000_accept_invite_rpcs.sql` and replaced/extended in `20260820000000_lock_invites_and_profile_email.sql`:

- `create_collaboration_invite(project_id, email, role)` — owner-only; looks up invitee internally
- `create_account_invite(email, role)` — owner-only; looks up invitee internally
- `accept_collaboration_invite(invite_id)` — caller must match invite email from `auth.users` (and `invitee_id` when set)
- `accept_account_invite(invite_id)` — same
- `decline_collaboration_invite(invite_id)` / `decline_account_invite(invite_id)`

`resolve_invitee_id` is revoked from `anon` / `authenticated` (no email-to-UUID oracle).

`invitee_is_caller` requires `auth.users` email match **and** (`invitee_id` is null or equals `auth.uid()`).

---

## Quick reference — all 11 tables

| Table | RLS Enabled | Policy count |
|-------|:-----------:|:------------:|
| `settings` | Yes | 1 |
| `daily_goal_data` | Yes | 1 |
| `streak_history` | Yes | 1 |
| `user_preferences` | Yes | 1 |
| `projects` | Yes | 3 |
| `tasks` | Yes | 7 |
| `user_profiles` | Yes | 6 |
| `project_collaborators` | Yes | 2 |
| `collaboration_invites` | Yes | 2 |
| `account_collaborators` | Yes | 2 |
| `account_invites` | Yes | 2 |

---

## CI validation

`npm run check:rls-policies` performs a static check against migration SQL files (no live DB required):

- Verifies `ENABLE ROW LEVEL SECURITY` is present for all 11 tables
- Verifies required policies' **last** action is `CREATE`
- Verifies invitee UPDATE policies' last action is `DROP`
- Verifies security markers (invite RPCs, email pin, `WITH CHECK` on editor updates and inserts)

`npm run test:rls` (`supabase test db`) runs live policy tests in `supabase/tests/database/rls.test.sql` against local Supabase. CI job **Live RLS** starts Supabase and runs that suite.

---

## Local integration testing

```bash
npx supabase start
npx supabase test db
```
