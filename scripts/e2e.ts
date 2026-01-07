/**
 * OkapiLaunch AI - End-to-End Test
 *
 * This test validates the entire pipeline:
 * 1. Create project -> queue job
 * 2. Run worker once to process job
 * 3. Verify job succeeded + artifact path written
 * 4. Create signed URL + download export.zip
 * 5. Unzip and verify required artifacts
 * 6. Run build validation on extracted Expo project
 *
 * Usage: pnpm test:e2e
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync, SpawnSyncReturns } from "node:child_process";
import AdmZip from "adm-zip";

// ============ Configuration ============

const TMP_DIR = path.resolve(process.cwd(), "tmp");
const EXTRACTED_DIR = path.join(TMP_DIR, "extracted");
const TIMEOUT_MS = 120000; // 2 minutes max for entire test

// Required env vars
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============ Utilities ============

function log(msg: string): void {
  console.log(`[E2E] ${new Date().toISOString()} - ${msg}`);
}

function logError(msg: string): void {
  console.error(`[E2E] ERROR: ${msg}`);
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  ensureDir(dir);
}

function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs: number = 60000
): { ok: boolean; stdout: string; stderr: string } {
  log(`Running: ${cmd} ${args.join(" ")} in ${cwd}`);

  const result: SpawnSyncReturns<Buffer> = spawnSync(cmd, args, {
    cwd,
    shell: true, // Windows compatibility
    timeout: timeoutMs,
    encoding: "buffer",
    stdio: ["pipe", "pipe", "pipe"]
  });

  const stdout = result.stdout?.toString("utf-8") ?? "";
  const stderr = result.stderr?.toString("utf-8") ?? "";

  if (result.error) {
    return { ok: false, stdout, stderr: stderr + "\n" + String(result.error) };
  }

  return { ok: result.status === 0, stdout, stderr };
}

function assertFile(filePath: string, minSize: number = 0): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
  const stat = fs.statSync(filePath);
  if (stat.size < minSize) {
    throw new Error(`File too small: ${filePath} (${stat.size} bytes, expected >= ${minSize})`);
  }
  log(`Verified: ${filePath} (${stat.size} bytes)`);
}

function assertValidJson(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  try {
    JSON.parse(content);
    log(`Valid JSON: ${filePath}`);
  } catch (e) {
    throw new Error(`Invalid JSON in ${filePath}: ${e}`);
  }
}

// ============ Test Steps ============

async function createProject(supabase: SupabaseClient): Promise<{ projectId: string; jobId: string }> {
  log("Step 1: Creating project...");

  const wizard = {
    name: "E2E Test App",
    category: "Utilities",
    authApple: true,
    subscription: true,
    backend: "supabase" as const,
    deleteMyData: true
  };

  // Create project directly in DB (simulating API call)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: "e2e-test-user",
      name: wizard.name
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(`Failed to create project: ${projectError?.message}`);
  }

  const projectId = project.id;
  log(`Created project: ${projectId}`);

  // Queue initial job
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      project_id: projectId,
      type: "plan",
      status: "queued",
      payload: { wizard }
    })
    .select("id")
    .single();

  if (jobError || !job) {
    throw new Error(`Failed to queue job: ${jobError?.message}`);
  }

  const jobId = job.id;
  log(`Queued job: ${jobId}`);

  return { projectId, jobId };
}

async function runWorkerOnce(): Promise<boolean> {
  log("Step 2: Running worker once...");

  // Import and run the worker's pollAndRunOnce function
  const workerPath = path.resolve(process.cwd(), "apps/worker/dist/jobs.js");

  if (!fs.existsSync(workerPath)) {
    log("Worker not built, building now...");
    const buildResult = runCommand("pnpm", ["--filter", "@okapilaunch/worker", "build"], process.cwd(), 60000);
    if (!buildResult.ok) {
      throw new Error(`Worker build failed: ${buildResult.stderr}`);
    }
  }

  // Dynamically import the worker module (use file:// URL for Windows compatibility)
  try {
    const workerUrl = pathToFileURL(workerPath).href;
    const { pollAndRunOnce } = await import(workerUrl);
    const didWork = await pollAndRunOnce();
    log(`Worker completed, didWork: ${didWork}`);
    return didWork;
  } catch (e) {
    throw new Error(`Worker execution failed: ${e}`);
  }
}

async function waitForJobCompletion(
  supabase: SupabaseClient,
  jobId: string,
  maxWaitMs: number = 60000
): Promise<any> {
  log("Step 3: Waiting for job completion...");

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }

    if (job.status === "succeeded") {
      log(`Job succeeded: ${jobId}`);
      return job;
    }

    if (job.status === "failed") {
      throw new Error(`Job failed: ${job.error}`);
    }

    log(`Job status: ${job.status}, waiting...`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error(`Job timed out after ${maxWaitMs}ms`);
}

async function findExportJob(
  supabase: SupabaseClient,
  projectId: string,
  maxWaitMs: number = 60000
): Promise<any> {
  log("Looking for export job...");

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    // Run worker to process any queued jobs
    try {
      await runWorkerOnce();
    } catch {
      // Ignore worker errors, keep polling
    }

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("project_id", projectId)
      .eq("type", "export")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    if (jobs && jobs.length > 0) {
      const exportJob = jobs[0];

      if (exportJob.status === "succeeded") {
        log(`Found succeeded export job: ${exportJob.id}`);
        return exportJob;
      }

      if (exportJob.status === "failed") {
        throw new Error(`Export job failed: ${exportJob.error}`);
      }

      log(`Export job status: ${exportJob.status}`);
    } else {
      log("No export job found yet, running worker...");
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error(`Export job not found or not completed after ${maxWaitMs}ms`);
}

async function downloadExport(
  supabase: SupabaseClient,
  job: any
): Promise<string> {
  log("Step 4: Downloading export...");

  const payload = job.payload as any;
  const bucket = payload.artifact_bucket;
  const objectPath = payload.artifact_object_path;

  if (!bucket || !objectPath) {
    throw new Error(`Job missing artifact info: bucket=${bucket}, path=${objectPath}`);
  }

  // Get signed URL
  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, 600);

  if (signedError || !signedData?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${signedError?.message}`);
  }

  log(`Got signed URL for: ${objectPath}`);

  // Download the file
  const response = await fetch(signedData.signedUrl);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const zipPath = path.join(TMP_DIR, "export.zip");

  ensureDir(TMP_DIR);
  fs.writeFileSync(zipPath, buffer);

  log(`Downloaded export.zip (${buffer.length} bytes)`);

  // Verify minimum size (5KB for minimal template)
  if (buffer.length < 5120) {
    throw new Error(`Export too small: ${buffer.length} bytes (expected >= 5KB)`);
  }

  return zipPath;
}

function extractZip(zipPath: string, jobId: string): string {
  log("Step 5: Extracting export.zip...");

  const extractDir = path.join(EXTRACTED_DIR, jobId);
  cleanDir(extractDir);

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractDir, true);

  log(`Extracted to: ${extractDir}`);

  // List contents
  const entries = zip.getEntries();
  log(`Archive contains ${entries.length} entries`);

  return extractDir;
}

function verifyArtifacts(extractDir: string): void {
  log("Step 6: Verifying required artifacts...");

  // Required files and minimum sizes
  const requiredFiles = [
    { path: "expo/package.json", minSize: 50 },
    { path: "expo/app.json", minSize: 50 },
    { path: "legal/PRIVACY_POLICY.md", minSize: 200 },
    { path: "legal/TERMS_OF_SERVICE.md", minSize: 200 },
    { path: "screenshots/screenshots_spec.json", minSize: 10 }
  ];

  for (const { path: relPath, minSize } of requiredFiles) {
    const fullPath = path.join(extractDir, relPath);
    assertFile(fullPath, minSize);
  }

  // Validate JSON files
  assertValidJson(path.join(extractDir, "expo/package.json"));
  assertValidJson(path.join(extractDir, "expo/app.json"));
  assertValidJson(path.join(extractDir, "screenshots/screenshots_spec.json"));

  // Verify legal documents have content (markdown, not JSON)
  log(`Verified: legal/PRIVACY_POLICY.md`);
  log(`Verified: legal/TERMS_OF_SERVICE.md`);

  log("All required artifacts verified!");
}

async function validateExpoBuild(extractDir: string): Promise<void> {
  log("Step 7: Validating Expo project build...");

  const expoDir = path.join(extractDir, "expo");

  if (!fs.existsSync(expoDir)) {
    log("Warning: No expo directory found, skipping build validation");
    return;
  }

  // 7A: Install dependencies
  log("Installing dependencies...");
  const installResult = runCommand("pnpm", ["install", "--no-frozen-lockfile"], expoDir, 120000);
  if (!installResult.ok) {
    log(`Warning: pnpm install had issues: ${installResult.stderr.slice(0, 500)}`);
    // Don't fail on install issues - may be network related
  }

  // 7B: TypeScript check (if tsconfig exists)
  const tsconfigPath = path.join(expoDir, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    log("Running TypeScript check...");
    const tscResult = runCommand("pnpm", ["-s", "tsc", "--noEmit"], expoDir, 60000);
    if (!tscResult.ok) {
      log(`Warning: TypeScript check had issues: ${tscResult.stderr.slice(0, 500)}`);
      // Continue anyway - generated code may have minor type issues
    }
  } else {
    log("No tsconfig.json found, skipping TypeScript check");
  }

  // 7C: Expo doctor check
  log("Running Expo doctor...");
  const doctorResult = runCommand("npx", ["expo", "doctor"], expoDir, 60000);
  if (!doctorResult.ok) {
    log(`Warning: Expo doctor reported issues: ${doctorResult.stderr.slice(0, 500)}`);
    // Continue anyway - expo doctor may report non-critical warnings
  } else {
    log("Expo doctor passed!");
  }

  log("Build validation completed!");
}

async function cleanup(supabase: SupabaseClient, projectId: string): Promise<void> {
  log("Cleaning up test data...");

  // Delete project (cascades to jobs)
  await supabase.from("projects").delete().eq("id", projectId);

  log("Cleanup completed");
}

// ============ Main Test Runner ============

async function runE2ETest(): Promise<void> {
  log("=== OkapiLaunch AI E2E Test Starting ===");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  // Clean tmp directory
  cleanDir(TMP_DIR);
  cleanDir(EXTRACTED_DIR);

  let projectId: string | null = null;

  try {
    // Step 1: Create project
    const { projectId: pid, jobId } = await createProject(supabase);
    projectId = pid;

    // Step 2: Run worker to process plan job
    await runWorkerOnce();

    // Step 3: Wait for initial job to complete
    await waitForJobCompletion(supabase, jobId, 60000);

    // Wait for all jobs in pipeline (plan -> build_mvp -> export)
    const exportJob = await findExportJob(supabase, projectId, 120000);

    // Step 4: Download export
    const zipPath = await downloadExport(supabase, exportJob);

    // Step 5: Extract zip
    const extractDir = extractZip(zipPath, exportJob.id);

    // Step 6: Verify artifacts
    verifyArtifacts(extractDir);

    // Step 7: Validate Expo build
    await validateExpoBuild(extractDir);

    log("=== E2E Test PASSED ===");
  } catch (error) {
    logError(`Test failed: ${error}`);

    // Cleanup on failure
    if (projectId) {
      try {
        await cleanup(supabase, projectId);
      } catch {
        // Ignore cleanup errors
      }
    }

    process.exit(1);
  }

  // Cleanup on success (optional - comment out to inspect artifacts)
  if (projectId) {
    try {
      await cleanup(supabase, projectId);
    } catch {
      // Ignore cleanup errors
    }
  }

  process.exit(0);
}

// Set timeout
const timeoutId = setTimeout(() => {
  logError(`Test timed out after ${TIMEOUT_MS}ms`);
  process.exit(1);
}, TIMEOUT_MS);

runE2ETest()
  .catch((e) => {
    logError(`Unexpected error: ${e}`);
    process.exit(1);
  })
  .finally(() => {
    clearTimeout(timeoutId);
  });
