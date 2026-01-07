"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "../../lib/supabase-browser";

function generateSecurePassword(): string {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => charset[x % charset.length]).join("");
}

function SignupForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowser();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`
        }
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div>
        <h2>Check your email</h2>
        <p>
          We've sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
        </p>
        <Link href="/login" style={{ color: "#111" }}>
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignup} style={{ display: "grid", gap: 16 }}>
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
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd", width: "100%", boxSizing: "border-box", paddingRight: 100 }}
            placeholder="At least 6 characters"
          />
          <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: "none",
                border: "none",
                color: "#6366f1",
                cursor: "pointer",
                fontSize: 12,
                padding: "4px 8px"
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              onClick={() => {
                const newPassword = generateSecurePassword();
                setPassword(newPassword);
                setShowPassword(true);
              }}
              style={{
                background: "#f0f0ff",
                border: "1px solid #6366f1",
                color: "#6366f1",
                cursor: "pointer",
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 4,
                fontWeight: 500
              }}
            >
              Generate
            </button>
          </div>
        </div>
        {password && showPassword && (
          <span style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            Save this password - you'll need it to log in!
          </span>
        )}
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
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <p style={{ marginTop: 20, textAlign: "center", color: "#666" }}>
        Already have an account?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} style={{ color: "#111" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginTop: 0 }}>Create Account</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SignupForm />
      </Suspense>
    </main>
  );
}
