import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase";

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("id,type,status,error,created_at,updated_at,payload")
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data ?? [] });
}
