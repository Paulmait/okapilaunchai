import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "OkapiLaunch AI - Build App Store-Ready iOS Apps in Minutes",
    template: "%s | OkapiLaunch AI"
  },
  description:
    "Build complete, production-ready iOS apps from your description. AI-powered app builder with legal compliance, App Store assets, and Expo exports.",
  keywords: [
    "AI app builder",
    "iOS app generator",
    "React Native",
    "Expo",
    "App Store",
    "mobile app builder",
    "no-code",
    "low-code"
  ],
  authors: [{ name: "OkapiLaunch" }],
  creator: "OkapiLaunch AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://okapilaunch.com",
    siteName: "OkapiLaunch AI",
    title: "OkapiLaunch AI - Build App Store-Ready iOS Apps in Minutes",
    description:
      "Build complete, production-ready iOS apps from your description. AI-powered with legal compliance and App Store assets.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "OkapiLaunch AI"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "OkapiLaunch AI - Build App Store-Ready iOS Apps",
    description: "AI-powered iOS app builder with legal compliance and App Store assets.",
    images: ["/og-image.svg"]
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg"
  },
  themeColor: "#6366f1"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          margin: 0,
          backgroundColor: "#fafafa",
          color: "#1e1b4b"
        }}
      >
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
        <main style={{ minHeight: "calc(100vh - 60px)" }}>{children}</main>
        <footer
          style={{
            padding: "40px 20px",
            borderTop: "1px solid #e0e7ff",
            backgroundColor: "#fff",
            textAlign: "center",
            color: "#6b7280",
            fontSize: 14
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }}>
            <Link href="/pricing" style={{ color: "#6b7280", textDecoration: "none" }}>Pricing</Link>
            <Link href="/privacy" style={{ color: "#6b7280", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>Terms</Link>
          </div>
          <p style={{ margin: 0 }}>
            2026 OkapiLaunch AI. Build App Store-ready apps in minutes.
          </p>
        </footer>
      </body>
    </html>
  );
}
