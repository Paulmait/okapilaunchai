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
  };
};

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const res = await fetch(`/api/projects/${params.projectId}/jobs`, { cache: "no-store" });
    const json = await res.json();
    setJobs(json.jobs ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function download(jobId: string) {
    const res = await fetch(`/api/jobs/${jobId}/download`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error ?? "Download not ready");
      return;
    }
    window.location.href = json.url;
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, { bg: string; text: string }> = {
      queued: { bg: "#fef3c7", text: "#92400e" },
      running: { bg: "#dbeafe", text: "#1e40af" },
      succeeded: { bg: "#d1fae5", text: "#065f46" },
      failed: { bg: "#fee2e2", text: "#991b1b" }
    };
    const c = colors[status] ?? { bg: "#f3f4f6", text: "#374151" };
    return (
      <span
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          background: c.bg,
          color: c.text
        }}
      >
        {status}
      </span>
    );
  }

  function getJobTypeLabel(type: string) {
    const labels: Record<string, string> = {
      plan: "Planning",
      build_mvp: "Building MVP",
      export: "Export",
      generate_assets: "Assets",
      validate: "Validation"
    };
    return labels[type] ?? type;
  }

  // Check if any job is still processing
  const isProcessing = jobs.some((j) => j.status === "queued" || j.status === "running");

  // Find the export job with artifacts
  const exportJob = jobs.find(
    (j) => j.type === "export" && j.status === "succeeded" && j.payload?.artifact_object_path
  );

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Link href="/" style={{ color: "#666", fontSize: 14, textDecoration: "none" }}>
            &larr; Back to Dashboard
          </Link>
          <h1 style={{ margin: "8px 0 0" }}>Project</h1>
        </div>
        <Link href="/new" style={{ color: "#111", textDecoration: "none" }}>
          + New Project
        </Link>
      </div>

      <div style={{ padding: 16, background: "#f9fafb", borderRadius: 12, marginBottom: 24 }}>
        <p style={{ margin: 0, color: "#555", fontSize: 13 }}>
          Project ID: <code style={{ background: "#e5e7eb", padding: "2px 6px", borderRadius: 4 }}>{params.projectId}</code>
        </p>
      </div>

      {/* Pipeline Progress */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Build Pipeline</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                  gap: 8,
                  padding: "8px 12px",
                  background: isDone
                    ? "#d1fae5"
                    : isFailed
                    ? "#fee2e2"
                    : isActive
                    ? "#dbeafe"
                    : "#f3f4f6",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    background: isDone
                      ? "#065f46"
                      : isFailed
                      ? "#991b1b"
                      : isActive
                      ? "#1e40af"
                      : "#9ca3af",
                    color: "#fff"
                  }}
                >
                  {isDone ? "\u2713" : isFailed ? "\u2717" : idx + 1}
                </span>
                {getJobTypeLabel(step)}
                {isActive && (
                  <span style={{ marginLeft: 4, color: "#1e40af" }}>
                    ...
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Download */}
      {exportJob && (
        <div
          style={{
            padding: 20,
            background: "#d1fae5",
            borderRadius: 12,
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <strong style={{ fontSize: 16 }}>Export Ready!</strong>
            <p style={{ margin: "4px 0 0", color: "#065f46", fontSize: 14 }}>
              Your app export package is ready to download.
            </p>
          </div>
          <button
            onClick={() => download(exportJob.id)}
            style={{
              padding: "12px 20px",
              borderRadius: 8,
              border: "none",
              background: "#065f46",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Download Export
          </button>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div
          style={{
            padding: 16,
            background: "#dbeafe",
            borderRadius: 12,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              border: "2px solid #1e40af",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}
          />
          <span style={{ color: "#1e40af" }}>Processing your app... This may take a few minutes.</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Job List */}
      <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <strong>All Jobs</strong>
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "transparent",
              cursor: "pointer"
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {!loading && jobs.length === 0 && <p style={{ color: "#666" }}>No jobs yet.</p>}

        {jobs.map((j) => (
          <div
            key={j.id}
            style={{
              padding: 12,
              marginTop: 10,
              border: "1px solid #eee",
              borderRadius: 10
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong>{getJobTypeLabel(j.type)}</strong>
                  {getStatusBadge(j.status)}
                </div>
                <div style={{ color: "#777", fontSize: 12, marginTop: 4 }}>
                  Started: {new Date(j.created_at).toLocaleString()}
                  {j.updated_at !== j.created_at && (
                    <> | Updated: {new Date(j.updated_at).toLocaleString()}</>
                  )}
                </div>
                {j.error && (
                  <div style={{ color: "#dc2626", marginTop: 6, fontSize: 13 }}>{j.error}</div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                {j.status === "succeeded" && j.payload?.artifact_object_path && (
                  <button
                    onClick={() => download(j.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #111",
                      background: "transparent",
                      cursor: "pointer"
                    }}
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
