"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Job = {
  id: string;
  type: string;
  status: "queued" | "running" | "succeeded" | "failed";
  error?: string | null;
  created_at: string;
  updated_at: string;
  payload?: {
    artifact_bucket?: string;
    artifact_object_path?: string;
    ai_model?: string;
    thinking_steps?: string[];
    current_step?: string;
  };
};

type Project = {
  id: string;
  name: string;
  created_at: string;
  wizard_payload?: {
    name: string;
    category?: string;
  };
};

const AI_THINKING_STEPS = [
  { step: "analyze", label: "Analyzing your requirements...", model: "Claude" },
  { step: "plan", label: "Creating app architecture...", model: "Claude" },
  { step: "generate_code", label: "Generating React Native code...", model: "GPT-4" },
  { step: "generate_assets", label: "Creating app icons and splash...", model: "GPT-4" },
  { step: "generate_legal", label: "Writing privacy policy & terms...", model: "Claude" },
  { step: "bundle", label: "Bundling your export package...", model: "System" },
];

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"preview" | "logs" | "files">("preview");
  const [thinkingIndex, setThinkingIndex] = useState(0);

  async function refresh() {
    setLoading(true);
    try {
      // Fetch project details
      const projectRes = await fetch(`/api/projects/${params.projectId}`, { cache: "no-store" });
      if (projectRes.ok) {
        const projectJson = await projectRes.json();
        setProject(projectJson.project);
      }

      // Fetch jobs
      const res = await fetch(`/api/projects/${params.projectId}/jobs`, { cache: "no-store" });
      const json = await res.json();
      setJobs(json.jobs ?? []);
    } catch (err) {
      console.error("Failed to fetch:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [params.projectId]);

  // Simulate thinking progression
  useEffect(() => {
    const isProcessing = jobs.some((j) => j.status === "queued" || j.status === "running");
    if (isProcessing) {
      const interval = setInterval(() => {
        setThinkingIndex((prev) => (prev + 1) % AI_THINKING_STEPS.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [jobs]);

  async function download(jobId: string) {
    const res = await fetch(`/api/jobs/${jobId}/download`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error ?? "Download not ready");
      return;
    }
    window.location.href = json.url;
  }

  const isProcessing = jobs.some((j) => j.status === "queued" || j.status === "running");
  const currentJob = jobs.find((j) => j.status === "running") || jobs.find((j) => j.status === "queued");
  const exportJob = jobs.find(
    (j) => j.type === "export" && j.status === "succeeded" && j.payload?.artifact_object_path
  );
  const allSucceeded = jobs.length > 0 && jobs.every((j) => j.status === "succeeded");
  const hasFailed = jobs.some((j) => j.status === "failed");

  const currentThinking = AI_THINKING_STEPS[thinkingIndex];

  function getPipelineProgress() {
    const steps = ["plan", "build_mvp", "export"];
    const completed = steps.filter((s) => jobs.find((j) => j.type === s && j.status === "succeeded")).length;
    return Math.round((completed / steps.length) * 100);
  }

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 60px)", backgroundColor: "#f8fafc" }}>
      {/* Left Sidebar */}
      <aside
        style={{
          width: 320,
          borderRight: "1px solid #e0e7ff",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Project Header */}
        <div style={{ padding: 16, borderBottom: "1px solid #e0e7ff" }}>
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#6b7280",
              textDecoration: "none",
              fontSize: 14,
              marginBottom: 12
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18
              }}
            >
              {(project?.name || "P")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "#1e1b4b" }}>
                {project?.name || "Loading..."}
              </h2>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {project?.wizard_payload?.category || "App"}
              </span>
            </div>
          </div>
        </div>

        {/* AI Status */}
        <div style={{ padding: 16, borderBottom: "1px solid #e0e7ff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: isProcessing ? "#3b82f6" : allSucceeded ? "#10b981" : hasFailed ? "#ef4444" : "#9ca3af",
                animation: isProcessing ? "pulse 2s infinite" : "none"
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
              {isProcessing ? "Building..." : allSucceeded ? "Ready" : hasFailed ? "Failed" : "Pending"}
            </span>
          </div>

          {/* AI Model Indicator */}
          {isProcessing && currentThinking && (
            <div
              style={{
                padding: 12,
                backgroundColor: "#f0f9ff",
                borderRadius: 8,
                border: "1px solid #bae6fd"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div
                  style={{
                    padding: "2px 8px",
                    backgroundColor: currentThinking.model === "Claude" ? "#8b5cf6" : "#10b981",
                    color: "#fff",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600
                  }}
                >
                  {currentThinking.model}
                </div>
                <span style={{ fontSize: 12, color: "#6b7280" }}>is working</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#0369a1" }}>
                {currentThinking.label}
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Progress</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{getPipelineProgress()}%</span>
            </div>
            <div style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${getPipelineProgress()}%`,
                  background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
                  borderRadius: 3,
                  transition: "width 0.5s ease"
                }}
              />
            </div>
          </div>
        </div>

        {/* Pipeline Steps */}
        <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
            BUILD PIPELINE
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["plan", "build_mvp", "export"].map((step, idx) => {
              const job = jobs.find((j) => j.type === step);
              const status = job?.status ?? "pending";
              const isActive = status === "running";
              const isDone = status === "succeeded";
              const isFailed = status === "failed";

              return (
                <div
                  key={step}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: isActive ? "#eff6ff" : isDone ? "#f0fdf4" : isFailed ? "#fef2f2" : "#f9fafb",
                    border: `1px solid ${isActive ? "#bfdbfe" : isDone ? "#bbf7d0" : isFailed ? "#fecaca" : "#e5e7eb"}`
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: isDone ? "#10b981" : isFailed ? "#ef4444" : isActive ? "#3b82f6" : "#e5e7eb",
                      color: isDone || isFailed || isActive ? "#fff" : "#6b7280"
                    }}
                  >
                    {isDone ? "✓" : isFailed ? "✗" : idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#1e1b4b" }}>
                      {step === "plan" ? "Planning" : step === "build_mvp" ? "Building" : "Exporting"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {isActive && "In progress..."}
                      {isDone && "Complete"}
                      {isFailed && "Failed"}
                      {status === "queued" && "Queued"}
                      {status === "pending" && "Pending"}
                    </div>
                  </div>
                  {isActive && (
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid #3b82f6",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: 16, borderTop: "1px solid #e0e7ff" }}>
          {exportJob && (
            <button
              onClick={() => download(exportJob.id)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download Export
            </button>
          )}
          {!exportJob && !isProcessing && jobs.length > 0 && (
            <button
              disabled
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                color: "#9ca3af",
                fontWeight: 500
              }}
            >
              Export not ready
            </button>
          )}
          <Link
            href={`/projects/${projectId}/editor`}
            style={{
              width: "100%",
              marginTop: 8,
              padding: 14,
              borderRadius: 10,
              border: "1px solid #e0e7ff",
              backgroundColor: "#fff",
              color: "#6366f1",
              fontWeight: 500,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit Code
          </Link>
          <Link
            href={`/projects/${projectId}/github`}
            style={{
              width: "100%",
              marginTop: 8,
              padding: 14,
              borderRadius: 10,
              border: "1px solid #e0e7ff",
              backgroundColor: "#fff",
              color: "#1f2937",
              fontWeight: 500,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Push to GitHub
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Navigation */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            borderBottom: "1px solid #e0e7ff",
            backgroundColor: "#fff"
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { key: "preview", label: "Preview", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
              { key: "logs", label: "Logs", icon: "M4 6h16M4 12h16M4 18h7" },
              { key: "files", label: "Files", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: activeTab === tab.key ? "#eff6ff" : "transparent",
                  color: activeTab === tab.key ? "#3b82f6" : "#6b7280",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: 14
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/pricing"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                color: "#6366f1",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade
            </Link>
            {exportJob && (
              <button
                onClick={() => download(exportJob.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                Publish
              </button>
            )}
          </div>
        </nav>

        {/* Content Area */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {activeTab === "preview" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40 }}>
              {/* Device Mockup */}
              <div
                style={{
                  width: 280,
                  height: 560,
                  backgroundColor: "#1e1b4b",
                  borderRadius: 40,
                  padding: 12,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#fff",
                    borderRadius: 32,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {isProcessing ? (
                    <div style={{ textAlign: "center", padding: 20 }}>
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          margin: "0 auto 20px",
                          border: "3px solid #e5e7eb",
                          borderTopColor: "#6366f1",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite"
                        }}
                      />
                      <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 18 }}>Building Your App</h3>
                      <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8 }}>
                        {currentThinking?.label || "Processing..."}
                      </p>
                      <div
                        style={{
                          marginTop: 16,
                          padding: "6px 12px",
                          backgroundColor: currentThinking?.model === "Claude" ? "#8b5cf6" : "#10b981",
                          color: "#fff",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          display: "inline-block"
                        }}
                      >
                        Powered by {currentThinking?.model || "AI"}
                      </div>
                    </div>
                  ) : allSucceeded ? (
                    <div style={{ textAlign: "center", padding: 20 }}>
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          margin: "0 auto 20px",
                          borderRadius: 20,
                          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <span style={{ fontSize: 36 }}>✓</span>
                      </div>
                      <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 18 }}>
                        {project?.name || "Your App"}
                      </h3>
                      <p style={{ color: "#10b981", fontSize: 14, marginTop: 8, fontWeight: 500 }}>
                        Ready to Download!
                      </p>
                      <p style={{ color: "#6b7280", fontSize: 13, marginTop: 16 }}>
                        Export includes Expo project,<br />legal docs, and App Store assets
                      </p>
                    </div>
                  ) : hasFailed ? (
                    <div style={{ textAlign: "center", padding: 20 }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                      <h3 style={{ margin: 0, color: "#991b1b" }}>Build Failed</h3>
                      <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8 }}>
                        Check the logs for details
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: 20 }}>
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          margin: "0 auto 20px",
                          borderRadius: 20,
                          backgroundColor: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <span style={{ fontSize: 36, opacity: 0.5 }}>📱</span>
                      </div>
                      <h3 style={{ margin: 0, color: "#9ca3af" }}>Waiting to Build</h3>
                    </div>
                  )}
                </div>
              </div>

              {/* Platform Badges */}
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                {["iOS", "Android", "Web"].map((platform) => (
                  <div
                    key={platform}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      backgroundColor: "#fff",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                      color: "#374151"
                    }}
                  >
                    <span>{platform === "iOS" ? "🍎" : platform === "Android" ? "🤖" : "🌐"}</span>
                    {platform}
                  </div>
                ))}
              </div>

              <p style={{ color: "#6b7280", fontSize: 14, marginTop: 24 }}>
                Built with Expo • React Native • TypeScript
              </p>
            </div>
          )}

          {activeTab === "logs" && (
            <div>
              <h3 style={{ margin: "0 0 16px", color: "#1e1b4b" }}>Build Logs</h3>
              {jobs.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No jobs yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      style={{
                        padding: 16,
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <strong style={{ color: "#1e1b4b" }}>
                            {job.type === "plan" ? "Planning" : job.type === "build_mvp" ? "Building MVP" : "Export"}
                          </strong>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 500,
                              backgroundColor:
                                job.status === "succeeded" ? "#d1fae5" :
                                job.status === "failed" ? "#fee2e2" :
                                job.status === "running" ? "#dbeafe" : "#fef3c7",
                              color:
                                job.status === "succeeded" ? "#065f46" :
                                job.status === "failed" ? "#991b1b" :
                                job.status === "running" ? "#1e40af" : "#92400e"
                            }}
                          >
                            {job.status}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {new Date(job.updated_at).toLocaleTimeString()}
                        </span>
                      </div>
                      {job.error && (
                        <div style={{ marginTop: 8, padding: 8, backgroundColor: "#fef2f2", borderRadius: 6, color: "#991b1b", fontSize: 13 }}>
                          {job.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div>
              <h3 style={{ margin: "0 0 16px", color: "#1e1b4b" }}>Project Files</h3>
              {!exportJob ? (
                <p style={{ color: "#6b7280" }}>Files will be available after export completes.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {[
                    { name: "App Source", icon: "📁", desc: "React Native + Expo" },
                    { name: "Privacy Policy", icon: "📄", desc: "GDPR compliant" },
                    { name: "Terms of Service", icon: "📄", desc: "Standard terms" },
                    { name: "App Icons", icon: "🎨", desc: "All sizes included" },
                    { name: "Splash Screen", icon: "🖼️", desc: "Launch image" },
                    { name: "Screenshots", icon: "📱", desc: "App Store ready" }
                  ].map((file) => (
                    <div
                      key={file.name}
                      style={{
                        padding: 16,
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb"
                      }}
                    >
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{file.icon}</div>
                      <div style={{ fontWeight: 500, color: "#1e1b4b" }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{file.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
