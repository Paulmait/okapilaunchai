import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing. Start free, upgrade when you're ready to ship."
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "one-time",
    description: "Try OkapiLaunch with one free project",
    features: [
      "1 app project (lifetime)",
      "AI-powered app generation",
      "Basic Expo export",
      "Privacy policy included",
      "Community support"
    ],
    cta: "Try Free",
    href: "/new",
    highlighted: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For indie developers ready to ship",
    features: [
      "Unlimited projects",
      "Full legal docs bundle",
      "In-app code editor (beta)",
      "GitHub integration (beta)",
      "Email support"
    ],
    cta: "Start Pro",
    href: "/subscribe?plan=pro",
    highlighted: true
  },
  {
    name: "Team",
    price: "$79",
    period: "/month",
    description: "For agencies and teams",
    features: [
      "Everything in Pro",
      "Priority email support",
      "Team features (coming soon)",
      "API access (coming soon)",
      "White-label exports (coming soon)"
    ],
    cta: "Start Team",
    href: "/subscribe?plan=team",
    highlighted: false
  }
];

const comparisonFeatures = [
  { feature: "Free tier available", us: true, them: false },
  { feature: "App Store compliance", us: true, them: false },
  { feature: "Legal docs auto-generated", us: true, them: false },
  { feature: "Transparent pricing", us: true, them: false },
  { feature: "Own your code (no lock-in)", us: true, them: false },
  { feature: "No hidden credits", us: true, them: false },
  { feature: "Export to Expo/React Native", us: true, them: true }
];

export default function PricingPage() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ fontSize: 42, fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{ fontSize: 20, color: "#6b7280", marginTop: 16, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Start free. No credit card required. Upgrade when you're ready to ship to the App Store.
        </p>
      </div>

      {/* Pricing Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 80 }}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              padding: 32,
              borderRadius: 16,
              border: plan.highlighted ? "2px solid #6366f1" : "1px solid #e0e7ff",
              backgroundColor: plan.highlighted ? "#fafaff" : "#fff",
              position: "relative",
              boxShadow: plan.highlighted ? "0 8px 30px rgba(99, 102, 241, 0.15)" : "none"
            }}
          >
            {plan.highlighted && (
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "#fff",
                  padding: "4px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                MOST POPULAR
              </div>
            )}
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "#1e1b4b", margin: 0 }}>{plan.name}</h2>
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 48, fontWeight: 700, color: "#1e1b4b" }}>{plan.price}</span>
              <span style={{ fontSize: 16, color: "#6b7280" }}>{plan.period}</span>
            </div>
            <p style={{ color: "#6b7280", marginTop: 8, marginBottom: 24 }}>{plan.description}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 32 }}>
              {plan.features.map((feature, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: "#374151" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M16.667 5L7.5 14.167 3.333 10" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              style={{
                display: "block",
                textAlign: "center",
                padding: "14px 24px",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 16,
                background: plan.highlighted ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "#fff",
                color: plan.highlighted ? "#fff" : "#6366f1",
                border: plan.highlighted ? "none" : "2px solid #6366f1"
              }}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div style={{ marginBottom: 80 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: "#1e1b4b", textAlign: "center", marginBottom: 40 }}>
          Why OkapiLaunch AI?
        </h2>
        <div style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e0e7ff", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", padding: "16px 24px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e0e7ff", fontWeight: 600, color: "#1e1b4b" }}>
            <div>Feature</div>
            <div style={{ textAlign: "center" }}>Us</div>
            <div style={{ textAlign: "center", color: "#9ca3af" }}>Others</div>
          </div>
          {comparisonFeatures.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 100px",
                padding: "14px 24px",
                borderBottom: i < comparisonFeatures.length - 1 ? "1px solid #e0e7ff" : "none",
                color: "#374151"
              }}
            >
              <div>{row.feature}</div>
              <div style={{ textAlign: "center" }}>
                {row.us ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: "inline" }}>
                    <circle cx="12" cy="12" r="10" fill="#dcfce7"/>
                    <path d="M17 9L10 16L7 13" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: "inline" }}>
                    <circle cx="12" cy="12" r="10" fill="#fee2e2"/>
                    <path d="M15 9L9 15M9 9L15 15" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                {row.them ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: "inline" }}>
                    <circle cx="12" cy="12" r="10" fill="#dcfce7"/>
                    <path d="M17 9L10 16L7 13" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: "inline" }}>
                    <circle cx="12" cy="12" r="10" fill="#fee2e2"/>
                    <path d="M15 9L9 15M9 9L15 15" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: "#1e1b4b", textAlign: "center", marginBottom: 40 }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "grid", gap: 20 }}>
          {[
            {
              q: "What do I get in the free tier?",
              a: "You get 1 free app project to try OkapiLaunch. This includes full AI generation, basic Expo export, and auto-generated privacy policy. Perfect for testing if OkapiLaunch is right for you."
            },
            {
              q: "Do I need a credit card to start?",
              a: "No! The free tier requires no credit card. Just sign up and start building your app immediately."
            },
            {
              q: "What does 'beta' mean for features?",
              a: "Features marked as beta are functional but still being improved. The code editor and GitHub integration work but have limited functionality. We're actively developing these based on user feedback."
            },
            {
              q: "Can I export my app and own the code?",
              a: "Yes! You get a complete Expo/React Native project that you fully own. No vendor lock-in, no ongoing fees to keep your app running."
            },
            {
              q: "What Team features are coming soon?",
              a: "We're building team collaboration (shared projects, member management), API access for automation, and white-label exports. Subscribe to Team now to lock in the price and get these features as they launch."
            }
          ].map((faq, i) => (
            <div key={i} style={{ padding: 24, backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e0e7ff" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1e1b4b" }}>{faq.q}</h3>
              <p style={{ margin: "12px 0 0", color: "#6b7280", lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", marginTop: 80, padding: "60px 40px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", borderRadius: 24 }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, color: "#fff", margin: 0 }}>
          Ready to build your app?
        </h2>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.9)", marginTop: 16, marginBottom: 32 }}>
          Join thousands of developers shipping App Store-ready apps in minutes.
        </p>
        <Link
          href="/new"
          style={{
            display: "inline-block",
            padding: "16px 40px",
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
    </main>
  );
}
