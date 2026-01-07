import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { getSupabaseServer } from "../../../lib/supabase-server";
import { WizardPayloadSchema } from "@okapilaunch/core";
import { ZodError } from "zod";
import { checkRateLimit, getClientId, RATE_LIMITS } from "../../../lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 5 project creations per minute
  const clientId = getClientId(req);
  const rateLimitResult = checkRateLimit(`projects:create:${clientId}`, RATE_LIMITS.heavy);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimitResult.resetTime)
        }
      }
    );
  }
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate wizard payload with Zod
    const wizardResult = WizardPayloadSchema.safeParse(body.wizard ?? body);
    if (!wizardResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: wizardResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const wizard = wizardResult.data;
    const supabase = getSupabaseAdmin();

    // Require authentication
    const authClient = getSupabaseServer();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to create a project", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Check subscription and usage limits
    // Use maybeSingle() to avoid errors when no row exists (new users)
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: usage } = await supabase
      .from("usage")
      .select("projects_created")
      .eq("user_id", userId)
      .maybeSingle();

    // Initialize records for new users if they don't exist
    if (!subscription) {
      await supabase
        .from("subscriptions")
        .insert({ user_id: userId, plan: "free", status: "active" });
    }

    if (!usage) {
      await supabase
        .from("usage")
        .insert({ user_id: userId, projects_created: 0, projects_limit: 1 });
    }

    const plan = subscription?.plan || "free";
    const projectsCreated = usage?.projects_created || 0;

    // Define limits per plan
    const limits: Record<string, number> = {
      free: 1,
      pro: 999999,
      team: 999999
    };

    const projectLimit = limits[plan] || 1;

    if (projectsCreated >= projectLimit) {
      return NextResponse.json(
        {
          error: plan === "free"
            ? "You've used your free project. Upgrade to Pro for unlimited projects!"
            : "Project limit reached",
          code: "LIMIT_REACHED",
          usage: { projects_created: projectsCreated, limit: projectLimit },
          upgradeUrl: "/pricing"
        },
        { status: 403 }
      );
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: wizard.name
      })
      .select("id")
      .single();

    if (projectError || !project) {
      console.error("Failed to create project:", projectError);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    const projectId = project.id;

    // Queue initial "plan" job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        project_id: projectId,
        type: "plan",
        status: "queued",
        payload: { wizard }
      })
      .select("id")
      .single();

    if (jobError || !job) {
      console.error("Failed to queue job:", jobError);
      // Attempt cleanup of orphan project
      await supabase.from("projects").delete().eq("id", projectId);
      return NextResponse.json(
        { error: "Failed to queue initial job" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      projectId,
      jobId: job.id
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get authenticated user
    const authClient = getSupabaseServer();
    const { data: { user } } = await authClient.auth.getUser();

    const supabase = getSupabaseAdmin();

    // Filter by authenticated user_id or show anonymous projects if not logged in
    const userId = user?.id;
    let query = supabase
      .from("projects")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (userId) {
      // Show user's own projects
      query = query.eq("user_id", userId);
    } else {
      // Not logged in - only show anonymous projects (if any)
      query = query.eq("user_id", "anonymous");
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("Failed to fetch projects:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects: projects ?? [] });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
