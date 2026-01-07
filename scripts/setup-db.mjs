/**
 * Setup Supabase database - run migrations and create storage bucket
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dgezhxhqmiaghvlmqvxd.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZXpoeGhxbWlhZ2h2bG1xdnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc0MTg1MCwiZXhwIjoyMDgzMzE3ODUwfQ.g0h7b6urq_DzlIF5an-ZCQoezq8uKcttajuG7ghNfro";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

async function verifyTables() {
  console.log("\n📋 Checking database tables...");

  const tables = ["projects", "jobs", "ai_decisions", "ai_runs"];
  const results = {};

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select("id").limit(1);
      if (error) {
        results[table] = { exists: false, error: error.message };
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        results[table] = { exists: true };
        console.log(`  ✅ ${table}: OK`);
      }
    } catch (e) {
      results[table] = { exists: false, error: String(e) };
      console.log(`  ❌ ${table}: ${e}`);
    }
  }

  return results;
}

async function createStorageBucket() {
  console.log("\n📦 Setting up storage bucket 'exports'...");

  try {
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.log(`  ⚠️ Could not list buckets: ${listError.message}`);
      return false;
    }

    const exists = buckets?.some((b) => b.name === "exports");

    if (exists) {
      console.log("  ✅ Bucket 'exports' already exists");
      return true;
    }

    // Create bucket
    const { error: createError } = await supabase.storage.createBucket("exports", {
      public: false,
      fileSizeLimit: 104857600 // 100MB
    });

    if (createError) {
      console.log(`  ❌ Failed to create bucket: ${createError.message}`);
      return false;
    }

    console.log("  ✅ Bucket 'exports' created successfully");
    return true;
  } catch (e) {
    console.log(`  ❌ Error: ${e}`);
    return false;
  }
}

async function testInsert() {
  console.log("\n🧪 Testing database write...");

  try {
    // Create a test project
    const { data: project, error: pErr } = await supabase
      .from("projects")
      .insert({
        user_id: "test-setup",
        name: "Test Project (can delete)"
      })
      .select("id")
      .single();

    if (pErr) {
      console.log(`  ❌ Insert failed: ${pErr.message}`);
      return false;
    }

    console.log(`  ✅ Created test project: ${project.id}`);

    // Create a test job
    const { data: job, error: jErr } = await supabase
      .from("jobs")
      .insert({
        project_id: project.id,
        type: "plan",
        status: "queued",
        payload: { test: true }
      })
      .select("id")
      .single();

    if (jErr) {
      console.log(`  ❌ Job insert failed: ${jErr.message}`);
    } else {
      console.log(`  ✅ Created test job: ${job.id}`);
    }

    // Clean up test data
    await supabase.from("projects").delete().eq("id", project.id);
    console.log("  🧹 Cleaned up test data");

    return true;
  } catch (e) {
    console.log(`  ❌ Error: ${e}`);
    return false;
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  OkapiLaunch AI - Database Setup");
  console.log("═══════════════════════════════════════════════");
  console.log(`\nConnecting to: ${SUPABASE_URL}`);

  // Step 1: Check tables
  const tableResults = await verifyTables();
  const allTablesExist = Object.values(tableResults).every((r) => r.exists);

  if (!allTablesExist) {
    console.log("\n⚠️  Some tables are missing!");
    console.log("   Please run the migrations in Supabase SQL Editor:");
    console.log("   https://supabase.com/dashboard/project/dgezhxhqmiaghvlmqvxd/sql/new");
    console.log("\n   Run these files in order:");
    console.log("   1. supabase/migrations/0001_init.sql");
    console.log("   2. supabase/migrations/0002_storage_exports_bucket.sql");
    console.log("   3. supabase/migrations/0003_rls_policies.sql");
    console.log("\n   Then run this script again.");
    process.exit(1);
  }

  // Step 2: Create storage bucket
  await createStorageBucket();

  // Step 3: Test insert/delete
  await testInsert();

  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✅ Database setup complete!");
  console.log("═══════════════════════════════════════════════");
  console.log("\nYou can now run:");
  console.log("  pnpm build");
  console.log("  pnpm dev");
}

main().catch((e) => {
  console.error("Setup failed:", e);
  process.exit(1);
});
