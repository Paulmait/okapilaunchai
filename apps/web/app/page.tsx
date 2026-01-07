import React from "react";
import Link from "next/link";

const features = [
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "App Store Compliance",
    description: "Every app includes privacy policies, terms of service, and delete-my-data flows. Pass App Store review on first try."
  },
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "AI-Powered Generation",
    description: "Describe your app and watch it come to life. Our AI handles code, assets, and legal docs automatically."
  },
  {
    icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    title: "Complete Export Package",
    description: "Download a production-ready Expo project with all screenshots, icons, and App Store assets included."
  },
  {
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    title: "Transparent Pipeline",
    description: "Track every step of your build. See exactly what's happening with real-time job status updates."
  },
  {
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Free to Start",
    description: "Build 3 apps for free. No credit card required. Upgrade only when you're ready to ship."
  },
  {
    icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    title: "Own Your Code",
    description: "Export complete React Native + Expo source code. No vendor lock-in, no ongoing fees."
  }
];

const steps = [
  { step: 1, title: "Describe Your App", description: "Tell us what you want to build" },
  { step: 2, title: "AI Generates", description: "We create code, assets, and legal docs" },
  { step: 3, title: "Download & Ship", description: "Get your Expo project and publish" }
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero Section */}
      <section
        style={{
          padding: "80px 20px",
          textAlign: "center",
          background: "linear-gradient(180deg, #fafaff 0%, #fff 100%)"
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 16px",
              backgroundColor: "#e0e7ff",
              color: "#4f46e5",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 24
            }}
          >
            Now in Public Beta
          </div>
          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              fontWeight: 700,
              color: "#1e1b4b",
              margin: 0,
              lineHeight: 1.2
            }}
          >
            Build App Store-Ready
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              iOS Apps in Minutes
            </span>
          </h1>
          <p
            style={{
              fontSize: 20,
              color: "#6b7280",
              marginTop: 24,
              maxWidth: 600,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.6
            }}
          >
            Describe your app idea and get a complete, production-ready Expo project with App Store
            compliance, legal docs, and assets included.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 40 }}>
            <Link
              href="/new"
              style={{
                padding: "16px 32px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                borderRadius: 12,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 18,
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)"
              }}
            >
              Start Building Free
            </Link>
            <Link
              href="/pricing"
              style={{
                padding: "16px 32px",
                backgroundColor: "#fff",
                color: "#6366f1",
                borderRadius: 12,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 18,
                border: "2px solid #e0e7ff"
              }}
            >
              View Pricing
            </Link>
          </div>
          <p style={{ marginTop: 16, color: "#9ca3af", fontSize: 14 }}>
            No credit card required
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "80px 20px", backgroundColor: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#1e1b4b",
              textAlign: "center",
              margin: 0
            }}
          >
            How It Works
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#6b7280",
              marginTop: 16,
              marginBottom: 60,
              fontSize: 18
            }}
          >
            From idea to App Store in three simple steps
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 40
            }}
          >
            {steps.map((s) => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    fontWeight: 700,
                    margin: "0 auto 20px"
                  }}
                >
                  {s.step}
                </div>
                <h3 style={{ margin: 0, fontSize: 20, color: "#1e1b4b" }}>{s.title}</h3>
                <p style={{ marginTop: 8, color: "#6b7280" }}>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: "80px 20px", backgroundColor: "#fafaff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#1e1b4b",
              textAlign: "center",
              margin: 0
            }}
          >
            Everything You Need to Ship
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#6b7280",
              marginTop: 16,
              marginBottom: 60,
              fontSize: 18
            }}
          >
            Built for indie developers who want to ship fast
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: 32,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  border: "1px solid #e0e7ff"
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#e0e7ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={f.icon} />
                  </svg>
                </div>
                <h3 style={{ margin: 0, fontSize: 20, color: "#1e1b4b" }}>{f.title}</h3>
                <p style={{ marginTop: 12, color: "#6b7280", lineHeight: 1.6 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section style={{ padding: "80px 20px", backgroundColor: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
            Why Choose OkapiLaunch?
          </h2>
          <p style={{ color: "#6b7280", marginTop: 16, marginBottom: 40, fontSize: 18 }}>
            Unlike other AI app builders, we focus on what matters: getting your app into the App
            Store.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              textAlign: "left"
            }}
          >
            <div style={{ padding: 24, backgroundColor: "#fef2f2", borderRadius: 12 }}>
              <h4 style={{ margin: 0, color: "#991b1b" }}>Other AI Builders</h4>
              <ul style={{ margin: "16px 0 0", paddingLeft: 20, color: "#6b7280" }}>
                <li>No free tier ($20-200/month)</li>
                <li>No App Store compliance</li>
                <li>Buggy, unpredictable output</li>
                <li>Hidden credit systems</li>
                <li>No legal docs included</li>
              </ul>
            </div>
            <div style={{ padding: 24, backgroundColor: "#dcfce7", borderRadius: 12 }}>
              <h4 style={{ margin: 0, color: "#065f46" }}>OkapiLaunch AI</h4>
              <ul style={{ margin: "16px 0 0", paddingLeft: 20, color: "#6b7280" }}>
                <li>Free tier with 3 projects</li>
                <li>Built for App Store approval</li>
                <li>Deterministic, reliable pipeline</li>
                <li>Transparent, simple pricing</li>
                <li>Legal docs auto-generated</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "80px 20px",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          textAlign: "center"
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: "#fff", margin: 0 }}>
            Ready to Build Your App?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 20, fontSize: 18 }}>
            Join developers shipping App Store-ready apps in minutes, not months.
          </p>
          <Link
            href="/new"
            style={{
              display: "inline-block",
              marginTop: 32,
              padding: "18px 40px",
              backgroundColor: "#fff",
              color: "#6366f1",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 18
            }}
          >
            Start Building Free
          </Link>
        </div>
      </section>
    </main>
  );
}
