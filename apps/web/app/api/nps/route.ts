import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { getSupabaseServer } from "../../../lib/supabase-server";
import { checkRateLimit, RATE_LIMITS } from "../../../lib/rate-limit";
import { z } from "zod";

const NpsSchema = z.object({
  score: z.number().min(0).max(10),
  reason: z.string().max(1000).optional()
});

export async function POST(req: Request) {
  // Require authentication for NPS
  const authClient = getSupabaseServer();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Rate limit: 1 NPS response per day per user
  const rateLimitResult = checkRateLimit(`nps:${user.id}`, { limit: 1, windowSec: 86400 });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "You've already submitted NPS feedback today. Please try again tomorrow." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = NpsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { score, reason } = result.data;

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("nps_responses")
      .insert({
        user_id: user.id,
        score,
        reason: reason || null
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to save NPS response:", error);
      return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
    }

    // Categorize the response
    let category: string;
    if (score >= 9) {
      category = "promoter";
    } else if (score >= 7) {
      category = "passive";
    } else {
      category = "detractor";
    }

    return NextResponse.json({
      success: true,
      responseId: data.id,
      category,
      message: "Thank you for your feedback!"
    });
  } catch (err) {
    console.error("NPS error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Admin-only endpoint
  const authClient = getSupabaseServer();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30"), 365);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all NPS responses in the period
  const { data: responses, error } = await supabase
    .from("nps_responses")
    .select("score, reason, created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate NPS score
  const total = responses?.length || 0;
  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  responses?.forEach((r) => {
    if (r.score >= 9) promoters++;
    else if (r.score >= 7) passives++;
    else detractors++;
  });

  const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

  return NextResponse.json({
    npsScore,
    total,
    breakdown: {
      promoters,
      passives,
      detractors,
      promoterPercent: total > 0 ? Math.round((promoters / total) * 100) : 0,
      passivePercent: total > 0 ? Math.round((passives / total) * 100) : 0,
      detractorPercent: total > 0 ? Math.round((detractors / total) * 100) : 0
    },
    recentResponses: responses?.slice(0, 20).map((r) => ({
      score: r.score,
      reason: r.reason,
      createdAt: r.created_at,
      category: r.score >= 9 ? "promoter" : r.score >= 7 ? "passive" : "detractor"
    }))
  });
}
