"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SubscribeSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give Stripe webhook time to process
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
      <div
        style={{
          width: 80,
          height: 80,
          margin: "0 auto 24px",
          borderRadius: "50%",
          backgroundColor: "#d1fae5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 style={{ margin: 0, fontSize: 32, color: "#1e1b4b" }}>
        Welcome to Pro!
      </h1>

      <p style={{ color: "#6b7280", fontSize: 18, marginTop: 12, marginBottom: 32 }}>
        Your subscription is now active. You have unlimited access to all Pro features.
      </p>

      <div
        style={{
          padding: 24,
          backgroundColor: "#f0fdf4",
          borderRadius: 12,
          border: "1px solid #bbf7d0",
          marginBottom: 32,
          textAlign: "left"
        }}
      >
        <h3 style={{ margin: "0 0 12px", color: "#065f46" }}>What's unlocked:</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#047857" }}>
          <li>Unlimited app projects</li>
          <li>Priority AI generation</li>
          <li>In-app code editor</li>
          <li>GitHub integration</li>
          <li>Full legal docs bundle</li>
          <li>Export history (30 days)</li>
        </ul>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Link
          href="/new"
          style={{
            padding: "14px 28px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#fff",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          Create New App
        </Link>
        <Link
          href="/dashboard"
          style={{
            padding: "14px 28px",
            backgroundColor: "#fff",
            color: "#374151",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 500
          }}
        >
          Go to Dashboard
        </Link>
      </div>

      <p style={{ marginTop: 32, fontSize: 13, color: "#9ca3af" }}>
        Need help? Contact us at support@okapilaunch.com
      </p>
    </div>
  );
}
