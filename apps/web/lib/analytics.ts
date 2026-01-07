/**
 * Analytics tracking for OkapiLaunch AI
 * Tracks user actions for product analytics and investor reporting
 */

import { getSupabaseAdmin } from "./supabase";
import crypto from "crypto";

export type EventType =
  | "page_view"
  | "signup"
  | "login"
  | "logout"
  | "project_created"
  | "project_viewed"
  | "job_started"
  | "job_completed"
  | "job_failed"
  | "export_downloaded"
  | "feedback_submitted"
  | "nps_submitted"
  | "button_click"
  | "feature_used"
  | "error";

export type AnalyticsEvent = {
  eventType: EventType;
  eventName: string;
  userId?: string;
  sessionId?: string;
  pagePath?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  eventData?: Record<string, unknown>;
};

/**
 * Hash IP address for privacy-safe analytics
 */
function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "okapi-salt").digest("hex").substring(0, 16);
}

/**
 * Track an analytics event
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    await supabase.from("analytics_events").insert({
      user_id: event.userId || null,
      session_id: event.sessionId || null,
      event_type: event.eventType,
      event_name: event.eventName,
      event_data: event.eventData || {},
      page_path: event.pagePath || null,
      referrer: event.referrer || null,
      user_agent: event.userAgent || null,
      ip_hash: event.ipAddress ? hashIp(event.ipAddress) : null
    });
  } catch (error) {
    // Don't let analytics errors break the app
    console.error("Analytics tracking error:", error);
  }
}

/**
 * Track API usage for abuse detection and metrics
 */
export async function trackApiUsage(data: {
  userId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  requestSizeBytes?: number;
  responseSizeBytes?: number;
  ipAddress?: string;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    await supabase.from("api_usage").insert({
      user_id: data.userId || null,
      endpoint: data.endpoint,
      method: data.method,
      status_code: data.statusCode,
      response_time_ms: data.responseTimeMs,
      request_size_bytes: data.requestSizeBytes || null,
      response_size_bytes: data.responseSizeBytes || null,
      ip_hash: data.ipAddress ? hashIp(data.ipAddress) : null
    });
  } catch (error) {
    console.error("API usage tracking error:", error);
  }
}

/**
 * Record a rate limit violation
 */
export async function recordRateLimitViolation(data: {
  ipAddress: string;
  userId?: string;
  endpoint: string;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const ipHash = hashIp(data.ipAddress);

    // Check if there's an existing violation record
    const { data: existing } = await supabase
      .from("rate_limit_violations")
      .select("id, violation_count")
      .eq("ip_hash", ipHash)
      .eq("endpoint", data.endpoint)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from("rate_limit_violations")
        .update({
          violation_count: existing.violation_count + 1,
          last_violation_at: new Date().toISOString(),
          user_id: data.userId || null
        })
        .eq("id", existing.id);
    } else {
      // Create new record
      await supabase.from("rate_limit_violations").insert({
        ip_hash: ipHash,
        user_id: data.userId || null,
        endpoint: data.endpoint
      });
    }
  } catch (error) {
    console.error("Rate limit violation tracking error:", error);
  }
}

/**
 * Get analytics summary for admin dashboard
 */
export async function getAnalyticsSummary(days: number = 30): Promise<{
  totalUsers: number;
  totalProjects: number;
  totalExports: number;
  conversionRate: number;
  dailyActiveUsers: number;
  topEvents: Array<{ event_name: string; count: number }>;
}> {
  const supabase = getSupabaseAdmin();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get total users
  const { count: totalUsers } = await supabase
    .from("analytics_events")
    .select("user_id", { count: "exact", head: true })
    .eq("event_type", "signup")
    .gte("created_at", startDate.toISOString());

  // Get total projects
  const { count: totalProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startDate.toISOString());

  // Get total exports
  const { count: totalExports } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "export_downloaded")
    .gte("created_at", startDate.toISOString());

  // Get page views for conversion rate
  const { count: pageViews } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "page_view")
    .gte("created_at", startDate.toISOString());

  // Calculate conversion rate (signups / unique visitors)
  const conversionRate = pageViews && pageViews > 0 ? ((totalUsers || 0) / pageViews) * 100 : 0;

  // Get daily active users (last 24 hours)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const { count: dailyActiveUsers } = await supabase
    .from("analytics_events")
    .select("user_id", { count: "exact", head: true })
    .not("user_id", "is", null)
    .gte("created_at", yesterday.toISOString());

  return {
    totalUsers: totalUsers || 0,
    totalProjects: totalProjects || 0,
    totalExports: totalExports || 0,
    conversionRate: Math.round(conversionRate * 100) / 100,
    dailyActiveUsers: dailyActiveUsers || 0,
    topEvents: []
  };
}

/**
 * Get detailed metrics for investor reporting
 */
export async function getInvestorMetrics(startDate: Date, endDate: Date): Promise<{
  summary: {
    totalSignups: number;
    totalProjects: number;
    totalRevenue: number;
    avgProjectsPerUser: number;
    retentionRate: number;
  };
  growth: {
    signupGrowth: number;
    projectGrowth: number;
    revenueGrowth: number;
  };
  dailyData: Array<{
    date: string;
    signups: number;
    projects: number;
    exports: number;
    revenue: number;
  }>;
  userSegments: {
    free: number;
    pro: number;
    team: number;
  };
  topFeatures: Array<{ feature: string; usage: number }>;
  npsScore: number;
}> {
  const supabase = getSupabaseAdmin();

  // Get basic counts
  const { count: totalSignups } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "signup")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  const { count: totalProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  // Get daily metrics if they exist
  const { data: dailyMetrics } = await supabase
    .from("daily_metrics")
    .select("*")
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])
    .order("date", { ascending: true });

  // Calculate NPS score
  const { data: npsData } = await supabase
    .from("nps_responses")
    .select("score")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  let npsScore = 0;
  if (npsData && npsData.length > 0) {
    const promoters = npsData.filter((r) => r.score >= 9).length;
    const detractors = npsData.filter((r) => r.score <= 6).length;
    npsScore = Math.round(((promoters - detractors) / npsData.length) * 100);
  }

  return {
    summary: {
      totalSignups: totalSignups || 0,
      totalProjects: totalProjects || 0,
      totalRevenue: 0, // Would come from payment provider
      avgProjectsPerUser: totalSignups ? (totalProjects || 0) / totalSignups : 0,
      retentionRate: 0 // Would need cohort analysis
    },
    growth: {
      signupGrowth: 0, // Would compare to previous period
      projectGrowth: 0,
      revenueGrowth: 0
    },
    dailyData: (dailyMetrics || []).map((m) => ({
      date: m.date,
      signups: m.total_signups,
      projects: m.total_projects_created,
      exports: m.total_exports_downloaded,
      revenue: Number(m.revenue_usd)
    })),
    userSegments: {
      free: totalSignups || 0, // Would need subscription data
      pro: 0,
      team: 0
    },
    topFeatures: [],
    npsScore
  };
}
