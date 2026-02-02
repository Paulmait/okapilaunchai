import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Enable structured logging
  _experiments: {
    enableLogs: true,
  },

  // Console logging integration
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay - capture 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Network errors that are usually user-side
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    // User cancelled
    "AbortError",
    "The operation was aborted",
  ],

  // Don't send PII
  beforeSend(event) {
    // Remove IP addresses
    if (event.user) {
      delete event.user.ip_address;
    }
    return event;
  },

  // Environment
  environment: process.env.NODE_ENV,
});
