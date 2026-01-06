"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  created_at: string;
};

type Job = {
  id: string;
  type: string;
  status: "queued" | "running" | "succeeded" | "failed";
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectJobs, setProjectJobs] = useState<Record<string, Job | null>>({});
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

      setProjects(json.projects ?? []);

      // Fetch latest job for each project
      const jobPromises = (json.projects ?? []).map(async (p: Project) => {
        try {
          const jobRes = await fetch(`/api/projects/${p.id}/jobs`, { cache: "no-store" });
          const jobJson = await jobRes.json();
          const jobs = jobJson.jobs ?? [];
          return { projectId: p.id, job: jobs[0] ?? null };
        } catch {
          return { projectId: p.id, job: null };
        }
      });

      const jobResults = await Promise.all(jobPromises);
      const jobMap: Record<string, Job | null> = {};
      for (const r of jobResults) {
        jobMap[r.projectId] = r.job;
      }
      setProjectJobs(jobMap);
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
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <Link
          href="/new"
          style={{
            padding: "10px 16px",
            background: "#111",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none"
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
            padding: 40,
            textAlign: "center",
            border: "2px dashed #ddd",
            borderRadius: 12,
            color: "#666"
          }}
        >
          <p style={{ margin: 0 }}>No projects yet.</p>
          <p style={{ marginTop: 8 }}>
            <Link href="/new" style={{ color: "#111" }}>
              Create your first app
            </Link>
          </p>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {projects.map((p) => {
            const latestJob = projectJobs[p.id];
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                style={{
                  display: "block",
                  padding: 16,
                  border: "1px solid #eee",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 0.15s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ccc")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#eee")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{p.name}</h3>
                    <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
                      Created {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {latestJob && (
                      <>
                        <span style={{ color: "#888", fontSize: 12 }}>{latestJob.type}</span>
                        {getStatusBadge(latestJob.status)}
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
