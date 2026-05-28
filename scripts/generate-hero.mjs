#!/usr/bin/env node
/**
 * One-shot hero image generator for Chromatique.
 *
 * Usage:
 *   node scripts/generate-hero.mjs
 *   node scripts/generate-hero.mjs --variant b   # default
 *   node scripts/generate-hero.mjs --variant c
 *   node scripts/generate-hero.mjs --custom "your full prompt here"
 *
 * Reads GEMINI_API_KEY from .env.local automatically.
 * Saves output to public/generated/hero-<variant>-<timestamp>.png
 *
 * Cost: ~$0.04 per generation. No retries are silent — if Gemini fails or
 * returns no image, the script exits with the error message.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env.local");
const outDir = resolve(projectRoot, "public", "generated");

// ─── Load .env.local manually (no extra deps) ────────────────────────────
function loadEnv(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(envPath);

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error("✗ GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}

// ─── Hero prompt variants (from the picked direction B + alternates) ─────
const PROMPTS = {
  b: `Editorial photographic illustration. Soft morning sunlight refracted through a translucent silk fabric, creating gentle pastel rainbow streaks: dusty rose, peach, soft mauve, honey amber, sage. Painterly bokeh background in warm cream. Floating, ethereal quality. Style: editorial fashion photography meets watercolour. 3:2 landscape, no text, no logos. Avoid: harsh neon rainbow, futuristic tech aesthetic, AI artifacts, overly saturated colours.`,
  a: `Editorial photographic illustration. Close-up: a softly cupped hand against blurred cream-and-peach background, gently holding a tonal arrangement of fabric swatches in dusty rose, soft mauve, peach, honey amber, warm beige. Morning natural light from upper left, depth-of-field bokeh in blush tones. Style: high-end beauty editorial photography meets painterly soft 3D rendering. Muted pastel jewel palette. 3:2 landscape, no text, no logos.`,
  c: `Editorial photographic illustration. Overhead view: a watercolour artist's palette resting on cream textured paper, with soft pools of pastel jewel-tone paint slowly mingling — dusty rose, peach, soft mauve, honey amber, sage. A slender paint brush rests beside it. Soft morning light from upper left, painterly bokeh edges. Style: editorial beauty magazine, modern artisan craftsmanship. 3:2 landscape, no text.`,
  e: `Editorial photographic illustration. A loose painterly arrangement of soft pastel-toned dried flowers and silk ribbons: dusty rose petals, peach silk, soft mauve eucalyptus, honey amber dried wildflowers, sage leaves. Warm morning light streaming from upper left, casting soft shadows on cream paper background. Style: editorial flower-shop photography meets watercolour stillness. 3:2 landscape, no text, no logos.`,
};

// ─── Argument parsing ────────────────────────────────────────────────────
const args = process.argv.slice(2);
let variant = "b";
let custom = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--variant" && args[i + 1]) variant = args[++i];
  else if (args[i] === "--custom" && args[i + 1]) custom = args[++i];
}
const prompt = custom ?? PROMPTS[variant];
if (!prompt) {
  console.error(`✗ Unknown variant: ${variant}. Options: ${Object.keys(PROMPTS).join(", ")}`);
  process.exit(1);
}

// ─── Generation ──────────────────────────────────────────────────────────
const MODEL = "gemini-2.5-flash-image";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(KEY)}`;

console.log(`→ Generating hero variant '${variant}'...`);
console.log(`  Prompt: ${prompt.slice(0, 100)}${prompt.length > 100 ? "..." : ""}`);
console.log(`  Model: ${MODEL}`);

const start = Date.now();
const res = await fetch(URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  }),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`✗ Gemini ${res.status}:`);
  console.error(text.slice(0, 800));
  process.exit(1);
}

const data = await res.json();

if (data.promptFeedback?.blockReason) {
  console.error(`✗ Gemini blocked: ${data.promptFeedback.blockReason}`);
  process.exit(1);
}

const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
if (!imagePart?.inlineData?.data) {
  console.error(`✗ Gemini returned no image. Raw response:`);
  console.error(JSON.stringify(data, null, 2).slice(0, 1200));
  process.exit(1);
}

// ─── Save PNG ────────────────────────────────────────────────────────────
mkdirSync(outDir, { recursive: true });
const ext = imagePart.inlineData.mimeType?.includes("jpeg") ? "jpg" : "png";
const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const filename = `hero-${variant}-${ts}.${ext}`;
const outPath = resolve(outDir, filename);
const buffer = Buffer.from(imagePart.inlineData.data, "base64");
writeFileSync(outPath, buffer);

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`✓ Generated in ${elapsed}s`);
console.log(`✓ Saved ${(buffer.length / 1024).toFixed(0)} KB to:`);
console.log(`  ${outPath}`);
