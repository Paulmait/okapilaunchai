/**
 * Run Supabase migrations using direct PostgreSQL connection
 */

import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file from project root
config({ path: path.join(__dirname, "..", ".env") });

// IMPORTANT: Set DATABASE_URL in your environment or .env file
// Format: postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL environment variable");
  console.error("   Set it in your .env file or environment");
  console.error("   Format: postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres");
  process.exit(1);
}

const migrations = [
  "0001_init.sql",
  "0002_storage_exports_bucket.sql",
  "0003_rls_policies.sql",
  "0004_analytics_and_feedback.sql",
  "20260107_subscriptions.sql",
  "0005_admin_users.sql"
];

async function runMigrations() {
  console.log("═══════════════════════════════════════════════");
  console.log("  OkapiLaunch AI - Running Migrations");
  console.log("═══════════════════════════════════════════════\n");

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("📡 Connecting to database...");
    await client.connect();
    console.log("✅ Connected!\n");

    for (const migrationFile of migrations) {
      const filePath = path.join(__dirname, "..", "supabase", "migrations", migrationFile);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Migration file not found: ${migrationFile}`);
        continue;
      }

      console.log(`📄 Running: ${migrationFile}`);
      const sql = fs.readFileSync(filePath, "utf-8");

      try {
        await client.query(sql);
        console.log(`   ✅ Success\n`);
      } catch (err) {
        // Some errors are expected (e.g., "already exists")
        if (err.message.includes("already exists") || err.message.includes("duplicate")) {
          console.log(`   ⚠️  Already applied (skipped)\n`);
        } else {
          console.log(`   ❌ Error: ${err.message}\n`);
        }
      }
    }

    // Verify tables exist
    console.log("📋 Verifying tables...");
    const tables = ["projects", "jobs", "ai_decisions", "ai_runs", "analytics_events", "user_feedback", "nps_responses", "subscriptions", "usage", "admin_users", "admin_audit_log"];

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ✅ ${table}: OK`);
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

    // Check storage bucket
    console.log("\n📦 Checking storage bucket...");
    try {
      const result = await client.query(`SELECT id FROM storage.buckets WHERE id = 'exports'`);
      if (result.rows.length > 0) {
        console.log("   ✅ exports bucket: OK");
      } else {
        console.log("   ⚠️  exports bucket: not found (will be created on first upload)");
      }
    } catch (err) {
      console.log(`   ⚠️  Could not check bucket: ${err.message}`);
    }

    console.log("\n═══════════════════════════════════════════════");
    console.log("  ✅ Migrations complete!");
    console.log("═══════════════════════════════════════════════");

  } catch (err) {
    console.error("❌ Database error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
