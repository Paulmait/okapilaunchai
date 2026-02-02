import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 700,
          color: "#e0e7ff",
          lineHeight: 1,
          marginBottom: 16,
        }}
      >
        404
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#1e1b4b",
          margin: "0 0 12px 0",
        }}
      >
        Page not found
      </h1>
      <p
        style={{
          fontSize: 16,
          color: "#6b7280",
          margin: "0 0 32px 0",
          maxWidth: 400,
        }}
      >
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
        It might have been moved or deleted.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 24px",
            backgroundColor: "#6366f1",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          Go to Home
        </Link>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 24px",
            backgroundColor: "#fff",
            color: "#6366f1",
            border: "1px solid #6366f1",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
