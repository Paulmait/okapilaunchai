/**
 * API Abuse Prevention Utilities
 * Implements multiple layers of protection against API abuse
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientId, RATE_LIMITS } from "./rate-limit";
import { recordRateLimitViolation, trackApiUsage } from "./analytics";

// Suspicious patterns that indicate potential abuse
const SUSPICIOUS_PATTERNS = {
  // SQL injection patterns
  sqlInjection: /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bupdate\b|--|;|')/i,
  // XSS patterns
  xss: /(<script|javascript:|on\w+\s*=|<iframe|<object|<embed)/i,
  // Path traversal
  pathTraversal: /(\.\.|%2e%2e|%252e)/i,
  // Command injection
  commandInjection: /(\||;|`|\$\(|&&|\|\|)/,
  // Excessive URL length (potential buffer overflow attempt)
  longUrl: 2000,
  // Excessive body size
  maxBodySize: 1024 * 1024, // 1MB
};

// Known bot/scanner user agents to block
const BLOCKED_USER_AGENTS = [
  "sqlmap",
  "nikto",
  "nessus",
  "nmap",
  "masscan",
  "acunetix",
  "burpsuite",
  "dirbuster",
  "gobuster",
  "wfuzz",
  "ffuf",
  "nuclei"
];

export type AbuseCheckResult = {
  allowed: boolean;
  reason?: string;
  severity?: "low" | "medium" | "high" | "critical";
  shouldBlock?: boolean;
};

/**
 * Check request for abuse patterns
 */
export function checkForAbuse(req: NextRequest): AbuseCheckResult {
  const url = req.url;
  const userAgent = req.headers.get("user-agent") || "";

  // Check for blocked user agents (security scanners)
  const isBlockedAgent = BLOCKED_USER_AGENTS.some((agent) =>
    userAgent.toLowerCase().includes(agent)
  );
  if (isBlockedAgent) {
    return {
      allowed: false,
      reason: "Blocked user agent",
      severity: "high",
      shouldBlock: true
    };
  }

  // Check URL length
  if (url.length > SUSPICIOUS_PATTERNS.longUrl) {
    return {
      allowed: false,
      reason: "URL too long",
      severity: "medium",
      shouldBlock: false
    };
  }

  // Check for SQL injection in URL
  if (SUSPICIOUS_PATTERNS.sqlInjection.test(url)) {
    return {
      allowed: false,
      reason: "Potential SQL injection",
      severity: "critical",
      shouldBlock: true
    };
  }

  // Check for XSS in URL
  if (SUSPICIOUS_PATTERNS.xss.test(url)) {
    return {
      allowed: false,
      reason: "Potential XSS",
      severity: "critical",
      shouldBlock: true
    };
  }

  // Check for path traversal
  if (SUSPICIOUS_PATTERNS.pathTraversal.test(url)) {
    return {
      allowed: false,
      reason: "Potential path traversal",
      severity: "high",
      shouldBlock: true
    };
  }

  return { allowed: true };
}

/**
 * Check request body for abuse patterns
 */
export async function checkBodyForAbuse(body: string): Promise<AbuseCheckResult> {
  // Check body size
  if (body.length > SUSPICIOUS_PATTERNS.maxBodySize) {
    return {
      allowed: false,
      reason: "Request body too large",
      severity: "medium",
      shouldBlock: false
    };
  }

  // Check for SQL injection in body
  if (SUSPICIOUS_PATTERNS.sqlInjection.test(body)) {
    return {
      allowed: false,
      reason: "Potential SQL injection in body",
      severity: "critical",
      shouldBlock: true
    };
  }

  // Check for XSS in body
  if (SUSPICIOUS_PATTERNS.xss.test(body)) {
    return {
      allowed: false,
      reason: "Potential XSS in body",
      severity: "high",
      shouldBlock: true
    };
  }

  // Check for command injection
  if (SUSPICIOUS_PATTERNS.commandInjection.test(body)) {
    return {
      allowed: false,
      reason: "Potential command injection",
      severity: "critical",
      shouldBlock: true
    };
  }

  return { allowed: true };
}

/**
 * Comprehensive API protection middleware
 * Returns null if request is allowed, NextResponse if blocked
 */
export async function protectApiRoute(
  req: NextRequest,
  options: {
    endpoint: string;
    rateLimitKey?: string;
    rateLimit?: { limit: number; windowSec: number };
    skipBodyCheck?: boolean;
  }
): Promise<NextResponse | null> {
  const startTime = Date.now();
  const clientId = getClientId(req);
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Check for abuse patterns
  const abuseCheck = checkForAbuse(req);
  if (!abuseCheck.allowed) {
    console.warn(`[ABUSE] ${abuseCheck.reason} from ${ipAddress} on ${options.endpoint}`);

    // Record violation
    await recordRateLimitViolation({
      ipAddress,
      endpoint: options.endpoint
    });

    // Track API usage with error
    await trackApiUsage({
      endpoint: options.endpoint,
      method: req.method,
      statusCode: 403,
      responseTimeMs: Date.now() - startTime,
      ipAddress
    });

    return NextResponse.json(
      { error: "Request blocked" },
      { status: 403 }
    );
  }

  // Rate limiting
  const rateLimitKey = options.rateLimitKey || `api:${options.endpoint}:${clientId}`;
  const rateLimit = options.rateLimit || RATE_LIMITS.standard;
  const rateLimitResult = checkRateLimit(rateLimitKey, rateLimit);

  if (!rateLimitResult.success) {
    // Record violation
    await recordRateLimitViolation({
      ipAddress,
      endpoint: options.endpoint
    });

    // Track API usage with rate limit error
    await trackApiUsage({
      endpoint: options.endpoint,
      method: req.method,
      statusCode: 429,
      responseTimeMs: Date.now() - startTime,
      ipAddress
    });

    // Calculate retry-after in seconds
    const retryAfterSec = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: "Too many requests",
        retryAfter: retryAfterSec
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSec.toString(),
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString()
        }
      }
    );
  }

  // Request is allowed
  return null;
}

/**
 * Track successful API request
 */
export async function trackSuccessfulRequest(
  req: NextRequest,
  options: {
    endpoint: string;
    statusCode: number;
    startTime: number;
    userId?: string;
    responseSize?: number;
  }
): Promise<void> {
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  await trackApiUsage({
    userId: options.userId,
    endpoint: options.endpoint,
    method: req.method,
    statusCode: options.statusCode,
    responseTimeMs: Date.now() - options.startTime,
    responseSizeBytes: options.responseSize,
    ipAddress
  });
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.toLowerCase().trim();

  if (!emailRegex.test(sanitized)) {
    return null;
  }

  // Check for suspicious patterns in email
  if (SUSPICIOUS_PATTERNS.sqlInjection.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  // Use crypto for secure randomness
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}
