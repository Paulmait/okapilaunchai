import React from "react";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import ClientWidgets from "../components/ClientWidgets";
import Header from "../components/Header";
import { Providers } from "../components/Providers";
import CookieConsent from "../components/CookieConsent";

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://okapilaunch.com"),
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
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OkapiLaunch" />
      </head>
      <body
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          margin: 0,
          backgroundColor: "#fafafa",
          color: "#1e1b4b"
        }}
      >
        <Providers>
          <Header />
          <main style={{ minHeight: "calc(100vh - 60px)" }}>{children}</main>
          <ClientWidgets />
          <CookieConsent />
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
        </Providers>
      </body>
    </html>
  );
}
