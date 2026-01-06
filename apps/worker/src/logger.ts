import type { RouterLogger } from "@okapilaunch/ai-router";
import { getSupabaseAdmin } from "./supabase.js";

export function createSupabaseRouterLogger(): RouterLogger {
  const supabase = getSupabaseAdmin();

  return {
    async logDecision({ projectId, userId, task, decision }) {
      const { error } = await supabase.from("ai_decisions").insert({
        project_id: projectId,
        user_id: userId,
        task,
        decision
      });
      if (error) console.warn("Failed to log decision:", error.message);
    },

    async logRun({ projectId, userId, task, provider, model, ok, error, usage, costUsdEst }) {
      const { error: insErr } = await supabase.from("ai_runs").insert({
        project_id: projectId,
        user_id: userId,
        task,
        provider,
        model,
        ok,
        error: error ?? null,
        usage: usage ?? null,
        cost_usd_est: costUsdEst ?? null
      });
      if (insErr) console.warn("Failed to log run:", insErr.message);
    }
  };
}
