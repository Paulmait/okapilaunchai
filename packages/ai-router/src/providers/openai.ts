import OpenAI from "openai";
import type { LlmProvider, LlmResponse } from "../router.js";

export function createOpenAIProvider(args?: { apiKey?: string }): LlmProvider {
  const client = new OpenAI({ apiKey: args?.apiKey ?? process.env.OPENAI_API_KEY });

  return {
    name: "openai",
    async complete({ model, prompt, system, maxOutputTokens, temperature, timeoutMs }): Promise<LlmResponse> {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Using Responses API for modern OpenAI SDKs
        const resp = await client.responses.create(
          {
            model,
            input: [
              ...(system ? [{ role: "system" as const, content: system }] : []),
              { role: "user" as const, content: prompt }
            ],
            max_output_tokens: maxOutputTokens ?? 800,
            temperature: temperature ?? 0.2
          },
          { signal: controller.signal }
        );

        // Extract text
        const text = (resp.output_text ?? "").trim();

        // Best-effort usage extraction
        const usage = (resp as any).usage
          ? {
              inputTokens: (resp as any).usage.input_tokens,
              outputTokens: (resp as any).usage.output_tokens,
              totalTokens: (resp as any).usage.total_tokens
            }
          : undefined;

        return { text, usage, raw: resp };
      } finally {
        clearTimeout(t);
      }
    }
  };
}
