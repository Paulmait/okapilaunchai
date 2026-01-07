/**
 * Admin authorization utilities
 */

// Admin emails - in production, use database roles or Supabase custom claims
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL || "admin@okapilaunch.com"
];

/**
 * Check if a user email is an admin
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

/**
 * Get admin emails list (for debugging)
 */
export function getAdminEmails(): string[] {
  return ADMIN_EMAILS;
}
