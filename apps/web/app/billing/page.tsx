"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Invoice {
  id: string;
  number: string | null;
  date: number;
  amount: number;
  currency: string;
  status: string | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

interface Subscription {
  plan: string;
  status: string;
  current_period_end?: string;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  async function fetchBillingData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch subscription status
      const subRes = await fetch("/api/user/subscription");
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
      }

      // Fetch invoices
      const invRes = await fetch("/api/stripe/invoices");
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.invoices || []);
      }
    } catch (err) {
      setError("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to cancel subscription");
        return;
      }

      setSuccessMessage(data.message);
      setShowCancelConfirm(false);
      // Refresh subscription data
      fetchBillingData();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleReactivate() {
    setReactivateLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/stripe/reactivate", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reactivate subscription");
        return;
      }

      setSuccessMessage(data.message);
      fetchBillingData();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setReactivateLoading(false);
    }
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency
    }).format(amount);
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #e5e7eb",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto"
          }}
        />
        <p style={{ color: "#6b7280", marginTop: 16 }}>Loading billing information...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <Link
        href="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "#6b7280",
          textDecoration: "none",
          fontSize: 14,
          marginBottom: 24
        }}
      >
        ← Back to Dashboard
      </Link>

      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1e1b4b", margin: "0 0 32px" }}>
        Billing & Subscription
      </h1>

      {error && (
        <div
          style={{
            padding: 16,
            backgroundColor: "#fef2f2",
            borderRadius: 8,
            color: "#991b1b",
            marginBottom: 24
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: 16,
            backgroundColor: "#f0fdf4",
            borderRadius: 8,
            color: "#166534",
            marginBottom: 24
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Current Plan Section */}
      <div
        style={{
          padding: 24,
          backgroundColor: "#fff",
          borderRadius: 16,
          border: "1px solid #e0e7ff",
          marginBottom: 32
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 600, color: "#1e1b4b" }}>
          Current Plan
        </h2>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "6px 16px",
                backgroundColor: subscription?.plan === "free" ? "#f3f4f6" : "#eff6ff",
                color: subscription?.plan === "free" ? "#374151" : "#3b82f6",
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                textTransform: "capitalize"
              }}
            >
              {subscription?.plan || "Free"} Plan
            </div>
            {subscription?.status === "canceling" && (
              <p style={{ margin: "8px 0 0", color: "#dc2626", fontSize: 14 }}>
                Scheduled for cancellation at end of billing period
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {subscription?.plan === "free" ? (
              <Link
                href="/pricing"
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "#fff",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                Upgrade Plan
              </Link>
            ) : subscription?.status === "canceling" ? (
              <button
                onClick={handleReactivate}
                disabled={reactivateLoading}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "#fff",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: reactivateLoading ? "wait" : "pointer",
                  opacity: reactivateLoading ? 0.7 : 1
                }}
              >
                {reactivateLoading ? "Reactivating..." : "Reactivate Subscription"}
              </button>
            ) : (
              <>
                <Link
                  href="/pricing"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#fff",
                    color: "#6366f1",
                    border: "2px solid #6366f1",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  Change Plan
                </Link>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#fff",
                    color: "#dc2626",
                    border: "2px solid #dc2626",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer"
                  }}
                >
                  Cancel Subscription
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 32,
              maxWidth: 450,
              width: "90%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 600, color: "#1e1b4b" }}>
              Cancel Subscription?
            </h3>
            <p style={{ margin: "0 0 24px", color: "#6b7280", lineHeight: 1.6 }}>
              Your subscription will remain active until the end of your current billing period.
              After that, you'll be downgraded to the Free plan with limited features.
            </p>
            <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: 14 }}>
              You can reactivate anytime before the billing period ends.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCancelConfirm(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: cancelLoading ? "wait" : "pointer",
                  opacity: cancelLoading ? 0.7 : 1
                }}
              >
                {cancelLoading ? "Canceling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History Section */}
      <div
        style={{
          padding: 24,
          backgroundColor: "#fff",
          borderRadius: 16,
          border: "1px solid #e0e7ff"
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 600, color: "#1e1b4b" }}>
          Invoice History
        </h2>

        {invoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ margin: "0 auto 16px", opacity: 0.5 }}
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p style={{ margin: 0 }}>No invoices yet</p>
            <p style={{ margin: "8px 0 0", fontSize: 14 }}>
              Invoices will appear here after your first payment.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px", color: "#6b7280", fontWeight: 500, fontSize: 14 }}>
                    Invoice
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 8px", color: "#6b7280", fontWeight: 500, fontSize: 14 }}>
                    Date
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 8px", color: "#6b7280", fontWeight: 500, fontSize: 14 }}>
                    Amount
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 8px", color: "#6b7280", fontWeight: 500, fontSize: 14 }}>
                    Status
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 8px", color: "#6b7280", fontWeight: 500, fontSize: 14 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "16px 8px", color: "#1e1b4b", fontWeight: 500 }}>
                      {invoice.number || invoice.id.slice(0, 12)}
                    </td>
                    <td style={{ padding: "16px 8px", color: "#6b7280" }}>
                      {formatDate(invoice.date)}
                    </td>
                    <td style={{ padding: "16px 8px", color: "#1e1b4b", fontWeight: 500 }}>
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td style={{ padding: "16px 8px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: invoice.status === "paid" ? "#dcfce7" : "#fef3c7",
                          color: invoice.status === "paid" ? "#166534" : "#92400e",
                          textTransform: "capitalize"
                        }}
                      >
                        {invoice.status || "pending"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 8px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        {invoice.hostedUrl && (
                          <a
                            href={invoice.hostedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#f3f4f6",
                              color: "#374151",
                              borderRadius: 6,
                              textDecoration: "none",
                              fontSize: 13,
                              fontWeight: 500
                            }}
                          >
                            View
                          </a>
                        )}
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#6366f1",
                              color: "#fff",
                              borderRadius: 6,
                              textDecoration: "none",
                              fontSize: 13,
                              fontWeight: 500
                            }}
                          >
                            Download PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legal Notice */}
      <p style={{ marginTop: 24, fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
        Payments are securely processed by Stripe.
        You can cancel your subscription at any time with one click.
        For billing questions, contact support@okapilaunch.ai
      </p>
    </div>
  );
}
