// Multi-provider, cost-aware router (MVP)
// NOTE: Provider implementations are stubs; wire to SDKs in providers/*.

export type Provider = "openai" | "anthropic";

export type TaskType =
  | "intent_classify"
  | "plan_architecture"
  | "generate_code"
  | "fix_errors"
  | "generate_copy"
  | "generate_legal"
  | "generate_screenshots_spec"
  | "validate_compliance";

export type RouterInput = {
  task: TaskType;
  prompt: string;
  system?: string;
  projectId: string;
  userId: string;
  maxOutputTokens?: number;
  temperature?: number;
  budgetUsdRemaining: number;
  preferCheap?: boolean;
};

export type ModelChoice = {
  provider: Provider;
  model: string;
  estUsdPer1kTokens: number;
};

export type RouterDecision = {
  choice: ModelChoice;
  reason: string[];
  hardLimits: {
    maxRetries: number;
    timeoutMs: number;
  };
};

export type LlmResponse = {
  text: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  raw?: unknown;
};

export interface LlmProvider {
  name: Provider;
  complete(args: {
    model: string;
    prompt: string;
    system?: string;
    maxOutputTokens?: number;
    temperature?: number;
    timeoutMs: number;
  }): Promise<LlmResponse>;
}

export interface RouterLogger {
  logDecision(args: {
    projectId: string;
    userId: string;
    task: TaskType;
    decision: RouterDecision;
  }): Promise<void>;
  logRun(args: {
    projectId: string;
    userId: string;
    task: TaskType;
    provider: Provider;
    model: string;
    ok: boolean;
    error?: string;
    usage?: LlmResponse["usage"];
    costUsdEst?: number;
  }): Promise<void>;
}

const CATALOG: Record<string, ModelChoice> = {
  "cheap.openai": { provider: "openai", model: "gpt-4o-mini", estUsdPer1kTokens: 0.0006 },
  "strong.openai": { provider: "openai", model: "gpt-4.1", estUsdPer1kTokens: 0.01 },
  "strong.anthropic": { provider: "anthropic", model: "claude-3-7-sonnet", estUsdPer1kTokens: 0.012 }
};

function roughTokenCount(text: string) {
  return Math.ceil(text.length / 4);
}
function estCostUsd(choice: ModelChoice, prompt: string, maxOutputTokens = 800) {
  const inTok = roughTokenCount(prompt);
  const outTok = maxOutputTokens;
  const totalTok = inTok + outTok;
  return (totalTok / 1000) * choice.estUsdPer1kTokens;
}

export function decide(input: RouterInput): RouterDecision {
  const reason: string[] = [];
  const hardLimits = { maxRetries: 2, timeoutMs: 60_000 };
  let primary: ModelChoice;

  switch (input.task) {
    case "intent_classify":
      primary = CATALOG["cheap.openai"];
      reason.push("Intent classification: cheap/fast.");
      hardLimits.maxRetries = 1;
      hardLimits.timeoutMs = 15_000;
      break;

    case "plan_architecture":
    case "validate_compliance":
    case "generate_legal":
      primary = CATALOG["strong.anthropic"];
      reason.push("Architecture/compliance/legal: Claude.");
      break;

    case "generate_code":
    case "generate_copy":
    case "generate_screenshots_spec":
      primary = CATALOG["strong.openai"];
      reason.push("Generation: OpenAI strong.");
      break;

    case "fix_errors":
      primary = CATALOG["strong.anthropic"];
      reason.push("Fix loop: Claude.");
      hardLimits.maxRetries = 3;
      break;

    default:
      primary = CATALOG["cheap.openai"];
      reason.push("Fallback: cheap.");
      break;
  }

  const est = estCostUsd(primary, input.prompt, input.maxOutputTokens);
  if (est > input.budgetUsdRemaining) {
    reason.push(`Budget guardrail: est ${est.toFixed(4)} > remaining ${input.budgetUsdRemaining.toFixed(4)}.`);
    primary = CATALOG["cheap.openai"];
    reason.push("Downgrade to cheap model.");
    hardLimits.maxRetries = 1;
  }

  if (input.preferCheap) {
    reason.push("preferCheap: force cheap model.");
    primary = CATALOG["cheap.openai"];
    hardLimits.maxRetries = 1;
  }

  return { choice: primary, reason, hardLimits };
}

export async function runWithRouting(args: {
  input: RouterInput;
  providers: Record<Provider, LlmProvider>;
  logger: RouterLogger;
}): Promise<LlmResponse> {
  const { input, providers, logger } = args;
  const decision = decide(input);

  await logger.logDecision({ projectId: input.projectId, userId: input.userId, task: input.task, decision });

  const provider = providers[decision.choice.provider];
  let lastErr: unknown;

  for (let attempt = 1; attempt <= decision.hardLimits.maxRetries; attempt++) {
    try {
      const resp = await provider.complete({
        model: decision.choice.model,
        prompt: input.prompt,
        system: input.system,
        maxOutputTokens: input.maxOutputTokens,
        temperature: input.temperature,
        timeoutMs: decision.hardLimits.timeoutMs
      });

      await logger.logRun({
        projectId: input.projectId,
        userId: input.userId,
        task: input.task,
        provider: decision.choice.provider,
        model: decision.choice.model,
        ok: true,
        usage: resp.usage,
        costUsdEst: estCostUsd(decision.choice, input.prompt, input.maxOutputTokens)
      });

      return resp;
    } catch (err) {
      lastErr = err;
      await logger.logRun({
        projectId: input.projectId,
        userId: input.userId,
        task: input.task,
        provider: decision.choice.provider,
        model: decision.choice.model,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        costUsdEst: estCostUsd(decision.choice, input.prompt, input.maxOutputTokens)
      });
    }
  }

  throw new Error(
    `LLM call failed after ${decision.hardLimits.maxRetries} attempts for task=${input.task}. Last error: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`
  );
}
