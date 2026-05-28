#!/usr/bin/env node
/**
 * One-shot hero image generator via Fal.ai (FLUX Pro 1.1 by default).
 *
 * Usage:
 *   node scripts/generate-hero-fal.mjs                       # variant b
 *   node scripts/generate-hero-fal.mjs --variant c
 *   node scripts/generate-hero-fal.mjs --model fal-ai/flux-pro/v1.1-ultra
 *   node scripts/generate-hero-fal.mjs --custom "your prompt"
 *
 * Reads FAL_KEY from .env.local.
 * Saves PNG to public/generated/hero-<variant>-<timestamp>.png
 *
 * Cost: ~$0.04 per image (FLUX Pro 1.1), ~$0.05 (Ultra).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env.local");
const outDir = resolve(projectRoot, "public", "generated");

function loadEnv(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(envPath);

const KEY = process.env.FAL_KEY;
if (!KEY) {
  console.error("✗ FAL_KEY not found in .env.local");
  process.exit(1);
}

const PROMPTS = {
  b: `Editorial photographic illustration. Soft morning sunlight refracted through a translucent silk fabric, creating gentle pastel rainbow streaks: dusty rose, peach, soft mauve, honey amber, sage. Painterly bokeh background in warm cream. Floating, ethereal quality. High-end editorial fashion photography meets watercolour. Muted pastel jewel palette. Soft natural light, dreamy depth-of-field. No text, no logos. Avoid: harsh neon rainbow, futuristic tech aesthetic.`,
  a: `Editorial photographic illustration. Close-up: a softly cupped hand against blurred cream-and-peach background, gently holding a tonal arrangement of fabric swatches in dusty rose, soft mauve, peach, honey amber, warm beige. Morning natural light from upper left, depth-of-field bokeh in blush tones. High-end beauty editorial photography meets painterly soft 3D rendering. Muted pastel jewel palette. No text, no logos.`,
  c: `Editorial photographic illustration. Overhead view: a watercolour artist's palette resting on cream textured paper, with soft pools of pastel jewel-tone paint slowly mingling — dusty rose, peach, soft mauve, honey amber, sage. A slender paint brush rests beside it. Soft morning light from upper left, painterly bokeh edges. Editorial beauty magazine, modern artisan craftsmanship. No text.`,
  e: `Editorial photographic illustration. A loose painterly arrangement of soft pastel-toned dried flowers and silk ribbons: dusty rose petals, peach silk, soft mauve eucalyptus, honey amber dried wildflowers, sage leaves. Warm morning light streaming from upper left, casting soft shadows on cream paper background. Editorial flower-shop photography meets watercolour stillness. No text, no logos.`,
};

const args = process.argv.slice(2);
let variant = "b";
let custom = null;
let model = "fal-ai/flux-pro/v1.1";
let aspect = "landscape_16_9";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--variant" && args[i + 1]) variant = args[++i];
  else if (args[i] === "--custom" && args[i + 1]) custom = args[++i];
  else if (args[i] === "--model" && args[i + 1]) model = args[++i];
  else if (args[i] === "--aspect" && args[i + 1]) aspect = args[++i];
}
const prompt = custom ?? PROMPTS[variant];
if (!prompt) {
  console.error(`✗ Unknown variant: ${variant}. Options: ${Object.keys(PROMPTS).join(", ")}`);
  process.exit(1);
}

console.log(`→ Generating hero variant '${variant}' via Fal.ai...`);
console.log(`  Model: ${model}`);
console.log(`  Aspect: ${aspect}`);

const start = Date.now();
const res = await fetch(`https://fal.run/${model}`, {
  method: "POST",
  headers: {
    Authorization: `Key ${KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt,
    image_size: aspect,
    num_images: 1,
    enable_safety_checker: true,
    output_format: "png",
  }),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`✗ Fal ${res.status}:`);
  console.error(text.slice(0, 800));
  process.exit(1);
}

const data = await res.json();
const imageUrl = data.images?.[0]?.url;
if (!imageUrl) {
  console.error(`✗ Fal returned no image. Response:`);
  console.error(JSON.stringify(data, null, 2).slice(0, 1200));
  process.exit(1);
}

console.log(`  Image URL: ${imageUrl}`);
console.log(`→ Downloading...`);
const imgRes = await fetch(imageUrl);
if (!imgRes.ok) {
  console.error(`✗ Failed to download image: ${imgRes.status}`);
  process.exit(1);
}
const buffer = Buffer.from(await imgRes.arrayBuffer());

mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const filename = `hero-${variant}-${ts}.png`;
const outPath = resolve(outDir, filename);
writeFileSync(outPath, buffer);

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`✓ Generated + downloaded in ${elapsed}s`);
console.log(`✓ Saved ${(buffer.length / 1024).toFixed(0)} KB to:`);
console.log(`  ${outPath}`);
console.log(``);
console.log(`Open it:  open "${outPath}"`);
