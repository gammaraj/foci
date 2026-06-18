# Supabase RLS Policy Matrix

> Last updated: June 2026 (after `20260618000000_fix_cross_collaborator_profile_visibility.sql`)

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
| `tasks` | Full CRUD | SELECT; UPDATE if `editor` | SELECT; UPDATE if `editor` |

### Active policies

**`projects`**
- `"Owners can manage their own projects"` — `FOR ALL`, `auth.uid() = user_id`
- `"Collaborators can view shared projects"` — `FOR SELECT`, project collaborator membership
- `"Account collaborators can view all owner projects"` — `FOR SELECT`, account collaborator membership

**`tasks`**
- `"Owners can manage their own tasks"` — `FOR ALL`, `auth.uid() = user_id`
- `"Collaborators can view tasks in shared projects"` — `FOR SELECT`, project collaborator membership
- `"Editors can update tasks in shared projects"` — `FOR UPDATE`, `role = 'editor'` in `project_collaborators`
- `"Account collaborators can view all owner tasks"` — `FOR SELECT`, account collaborator membership
- `"Account editors can update all owner tasks"` — `FOR UPDATE`, `role = 'editor'` in `account_collaborators`

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

> The global `"Authenticated users can view all profiles"` policy was removed in `20260517000000_security_hardening.sql`. Email lookup for invites uses the `resolve_invitee_id(email)` SECURITY DEFINER RPC.

---

## Project Collaboration tables

| Table | Owner | Collaborator |
|-------|-------|--------------|
| `project_collaborators` | Full CRUD | SELECT own row only |
| `collaboration_invites` | Full CRUD | SELECT + UPDATE invites addressed to them |

### Active policies

**`project_collaborators`**
- `"Owners can manage collaborators"` — `FOR ALL`, `auth.uid() = owner_id`
- `"Collaborators can view their membership"` — `FOR SELECT`, `auth.uid() = collaborator_id`

**`collaboration_invites`**
- `"Owners can manage invites"` — `FOR ALL`, `auth.uid() = owner_id`
- `"Invitees can view their invites"` — `FOR SELECT`, `invitee_id` or email match via `user_profiles`
- `"Invitees can update their invites"` — `FOR UPDATE`, same match

---

## Account Collaboration tables

| Table | Owner | Account collaborator |
|-------|-------|----------------------|
| `account_collaborators` | Full CRUD | SELECT own row only |
| `account_invites` | Full CRUD | SELECT + UPDATE invites addressed to them |

### Active policies

**`account_collaborators`**
- `"Owners can manage account collaborators"` — `FOR ALL`, `auth.uid() = owner_id`
- `"Collaborators can view their account access"` — `FOR SELECT`, `auth.uid() = collaborator_id`

**`account_invites`**
- `"Owners can manage account invites"` — `FOR ALL`, `auth.uid() = owner_id`
- `"Invitees can view their account invites"` — `FOR SELECT`, `invitee_id` or email match
- `"Invitees can update their account invites"` — `FOR UPDATE`, same match

---

## Invite acceptance RPCs

Defined in `20260518000000_accept_invite_rpcs.sql`:

- `accept_collaboration_invite(invite_id uuid)` — validates invitee, creates `project_collaborators` row, marks invite accepted
- `accept_account_invite(invite_id uuid)` — validates invitee, creates `account_collaborators` row, marks invite accepted

Both run as `SECURITY DEFINER` with explicit auth and expiry checks. Collaborator rows cannot be inserted directly by clients due to RLS.

### Helper RPC

- `resolve_invitee_id(invitee_email text)` — returns `user_id` for an email address; used during invite creation to pre-populate `invitee_id`. Granted to `authenticated` only.

---

## Quick reference — all 11 tables

| Table | RLS Enabled | Policy count |
|-------|:-----------:|:------------:|
| `settings` | Yes | 1 |
| `daily_goal_data` | Yes | 1 |
| `streak_history` | Yes | 1 |
| `user_preferences` | Yes | 1 |
| `projects` | Yes | 3 |
| `tasks` | Yes | 5 |
| `user_profiles` | Yes | 6 |
| `project_collaborators` | Yes | 2 |
| `collaboration_invites` | Yes | 3 |
| `account_collaborators` | Yes | 2 |
| `account_invites` | Yes | 3 |

---

## CI validation

`npm run check:rls-policies` performs a static check against migration SQL files (no live DB required):

- Verifies `ENABLE ROW LEVEL SECURITY` is present for all 11 tables
- Verifies all known policy names exist in migrations

---

## Local integration testing (optional)

```bash
npx supabase db reset
# Run app against local Supabase and exercise invite flows manually
```

Automated RLS integration tests against a live DB are not yet wired in CI (requires test Supabase credentials).
