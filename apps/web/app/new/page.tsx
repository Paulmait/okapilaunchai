"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Wizard = {
  name: string;
  description: string;
  category: string;
  authApple: boolean;
  subscription: boolean;
  backend: "supabase"; // Firebase support coming soon
  deleteMyData: boolean;
};

const CATEGORIES = [
  { value: "Utilities", icon: "🔧", desc: "Tools and utilities" },
  { value: "Productivity", icon: "📊", desc: "Task management and workflow" },
  { value: "Health & Fitness", icon: "💪", desc: "Wellness and exercise" },
  { value: "Education", icon: "📚", desc: "Learning and courses" },
  { value: "Travel", icon: "✈️", desc: "Travel planning and guides" },
  { value: "Social", icon: "💬", desc: "Communication and networking" },
  { value: "Entertainment", icon: "🎮", desc: "Games and media" },
  { value: "Finance", icon: "💰", desc: "Money management" },
];

const STEPS = [
  { num: 1, title: "Describe", desc: "Tell us about your app" },
  { num: 2, title: "Features", desc: "Choose capabilities" },
  { num: 3, title: "Compliance", desc: "Legal requirements" },
  { num: 4, title: "Launch", desc: "Start building" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Wizard>({
    name: "",
    description: "",
    category: "Utilities",
    authApple: true,
    subscription: false,
    backend: "supabase",
    deleteMyData: true
  });

  const canNext = useMemo(() => {
    if (step === 1) return form.name.trim().length >= 2 && form.description.trim().length >= 10;
    return true;
  }, [step, form.name, form.description]);

  async function createProject() {
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wizard: form })
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to create project");
        return;
      }

      router.push(`/projects/${json.projectId}`);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", backgroundColor: "#f8fafc" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#6b7280",
              textDecoration: "none",
              fontSize: 14,
              marginBottom: 16
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 style={{ margin: 0, fontSize: 32, color: "#1e1b4b" }}>Create New App</h1>
          <p style={{ margin: "8px 0 0", color: "#6b7280" }}>
            Describe your app and we'll build it with AI
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
          {STEPS.map((s, idx) => (
            <div
              key={s.num}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 12
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: step >= s.num ? "#6366f1" : "#e5e7eb",
                  color: step >= s.num ? "#fff" : "#6b7280",
                  transition: "all 0.3s"
                }}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <div style={{ flex: 1, display: idx < STEPS.length - 1 ? "block" : "none" }}>
                <div
                  style={{
                    height: 2,
                    backgroundColor: step > s.num ? "#6366f1" : "#e5e7eb",
                    transition: "all 0.3s"
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            border: "1px solid #e0e7ff",
            padding: 32,
            marginBottom: 24
          }}
        >
          {step === 1 && (
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "#1e1b4b" }}>
                What are you building?
              </h2>
              <p style={{ margin: "0 0 24px", color: "#6b7280" }}>
                Give your app a name and describe what it does
              </p>

              <div style={{ display: "grid", gap: 20 }}>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "#374151" }}>
                    App Name
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 16,
                      boxSizing: "border-box"
                    }}
                    placeholder="e.g., FitTracker Pro"
                  />
                </label>

                <label style={{ display: "block" }}>
                  <span style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "#374151" }}>
                    Description
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 16,
                      resize: "vertical",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                    placeholder="Describe your app in detail. What problem does it solve? Who is it for? What features should it have?"
                  />
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    Minimum 10 characters. The more detail, the better the result!
                  </span>
                </label>

                <div>
                  <span style={{ display: "block", marginBottom: 12, fontWeight: 500, color: "#374151" }}>
                    Category
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.value })}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          border: `2px solid ${form.category === cat.value ? "#6366f1" : "#e5e7eb"}`,
                          backgroundColor: form.category === cat.value ? "#eff6ff" : "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{cat.icon}</div>
                        <div style={{ fontWeight: 500, color: "#1e1b4b" }}>{cat.value}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{cat.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "#1e1b4b" }}>
                Choose Features
              </h2>
              <p style={{ margin: "0 0 24px", color: "#6b7280" }}>
                Select the capabilities your app needs
              </p>

              <div style={{ display: "grid", gap: 16 }}>
                {[
                  {
                    key: "authApple",
                    icon: "🍎",
                    title: "Sign in with Apple",
                    desc: "Let users sign in with their Apple ID (required for apps with social login)",
                    recommended: true
                  },
                  {
                    key: "subscription",
                    icon: "💳",
                    title: "In-App Purchases",
                    desc: "Add subscription or one-time purchase options with StoreKit",
                    recommended: false
                  }
                ].map((feature) => (
                  <label
                    key={feature.key}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      padding: 16,
                      borderRadius: 12,
                      border: `2px solid ${(form as any)[feature.key] ? "#6366f1" : "#e5e7eb"}`,
                      backgroundColor: (form as any)[feature.key] ? "#fafaff" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(form as any)[feature.key]}
                      onChange={(e) => setForm({ ...form, [feature.key]: e.target.checked })}
                      style={{ width: 20, height: 20, marginTop: 4 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 24 }}>{feature.icon}</span>
                        <span style={{ fontWeight: 600, color: "#1e1b4b" }}>{feature.title}</span>
                        {feature.recommended && (
                          <span
                            style={{
                              padding: "2px 8px",
                              backgroundColor: "#d1fae5",
                              color: "#065f46",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600
                            }}
                          >
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
                        {feature.desc}
                      </p>
                    </div>
                  </label>
                ))}

                <div style={{ marginTop: 8 }}>
                  <span style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "#374151" }}>
                    Backend Provider
                  </span>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      border: "2px solid #6366f1",
                      backgroundColor: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      gap: 12
                    }}
                  >
                    <div style={{ fontSize: 28 }}>⚡</div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1e1b4b" }}>Supabase</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>PostgreSQL + Auth + Realtime</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                    All apps use Supabase for backend. Firebase support coming soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "#1e1b4b" }}>
                App Store Compliance
              </h2>
              <p style={{ margin: "0 0 24px", color: "#6b7280" }}>
                We'll automatically generate legal docs and privacy features
              </p>

              <div
                style={{
                  padding: 20,
                  backgroundColor: "#f0fdf4",
                  borderRadius: 12,
                  border: "1px solid #bbf7d0",
                  marginBottom: 24
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 32 }}>✅</div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#065f46" }}>Compliance Included</div>
                    <div style={{ fontSize: 14, color: "#047857" }}>
                      Privacy Policy • Terms of Service • Delete My Data flow
                    </div>
                  </div>
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: 16,
                  borderRadius: 12,
                  border: `2px solid ${form.deleteMyData ? "#6366f1" : "#e5e7eb"}`,
                  backgroundColor: form.deleteMyData ? "#fafaff" : "#fff",
                  cursor: "pointer"
                }}
              >
                <input
                  type="checkbox"
                  checked={form.deleteMyData}
                  onChange={(e) => setForm({ ...form, deleteMyData: e.target.checked })}
                  style={{ width: 20, height: 20, marginTop: 4 }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, color: "#1e1b4b" }}>Delete My Data Feature</span>
                    <span
                      style={{
                        padding: "2px 8px",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      REQUIRED BY APPLE
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
                    Includes a settings page with "Delete My Data" button and API endpoint. Required for apps that collect user data.
                  </p>
                </div>
              </label>

              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  backgroundColor: "#eff6ff",
                  borderRadius: 12,
                  border: "1px solid #bfdbfe"
                }}
              >
                <div style={{ fontWeight: 600, color: "#1e40af", marginBottom: 8 }}>
                  📋 What you'll get:
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: "#1e40af", fontSize: 14 }}>
                  <li>Privacy Policy (GDPR & CCPA compliant)</li>
                  <li>Terms of Service</li>
                  <li>In-app Settings page with data deletion</li>
                  <li>API endpoint for account deletion</li>
                  <li>App Store submission guide</li>
                </ul>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "#1e1b4b" }}>
                Ready to Build!
              </h2>
              <p style={{ margin: "0 0 24px", color: "#6b7280" }}>
                Review your app configuration and start building
              </p>

              <div
                style={{
                  padding: 20,
                  backgroundColor: "#f8fafc",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  marginBottom: 24
                }}
              >
                <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#374151" }}>Summary</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280" }}>App Name</span>
                    <span style={{ fontWeight: 500, color: "#1e1b4b" }}>{form.name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280" }}>Category</span>
                    <span style={{ fontWeight: 500, color: "#1e1b4b" }}>{form.category}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280" }}>Backend</span>
                    <span style={{ fontWeight: 500, color: "#1e1b4b" }}>Supabase</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280" }}>Features</span>
                    <span style={{ fontWeight: 500, color: "#1e1b4b" }}>
                      {[
                        form.authApple && "Apple Sign In",
                        form.subscription && "In-App Purchases",
                        form.deleteMyData && "Delete My Data"
                      ]
                        .filter(Boolean)
                        .join(", ") || "Basic"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: 20,
                  backgroundColor: "#fef3c7",
                  borderRadius: 12,
                  border: "1px solid #fcd34d",
                  marginBottom: 24
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>⏱️</span>
                  <div>
                    <div style={{ fontWeight: 600, color: "#92400e" }}>Estimated Build Time</div>
                    <div style={{ fontSize: 14, color: "#a16207" }}>2-5 minutes depending on complexity</div>
                  </div>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: 16,
                    backgroundColor: "#fef2f2",
                    borderRadius: 12,
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    marginBottom: 24
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={createProject}
                disabled={creating}
                style={{
                  width: "100%",
                  padding: 18,
                  borderRadius: 12,
                  border: "none",
                  background: creating ? "#9ca3af" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: creating ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10
                }}
              >
                {creating ? (
                  <>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        border: "2px solid #fff",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }}
                    />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Building
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {step < 4 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                backgroundColor: "#fff",
                color: step === 1 ? "#9ca3af" : "#374151",
                fontWeight: 500,
                cursor: step === 1 ? "not-allowed" : "pointer"
              }}
            >
              Back
            </button>
            <button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canNext}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                background: canNext ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "#e5e7eb",
                color: canNext ? "#fff" : "#9ca3af",
                fontWeight: 600,
                cursor: canNext ? "pointer" : "not-allowed"
              }}
            >
              Continue
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
