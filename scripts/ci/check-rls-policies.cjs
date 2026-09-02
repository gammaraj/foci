#!/usr/bin/env node
/**
 * Static RLS check: verifies that every public table has RLS enabled and
 * that policy names and security markers exist in migration SQL files.
 *
 * No live database required — runs purely against migration file contents.
 */
const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(__dirname, "../../supabase/migrations");

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

/** Last action in chronological migrations must be CREATE. */
const REQUIRED_POLICIES = [
  "Users can manage their own settings",
  "Users can manage their own daily goal data",
  "Users can manage their own streak history",
  "Users can manage their own preferences",
  "Owners can manage their own projects",
  "Collaborators can view shared projects",
  "Account collaborators can view all owner projects",
  "Owners can manage their own tasks",
  "Collaborators can view tasks in shared projects",
  "Editors can update tasks in shared projects",
  "Editors can insert tasks in shared projects",
  "Account collaborators can view all owner tasks",
  "Account editors can update all owner tasks",
  "Account editors can insert tasks for owner",
  "Users can manage own profile",
  "Users can view project collaborator profiles",
  "Users can view account collaborator profiles",
  "Collaborators can view owner profiles",
  "Invitees can view inviter profiles",
  "Fellow project collaborators can view each other's profiles",
  "Owners can manage collaborators",
  "Collaborators can view their membership",
  "Owners can manage invites",
  "Invitees can view their invites",
  "Owners can manage account collaborators",
  "Collaborators can view their account access",
  "Owners can manage account invites",
  "Invitees can view their account invites",
];

/** Last action must be DROP — invitees accept/decline via RPCs only. */
const DROPPED_POLICIES = [
  "Invitees can update their invites",
  "Invitees can update their account invites",
];

const REQUIRED_MARKERS = [
  "protect_user_profile_email",
  "protect_non_owner_task_identity",
  "create_collaboration_invite",
  "create_account_invite",
  "decline_collaboration_invite",
  "decline_account_invite",
  "invitee_is_caller",
  "REVOKE EXECUTE ON FUNCTION public.resolve_invitee_id",
  "user_profiles_email_lower_key",
  "migrate_guest_workspace",
  'WITH CHECK',
];

const sqlFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8"));

const sql = sqlFiles.join("\n");

let passed = true;

const missingRls = TABLES_REQUIRING_RLS.filter(
  (table) => !sql.includes(`${table} enable row level security`) &&
             !sql.includes(`${table}\nenable row level security`) &&
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

function lastPolicyAction(name) {
  const re = new RegExp(
    `drop policy if exists "${name}"|create policy "${name}"`,
    "gi",
  );
  let last = null;
  let match;
  while ((match = re.exec(sql)) !== null) {
    last = match[0].toLowerCase().startsWith("drop") ? "drop" : "create";
  }
  return last;
}

const missingPolicies = REQUIRED_POLICIES.filter((name) => lastPolicyAction(name) !== "create");
if (missingPolicies.length > 0) {
  console.error("\n❌ Expected policies missing or last action is not CREATE:");
  missingPolicies.forEach((p) => console.error(`   - "${p}" (last: ${lastPolicyAction(p) ?? "none"})`));
  passed = false;
} else {
  console.log(`✅ Policies active: all ${REQUIRED_POLICIES.length} expected policy names end in CREATE`);
}

const stillPresent = DROPPED_POLICIES.filter((name) => lastPolicyAction(name) !== "drop");
if (stillPresent.length > 0) {
  console.error("\n❌ Invitee UPDATE policies must stay dropped (use decline RPCs):");
  stillPresent.forEach((p) => console.error(`   - "${p}" (last: ${lastPolicyAction(p) ?? "none"})`));
  passed = false;
} else {
  console.log(`✅ Invitee UPDATE policies dropped: ${DROPPED_POLICIES.length}`);
}

const missingMarkers = REQUIRED_MARKERS.filter((marker) => !sql.includes(marker));
if (missingMarkers.length > 0) {
  console.error("\n❌ Missing security markers in migrations:");
  missingMarkers.forEach((m) => console.error(`   - ${m}`));
  passed = false;
} else {
  console.log(`✅ Security markers found: ${REQUIRED_MARKERS.length}`);
}

function lastCreatePolicySnippet(name) {
  const re = new RegExp(`create policy "${name}"`, "gi");
  let lastIndex = -1;
  let match;
  while ((match = re.exec(sql)) !== null) {
    lastIndex = match.index;
  }
  if (lastIndex < 0) return "";
  return sql.slice(lastIndex, lastIndex + 2000);
}

const editorSnippet = lastCreatePolicySnippet("Editors can update tasks in shared projects");
const accountEditorSnippet = lastCreatePolicySnippet("Account editors can update all owner tasks");
const editorInsertSnippet = lastCreatePolicySnippet("Editors can insert tasks in shared projects");
const accountEditorInsertSnippet = lastCreatePolicySnippet("Account editors can insert tasks for owner");
if (!/with check/i.test(editorSnippet) || !/with check/i.test(accountEditorSnippet)) {
  console.error("\n❌ Latest editor task UPDATE policies must include WITH CHECK");
  passed = false;
} else {
  console.log("✅ Editor UPDATE policies include WITH CHECK");
}
if (!/with check/i.test(editorInsertSnippet) || !/with check/i.test(accountEditorInsertSnippet)) {
  console.error("\n❌ Latest editor task INSERT policies must include WITH CHECK");
  passed = false;
} else {
  console.log("✅ Editor INSERT policies include WITH CHECK");
}

if (!passed) {
  process.exit(1);
}

console.log("\n✅ RLS check passed.");
