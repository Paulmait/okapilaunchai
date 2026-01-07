import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

export async function GET() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 });
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.delete({ name, ...options });
      }
    }
  });

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get usage - use maybeSingle() to avoid errors for new users
  const { data: usage } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // If no records exist, create them for new/existing users
  if (!usage || !subscription) {
    const { getSupabaseAdmin } = await import("../../../lib/supabase");
    const adminClient = getSupabaseAdmin();

    if (!usage) {
      await adminClient.from("usage").insert({
        user_id: user.id,
        projects_limit: 1,
        projects_created: 0
      });
    }

    if (!subscription) {
      await adminClient.from("subscriptions").insert({
        user_id: user.id,
        plan: "free",
        status: "active"
      });
    }

    return NextResponse.json({
      usage: { projects_created: 0, projects_limit: 1 },
      subscription: { plan: "free", status: "active" },
      canCreateProject: true
    });
  }

  const plan = subscription?.plan || "free";
  const projectsCreated = usage?.projects_created || 0;
  const projectsLimit = plan === "free" ? 1 : plan === "pro" ? 999999 : 999999;
  const canCreateProject = projectsCreated < projectsLimit;

  return NextResponse.json({
    usage: {
      projects_created: projectsCreated,
      projects_limit: projectsLimit,
      ai_tokens_used: usage?.ai_tokens_used || 0,
      storage_bytes_used: usage?.storage_bytes_used || 0
    },
    subscription: {
      plan,
      status: subscription?.status || "active",
      current_period_end: subscription?.current_period_end
    },
    canCreateProject
  });
}
