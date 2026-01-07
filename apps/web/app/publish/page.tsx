"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { getSupabaseBrowser } from "../../lib/supabase-browser";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  latest_job?: {
    id: string;
    status: string;
    artifact_object_path?: string;
  };
}

export default function PublishPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{ plan: string } | null>(null);

  useEffect(() => {
    loadProjects();
    loadSubscription();
  }, []);

  async function loadProjects() {
    const supabase = getSupabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Get projects with their latest completed job
    const { data: projectsData } = await supabase
      .from("projects")
      .select("id, name, description, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (projectsData) {
      // Get latest job for each project
      const projectsWithJobs = await Promise.all(
        projectsData.map(async (project) => {
          const { data: jobData } = await supabase
            .from("jobs")
            .select("id, status, payload")
            .eq("project_id", project.id)
            .eq("status", "succeeded")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...project,
            latest_job: jobData ? {
              id: jobData.id,
              status: jobData.status,
              artifact_object_path: jobData.payload?.artifact_object_path
            } : undefined
          };
        })
      );
      setProjects(projectsWithJobs);
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

  const readyProjects = projects.filter(p => p.latest_job?.artifact_object_path);
  const isPro = subscription?.plan === "pro" || subscription?.plan === "team";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Header />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 28, color: "#1e1b4b" }}>Publish to App Store</h1>
          <p style={{ margin: "8px 0 0", color: "#6b7280" }}>
            Deploy your completed apps to the Apple App Store
          </p>
        </div>

        {!isPro && (
          <div
            style={{
              padding: 24,
              backgroundColor: "#fef3c7",
              borderRadius: 12,
              border: "1px solid #fcd34d",
              marginBottom: 24
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: "#92400e" }}>Pro Feature</h3>
                <p style={{ margin: "4px 0 12px", color: "#a16207", fontSize: 14 }}>
                  App Store publishing is available on Pro and Team plans. Upgrade to publish your apps directly.
                </p>
                <Link
                  href="/pricing"
                  style={{
                    display: "inline-block",
                    padding: "10px 20px",
                    backgroundColor: "#d97706",
                    color: "#fff",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            Loading your projects...
          </div>
        ) : readyProjects.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              backgroundColor: "#fff",
              borderRadius: 16,
              border: "1px solid #e0e7ff"
            }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 style={{ margin: 0, color: "#4b5563" }}>No apps ready to publish</h3>
            <p style={{ margin: "8px 0 20px", color: "#9ca3af" }}>
              Complete building an app first, then come back to publish it.
            </p>
            <Link
              href="/new"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 600
              }}
            >
              Create New App
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {readyProjects.map((project) => (
              <div
                key={project.id}
                style={{
                  padding: 24,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e0e7ff"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, color: "#1e1b4b" }}>{project.name}</h3>
                    <p style={{ margin: "4px 0", color: "#6b7280", fontSize: 14 }}>{project.description}</p>
                    <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#d1fae5",
                          color: "#059669",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      >
                        Build Complete
                      </span>
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link
                      href={`/projects/${project.id}`}
                      style={{
                        padding: "10px 16px",
                        backgroundColor: "#f3f4f6",
                        color: "#374151",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontSize: 14,
                        fontWeight: 500
                      }}
                    >
                      View Project
                    </Link>
                    {isPro ? (
                      <button
                        onClick={() => alert("App Store publishing coming soon! Download your export and upload via Transporter for now.")}
                        style={{
                          padding: "10px 16px",
                          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Publish
                      </button>
                    ) : (
                      <Link
                        href="/pricing"
                        style={{
                          padding: "10px 16px",
                          backgroundColor: "#e0e7ff",
                          color: "#4f46e5",
                          borderRadius: 8,
                          textDecoration: "none",
                          fontSize: 14,
                          fontWeight: 500
                        }}
                      >
                        Upgrade to Publish
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 40,
            padding: 24,
            backgroundColor: "#f0f9ff",
            borderRadius: 12,
            border: "1px solid #bae6fd"
          }}
        >
          <h3 style={{ margin: "0 0 12px", color: "#0369a1", fontSize: 16 }}>Publishing Checklist</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0c4a6e", fontSize: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Privacy Policy included
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0c4a6e", fontSize: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Terms of Service included
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0c4a6e", fontSize: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              App icons generated
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0c4a6e", fontSize: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Screenshots ready
            </div>
          </div>
          <p style={{ margin: "12px 0 0", color: "#0369a1", fontSize: 13 }}>
            All OkapiLaunch exports include App Store compliance essentials.
          </p>
        </div>
      </div>
    </div>
  );
}
