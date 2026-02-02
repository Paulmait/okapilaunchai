"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 80,
          marginBottom: 16,
        }}
      >
        &#9888;
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#1e1b4b",
          margin: "0 0 12px 0",
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          fontSize: 16,
          color: "#6b7280",
          margin: "0 0 24px 0",
          maxWidth: 400,
        }}
      >
        We encountered an unexpected error. Our team has been notified
        and is working to fix it.
      </p>
      {error.digest && (
        <p
          style={{
            fontSize: 12,
            color: "#9ca3af",
            margin: "0 0 24px 0",
            fontFamily: "monospace",
          }}
        >
          Error ID: {error.digest}
        </p>
      )}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 24px",
            backgroundColor: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 24px",
            backgroundColor: "#fff",
            color: "#6366f1",
            border: "1px solid #6366f1",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}
