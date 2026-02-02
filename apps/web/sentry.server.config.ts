import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Don't send PII
  beforeSend(event) {
    // Remove sensitive data
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email; // Don't send user emails to Sentry
    }

    // Scrub sensitive headers
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
      delete event.request.headers["x-api-key"];
    }

    return event;
  },

  // Filter out expected errors
  ignoreErrors: [
    // Rate limiting is expected
    "Rate limit exceeded",
    // Auth errors are expected
    "Authentication required",
    "Invalid credentials",
  ],

  // Environment
  environment: process.env.NODE_ENV,
});
