import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { getSupabaseServer } from "../../../lib/supabase-server";
import { WizardPayloadSchema } from "@okapilaunch/core";
import { ZodError } from "zod";

export async function POST(req: Request) {
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

    // Get authenticated user if available
    let userId = "anonymous";
    try {
      const authClient = getSupabaseServer();
      const { data: { user } } = await authClient.auth.getUser();
      if (user?.id) {
        userId = user.id;
      }
    } catch {
      // Continue with anonymous if auth check fails
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
    const supabase = getSupabaseAdmin();

    // For MVP: return all projects. In production, filter by authenticated user_id.
    // TODO: Add auth filter
    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

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
