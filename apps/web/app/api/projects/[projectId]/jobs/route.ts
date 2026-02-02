import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase";
import { getSupabaseServer } from "../../../../../lib/supabase-server";

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  // Verify user is authenticated and owns the project
  const authClient = getSupabaseServer();
  const { data: { user } } = await authClient.auth.getUser();

  const supabase = getSupabaseAdmin();

  // Check if project exists and user owns it (or it's anonymous)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", params.projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Authorization check: user must own the project or it must be anonymous
  const userId = user?.id;
  if (project.user_id !== "anonymous" && project.user_id !== userId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("id,type,status,error,created_at,updated_at,payload")
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Jobs fetch error:", error.message);
    return NextResponse.json({ error: "Failed to retrieve jobs" }, { status: 500 });
  }
  return NextResponse.json({ jobs: data ?? [] });
}
