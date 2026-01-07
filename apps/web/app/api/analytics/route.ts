import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { getSupabaseServer } from "../../../lib/supabase-server";
import { getAnalyticsSummary, getInvestorMetrics } from "../../../lib/analytics";
import { isAdmin } from "../../../lib/admin";

export async function GET(req: Request) {
  // Require authentication
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
  const type = searchParams.get("type") || "summary";
  const days = Math.min(parseInt(searchParams.get("days") || "30"), 365);

  try {
    if (type === "summary") {
      const summary = await getAnalyticsSummary(days);
      return NextResponse.json(summary);
    }

    if (type === "investor") {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await getInvestorMetrics(startDate, endDate);
      return NextResponse.json(metrics);
    }

    if (type === "usage") {
      const supabase = getSupabaseAdmin();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get API usage stats
      const { data: usageData, error } = await supabase
        .from("api_usage")
        .select("endpoint, method, status_code, response_time_ms, created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Aggregate by endpoint
      const endpointStats: Record<string, { count: number; avgResponseTime: number; errors: number }> = {};

      usageData?.forEach((u) => {
        const key = `${u.method} ${u.endpoint}`;
        if (!endpointStats[key]) {
          endpointStats[key] = { count: 0, avgResponseTime: 0, errors: 0 };
        }
        endpointStats[key].count++;
        endpointStats[key].avgResponseTime += u.response_time_ms || 0;
        if (u.status_code && u.status_code >= 400) {
          endpointStats[key].errors++;
        }
      });

      // Calculate averages
      Object.keys(endpointStats).forEach((key) => {
        const stats = endpointStats[key];
        stats.avgResponseTime = Math.round(stats.avgResponseTime / stats.count);
      });

      return NextResponse.json({
        totalRequests: usageData?.length || 0,
        endpointStats,
        recentRequests: usageData?.slice(0, 50)
      });
    }

    if (type === "violations") {
      const supabase = getSupabaseAdmin();

      // Get rate limit violations
      const { data: violations, error } = await supabase
        .from("rate_limit_violations")
        .select("*")
        .order("last_violation_at", { ascending: false })
        .limit(100);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Summary stats
      const totalViolations = violations?.reduce((sum, v) => sum + (v.violation_count || 1), 0) || 0;
      const uniqueIps = new Set(violations?.map((v) => v.ip_hash)).size;
      const blocked = violations?.filter((v) => v.is_blocked).length || 0;

      return NextResponse.json({
        totalViolations,
        uniqueIps,
        blocked,
        violations: violations?.slice(0, 50)
      });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
