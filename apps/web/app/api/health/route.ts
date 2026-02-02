import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";

/**
 * Health check endpoint for load balancers and monitoring
 *
 * GET /api/health - Returns health status
 * GET /api/health?full=true - Returns detailed health with DB check
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fullCheck = searchParams.get("full") === "true";

  const health: {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
    checks: Record<string, { status: string; latency?: number; error?: string }>;
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    checks: {},
  };

  // Basic check - always fast
  health.checks.server = { status: "ok" };

  // Full check - includes database
  if (fullCheck) {
    const dbStart = Date.now();
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("projects").select("id").limit(1);

      if (error) {
        health.checks.database = {
          status: "error",
          latency: Date.now() - dbStart,
          error: "Query failed",
        };
        health.status = "degraded";
      } else {
        health.checks.database = {
          status: "ok",
          latency: Date.now() - dbStart,
        };
      }
    } catch (e) {
      health.checks.database = {
        status: "error",
        latency: Date.now() - dbStart,
        error: "Connection failed",
      };
      health.status = "unhealthy";
    }

    // Check Redis if configured
    if (process.env.UPSTASH_REDIS_REST_URL) {
      health.checks.redis = { status: "configured" };
    } else {
      health.checks.redis = { status: "not_configured" };
    }

    // Check external services configuration
    health.checks.stripe = process.env.STRIPE_SECRET_KEY
      ? { status: "configured" }
      : { status: "not_configured" };

    health.checks.openai = process.env.OPENAI_API_KEY
      ? { status: "configured" }
      : { status: "not_configured" };

    health.checks.anthropic = process.env.ANTHROPIC_API_KEY
      ? { status: "configured" }
      : { status: "not_configured" };
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
