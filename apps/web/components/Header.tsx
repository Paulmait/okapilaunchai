"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid #e0e7ff",
        backgroundColor: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}
    >
      <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/favicon.svg" alt="OkapiLaunch AI" width={32} height={32} />
        <span style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>
          OkapiLaunch<span style={{ fontWeight: 300, color: "#6366f1" }}>AI</span>
        </span>
      </Link>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <Link href="/pricing" style={{ color: "#6366f1", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
          Pricing
        </Link>

        {loading ? (
          <span style={{ color: "#9ca3af", fontSize: 14 }}>...</span>
        ) : user ? (
          <>
            <Link href="/dashboard" style={{ color: "#6366f1", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              style={{
                color: "#6b7280",
                background: "none",
                border: "1px solid #e0e7ff",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            style={{
              color: "#6366f1",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500
            }}
          >
            Sign In
          </Link>
        )}

        <Link
          href="/new"
          style={{
            color: "#fff",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            padding: "8px 16px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            borderRadius: 8
          }}
        >
          Start Building
        </Link>
      </div>
    </nav>
  );
}
