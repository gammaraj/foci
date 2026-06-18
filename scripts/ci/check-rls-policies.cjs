#!/usr/bin/env node
/**
 * Static RLS check: verifies that every public table has RLS enabled and
 * that all known policy names exist somewhere in the migration SQL files.
 *
 * No live database required — runs purely against migration file contents.
 */
const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(__dirname, "../../supabase/migrations");

// All 11 public tables must have ENABLE ROW LEVEL SECURITY
const TABLES_REQUIRING_RLS = [
  "settings",
  "daily_goal_data",
  "streak_history",
  "user_preferences",
  "projects",
  "tasks",
  "user_profiles",
  "project_collaborators",
  "collaboration_invites",
  "account_collaborators",
  "account_invites",
];

// Every known policy name must appear in migrations
const REQUIRED_POLICIES = [
  // settings / daily_goal_data / streak_history / user_preferences
  "Users can manage their own settings",
  "Users can manage their own daily goal data",
  "Users can manage their own streak history",
  "Users can manage their own preferences",

  // projects
  "Owners can manage their own projects",
  "Collaborators can view shared projects",
  "Account collaborators can view all owner projects",

  // tasks
  "Owners can manage their own tasks",
  "Collaborators can view tasks in shared projects",
  "Editors can update tasks in shared projects",
  "Account collaborators can view all owner tasks",
  "Account editors can update all owner tasks",

  // user_profiles
  "Users can manage own profile",
  "Users can view project collaborator profiles",
  "Users can view account collaborator profiles",
  "Collaborators can view owner profiles",
  "Invitees can view inviter profiles",
  "Fellow project collaborators can view each other's profiles",

  // project_collaborators
  "Owners can manage collaborators",
  "Collaborators can view their membership",

  // collaboration_invites
  "Owners can manage invites",
  "Invitees can view their invites",
  "Invitees can update their invites",

  // account_collaborators
  "Owners can manage account collaborators",
  "Collaborators can view their account access",

  // account_invites
  "Owners can manage account invites",
  "Invitees can view their account invites",
  "Invitees can update their account invites",
];

// ── Load all migration SQL ──────────────────────────────────────────────────

const sql = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8"))
  .join("\n");

let passed = true;

// ── Check 1: RLS enabled on every table ────────────────────────────────────

const missingRls = TABLES_REQUIRING_RLS.filter(
  (table) => !sql.includes(`${table} enable row level security`) &&
             !sql.includes(`${table}\nenable row level security`) &&
             // handle both inline and multi-line ALTER TABLE forms
             !new RegExp(
               `alter\\s+table\\s+(public\\.)?${table}\\s+enable\\s+row\\s+level\\s+security`,
               "i"
             ).test(sql)
);

if (missingRls.length > 0) {
  console.error("\n❌ Tables missing ENABLE ROW LEVEL SECURITY in migrations:");
  missingRls.forEach((t) => console.error(`   - ${t}`));
  passed = false;
} else {
  console.log(`✅ RLS enabled: all ${TABLES_REQUIRING_RLS.length} tables confirmed`);
}

// ── Check 2: all policy names present ──────────────────────────────────────

const missingPolicies = REQUIRED_POLICIES.filter((name) => !sql.includes(`"${name}"`));

if (missingPolicies.length > 0) {
  console.error("\n❌ Missing expected RLS policy names in migrations:");
  missingPolicies.forEach((p) => console.error(`   - "${p}"`));
  passed = false;
} else {
  console.log(`✅ Policies found: all ${REQUIRED_POLICIES.length} expected policy names confirmed`);
}

// ── Result ──────────────────────────────────────────────────────────────────

if (!passed) {
  process.exit(1);
}

console.log("\n✅ RLS check passed.");
