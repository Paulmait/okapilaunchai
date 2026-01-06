import fs from "node:fs";
import path from "node:path";
import { getSupabaseAdmin } from "./supabase.js";
import { createOpenAIProvider } from "@okapilaunch/ai-router/src/providers/openai.js";
import { createAnthropicProvider } from "@okapilaunch/ai-router/src/providers/anthropic.js";
import { executeTaskGraph, makeDefaultGraph, makeBuildMvpGraph } from "./executor.js";
import { zipDirectory } from "./exporter.js";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src: string, dest: string) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function getArtifactsRoot() {
  return process.env.ARTIFACTS_DIR || path.resolve(process.cwd(), "artifacts");
}

function getTemplatesRoot() {
  // Try multiple paths for templates
  const candidates = [
    path.resolve(process.cwd(), "../../packages/templates/expo-minimal"),
    path.resolve(process.cwd(), "../packages/templates/expo-minimal"),
    path.resolve(process.cwd(), "packages/templates/expo-minimal")
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  return candidates[0]; // fallback
}

export async function pollAndRunOnce(): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw new Error(error.message);
  const job = jobs?.[0];
  if (!job) return false;

  // Mark running (simple lock)
  const { error: updErr } = await supabase
    .from("jobs")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", job.id)
    .eq("status", "queued");

  if (updErr) return false;

  const projectId = job.project_id as string;
  const jobId = job.id as string;
  const jobType = job.type as string;
  const userId = "system";
  const artifactsDir = path.join(getArtifactsRoot(), projectId, jobId);
  ensureDir(artifactsDir);

  console.log(`[Worker] Processing job ${jobId} (type: ${jobType}) for project ${projectId}`);

  try {
    const payload = (job.payload ?? {}) as any;
    const wizard = payload.wizard ?? payload;

    // Handle different job types
    switch (jobType) {
      case "plan":
        await handlePlanJob(supabase, jobId, projectId, userId, wizard, artifactsDir, payload);
        break;

      case "build_mvp":
        await handleBuildMvpJob(supabase, jobId, projectId, userId, wizard, artifactsDir, payload);
        break;

      case "export":
        await handleExportJob(supabase, jobId, projectId, artifactsDir, payload);
        break;

      default:
        // Legacy: run default task graph for unknown types
        await handleDefaultJob(supabase, jobId, projectId, userId, wizard, artifactsDir, payload);
    }

    return true;
  } catch (e: any) {
    console.error(`[Worker] Job ${jobId} failed:`, e);
    await supabase
      .from("jobs")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
        error: e?.message ?? String(e)
      })
      .eq("id", job.id);
    return true;
  }
}

async function handlePlanJob(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  jobId: string,
  projectId: string,
  userId: string,
  wizard: any,
  artifactsDir: string,
  payload: any
) {
  const providers = {
    openai: createOpenAIProvider(),
    anthropic: createAnthropicProvider()
  };

  const graph = makeDefaultGraph({
    appName: wizard.name ?? "My App",
    category: wizard.category ?? "Utilities",
    authApple: !!wizard.authApple,
    subscription: !!wizard.subscription,
    backend: (wizard.backend ?? "supabase") as any,
    deleteMyData: wizard.deleteMyData !== false
  });

  const nodeResults = await executeTaskGraph(graph, {
    projectId,
    userId,
    budgetUsdRemaining: Number(process.env.DEFAULT_PROJECT_BUDGET_USD ?? 3),
    providers,
    artifactsDir
  });

  // Write plan outputs
  ensureDir(path.join(artifactsDir, "plan"));
  const planText = nodeResults
    .filter((r) => r.ok && r.outputText)
    .map((r) => r.outputText!)
    .join("\n\n---\n\n");

  fs.writeFileSync(path.join(artifactsDir, "plan", "PLAN_OUTPUT.txt"), planText, "utf-8");

  // Update job as succeeded
  const nextPayload = {
    ...payload,
    results: nodeResults,
    planComplete: true
  };

  await supabase
    .from("jobs")
    .update({
      status: "succeeded",
      updated_at: new Date().toISOString(),
      payload: nextPayload
    })
    .eq("id", jobId);

  // Queue build_mvp job automatically
  await supabase.from("jobs").insert({
    project_id: projectId,
    type: "build_mvp",
    status: "queued",
    payload: { wizard, planResults: nodeResults }
  });

  console.log(`[Worker] Plan job ${jobId} completed, queued build_mvp job`);
}

async function handleBuildMvpJob(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  jobId: string,
  projectId: string,
  userId: string,
  wizard: any,
  artifactsDir: string,
  payload: any
) {
  const templateDir = getTemplatesRoot();
  const expoDir = path.join(artifactsDir, "expo");

  // Copy template
  if (fs.existsSync(templateDir)) {
    copyDir(templateDir, expoDir);
    console.log(`[Worker] Copied Expo template from ${templateDir}`);
  } else {
    // Create minimal structure if template not found
    ensureDir(expoDir);
    fs.writeFileSync(
      path.join(expoDir, "package.json"),
      JSON.stringify(
        {
          name: wizard.name?.toLowerCase().replace(/\s+/g, "-") || "my-app",
          version: "1.0.0",
          main: "expo/AppEntry.js",
          scripts: {
            start: "expo start",
            ios: "expo run:ios",
            android: "expo run:android"
          },
          dependencies: {
            expo: "~51.0.0",
            react: "18.2.0",
            "react-native": "0.74.5"
          }
        },
        null,
        2
      ),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(expoDir, "app.json"),
      JSON.stringify(
        {
          expo: {
            name: wizard.name || "My App",
            slug: wizard.name?.toLowerCase().replace(/\s+/g, "-") || "my-app",
            version: "1.0.0",
            orientation: "portrait",
            platforms: ["ios"]
          }
        },
        null,
        2
      ),
      "utf-8"
    );
    console.log(`[Worker] Created minimal Expo structure`);
  }

  const providers = {
    openai: createOpenAIProvider(),
    anthropic: createAnthropicProvider()
  };

  // Run build MVP task graph
  const graph = makeBuildMvpGraph({
    appName: wizard.name ?? "My App",
    category: wizard.category ?? "Utilities",
    authApple: !!wizard.authApple,
    subscription: !!wizard.subscription,
    backend: (wizard.backend ?? "supabase") as any,
    deleteMyData: wizard.deleteMyData !== false,
    planResults: payload.planResults
  });

  const nodeResults = await executeTaskGraph(graph, {
    projectId,
    userId,
    budgetUsdRemaining: Number(process.env.DEFAULT_PROJECT_BUDGET_USD ?? 3),
    providers,
    artifactsDir
  });

  // Write legal and screenshot outputs
  ensureDir(path.join(artifactsDir, "legal"));
  ensureDir(path.join(artifactsDir, "screenshots"));

  const legalText = nodeResults
    .filter((r) => r.ok && r.outputText && r.nodeId.includes("legal"))
    .map((r) => r.outputText!)
    .join("\n\n---\n\n");

  if (legalText) {
    fs.writeFileSync(path.join(artifactsDir, "legal", "LEGAL_OUTPUT.txt"), legalText, "utf-8");
  } else {
    // Write placeholder if no legal content generated
    fs.writeFileSync(
      path.join(artifactsDir, "legal", "LEGAL_OUTPUT.txt"),
      `Privacy Policy for ${wizard.name || "App"}\n\nThis app respects your privacy.\n\nLast updated: ${new Date().toISOString().split("T")[0]}`,
      "utf-8"
    );
  }

  const screenshotJson = nodeResults
    .map((r) => r.outputText ?? "")
    .find((t) => t.trim().startsWith("{") && t.includes("screenshot"));

  fs.writeFileSync(
    path.join(artifactsDir, "screenshots", "screenshots_spec.json"),
    screenshotJson || JSON.stringify({ screenshots: [], generated: new Date().toISOString() }, null, 2),
    "utf-8"
  );

  // Update job as succeeded
  const nextPayload = {
    ...payload,
    results: nodeResults,
    buildComplete: true
  };

  await supabase
    .from("jobs")
    .update({
      status: "succeeded",
      updated_at: new Date().toISOString(),
      payload: nextPayload
    })
    .eq("id", jobId);

  // Queue export job automatically
  await supabase.from("jobs").insert({
    project_id: projectId,
    type: "export",
    status: "queued",
    payload: { wizard, artifactsDir }
  });

  console.log(`[Worker] Build MVP job ${jobId} completed, queued export job`);
}

async function handleExportJob(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  jobId: string,
  projectId: string,
  artifactsDir: string,
  payload: any
) {
  // Use artifacts from previous job if this is a fresh export
  const sourceDir = payload.artifactsDir || artifactsDir;

  // Zip the export package
  const outZip = path.join(artifactsDir, "export.zip");

  if (fs.existsSync(sourceDir)) {
    await zipDirectory(sourceDir, outZip);
  } else {
    // Create minimal export if artifacts don't exist
    ensureDir(sourceDir);
    ensureDir(path.join(sourceDir, "expo"));
    fs.writeFileSync(
      path.join(sourceDir, "expo", "README.txt"),
      "Export placeholder - run build_mvp first",
      "utf-8"
    );
    await zipDirectory(sourceDir, outZip);
  }

  // Upload to Supabase Storage bucket `exports`
  const objectPath = `${projectId}/${jobId}/export.zip`;
  const zipBuf = fs.readFileSync(outZip);

  const { error: upErr } = await supabase.storage
    .from("exports")
    .upload(objectPath, zipBuf, { contentType: "application/zip", upsert: true });

  if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

  const nextPayload = {
    ...payload,
    artifact_bucket: "exports",
    artifact_object_path: objectPath,
    exportComplete: true
  };

  await supabase
    .from("jobs")
    .update({
      status: "succeeded",
      updated_at: new Date().toISOString(),
      payload: nextPayload
    })
    .eq("id", jobId);

  console.log(`[Worker] Export job ${jobId} completed, uploaded to ${objectPath}`);
}

async function handleDefaultJob(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  jobId: string,
  projectId: string,
  userId: string,
  wizard: any,
  artifactsDir: string,
  payload: any
) {
  // Prepare Expo template
  const templateDir = getTemplatesRoot();
  const expoDir = path.join(artifactsDir, "expo");

  if (fs.existsSync(templateDir)) {
    copyDir(templateDir, expoDir);
  }

  const providers = {
    openai: createOpenAIProvider(),
    anthropic: createAnthropicProvider()
  };

  const graph = makeDefaultGraph({
    appName: wizard.name ?? "My App",
    category: wizard.category ?? "Utilities",
    authApple: !!wizard.authApple,
    subscription: !!wizard.subscription,
    backend: (wizard.backend ?? "supabase") as any,
    deleteMyData: wizard.deleteMyData !== false
  });

  const nodeResults = await executeTaskGraph(graph, {
    projectId,
    userId,
    budgetUsdRemaining: Number(process.env.DEFAULT_PROJECT_BUDGET_USD ?? 3),
    providers,
    artifactsDir
  });

  // Write outputs
  ensureDir(path.join(artifactsDir, "legal"));
  ensureDir(path.join(artifactsDir, "screenshots"));

  const legalText = nodeResults
    .filter((r) => r.ok && r.outputText)
    .map((r) => r.outputText!)
    .join("\n\n---\n\n");

  fs.writeFileSync(path.join(artifactsDir, "legal", "LEGAL_OUTPUT.txt"), legalText, "utf-8");

  const screenshotJson = nodeResults
    .map((r) => r.outputText ?? "")
    .find((t) => t.trim().startsWith("{") && t.includes("screenshot")) ?? "{}";

  fs.writeFileSync(path.join(artifactsDir, "screenshots", "screenshots_spec.json"), screenshotJson, "utf-8");

  // Zip export package
  const outZip = path.join(artifactsDir, "export.zip");
  await zipDirectory(artifactsDir, outZip);

  // Upload to Supabase Storage
  const objectPath = `${projectId}/${jobId}/export.zip`;
  const zipBuf = fs.readFileSync(outZip);

  const { error: upErr } = await supabase.storage
    .from("exports")
    .upload(objectPath, zipBuf, { contentType: "application/zip", upsert: true });

  if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

  const nextPayload = {
    ...payload,
    results: nodeResults,
    artifact_bucket: "exports",
    artifact_object_path: objectPath
  };

  await supabase
    .from("jobs")
    .update({
      status: "succeeded",
      updated_at: new Date().toISOString(),
      payload: nextPayload
    })
    .eq("id", jobId);
}
