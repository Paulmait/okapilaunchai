"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const PLANS = {
  pro: {
    name: "Pro",
    price: "$29/month",
    features: [
      "Unlimited projects",
      "Priority AI generation",
      "In-app code editor",
      "GitHub integration",
      "Full legal docs bundle",
      "App Store asset pack",
      "Export history (30 days)",
      "Email support"
    ]
  },
  team: {
    name: "Team",
    price: "$79/month",
    features: [
      "Everything in Pro",
      "5 team members",
      "White-label exports",
      "Custom branding",
      "API access",
      "Export history (1 year)",
      "Priority support",
      "Dedicated onboarding"
    ]
  }
};

function SubscribeContent() {
  const searchParams = useSearchParams();
  const planKey = searchParams.get("plan") as "pro" | "team" | null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = planKey && PLANS[planKey] ? PLANS[planKey] : null;

  async function handleSubscribe() {
    if (!planKey) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start checkout");
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!plan) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <h1 style={{ color: "#1e1b4b" }}>Select a Plan</h1>
        <p style={{ color: "#6b7280", marginBottom: 32 }}>
          Choose a plan to get started with unlimited projects.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Link
            href="/subscribe?plan=pro"
            style={{
              padding: "16px 32px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            Pro - $29/mo
          </Link>
          <Link
            href="/subscribe?plan=team"
            style={{
              padding: "16px 32px",
              backgroundColor: "#fff",
              color: "#6366f1",
              border: "2px solid #6366f1",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            Team - $79/mo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "60px 20px" }}>
      <Link
        href="/pricing"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "#6b7280",
          textDecoration: "none",
          fontSize: 14,
          marginBottom: 24
        }}
      >
        ← Back to Pricing
      </Link>

      <div
        style={{
          padding: 32,
          backgroundColor: "#fff",
          borderRadius: 16,
          border: "1px solid #e0e7ff"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#eff6ff",
              color: "#3b82f6",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 12
            }}
          >
            {plan.name.toUpperCase()} PLAN
          </div>
          <h1 style={{ margin: 0, fontSize: 36, color: "#1e1b4b" }}>{plan.price}</h1>
          <p style={{ margin: "8px 0 0", color: "#6b7280" }}>Billed monthly. Cancel anytime.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#374151" }}>What's included:</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {plan.features.map((feature, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  color: "#374151"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#dcfce7" />
                  <path d="M14 7L8.5 12.5 6 10" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              backgroundColor: "#fef2f2",
              borderRadius: 8,
              color: "#991b1b",
              marginBottom: 16,
              fontSize: 14
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 10,
            border: "none",
            background: loading ? "#9ca3af" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid #fff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}
              />
              Processing...
            </>
          ) : (
            <>Subscribe to {plan.name}</>
          )}
        </button>

        <p style={{ margin: "16px 0 0", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
          Secure payment powered by Stripe. You can cancel anytime.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #e5e7eb",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto"
        }}
      />
      <p style={{ color: "#6b7280", marginTop: 16 }}>Loading...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscribeContent />
    </Suspense>
  );
}
