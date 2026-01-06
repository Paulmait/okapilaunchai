"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Wizard = {
  name: string;
  category: string;
  authApple: boolean;
  subscription: boolean;
  backend: "supabase" | "firebase";
  deleteMyData: boolean;
};

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Wizard>({
    name: "",
    category: "Utilities",
    authApple: true,
    subscription: true,
    backend: "supabase",
    deleteMyData: true
  });

  const canNext = useMemo(() => (step === 1 ? form.name.trim().length >= 2 : true), [step, form.name]);

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

      // Redirect to project page
      router.push(`/projects/${json.projectId}`);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main style={{ maxWidth: 900 }}>
      <h1 style={{ marginTop: 0 }}>New Project Wizard</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: s === step ? "#f5f5f5" : "transparent"
            }}
          >
            Step {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <section style={{ display: "grid", gap: 12 }}>
          <label>
            App name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              placeholder="e.g., PocketCaddie"
            />
          </label>

          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            >
              <option>Utilities</option>
              <option>Productivity</option>
              <option>Health & Fitness</option>
              <option>Education</option>
              <option>Travel</option>
            </select>
          </label>
        </section>
      )}

      {step === 2 && (
        <section style={{ display: "grid", gap: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={form.authApple}
              onChange={(e) => setForm({ ...form, authApple: e.target.checked })}
            />{" "}
            Apple Sign In
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.subscription}
              onChange={(e) => setForm({ ...form, subscription: e.target.checked })}
            />{" "}
            StoreKit subscription
          </label>
          <label>
            Backend
            <select
              value={form.backend}
              onChange={(e) => setForm({ ...form, backend: e.target.value as any })}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            >
              <option value="supabase">Supabase</option>
              <option value="firebase">Firebase</option>
            </select>
          </label>
        </section>
      )}

      {step === 3 && (
        <section style={{ display: "grid", gap: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={form.deleteMyData}
              onChange={(e) => setForm({ ...form, deleteMyData: e.target.checked })}
            />{" "}
            Include “Delete My Data” endpoint + policy language
          </label>
          <p style={{ color: "#555" }}>
            This is one of the fastest ways to reduce App Store review friction for apps that collect user data.
          </p>
        </section>
      )}

      {step === 4 && (
        <section style={{ display: "grid", gap: 10 }}>
          <p>
            Your app will be created and a build job will be queued. You can track progress on the project page.
          </p>
          {error && (
            <div style={{ padding: 12, background: "#fee", color: "#c00", borderRadius: 8 }}>
              {error}
            </div>
          )}
          <button
            onClick={createProject}
            disabled={creating}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #111",
              cursor: creating ? "wait" : "pointer",
              opacity: creating ? 0.6 : 1
            }}
          >
            {creating ? "Creating..." : "Create Project"}
          </button>
        </section>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
        >
          Back
        </button>
        <button
          onClick={() => setStep((s) => Math.min(4, s + 1))}
          disabled={!canNext || step === 4}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
        >
          Next
        </button>
      </div>
    </main>
  );
}
