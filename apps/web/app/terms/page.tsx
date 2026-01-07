import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "OkapiLaunch AI Terms of Service - Rules and guidelines for using our service."
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px" }}>
      <Link href="/" style={{ color: "#6366f1", textDecoration: "none", fontSize: 14 }}>
        &larr; Back to Home
      </Link>

      <article style={{ marginTop: 24 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 40 }}>Last Updated: January 6, 2026</p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Agreement to Terms</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            By accessing or using OkapiLaunch AI ("Service"), you agree to be bound by these Terms
            of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Description of Service</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            OkapiLaunch AI is an AI-powered platform that helps you create iOS mobile applications.
            We generate React Native (Expo) source code, legal documents, and App Store assets based
            on your project descriptions. You receive downloadable export packages that you can use
            to publish apps to the App Store.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>User Accounts</h2>
          <p style={{ color: "#374151", lineHeight: 1.7, marginBottom: 12 }}>
            To use the Service, you must create an account. You agree to:
          </p>
          <ul style={{ color: "#374151", lineHeight: 1.7, paddingLeft: 24 }}>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your password</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Acceptable Use</h2>
          <p style={{ color: "#374151", lineHeight: 1.7, marginBottom: 12 }}>
            You agree not to use the Service to:
          </p>
          <ul style={{ color: "#374151", lineHeight: 1.7, paddingLeft: 24 }}>
            <li>Create apps that violate Apple App Store guidelines</li>
            <li>Generate illegal, harmful, or offensive content</li>
            <li>Infringe on intellectual property rights</li>
            <li>Distribute malware or malicious code</li>
            <li>Attempt to circumvent security measures</li>
            <li>Abuse or overload our systems</li>
            <li>Resell or redistribute the Service without permission</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Intellectual Property</h2>
          <h3 style={{ fontSize: 18, color: "#1e1b4b", marginTop: 20, marginBottom: 12 }}>
            Your Content
          </h3>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            You retain ownership of the content you provide (app descriptions, configurations). You
            grant us a license to use this content solely to provide the Service.
          </p>

          <h3 style={{ fontSize: 18, color: "#1e1b4b", marginTop: 20, marginBottom: 12 }}>
            Generated Content
          </h3>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            The code, assets, and documents we generate for your projects are yours to use. You
            receive a perpetual, worldwide, royalty-free license to use, modify, and distribute the
            generated content in your applications.
          </p>

          <h3 style={{ fontSize: 18, color: "#1e1b4b", marginTop: 20, marginBottom: 12 }}>
            Our Platform
          </h3>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            The OkapiLaunch AI platform, including our website, tools, and underlying technology,
            remains our intellectual property.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Subscriptions and Payments</h2>
          <ul style={{ color: "#374151", lineHeight: 1.7, paddingLeft: 24 }}>
            <li>Free tier includes 3 projects with basic features</li>
            <li>Paid subscriptions are billed monthly in advance</li>
            <li>You may cancel at any time; access continues until the billing period ends</li>
            <li>No refunds for partial billing periods</li>
            <li>Prices may change with 30 days notice</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>AI-Generated Content</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            Content is generated using AI technology. While we strive for quality and accuracy:
          </p>
          <ul style={{ color: "#374151", lineHeight: 1.7, paddingLeft: 24, marginTop: 12 }}>
            <li>Generated code may contain bugs or require modifications</li>
            <li>Legal templates are starting points and should be reviewed by a lawyer</li>
            <li>You are responsible for reviewing and testing all generated content</li>
            <li>App Store approval is not guaranteed</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Disclaimers</h2>
          <p style={{ color: "#374151", lineHeight: 1.7, textTransform: "uppercase", fontSize: 14 }}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE
            DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. WE ARE
            NOT RESPONSIBLE FOR APP STORE REJECTIONS, LEGAL COMPLIANCE OF YOUR APPS, OR ANY DAMAGES
            ARISING FROM USE OF GENERATED CONTENT.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Limitation of Liability</h2>
          <p style={{ color: "#374151", lineHeight: 1.7, textTransform: "uppercase", fontSize: 14 }}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OKAPILAUNCH AI SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY
            SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST TWELVE MONTHS.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Indemnification</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            You agree to indemnify and hold harmless OkapiLaunch AI from any claims, damages, or
            expenses arising from your use of the Service, your violation of these Terms, or your
            violation of any third-party rights.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Termination</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            We may suspend or terminate your account for violation of these Terms. You may delete
            your account at any time from the{" "}
            <Link href="/settings" style={{ color: "#6366f1" }}>Settings page</Link>. Upon
            termination, your right to use the Service ends, but provisions that should survive
            (intellectual property, disclaimers, limitations) remain in effect.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Changes to Terms</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            We may modify these Terms at any time. Material changes will be communicated via email
            or notice on the website. Continued use of the Service after changes constitutes
            acceptance of the new Terms.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Governing Law</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            These Terms shall be governed by the laws of the State of Delaware, United States,
            without regard to conflict of law principles.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, color: "#1e1b4b", marginBottom: 16 }}>Contact Us</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            If you have questions about these Terms, please contact us at:{" "}
            <a href="mailto:legal@okapilaunch.com" style={{ color: "#6366f1" }}>
              legal@okapilaunch.com
            </a>
          </p>
        </section>
      </article>
    </main>
  );
}
