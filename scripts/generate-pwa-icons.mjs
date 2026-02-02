/**
 * Generate PWA icons from SVG logo
 *
 * This script converts the logo.svg to PNG icons for PWA manifest.
 * Run: node scripts/generate-pwa-icons.mjs
 *
 * Requires: npm install sharp (run from project root)
 */

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');

const sizes = [192, 512];

async function generateIcons() {
  const svgPath = path.join(publicDir, 'logo.svg');

  if (!fs.existsSync(svgPath)) {
    console.error('❌ logo.svg not found in public directory');
    process.exit(1);
  }

  console.log('🎨 Generating PWA icons from logo.svg...\n');

  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}.png`);

    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`   ✅ icon-${size}.png created`);
    } catch (error) {
      console.error(`   ❌ Failed to create icon-${size}.png:`, error.message);
    }
  }

  // Also create favicon.ico (16x16 and 32x32)
  try {
    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32.png'));
    console.log('   ✅ favicon-32.png created');
  } catch (error) {
    console.error('   ❌ Failed to create favicon:', error.message);
  }

  console.log('\n✅ PWA icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Icons are in apps/web/public/');
  console.log('2. manifest.json already references these icons');
  console.log('3. Deploy to see PWA install prompt on mobile');
}

generateIcons().catch(console.error);
