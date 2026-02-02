import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring - lower rate for edge
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Environment
  environment: process.env.NODE_ENV,
});
