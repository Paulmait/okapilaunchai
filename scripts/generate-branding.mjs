/**
 * OkapiLaunch AI - Branding Asset Generator
 * Generates logo SVGs and favicon
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "apps", "web", "public");

// Brand colors
const BRAND = {
  primary: "#6366f1", // Indigo
  secondary: "#8b5cf6", // Purple
  accent: "#06b6d4", // Cyan
  dark: "#1e1b4b", // Dark indigo
  light: "#e0e7ff", // Light indigo
  white: "#ffffff",
  black: "#0f0d1a"
};

// Main logo SVG (rocket/launch icon)
const logoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${BRAND.secondary};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${BRAND.accent};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${BRAND.primary};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#grad1)"/>

  <!-- Rocket body -->
  <path d="M256 80 L320 200 L320 340 L256 380 L192 340 L192 200 Z" fill="${BRAND.white}" opacity="0.95"/>

  <!-- Rocket window -->
  <circle cx="256" cy="200" r="40" fill="url(#grad2)"/>
  <circle cx="256" cy="200" r="25" fill="${BRAND.white}" opacity="0.3"/>

  <!-- Rocket fins -->
  <path d="M192 280 L140 360 L192 340 Z" fill="${BRAND.white}" opacity="0.8"/>
  <path d="M320 280 L372 360 L320 340 Z" fill="${BRAND.white}" opacity="0.8"/>

  <!-- Rocket flames -->
  <ellipse cx="256" cy="420" rx="50" ry="30" fill="${BRAND.accent}" opacity="0.9"/>
  <ellipse cx="256" cy="410" rx="35" ry="20" fill="${BRAND.white}" opacity="0.8"/>

  <!-- Speed lines -->
  <rect x="100" y="140" width="60" height="6" rx="3" fill="${BRAND.white}" opacity="0.4"/>
  <rect x="80" y="180" width="80" height="6" rx="3" fill="${BRAND.white}" opacity="0.3"/>
  <rect x="352" y="160" width="70" height="6" rx="3" fill="${BRAND.white}" opacity="0.4"/>
  <rect x="362" y="200" width="60" height="6" rx="3" fill="${BRAND.white}" opacity="0.3"/>
</svg>`;

// Icon-only version (for favicon)
const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${BRAND.secondary};stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="16" cy="16" r="15" fill="url(#iconGrad)"/>
  <path d="M16 5 L20 12.5 L20 21 L16 24 L12 21 L12 12.5 Z" fill="${BRAND.white}" opacity="0.95"/>
  <circle cx="16" cy="12.5" r="2.5" fill="${BRAND.accent}"/>
  <ellipse cx="16" cy="27" rx="3" ry="1.5" fill="${BRAND.accent}" opacity="0.9"/>
</svg>`;

// Wordmark logo
const wordmarkSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80">
  <defs>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${BRAND.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${BRAND.secondary};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Icon -->
  <circle cx="40" cy="40" r="35" fill="url(#textGrad)"/>
  <path d="M40 12 L50 28 L50 52 L40 60 L30 52 L30 28 Z" fill="${BRAND.white}" opacity="0.95"/>
  <circle cx="40" cy="28" r="6" fill="${BRAND.accent}"/>
  <ellipse cx="40" cy="68" rx="8" ry="4" fill="${BRAND.accent}" opacity="0.9"/>

  <!-- Text -->
  <text x="90" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="${BRAND.dark}">
    OkapiLaunch
  </text>
  <text x="310" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="300" fill="${BRAND.primary}">
    AI
  </text>
</svg>`;

// Open Graph image (1200x630)
const ogImageSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND.dark};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2e1065;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${BRAND.secondary};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <!-- Decorative elements -->
  <circle cx="100" cy="100" r="200" fill="${BRAND.primary}" opacity="0.1"/>
  <circle cx="1100" cy="530" r="250" fill="${BRAND.secondary}" opacity="0.1"/>

  <!-- Logo -->
  <circle cx="600" cy="240" r="120" fill="url(#logoGrad)"/>
  <path d="M600 140 L660 220 L660 320 L600 360 L540 320 L540 220 Z" fill="${BRAND.white}" opacity="0.95"/>
  <circle cx="600" cy="220" r="30" fill="${BRAND.accent}"/>
  <ellipse cx="600" cy="390" rx="40" ry="20" fill="${BRAND.accent}" opacity="0.9"/>

  <!-- Text -->
  <text x="600" y="480" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="700" fill="${BRAND.white}">
    OkapiLaunch AI
  </text>
  <text x="600" y="540" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="400" fill="${BRAND.light}">
    Build App Store-Ready iOS Apps in Minutes
  </text>
</svg>`;

// Favicon ICO generation helper (creates a simple HTML for favicon)
const faviconHTML = `<!-- Place in <head> -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="${BRAND.primary}">
`;

// Brand guidelines
const brandGuidelinesJSON = {
  name: "OkapiLaunch AI",
  tagline: "Build App Store-Ready iOS Apps in Minutes",
  colors: {
    primary: { hex: BRAND.primary, name: "Indigo", usage: "Primary buttons, links, accents" },
    secondary: { hex: BRAND.secondary, name: "Purple", usage: "Gradients, hover states" },
    accent: { hex: BRAND.accent, name: "Cyan", usage: "Success states, highlights" },
    dark: { hex: BRAND.dark, name: "Deep Indigo", usage: "Text, backgrounds" },
    light: { hex: BRAND.light, name: "Light Indigo", usage: "Backgrounds, borders" }
  },
  typography: {
    primary: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    weights: ["400 (Regular)", "500 (Medium)", "600 (Semibold)", "700 (Bold)"]
  },
  assets: {
    logo: "/logo.svg",
    icon: "/favicon.svg",
    wordmark: "/wordmark.svg",
    ogImage: "/og-image.svg"
  }
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  OkapiLaunch AI - Branding Generator");
  console.log("═══════════════════════════════════════════════\n");

  ensureDir(publicDir);

  // Generate SVG files
  const files = [
    { name: "logo.svg", content: logoSVG },
    { name: "favicon.svg", content: iconSVG },
    { name: "wordmark.svg", content: wordmarkSVG },
    { name: "og-image.svg", content: ogImageSVG }
  ];

  for (const file of files) {
    const filePath = path.join(publicDir, file.name);
    fs.writeFileSync(filePath, file.content.trim(), "utf-8");
    console.log(`✅ Created: ${file.name}`);
  }

  // Save brand guidelines
  const guidelinesPath = path.join(publicDir, "brand-guidelines.json");
  fs.writeFileSync(guidelinesPath, JSON.stringify(brandGuidelinesJSON, null, 2), "utf-8");
  console.log("✅ Created: brand-guidelines.json");

  // Save favicon HTML snippet
  const faviconPath = path.join(publicDir, "favicon-snippet.html");
  fs.writeFileSync(faviconPath, faviconHTML.trim(), "utf-8");
  console.log("✅ Created: favicon-snippet.html");

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Branding assets generated!");
  console.log("═══════════════════════════════════════════════");
  console.log("\nAssets saved to: apps/web/public/");
  console.log("\nBrand Colors:");
  console.log(`  Primary:   ${BRAND.primary} (Indigo)`);
  console.log(`  Secondary: ${BRAND.secondary} (Purple)`);
  console.log(`  Accent:    ${BRAND.accent} (Cyan)`);
}

main();
