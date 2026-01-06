import { runWithRouting, type LlmProvider, type RouterLogger } from "@okapilaunch/ai-router";

// MVP: stub providers + logger.
// Replace with real SDK calls and Supabase writes.

const openaiProvider: LlmProvider = {
  name: "openai",
  async complete({ model, prompt }) {
    // TODO: call OpenAI SDK
    return { text: `[STUB:${model}] ${prompt.slice(0, 120)}...` };
  }
};

const anthropicProvider: LlmProvider = {
  name: "anthropic",
  async complete({ model, prompt }) {
    // TODO: call Anthropic SDK
    return { text: `[STUB:${model}] ${prompt.slice(0, 120)}...` };
  }
};

const logger: RouterLogger = {
  async logDecision(args) {
    console.log("DECISION", JSON.stringify(args, null, 2));
  },
  async logRun(args) {
    console.log("RUN", JSON.stringify(args, null, 2));
  }
};

async function main() {
  // MVP demo run:
  const resp = await runWithRouting({
    input: {
      task: "plan_architecture",
      prompt: "Plan an Expo app with Apple Sign In and subscription paywall. Provide folder structure and key screens.",
      projectId: "demo-project",
      userId: "demo-user",
      budgetUsdRemaining: 1.0,
      maxOutputTokens: 800
    },
    providers: { openai: openaiProvider, anthropic: anthropicProvider },
    logger
  });

  console.log("\n--- RESPONSE ---\n", resp.text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
