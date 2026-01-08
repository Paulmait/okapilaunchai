"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "../../../../components/Header";
import { getSupabaseBrowser } from "../../../../lib/supabase-browser";
import { useToast } from "../../../../components/Toast";

export default function GitHubPage() {
  const params = useParams();
  const { showToast } = useToast();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [subscription, setSubscription] = useState<{ plan: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    loadProject();
    loadSubscription();
  }, [projectId]);

  async function loadProject() {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (data) {
      setProject(data);
      setRepoName(data.name.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
    }
    setLoading(false);
  }

  async function loadSubscription() {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch (e) {
      console.error("Failed to load subscription:", e);
    }
  }

  async function connectGitHub() {
    // In production, this would redirect to GitHub OAuth
    showToast("info", "GitHub OAuth integration coming soon! For now, download your export and push manually.");
    setGithubConnected(true);
  }

  async function pushToGitHub() {
    setPushing(true);
    // Simulate pushing
    await new Promise(resolve => setTimeout(resolve, 2000));
    showToast("success", "Repository created and code pushed! (Simulated - full integration coming soon)");
    setPushing(false);
  }

  const isPro = subscription?.plan === "pro" || subscription?.plan === "team";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <Header />
        <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <Header />
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 24px",
              borderRadius: "50%",
              backgroundColor: "#1f2937",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, color: "#1e1b4b" }}>GitHub Integration - Pro Feature</h1>
          <p style={{ color: "#6b7280", fontSize: 16, marginTop: 12, marginBottom: 32 }}>
            Connect your GitHub account to push your app code directly to a repository. Manage versions, collaborate with your team, and deploy with CI/CD.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link
              href="/pricing"
              style={{
                padding: "14px 28px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 600
              }}
            >
              Upgrade to Pro
            </Link>
            <Link
              href={`/projects/${projectId}`}
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
              Back to Project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Header />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
        <Link
          href={`/projects/${projectId}`}
          style={{ color: "#6366f1", textDecoration: "none", fontSize: 14, display: "flex", alignItems: "center", gap: 4, marginBottom: 24 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to {project?.name}
        </Link>

        {/* Coming Soon Banner */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef3c7",
            borderRadius: 10,
            border: "1px solid #fcd34d",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <span style={{ fontWeight: 600, color: "#92400e" }}>Coming Soon</span>
            <span style={{ color: "#a16207", marginLeft: 8, fontSize: 14 }}>
              GitHub OAuth integration is in development. For now, download your export and push manually.
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: "#1f2937",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: "#1e1b4b" }}>GitHub Integration</h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280" }}>Push your app to a GitHub repository</p>
          </div>
        </div>

        {!githubConnected ? (
          <div
            style={{
              padding: 32,
              backgroundColor: "#fff",
              borderRadius: 16,
              border: "1px solid #e0e7ff",
              textAlign: "center"
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 style={{ margin: 0, color: "#1e1b4b" }}>Connect Your GitHub Account</h3>
            <p style={{ color: "#6b7280", margin: "8px 0 24px" }}>
              Authorize OkapiLaunch to create and push to repositories on your behalf.
            </p>
            <button
              onClick={connectGitHub}
              style={{
                padding: "14px 28px",
                backgroundColor: "#1f2937",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Connect GitHub
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                padding: 16,
                backgroundColor: "#d1fae5",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 12
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ color: "#065f46", fontWeight: 500 }}>GitHub connected</span>
            </div>

            <div
              style={{
                padding: 24,
                backgroundColor: "#fff",
                borderRadius: 16,
                border: "1px solid #e0e7ff"
              }}
            >
              <h3 style={{ margin: "0 0 20px", color: "#1e1b4b" }}>Create Repository</h3>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500, color: "#374151", fontSize: 14 }}>
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 15
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 14, color: "#374151" }}>Private repository</span>
                </label>
              </div>

              <button
                onClick={pushToGitHub}
                disabled={pushing || !repoName}
                style={{
                  width: "100%",
                  padding: 14,
                  backgroundColor: pushing ? "#9ca3af" : "#1f2937",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: pushing ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                {pushing ? (
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
                    Pushing...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Create & Push to GitHub
                  </>
                )}
              </button>
            </div>

            <div
              style={{
                padding: 20,
                backgroundColor: "#f0f9ff",
                borderRadius: 12,
                border: "1px solid #bae6fd"
              }}
            >
              <h4 style={{ margin: "0 0 12px", color: "#0369a1", fontSize: 14 }}>What happens next?</h4>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#0c4a6e", fontSize: 13 }}>
                <li style={{ marginBottom: 6 }}>A new repository will be created on your GitHub account</li>
                <li style={{ marginBottom: 6 }}>All your app's code and assets will be pushed</li>
                <li style={{ marginBottom: 6 }}>README with setup instructions included</li>
                <li>You can then set up CI/CD, invite collaborators, and more</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
