"use client";

import { useState, useEffect } from "react";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentStatus = "pending" | "accepted" | "declined";

export default function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>("pending");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === "accepted" || stored === "declined") {
      setStatus(stored as ConsentStatus);
    } else {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setStatus("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setStatus("declined");
    setVisible(false);
  };

  if (status !== "pending" || !visible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#1e1b4b",
        color: "#fff",
        padding: "16px 24px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        zIndex: 9999,
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div style={{ flex: "1 1 400px", fontSize: 14, lineHeight: 1.5 }}>
        <p style={{ margin: 0 }}>
          We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.
          By clicking &quot;Accept&quot;, you consent to our use of cookies.{" "}
          <a
            href="/privacy"
            style={{ color: "#a5b4fc", textDecoration: "underline" }}
          >
            Learn more
          </a>
        </p>
      </div>
      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        <button
          onClick={handleDecline}
          style={{
            padding: "10px 20px",
            backgroundColor: "transparent",
            color: "#a5b4fc",
            border: "1px solid #a5b4fc",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
