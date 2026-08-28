#!/usr/bin/env node
/**
 * Ensures the admin email allowlist in src/lib/admin.ts stays in sync with
 * public.admin_list_users() in supabase migrations.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "../..");
const adminTsPath = path.join(root, "src/lib/admin.ts");
const migrationsDir = path.join(root, "supabase/migrations");

function extractEmailsFromAdminTs(source) {
  const match = source.match(/ADMIN_EMAILS\s*=\s*\[([\s\S]*?)\]\s*as\s+const/);
  if (!match) {
    throw new Error("Could not find ADMIN_EMAILS array in src/lib/admin.ts");
  }
  return [...match[1].matchAll(/["']([^"']+@[^"']+)["']/g)].map((m) => m[1].toLowerCase()).sort();
}

function extractEmailsFromAdminRpc(sql) {
  const fnMatch = sql.match(
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.admin_list_users\s*\([\s\S]*?END;\s*\$\$/i,
  );
  if (!fnMatch) return null;
  const notIn = fnMatch[0].match(/NOT\s+IN\s*\(([\s\S]*?)\)/i);
  if (!notIn) {
    throw new Error("admin_list_users() has no NOT IN allowlist");
  }
  return [...notIn[1].matchAll(/['"]([^'"]+@[^'"]+)['"]/g)].map((m) => m[1].toLowerCase()).sort();
}

const adminTs = fs.readFileSync(adminTsPath, "utf8");
const fromTs = extractEmailsFromAdminTs(adminTs);

const sqlFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let fromSql = null;
let sourceFile = null;
for (const file of sqlFiles) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  const emails = extractEmailsFromAdminRpc(sql);
  if (emails) {
    fromSql = emails;
    sourceFile = file;
  }
}

if (!fromSql) {
  console.error("FAIL: no admin_list_users() allowlist found in migrations");
  process.exit(1);
}

const tsJoined = fromTs.join(",");
const sqlJoined = fromSql.join(",");

if (tsJoined !== sqlJoined) {
  console.error("FAIL: admin email allowlist mismatch");
  console.error(`  src/lib/admin.ts: ${JSON.stringify(fromTs)}`);
  console.error(`  ${sourceFile}:     ${JSON.stringify(fromSql)}`);
  console.error("Keep ADMIN_EMAILS and public.admin_list_users() in sync.");
  process.exit(1);
}

if (fromTs.length === 0) {
  console.error("FAIL: admin allowlist is empty");
  process.exit(1);
}

console.log(`OK: admin allowlist in sync (${fromTs.length} email(s), last defined in ${sourceFile})`);
