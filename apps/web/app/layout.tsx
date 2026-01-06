import React from "react";
import Link from "next/link";

export const metadata = {
  title: "OkapiLaunch AI",
  description: "App Store-ready iOS app builder"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          margin: 0,
          backgroundColor: "#fafafa"
        }}
      >
        <nav
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #eee",
            backgroundColor: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <strong style={{ fontSize: 18 }}>OkapiLaunch AI</strong>
          </Link>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Link href="/pricing" style={{ color: "#666", textDecoration: "none", fontSize: 14 }}>
              Pricing
            </Link>
            <Link
              href="/login"
              style={{
                color: "#111",
                textDecoration: "none",
                fontSize: 14,
                padding: "6px 12px",
                border: "1px solid #ddd",
                borderRadius: 6
              }}
            >
              Sign In
            </Link>
          </div>
        </nav>
        <main style={{ minHeight: "calc(100vh - 60px)" }}>{children}</main>
      </body>
    </html>
  );
}
