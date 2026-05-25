# Supabase RLS Policy Matrix

> Last updated: May 2026 (after `20260517000000_security_hardening.sql`)

This document describes the **current** Row Level Security policies. Roles for collaboration are **`viewer`** and **`editor`** only (no admin role).

## Core tables (single-user)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `tasks` | `auth.uid() = user_id` | owner | owner | owner |
| `projects` | owner | owner | owner | owner |
| `settings` | owner | owner | owner | owner |
| `daily_goal_data` | owner | owner | owner | owner |

## User profiles

| Policy | Operation | Rule |
|--------|-----------|------|
| Users manage own profile | ALL | `auth.uid() = user_id` |
| Collaborators can view owner profiles | SELECT | Collaborator on a shared project/account owned by profile user |
| Invitees can view inviter profiles | SELECT | Pending project or account invite from profile user |

Global profile SELECT for all authenticated users was **removed** in the security hardening migration. Email lookup for invites uses the `resolve_invitee_id(email)` SECURITY DEFINER RPC.

## Project collaboration

| Table | Owner | Collaborator (viewer/editor) |
|-------|-------|------------------------------|
| `project_collaborators` | CRUD | SELECT own row |
| `collaboration_invites` | CRUD | SELECT/UPDATE pending invites addressed to them |
| Shared `tasks` / `projects` | Full access | SELECT always; UPDATE if role = `editor` |

## Account collaboration

| Table | Owner | Account collaborator |
|-------|-------|----------------------|
| `account_collaborators` | CRUD | SELECT own row |
| `account_invites` | CRUD | SELECT/UPDATE pending invites addressed to them |
| All owner projects/tasks | Full access | SELECT always; UPDATE if role = `editor` |

## Invite acceptance RPCs

Defined in `20260518000000_accept_invite_rpcs.sql`:

- `accept_project_invite(invite_id uuid)` — validates invitee, creates `project_collaborators` row
- `accept_account_invite(invite_id uuid)` — validates invitee, creates `account_collaborators` row

Both run as SECURITY DEFINER with explicit auth checks.

## CI validation

`npm run check:rls-policies` verifies that expected policy names exist in migration SQL files (static check, no live DB required).

## Local integration testing (optional)

With a linked Supabase project:

```bash
npx supabase db reset
# Run app against local Supabase and exercise invite flows manually
```

Automated RLS integration tests against a live DB are not yet wired in CI (requires test Supabase credentials).
