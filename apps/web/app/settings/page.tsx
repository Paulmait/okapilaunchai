"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function handleDeleteData() {
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/delete-my-data", {
        method: "POST"
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to delete data");
        return;
      }

      setDeleted(true);
      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    try {
      const res = await fetch("/api/auth/signout", { method: "POST" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch {
      // Fallback: just redirect
      router.push("/");
    }
  }

  if (deleted) {
    return (
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#d1fae5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 40
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{ margin: 0, color: "#065f46" }}>Data Deleted</h1>
        <p style={{ color: "#6b7280", marginTop: 16 }}>
          Your account and all associated data have been permanently deleted.
        </p>
        <p style={{ color: "#9ca3af", marginTop: 8, fontSize: 14 }}>
          Redirecting to home page...
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
      <Link href="/dashboard" style={{ color: "#6366f1", textDecoration: "none", fontSize: 14 }}>
        &larr; Back to Dashboard
      </Link>

      <h1 style={{ marginTop: 16, marginBottom: 32, color: "#1e1b4b" }}>Settings</h1>

      {/* Account Section */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, color: "#1e1b4b", marginBottom: 16 }}>Account</h2>
        <div
          style={{
            padding: 20,
            backgroundColor: "#fff",
            borderRadius: 12,
            border: "1px solid #e0e7ff"
          }}
        >
          <button
            onClick={handleSignOut}
            style={{
              padding: "12px 20px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Sign Out
          </button>
        </div>
      </section>

      {/* Legal Section */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, color: "#1e1b4b", marginBottom: 16 }}>Legal</h2>
        <div
          style={{
            padding: 20,
            backgroundColor: "#fff",
            borderRadius: 12,
            border: "1px solid #e0e7ff",
            display: "flex",
            gap: 16
          }}
        >
          <Link
            href="/privacy"
            style={{
              color: "#6366f1",
              textDecoration: "none",
              fontWeight: 500
            }}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            style={{
              color: "#6366f1",
              textDecoration: "none",
              fontWeight: 500
            }}
          >
            Terms of Service
          </Link>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 style={{ fontSize: 18, color: "#dc2626", marginBottom: 16 }}>Danger Zone</h2>
        <div
          style={{
            padding: 20,
            backgroundColor: "#fef2f2",
            borderRadius: 12,
            border: "1px solid #fecaca"
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, color: "#991b1b" }}>Delete My Data</h3>
          <p style={{ color: "#6b7280", marginTop: 8, marginBottom: 16, fontSize: 14 }}>
            Permanently delete your account and all associated data, including all projects, jobs,
            and exported files. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              padding: "12px 20px",
              backgroundColor: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Delete My Data
          </button>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 32,
              maxWidth: 450,
              width: "100%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px"
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 style={{ margin: 0, textAlign: "center", color: "#1e1b4b" }}>
              Delete All Data?
            </h2>
            <p style={{ color: "#6b7280", textAlign: "center", marginTop: 12 }}>
              This will permanently delete:
            </p>
            <ul style={{ color: "#6b7280", marginTop: 8, paddingLeft: 20 }}>
              <li>Your account</li>
              <li>All projects and jobs</li>
              <li>All exported app files</li>
              <li>All associated data</li>
            </ul>

            {error && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  borderRadius: 8,
                  marginTop: 16,
                  fontSize: 14
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <label style={{ display: "block", color: "#374151", fontSize: 14, marginBottom: 8 }}>
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={deleting}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 16,
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: 8,
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                disabled={deleting || confirmText !== "DELETE"}
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: confirmText === "DELETE" ? "#dc2626" : "#fca5a5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: deleting || confirmText !== "DELETE" ? "not-allowed" : "pointer",
                  fontWeight: 500,
                  opacity: deleting ? 0.6 : 1
                }}
              >
                {deleting ? "Deleting..." : "Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
