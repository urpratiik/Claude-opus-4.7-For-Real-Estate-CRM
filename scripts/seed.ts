/* eslint-disable no-console */
/**
 * EstateFlow CRM — seed script.
 *
 * What it does:
 *   1. Creates 6 demo auth users via the Supabase admin API (idempotent).
 *   2. Runs supabase/seed.sql to populate organizations, profiles, leads,
 *      properties, calls, follow-ups, attendance, social posts, etc.
 *
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npm run seed
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env. " +
      "Copy .env.example to .env.local and fill them in.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_PASSWORD = "Password123!";

const DEMO_USERS = [
  { id: "11111111-1111-1111-1111-111111111111", email: "admin@acme.test",   name: "Priya Admin",   role: "admin" },
  { id: "22222222-2222-2222-2222-222222222222", email: "manager@acme.test", name: "Rohit Manager", role: "sales_manager" },
  { id: "33333333-3333-3333-3333-333333333333", email: "anita@acme.test",   name: "Anita Agent",   role: "sales_agent" },
  { id: "44444444-4444-4444-4444-444444444444", email: "vikram@acme.test",  name: "Vikram Agent",  role: "sales_agent" },
  { id: "55555555-5555-5555-5555-555555555555", email: "field@acme.test",   name: "Suresh Field",  role: "field_executive" },
  { id: "66666666-6666-6666-6666-666666666666", email: "social@acme.test",  name: "Neha Social",   role: "social_media_manager" },
] as const;

async function ensureUser(u: (typeof DEMO_USERS)[number]) {
  // Try to fetch by id first
  const existing = await admin.auth.admin.getUserById(u.id).catch(() => null);
  if (existing?.data?.user) {
    console.log(`✓ user exists: ${u.email}`);
    return;
  }

  // Fall back: list and search by email (in case the id collides with an old run)
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const match = list?.users.find((x) => x.email === u.email);
  if (match) {
    console.log(`✓ user exists by email: ${u.email} (id ${match.id})`);
    return;
  }

  // Create with the deterministic id
  const { error } = await admin.auth.admin.createUser({
    email: u.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.name, demo_uid: u.id },
  });
  if (error) {
    console.error(`✗ failed to create ${u.email}: ${error.message}`);
    return;
  }
  console.log(`+ created ${u.email}`);
}

async function syncProfileIds() {
  // Make sure the profiles in seed.sql match the actual auth.users ids.
  // We update profiles after seed.sql runs, mapping email -> auth id.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const byEmail = new Map(list?.users.map((u) => [u.email!, u.id] as const) ?? []);

  for (const u of DEMO_USERS) {
    const realId = byEmail.get(u.email);
    if (!realId) continue;
    if (realId === u.id) continue;
    // Update profile id to the real auth id (cascade FK targets)
    await admin
      .from("profiles")
      .update({ id: realId })
      .eq("email", u.email);
    console.log(`↺ aligned profile ${u.email} -> ${realId}`);
  }
}

async function runSeedSql() {
  const sqlPath = join(process.cwd(), "supabase", "seed.sql");
  const sql = readFileSync(sqlPath, "utf8");

  // We can't run multi-statement SQL from supabase-js directly, so users
  // typically run this via `psql $SUPABASE_DB_URL -f supabase/seed.sql`.
  // We print the command instead for clarity.
  console.log(
    "\nNext step: run the SQL seed against your database:\n" +
      `  psql "$SUPABASE_DB_URL" -f supabase/seed.sql\n` +
      "(or paste the file into Supabase SQL editor)\n",
  );
  // Best-effort: attempt rpc if you've created an exec_sql function (see README)
  if (process.env.SEED_USE_RPC === "true") {
    const { error } = await admin.rpc("exec_sql", { sql });
    if (error) console.error("rpc exec_sql failed:", error.message);
    else console.log("✓ seed.sql executed via exec_sql RPC");
  }
}

async function main() {
  console.log("Seeding demo auth users...");
  for (const u of DEMO_USERS) await ensureUser(u);

  await runSeedSql();
  await syncProfileIds();

  console.log("\nDemo accounts (password = Password123!):");
  for (const u of DEMO_USERS) console.log(`  ${u.role.padEnd(20)} ${u.email}`);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
