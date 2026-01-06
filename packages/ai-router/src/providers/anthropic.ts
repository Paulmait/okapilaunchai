import Anthropic from "@anthropic-ai/sdk";
import type { LlmProvider, LlmResponse } from "../router.js";

export function createAnthropicProvider(args?: { apiKey?: string }): LlmProvider {
  const client = new Anthropic({ apiKey: args?.apiKey ?? process.env.ANTHROPIC_API_KEY });

  return {
    name: "anthropic",
    async complete({ model, prompt, system, maxOutputTokens, temperature, timeoutMs }): Promise<LlmResponse> {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Anthropic Messages API
        const msg = await client.messages.create(
          {
            model,
            max_tokens: maxOutputTokens ?? 800,
            temperature: temperature ?? 0.2,
            system: system ?? undefined,
            messages: [{ role: "user", content: prompt }]
          },
          { signal: controller.signal }
        );

        const text = (msg.content ?? [])
          .map((c: any) => (c.type === "text" ? c.text : ""))
          .join("")
          .trim();

        const usage = (msg.usage ?? undefined)
          ? {
              inputTokens: (msg as any).usage.input_tokens,
              outputTokens: (msg as any).usage.output_tokens,
              totalTokens: ((msg as any).usage.input_tokens ?? 0) + ((msg as any).usage.output_tokens ?? 0)
            }
          : undefined;

        return { text, usage, raw: msg };
      } finally {
        clearTimeout(t);
      }
    }
  };
}
