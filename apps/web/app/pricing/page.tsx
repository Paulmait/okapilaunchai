import fs from "node:fs";
import path from "node:path";

export default function PricingPage() {
  const p = path.join(process.cwd(), "..", "..", "docs", "pricing.md");
  let md = "";
  try {
    md = fs.readFileSync(p, "utf-8");
  } catch {
    md = "Pricing file not found.";
  }

  return (
    <main style={{ maxWidth: 900 }}>
      <h1 style={{ marginTop: 0 }}>Pricing</h1>
      <pre style={{ whiteSpace: "pre-wrap", background: "#fafafa", padding: 12, borderRadius: 12, border: "1px solid #eee" }}>
        {md}
      </pre>
    </main>
  );
}
