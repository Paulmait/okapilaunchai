import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "OkapiLaunch AI Privacy Policy - How we collect, use, and protect your data."
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px" }}>
      <Link href="/" style={{ color: "#6366f1", textDecoration: "none", fontSize: 14 }}>
        &larr; Back to Home
      </Link>

      <article style={{ marginTop: 24 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 40 }}>Last Updated: January 6, 2026</p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Introduction</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            OkapiLaunch AI ("we," "our," or "us") respects your privacy and is committed to
            protecting your personal data. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our web application and services.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Information We Collect</h2>

          <h3 style={{ fontSize: 18, color: "#1e1b4b", marginTop: 20, marginBottom: 12 }}>
            Information You Provide
          </h3>
          <ul style={{ color: "#374151", lineHeight: 1.7, paddingLeft: 24 }}>
            <li><strong>Account Information:</strong> Email address and password when you create an account.</li>
            <li><strong>Project Data:</strong> App descriptions, configurations, and settings you provide in the wizard.</li>
            <li><strong>Payment Information:</strong> Billing details processed securely through our payment provider.</li>
          </ul>

          <h3 style={{ fontSize: 18, color: "#1e1b4b", marginTop: 20, marginBottom: 12 }}>
            Information Collected Automatically
          </h3>
          <ul style={{ color: "#374151", lineHeight: 1.7, paddingLeft: 24 }}>
            <li><strong>Usage Data:</strong> How you interact with our service, features used, and actions taken.</li>
            <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
            <li><strong>Log Data:</strong> IP address, access times, and pages viewed.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>How We Use Your Information</h2>
          <ul style={{ color: "#374151", lineHeight: 1.7, paddingLeft: 24 }}>
            <li>Provide, maintain, and improve our services</li>
            <li>Generate your app projects and export packages</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Respond to your questions and requests</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>AI Processing</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            We use AI services (OpenAI and Anthropic) to generate app code and content. Your project
            descriptions are sent to these services for processing. We do not share your personal
            account information with AI providers. Generated content is stored in your account and
            included in your exports.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Data Storage and Security</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            Your data is stored securely using Supabase, a SOC 2 Type II certified platform. We use
            encryption in transit (TLS) and at rest. Export files are stored in secure cloud storage
            with signed URLs for download access.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Your Rights</h2>
          <p style={{ color: "#374151", lineHeight: 1.7, marginBottom: 16 }}>You have the right to:</p>
          <ul style={{ color: "#374151", lineHeight: 1.7, paddingLeft: 24 }}>
            <li><strong>Access:</strong> Request a copy of your personal data.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
            <li><strong>Deletion:</strong> Delete your account and all associated data.</li>
            <li><strong>Data Portability:</strong> Export your projects and data.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Delete Your Data</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            You can delete your account and all associated data at any time from the{" "}
            <Link href="/settings" style={{ color: "#6366f1" }}>Settings page</Link>. This will
            permanently remove your account, all projects, jobs, and exported files. This action
            cannot be undone.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Data Retention</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            We retain your data for as long as your account is active. Export files are retained
            based on your subscription plan (30 days for Pro, 1 year for Team). After account
            deletion, all data is permanently removed within 30 days.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Cookies</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            We use essential cookies to maintain your session and authentication state. We do not
            use tracking cookies or sell data to advertisers.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Children's Privacy</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            Our service is not intended for children under 13. We do not knowingly collect
            information from children under 13.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Changes to This Policy</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by email or by posting a notice on our website.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Contact Us</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            If you have questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:privacy@okapilaunch.com" style={{ color: "#6366f1" }}>
              privacy@okapilaunch.com
            </a>
          </p>
        </section>
      </article>
    </main>
  );
}
