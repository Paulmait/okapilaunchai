"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "../../lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginTop: 0 }}>Sign In</h1>

      <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
        {error && (
          <div style={{ padding: 12, background: "#fee", color: "#c00", borderRadius: 8 }}>
            {error}
          </div>
        )}

        <label style={{ display: "grid", gap: 4 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
            placeholder="you@example.com"
          />
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
            placeholder="Your password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 14,
            borderRadius: 8,
            border: "none",
            background: "#111",
            color: "#fff",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p style={{ marginTop: 20, textAlign: "center", color: "#666" }}>
        Don't have an account?{" "}
        <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} style={{ color: "#111" }}>
          Sign up
        </Link>
      </p>
    </main>
  );
}
