import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { runWithRouting, type LlmProvider } from "@okapilaunch/ai-router";
import type { TaskGraph, TaskGraphNode } from "@okapilaunch/core";
import { createSupabaseRouterLogger } from "./logger.js";

export type ExecutorContext = {
  projectId: string;
  userId: string;
  budgetUsdRemaining: number;
  providers: Record<"openai" | "anthropic", LlmProvider>;
  artifactsDir: string; // e.g. /.../artifacts/<projectId>
};

export type NodeResult = {
  nodeId: string;
  ok: boolean;
  outputText?: string;
  error?: string;
};

function topoSort(nodes: TaskGraphNode[]): TaskGraphNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const temp = new Set<string>();
  const out: TaskGraphNode[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    if (temp.has(id)) throw new Error("Cycle detected in task graph");
    temp.add(id);
    const n = byId.get(id);
    if (!n) throw new Error(`Missing node: ${id}`);
    for (const dep of n.dependsOn ?? []) visit(dep);
    temp.delete(id);
    visited.add(id);
    out.push(n);
  }

  for (const n of nodes) visit(n.id);
  return out;
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function buildPrompt(node: TaskGraphNode): { system?: string; prompt: string } {
  const input = node.input ?? {};
  const base = `Task: ${node.title}\nTaskType: ${node.taskType}\nInput JSON:\n${JSON.stringify(input, null, 2)}\n`;
  // A few opinionated helpers:
  if (node.taskType === "plan_architecture") {
    return {
      system:
        "You are an iOS App Store compliance expert and React Native/Expo architect. Be specific and output structured JSON where asked.",
      prompt:
        base +
        "\nReturn: (1) app architecture plan, (2) screen list, (3) data model, (4) API/endpoints, (5) compliance checklist. Use clear headings."
    };
  }
  if (node.taskType === "generate_legal") {
    return {
      system: "You are a product counsel writing App Store–friendly legal docs. Avoid medical/legal overclaims.",
      prompt:
        base +
        "\nGenerate: Privacy Policy, Terms of Service, and a short-form EULA compatible with Apple's standard requirements. Include 'Delete My Data' language if requested."
    };
  }
  if (node.taskType === "generate_screenshots_spec") {
    return {
      system: "You are an App Store listing expert. Produce screenshot copy that is short and benefit-driven.",
      prompt:
        base +
        "\nGenerate: screenshot plan for iPhone 6.7 and 6.1 (5 screenshots each). Include titles + captions + what the screen shows. Output as JSON."
    };
  }
  if (node.taskType === "generate_code") {
    return {
      system:
        "You are a senior React Native/Expo engineer. Output ONLY a JSON object with keys: files (array of {path, content}). No prose.",
      prompt:
        base +
        "\nGenerate code changes as files for an Expo app template. Include navigation, a paywall screen placeholder, and Apple Sign In placeholder wiring. Output strict JSON."
    };
  }
  if (node.taskType === "fix_errors") {
    return {
      system:
        "You are a debugging assistant. Output ONLY a JSON object with keys: files (array of {path, content}) to fix errors. No prose.",
      prompt:
        base + "\nFix the build/type errors described in input.errorLog. Output strict JSON."
    };
  }
  if (node.taskType === "validate_compliance") {
    return {
      system: "You are an App Store reviewer. Identify compliance risks and required changes.",
      prompt:
        base +
        "\nReturn a concise compliance report with: risks, missing items, and required edits to pass App Review."
    };
  }

  return { prompt: base + "\nProvide your best output." };
}

function tryParseJsonFiles(text: string): { files: Array<{ path: string; content: string }> } | null {
  try {
    const obj = JSON.parse(text);
    if (!obj || !Array.isArray(obj.files)) return null;
    return { files: obj.files };
  } catch {
    return null;
  }
}

function writeFiles(rootDir: string, files: Array<{ path: string; content: string }>) {
  for (const f of files) {
    const abs = path.join(rootDir, f.path);
    ensureDir(path.dirname(abs));
    fs.writeFileSync(abs, f.content, "utf-8");
  }
}

function basicValidateExpoProject(expoDir: string): { ok: boolean; errorLog?: string } {
  // MVP validator: check for key files existing
  const must = ["app.json", "package.json"];
  const missing = must.filter((m) => !fs.existsSync(path.join(expoDir, m)));
  if (missing.length) return { ok: false, errorLog: `Missing required files: ${missing.join(", ")}` };
  return { ok: true };
}

export async function executeTaskGraph(graph: TaskGraph, ctx: ExecutorContext): Promise<NodeResult[]> {
  const logger = createSupabaseRouterLogger();
  const ordered = topoSort(graph.nodes);
  const results: NodeResult[] = [];

  ensureDir(ctx.artifactsDir);

  for (const node of ordered) {
    const { system, prompt } = buildPrompt(node);

    // Small repair loop for nodes that must output JSON files.
    const needsFiles = node.taskType === "generate_code" || node.taskType === "fix_errors";
    const maxAttempts = needsFiles ? 3 : 2;

    let ok = false;
    let lastError = "";
    let outputText = "";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const resp = await runWithRouting({
          input: {
            task: node.taskType as any,
            prompt,
            system,
            projectId: ctx.projectId,
            userId: ctx.userId,
            budgetUsdRemaining: ctx.budgetUsdRemaining,
            maxOutputTokens: 1400,
            temperature: 0.2,
            preferCheap: node.taskType === "intent_classify"
          },
          providers: ctx.providers,
          logger
        });

        outputText = resp.text;

        if (needsFiles) {
          const parsed = tryParseJsonFiles(outputText);
          if (!parsed) {
            lastError = `Model did not return strict JSON with files[] on attempt ${attempt}.`;
            // Next attempt: reinforce
            node.input = {
              ...(node.input ?? {}),
              errorLog: lastError,
              hint: "Return ONLY valid JSON: {files:[{path,content}]}. No markdown."
            };
            continue;
          }

          const expoDir = path.join(ctx.artifactsDir, "expo");
          ensureDir(expoDir);

          // Write patches into expo folder (template should already exist)
          writeFiles(expoDir, parsed.files);

          // Basic validate
          const val = basicValidateExpoProject(expoDir);
          if (!val.ok) {
            lastError = val.errorLog ?? "Validation failed.";
            // Trigger a fix_errors attempt by feeding error log into same node loop
            node.input = { ...(node.input ?? {}), errorLog: lastError };
            continue;
          }
        }

        ok = true;
        break;
      } catch (e: any) {
        lastError = e?.message ?? String(e);
      }
    }

    results.push({ nodeId: node.id, ok, outputText: ok ? outputText : undefined, error: ok ? undefined : lastError });
  }

  return results;
}

export function makeDefaultGraph(input: {
  appName: string;
  category: string;
  authApple: boolean;
  subscription: boolean;
  backend: "supabase" | "firebase";
  deleteMyData: boolean;
}): TaskGraph {
  return {
    version: "1",
    nodes: [
      {
        id: crypto.randomUUID(),
        title: "Plan architecture",
        taskType: "plan_architecture",
        input
      },
      {
        id: crypto.randomUUID(),
        title: "Generate legal documents",
        taskType: "generate_legal",
        input,
        dependsOn: []
      },
      {
        id: crypto.randomUUID(),
        title: "Generate App Store screenshot spec + captions",
        taskType: "generate_screenshots_spec",
        input,
        dependsOn: []
      }
    ]
  };
}

export function makeBuildMvpGraph(input: {
  appName: string;
  category: string;
  authApple: boolean;
  subscription: boolean;
  backend: "supabase" | "firebase";
  deleteMyData: boolean;
  planResults?: any[];
}): TaskGraph {
  const codeNodeId = crypto.randomUUID();
  const legalNodeId = `legal-${crypto.randomUUID()}`;
  const screenshotNodeId = crypto.randomUUID();

  return {
    version: "1",
    nodes: [
      {
        id: codeNodeId,
        title: "Generate MVP code",
        taskType: "generate_code",
        input: {
          ...input,
          planContext: input.planResults
        }
      },
      {
        id: legalNodeId,
        title: "Generate legal documents",
        taskType: "generate_legal",
        input,
        dependsOn: []
      },
      {
        id: screenshotNodeId,
        title: "Generate App Store screenshot spec",
        taskType: "generate_screenshots_spec",
        input,
        dependsOn: []
      },
      {
        id: crypto.randomUUID(),
        title: "Validate compliance",
        taskType: "validate_compliance",
        input,
        dependsOn: [codeNodeId, legalNodeId]
      }
    ]
  };
}
