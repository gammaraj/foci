#!/usr/bin/env node
/**
 * Static check: expected RLS policy names exist in supabase migrations.
 */
const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(__dirname, "../../supabase/migrations");

const REQUIRED_POLICIES = [
  "Users can manage own profile",
  "Collaborators can view owner profiles",
  "Invitees can view inviter profiles",
  "Owners can manage account collaborators",
  "Collaborators can view their account access",
  "Owners can manage account invites",
];

const sql = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8"))
  .join("\n");

const missing = REQUIRED_POLICIES.filter((name) => !sql.includes(`"${name}"`));

if (missing.length > 0) {
  console.error("Missing expected RLS policies in migrations:");
  missing.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}

console.log(`RLS policy check passed (${REQUIRED_POLICIES.length} policies found).`);
