"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Job = {
  id: string;
  type: string;
  status: "queued" | "running" | "succeeded" | "failed";
};

type Project = {
  id: string;
  name: string;
  created_at: string;
  latestJob: Job | null;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to load projects");
        return;
      }

      // API now returns projects with latestJob included (single query)
      setProjects(json.projects ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#1e1b4b" }}>My Projects</h1>
        <Link
          href="/new"
          style={{
            padding: "10px 16px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          + New Project
        </Link>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fee", color: "#c00", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && <p>Loading projects...</p>}

      {!loading && projects.length === 0 && (
        <div
          style={{
            padding: 60,
            textAlign: "center",
            border: "2px dashed #e0e7ff",
            borderRadius: 16,
            backgroundColor: "#fafaff"
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            <img src="/favicon.svg" alt="" width={64} height={64} style={{ opacity: 0.5 }} />
          </div>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 18 }}>No projects yet</p>
          <p style={{ marginTop: 8 }}>
            <Link
              href="/new"
              style={{
                color: "#6366f1",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Create your first app
            </Link>
          </p>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {projects.map((p) => {
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                style={{
                  display: "block",
                  padding: 20,
                  border: "1px solid #e0e7ff",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: "inherit",
                  backgroundColor: "#fff",
                  transition: "all 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e0e7ff";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, color: "#1e1b4b" }}>{p.name}</h3>
                    <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                      Created {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {p.latestJob && (
                      <>
                        <span style={{ color: "#888", fontSize: 12 }}>{p.latestJob.type}</span>
                        {getStatusBadge(p.latestJob.status)}
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
