/**
 * Admin authorization utilities
 *
 * Uses database-backed admin roles with environment variable fallback.
 *
 * DATABASE SETUP:
 * Run migration 0005_admin_users.sql to create the admin_users table.
 * Then insert admin users:
 *
 *   INSERT INTO admin_users (user_id, email, role)
 *   VALUES ('user-uuid', 'admin@example.com', 'admin');
 *
 * FALLBACK:
 * If database check fails or is not set up, falls back to ADMIN_EMAIL env var.
 * Set ADMIN_EMAIL=email@example.com in your environment.
 */

import { getSupabaseAdmin } from "./supabase";

// Fallback admin emails from environment (for backwards compatibility)
const FALLBACK_ADMIN_EMAILS = process.env.ADMIN_EMAIL
  ? [process.env.ADMIN_EMAIL]
  : [];

// Cache for admin status to reduce DB queries (5 minute TTL)
const adminCache = new Map<string, { isAdmin: boolean; role: string | null; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a user is an admin (synchronous, uses cache or fallback)
 * For new code, prefer isAdminAsync() for accurate database checks
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;

  // Check cache first
  const cached = adminCache.get(email);
  if (cached && cached.expires > Date.now()) {
    return cached.isAdmin;
  }

  // Fallback to environment variable check
  return FALLBACK_ADMIN_EMAILS.includes(email);
}

/**
 * Check if a user is an admin (async, uses database)
 * This is the preferred method for accurate admin checks
 *
 * @param userId - The user's UUID from auth
 * @param email - The user's email (used for fallback)
 * @returns Object with isAdmin status and role
 */
export async function isAdminAsync(
  userId: string | undefined | null,
  email: string | undefined | null
): Promise<{ isAdmin: boolean; role: string | null }> {
  // Check cache first
  const cacheKey = userId || email || "";
  const cached = adminCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return { isAdmin: cached.isAdmin, role: cached.role };
  }

  // Default result
  let result = { isAdmin: false, role: null as string | null };

  // Try database check if we have a userId
  if (userId) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", userId)
        .is("revoked_at", null)
        .single();

      if (!error && data) {
        result = { isAdmin: true, role: data.role };
      }
    } catch (e) {
      // Database might not have the table yet, fall through to email check
      console.warn("[Admin] Database check failed, using fallback:", e);
    }
  }

  // Fallback to email check if database didn't find admin
  if (!result.isAdmin && email && FALLBACK_ADMIN_EMAILS.includes(email)) {
    result = { isAdmin: true, role: "admin" };
  }

  // Cache the result
  adminCache.set(cacheKey, {
    isAdmin: result.isAdmin,
    role: result.role,
    expires: Date.now() + CACHE_TTL_MS,
  });

  return result;
}

/**
 * Check if a user is a super admin
 */
export async function isSuperAdmin(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;

  const { role } = await isAdminAsync(userId, null);
  return role === "super_admin";
}

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  options: {
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_type: options.targetType || null,
      target_id: options.targetId || null,
      metadata: options.metadata || null,
      ip_address: options.ipAddress || null,
      user_agent: options.userAgent || null,
    });
  } catch (e) {
    // Don't fail the request if audit logging fails
    console.error("[Admin] Failed to log admin action:", e);
  }
}

/**
 * Get list of admin emails (for debugging/display)
 * Returns only the fallback emails, not database admins
 */
export function getAdminEmails(): string[] {
  return FALLBACK_ADMIN_EMAILS;
}

/**
 * Clear the admin cache (useful after role changes)
 */
export function clearAdminCache(): void {
  adminCache.clear();
}

/**
 * Clear cache for a specific user
 */
export function clearAdminCacheForUser(userIdOrEmail: string): void {
  adminCache.delete(userIdOrEmail);
}

/**
 * Check admin password rotation status
 * Returns password expiry information for the admin user
 */
export async function checkPasswordRotationStatus(
  userId: string
): Promise<{
  isExpired: boolean;
  daysUntilExpiry: number;
  needsRotation: boolean;
  expiresAt: Date | null;
} | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("admin_users")
      .select("password_expires_at, force_password_change")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .single();

    if (error || !data) {
      return null;
    }

    const expiresAt = data.password_expires_at ? new Date(data.password_expires_at) : null;
    const now = new Date();
    const daysUntilExpiry = expiresAt
      ? Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    const isExpired = expiresAt ? expiresAt < now : false;
    const needsRotation = isExpired || data.force_password_change === true;

    return {
      isExpired,
      daysUntilExpiry,
      needsRotation,
      expiresAt,
    };
  } catch (e) {
    console.error("[Admin] Failed to check password rotation status:", e);
    return null;
  }
}

/**
 * Mark admin password as changed (resets the 6-month timer)
 */
export async function markPasswordChanged(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();

    // Call the database function
    const { error } = await supabase.rpc("admin_password_changed", {
      admin_user_id: userId,
    });

    if (error) {
      console.error("[Admin] Failed to mark password changed:", error);
      return false;
    }

    // Clear cache for this user
    clearAdminCacheForUser(userId);

    return true;
  } catch (e) {
    console.error("[Admin] Failed to mark password changed:", e);
    return false;
  }
}

/**
 * Get all admins with passwords expiring within 14 days
 * Useful for sending reminder emails
 */
export async function getAdminsWithExpiringPasswords(): Promise<
  Array<{
    id: string;
    email: string;
    daysUntilExpiry: number;
    reminderSent: boolean;
  }>
> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("get_admins_with_expiring_passwords");

    if (error || !data) {
      return [];
    }

    return data.map((row: { id: string; email: string; days_until_expiry: number; reminder_sent: boolean }) => ({
      id: row.id,
      email: row.email,
      daysUntilExpiry: row.days_until_expiry,
      reminderSent: row.reminder_sent,
    }));
  } catch (e) {
    console.error("[Admin] Failed to get admins with expiring passwords:", e);
    return [];
  }
}

/**
 * Force an admin to change their password on next login
 */
export async function forcePasswordRotation(
  adminUserId: string,
  reason: string = "security_policy"
): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("force_admin_password_rotation", {
      admin_user_id: adminUserId,
      reason,
    });

    if (error) {
      console.error("[Admin] Failed to force password rotation:", error);
      return false;
    }

    clearAdminCacheForUser(adminUserId);
    return true;
  } catch (e) {
    console.error("[Admin] Failed to force password rotation:", e);
    return false;
  }
}
