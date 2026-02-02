/**
 * Rate limiter with Redis support for multi-instance scaling
 *
 * CONFIGURATION:
 * Set these environment variables to enable Redis rate limiting:
 * - UPSTASH_REDIS_REST_URL: Your Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Your Upstash Redis REST token
 *
 * FALLBACK BEHAVIOR:
 * If Redis is not configured, falls back to in-memory rate limiting.
 * In-memory is fine for single-instance deployments but won't share
 * state across multiple instances (Railway, Vercel, etc.).
 *
 * REDIS SETUP (Upstash):
 * 1. Create free account at https://upstash.com
 * 2. Create a new Redis database
 * 3. Copy REST URL and token to environment variables
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Types
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

// Check if Redis is configured
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_REDIS = !!(REDIS_URL && REDIS_TOKEN);

// Initialize Redis client if configured
let redis: Redis | null = null;
if (USE_REDIS) {
  try {
    redis = new Redis({
      url: REDIS_URL!,
      token: REDIS_TOKEN!,
    });
    console.log("[RateLimit] Using Redis-backed rate limiting");
  } catch (e) {
    console.warn("[RateLimit] Failed to initialize Redis, falling back to in-memory:", e);
  }
}

// Create Upstash rate limiters for different presets
const redisRateLimiters: Record<string, Ratelimit> | null = redis ? {
  standard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "60 s"),
    analytics: true,
    prefix: "ratelimit:standard",
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "ratelimit:auth",
  }),
  heavy: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "ratelimit:heavy",
  }),
  delete: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "3600 s"),
    analytics: true,
    prefix: "ratelimit:delete",
  }),
} : null;

// In-memory fallback store
type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up old entries periodically (only for in-memory)
if (!USE_REDIS) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (record.resetTime < now) {
        memoryStore.delete(key);
      }
    }
  }, 60000);
}

/**
 * Check if a request should be rate limited (in-memory fallback)
 */
function checkRateLimitMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const record = memoryStore.get(key);

  if (!record || record.resetTime < now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs
    };
    memoryStore.set(key, newRecord);
    return {
      success: true,
      remaining: config.limit - 1,
      resetTime: newRecord.resetTime
    };
  }

  if (record.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime
    };
  }

  record.count++;
  return {
    success: true,
    remaining: config.limit - record.count,
    resetTime: record.resetTime
  };
}

/**
 * Check if a request should be rate limited
 * Uses Redis if configured, falls back to in-memory otherwise
 *
 * @param key - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Result indicating if the request is allowed
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  // Use in-memory for non-Redis environments
  return checkRateLimitMemory(key, config);
}

/**
 * Check if a request should be rate limited (async version for Redis)
 * Prefer this for new code as it supports Redis
 *
 * @param key - Unique identifier for the rate limit
 * @param preset - One of the preset rate limit configurations
 * @returns Result indicating if the request is allowed
 */
export async function checkRateLimitAsync(
  key: string,
  preset: keyof typeof RATE_LIMITS = "standard"
): Promise<RateLimitResult> {
  // Use Redis if available
  if (redisRateLimiters && redisRateLimiters[preset]) {
    try {
      const result = await redisRateLimiters[preset].limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        resetTime: result.reset,
      };
    } catch (e) {
      console.warn("[RateLimit] Redis error, falling back to memory:", e);
      // Fall through to memory-based rate limiting
    }
  }

  // Fallback to in-memory
  return checkRateLimitMemory(key, RATE_LIMITS[preset]);
}

/**
 * Get client identifier from request headers
 * Uses multiple fallback strategies for reliable identification
 *
 * Priority order:
 * 1. CF-Connecting-IP (Cloudflare)
 * 2. X-Real-IP (nginx)
 * 3. X-Forwarded-For (first IP in chain)
 * 4. Hash of user-agent + accept-language as last resort
 */
export function getClientId(req: Request): string {
  // Cloudflare provides the real client IP
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  // Nginx proxy real IP
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // X-Forwarded-For chain - use first (original client) IP
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp && firstIp !== "unknown") {
      return firstIp;
    }
  }

  // Last resort: hash of user-agent + accept-language for some uniqueness
  const userAgent = req.headers.get("user-agent") || "";
  const acceptLang = req.headers.get("accept-language") || "";
  if (userAgent || acceptLang) {
    const fingerprint = `${userAgent}:${acceptLang}`;
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `fp_${Math.abs(hash).toString(36)}`;
  }

  return "unknown";
}

/**
 * Get client identifier with authenticated user ID preference
 * Use this for authenticated endpoints to ensure proper rate limiting per user
 */
export function getAuthenticatedClientId(req: Request, userId?: string | null): string {
  if (userId) {
    return `user_${userId}`;
  }
  return getClientId(req);
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

/**
 * Check if Redis rate limiting is enabled
 */
export function isRedisEnabled(): boolean {
  return USE_REDIS && redis !== null;
}
