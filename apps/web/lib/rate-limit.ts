/**
 * Simple in-memory rate limiter for API routes
 *
 * LIMITATIONS:
 * - In-memory storage: Rate limits are not shared across server instances
 * - On serverless/Railway: Each instance has its own rate limit store
 * - Memory usage: Store grows with unique client IPs (cleaned every minute)
 *
 * PRODUCTION RECOMMENDATIONS:
 * - Use Redis (Upstash Redis is a good serverless option)
 * - Use Vercel KV or similar managed solution
 * - Add IP hash storage for abuse tracking in database
 *
 * Current behavior on multi-instance:
 * - Each instance allows `limit` requests independently
 * - Effective limit = limit × number_of_instances
 * - Acceptable for MVP, should migrate to Redis for scale
 */

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export type RateLimitConfig = {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSec: number;
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetTime: number;
};

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Result indicating if the request is allowed
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const record = rateLimitStore.get(key);

  // No existing record or window expired - create new
  if (!record || record.resetTime < now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(key, newRecord);
    return {
      success: true,
      remaining: config.limit - 1,
      resetTime: newRecord.resetTime
    };
  }

  // Within window - check limit
  if (record.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime
    };
  }

  // Increment count
  record.count++;
  return {
    success: true,
    remaining: config.limit - record.count,
    resetTime: record.resetTime
  };
}

/**
 * Get client identifier from request headers
 * Uses X-Forwarded-For if behind a proxy, falls back to IP
 */
export function getClientId(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  // Fallback - in production, you'd want real IP
  return "unknown";
}

// Preset configurations
export const RATE_LIMITS = {
  // Standard API: 60 requests per minute
  standard: { limit: 60, windowSec: 60 },
  // Auth endpoints: 10 requests per minute (prevent brute force)
  auth: { limit: 10, windowSec: 60 },
  // Heavy operations: 5 per minute
  heavy: { limit: 5, windowSec: 60 },
  // Delete operations: 3 per hour
  delete: { limit: 3, windowSec: 3600 }
} as const;
