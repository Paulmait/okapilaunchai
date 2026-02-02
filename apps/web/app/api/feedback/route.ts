import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { getSupabaseServer } from "../../../lib/supabase-server";
import { checkRateLimit, getClientId, RATE_LIMITS } from "../../../lib/rate-limit";
import { isAdmin, logAdminAction } from "../../../lib/admin";
import { z } from "zod";

const FeedbackSchema = z.object({
  feedbackType: z.enum(["bug", "feature_request", "complaint", "praise", "general"]),
  rating: z.number().min(1).max(5).optional(),
  message: z.string().min(10).max(2000),
  pagePath: z.string().optional(),
  context: z.record(z.unknown()).optional()
});

export async function POST(req: Request) {
  // Rate limit: 10 feedback submissions per hour
  const clientId = getClientId(req);
  const rateLimitResult = checkRateLimit(`feedback:${clientId}`, { limit: 10, windowSec: 3600 });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many feedback submissions. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = FeedbackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { feedbackType, rating, message, pagePath, context } = result.data;

    // Get authenticated user if available
    let userId = null;
    try {
      const authClient = getSupabaseServer();
      const { data: { user } } = await authClient.auth.getUser();
      if (user?.id) {
        userId = user.id;
      }
    } catch {
      // Continue without user ID
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("user_feedback")
      .insert({
        user_id: userId,
        feedback_type: feedbackType,
        rating: rating || null,
        message,
        page_path: pagePath || null,
        context: context || {}
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to save feedback:", error);
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      feedbackId: data.id,
      message: "Thank you for your feedback!"
    });
  } catch (err) {
    console.error("Feedback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Only allow admin access
  const authClient = getSupabaseServer();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Require admin role
  if (!isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  // Log admin action
  await logAdminAction(user.id, "view_feedback", {
    targetType: "feedback",
    metadata: { status, type },
    ipAddress: getClientId(req),
    userAgent: req.headers.get("user-agent") || undefined,
  });

  const supabase = getSupabaseAdmin();
  const limitParam = parseInt(searchParams.get("limit") || "50", 10);
  const limit = Math.min(isNaN(limitParam) ? 50 : limitParam, 100);

  // Validate status and type parameters
  const validStatuses = ["open", "resolved", "pending"];
  const validTypes = ["bug", "feature_request", "complaint", "praise", "general"];

  let query = supabase
    .from("user_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 });
    }
    query = query.eq("status", status);
  }

  if (type) {
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }
    query = query.eq("feedback_type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Feedback fetch error:", error.message);
    return NextResponse.json({ error: "Failed to retrieve feedback data" }, { status: 500 });
  }

  return NextResponse.json({ feedback: data });
}
