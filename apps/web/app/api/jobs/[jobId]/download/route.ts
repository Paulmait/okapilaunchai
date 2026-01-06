import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase";

export async function GET(_req: Request, { params }: { params: { jobId: string } }) {
  const supabase = getSupabaseAdmin();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id,status,payload")
    .eq("id", params.jobId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.status !== "succeeded") return NextResponse.json({ error: "Job not ready" }, { status: 409 });

  const payload = (job.payload ?? {}) as any;
  const bucket = payload.artifact_bucket;
  const objectPath = payload.artifact_object_path;

  if (!bucket || !objectPath) {
    return NextResponse.json({ error: "Missing artifact location" }, { status: 500 });
  }

  const { data: signed, error: sErr } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 10); // 10 minutes
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  return NextResponse.json({ url: signed.signedUrl, expiresIn: 600 });
}
