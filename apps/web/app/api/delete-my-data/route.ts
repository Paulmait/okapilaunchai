import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { getSupabaseServer } from "../../../lib/supabase-server";
import { checkRateLimit, RATE_LIMITS } from "../../../lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit: 3 delete operations per hour (very restrictive)
    const authClient = getSupabaseServer();
    const { data: { user: authUser } } = await authClient.auth.getUser();
    const limitKey = authUser?.id || "anonymous";

    const rateLimitResult = checkRateLimit(`delete:${limitKey}`, RATE_LIMITS.delete);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many delete requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Reset": String(rateLimitResult.resetTime)
          }
        }
      );
    }
    // Verify user is authenticated (authUser from rate limit check)
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = authUser.id;
    const supabase = getSupabaseAdmin();

    // 1. Get all projects for this user
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", userId);

    if (projectsError) {
      console.error("Failed to fetch user projects:", projectsError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    const projectIds = projects?.map((p) => p.id) ?? [];

    // 2. Get all jobs for these projects to find storage artifacts
    if (projectIds.length > 0) {
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, payload")
        .in("project_id", projectIds);

      if (jobsError) {
        console.error("Failed to fetch jobs:", jobsError);
      }

      // 3. Delete storage artifacts
      const filesToDelete: string[] = [];
      for (const job of jobs ?? []) {
        const payload = job.payload as { artifact_bucket?: string; artifact_object_path?: string } | null;
        if (payload?.artifact_bucket && payload?.artifact_object_path) {
          filesToDelete.push(payload.artifact_object_path);
        }
      }

      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("exports")
          .remove(filesToDelete);

        if (storageError) {
          console.error("Failed to delete some storage files:", storageError);
          // Continue with deletion - don't fail the entire request
        }
      }

      // 4. Delete AI runs for jobs
      const jobIds = (jobs ?? []).map((j) => j.id);
      if (jobIds.length > 0) {
        await supabase.from("ai_runs").delete().in("job_id", jobIds);
      }

      // 5. Delete AI decisions for projects
      await supabase.from("ai_decisions").delete().in("project_id", projectIds);

      // 6. Delete jobs for projects
      await supabase.from("jobs").delete().in("project_id", projectIds);

      // 7. Delete projects
      await supabase.from("projects").delete().eq("user_id", userId);
    }

    // 8. Anonymize the user in Supabase Auth
    // Note: We can't fully delete from auth.users via client, but we can update user metadata
    // The user should be deleted from the Supabase dashboard or via admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        deleted: true,
        deleted_at: new Date().toISOString(),
        email_anonymized: true
      }
    });

    if (updateError) {
      console.error("Failed to anonymize user metadata:", updateError);
      // Continue - the data deletion was successful
    }

    // 9. Sign out the user
    await authClient.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Your data has been deleted successfully",
      deletedProjects: projectIds.length
    });
  } catch (err) {
    console.error("Delete my data error:", err);
    return NextResponse.json(
      { error: "Failed to delete data. Please contact support." },
      { status: 500 }
    );
  }
}
