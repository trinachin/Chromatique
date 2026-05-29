#!/usr/bin/env node
/**
 * Batch generate the 22 fabric macro-photo textures via HuggingFace Inference API.
 *
 * Model: black-forest-labs/FLUX.1-schnell (FREE tier, ~1-3s per image)
 *
 * Usage:
 *   node scripts/generate-fabrics-hf.mjs --sample        # 2 test fabrics
 *   node scripts/generate-fabrics-hf.mjs                 # full 22-fabric batch
 *   node scripts/generate-fabrics-hf.mjs --only linen    # regenerate one
 *
 * Reads HF_API_KEY from .env.local.
 * Saves PNGs to public/generated/fabrics/<slug>.png
 *
 * Notes on HF free tier:
 *   - Rate limited; retry on 429 with backoff
 *   - 503 means model loading; retry after ~20s
 *   - Returns raw image bytes (PNG), not JSON
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env.local");
const outDir = resolve(projectRoot, "public", "generated", "fabrics");

function loadEnv(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(envPath);

const KEY = process.env.HF_API_KEY;
if (!KEY) {
  console.error("✗ HF_API_KEY not found in .env.local");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── STYLE PREFIX (tightened from earlier Fal experiments) ───────────────
const STYLE_PREFIX = `Top-down extreme macro photograph of fabric surface, camera at exactly 90 degrees directly overhead. About 3cm of fabric fills the frame with 20-30 yarns across the width. Woven texture repeats edge to edge across the whole square. Fabric is stretched perfectly flat. Sharp focus, soft natural daylight from upper left. Real photography, NOT illustration. Textile sample-library quality. NO drape, NO folds, NO wrinkles, NO bunching. Square. No garments, model, hands, pins, labels, text, logos.`;

// ─── 22 FABRIC SUBJECTS ──────────────────────────────────────────────────
const FABRICS = [
  // Natural plant
  { slug: "linen",                subject: `100% LINEN, warm oat-beige #D2B97A. Visible cross-hatched warp and weft threads, slubby flax texture.` },
  { slug: "lightweight-cotton",   subject: `Lightweight cotton voile, cream #E8DCC0. Fine even plain weave, soft matte finish.` },
  { slug: "organic-cotton",       subject: `Organic cotton, undyed cream #EBDFC2. Soft natural matte finish, slight cotton fluff, GOTS-certified appearance.` },
  { slug: "hemp",                 subject: `Hemp fabric, olive-tan #A89560. Coarser bast-fibre weave, visible slubs, slightly rough.` },
  { slug: "ramie",                subject: `Ramie fabric, pale cream #D6C599. Crisp linen-like bast weave, subtle lustre, more refined than flax.` },

  // Regenerated cellulose
  { slug: "tencel-lyocell",       subject: `TENCEL Lyocell, pale dove-cream #C7BFB0. Smooth silky surface, very fine weave, subtle satin sheen.` },
  { slug: "modal",                subject: `Lenzing Modal, pale beige #C5B493. Buttery smooth, very fine knit, soft sheen.` },
  { slug: "ecovero-viscose",      subject: `EcoVero viscose, warm taupe #BCA98A. Soft drapey surface with subtle silky sheen, fine weave.` },
  { slug: "bamboo-lyocell",       subject: `Closed-loop bamboo lyocell, pale sage-grey #AFAC8B. Smooth silky surface, fine weave, cool sheen.` },

  // Natural animal
  { slug: "silk",                 subject: `Mulberry silk charmeuse, champagne #D5BB7E. Smooth lustrous surface with diagonal sheen highlights, satin weave.` },
  { slug: "wool",                 subject: `Natural undyed wool, warm oatmeal #AB976D. Visible fuzzy halo of fibres, matte natural sheep-fleece.` },
  { slug: "merino-wool",          subject: `Fine merino wool knit, soft cream-oat #B5A381. Very fine wool knit, subtle fibre halo, non-itchy.` },

  // Specialty
  { slug: "seersucker",           subject: `Cotton seersucker, pale dusty blue #BAC9D2. Distinctive puckered horizontal stripes with raised three-dimensional bumpy texture.` },
  { slug: "dobby-cotton",         subject: `Dobby-weave cotton, warm cream-oat #CDBA94. Small repeating geometric dots woven into the cloth, subtle dimensional texture.` },
  { slug: "eyelet-cotton",        subject: `Eyelet broderie anglaise cotton, cream #D9C49A. Embroidered perforations and small holes, decorative cutwork.` },

  // Blends
  { slug: "linen-tencel",         subject: `Linen-Tencel blend, warm oat #BFB18A. Linen's slubby cross-hatch weave but smoother, silky sheen from tencel.` },
  { slug: "cotton-modal",         subject: `Cotton-Modal blend knit, soft cream #CCB98F. Fine knit with cotton's matte hand and modal's silky drape.` },
  { slug: "cotton-linen",         subject: `Cotton-Linen 50/50 blend, oat-beige #C3AE82. Linen's visible cross-hatched weave but softer.` },

  // Synthetics
  { slug: "polyester",            subject: `Polyester woven fabric, cool mid-grey #999CA3. Smooth synthetic surface, slight plastic-y sheen, very even tight weave.` },
  { slug: "performance-synthetic",subject: `Performance polyester Dri-FIT, cool tech-grey #8E99A5. Engineered wicking texture with fine moisture-channel grid pattern.` },
  { slug: "nylon",                subject: `Nylon ripstop fabric, cool silver-grey #9DA3AE. Smooth tight weave, subtle plastic sheen, slight silvery shimmer.` },
  { slug: "acrylic",              subject: `Acrylic knit fabric, muddy grey-beige #A0938A. Loose knit with visible pills and bobbles, fake-wool appearance.` },
];

const SAMPLE_SLUGS = ["linen", "silk"];

// ─── Argument parsing ────────────────────────────────────────────────────
const args = process.argv.slice(2);
let onlySlug = null;
let sampleOnly = false;
let model = "black-forest-labs/FLUX.1-schnell";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--only" && args[i + 1]) onlySlug = args[++i];
  else if (args[i] === "--sample") sampleOnly = true;
  else if (args[i] === "--model" && args[i + 1]) model = args[++i];
}

let toGenerate;
if (onlySlug) toGenerate = FABRICS.filter((f) => f.slug === onlySlug);
else if (sampleOnly) toGenerate = FABRICS.filter((f) => SAMPLE_SLUGS.includes(f.slug));
else toGenerate = FABRICS;

if (toGenerate.length === 0) {
  console.error(`✗ No fabric matches --only ${onlySlug}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

console.log(`\n→ Batch generating ${toGenerate.length} fabric textures via HuggingFace (FREE)`);
console.log(`  Model: ${model}`);
console.log(`  Output: ${outDir}\n`);

async function tryGenerate(prompt, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { num_inference_steps: 4, guidance_scale: 0 },
      }),
    });

    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      return { ok: true, buf };
    }

    const text = await res.text();
    // 503 = model loading, 429 = rate limited
    if ((res.status === 503 || res.status === 429) && attempt < maxAttempts) {
      const waitSec = res.status === 503 ? 20 : 5;
      process.stdout.write(`(retry in ${waitSec}s) `);
      await sleep(waitSec * 1000);
      continue;
    }
    return { ok: false, status: res.status, text: text.slice(0, 200) };
  }
  return { ok: false, status: 0, text: "exhausted retries" };
}

let successCount = 0;
let failCount = 0;
const totalStart = Date.now();

for (let i = 0; i < toGenerate.length; i++) {
  const item = toGenerate[i];
  const idx = `${(i + 1).toString().padStart(2, " ")}/${toGenerate.length}`;
  const fullPrompt = `${STYLE_PREFIX} ${item.subject}`;
  const outPath = resolve(outDir, `${item.slug}.png`);

  process.stdout.write(`${idx}  ${item.slug.padEnd(28, " ")} `);

  const start = Date.now();
  const result = await tryGenerate(fullPrompt);

  if (!result.ok) {
    console.log(`✗ ${result.status} ${result.text}`);
    failCount++;
    continue;
  }

  writeFileSync(outPath, result.buf);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const kb = (result.buf.length / 1024).toFixed(0);
  console.log(`✓ ${elapsed}s · ${kb} KB`);
  successCount++;
}

const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);

console.log(`\n${"─".repeat(60)}`);
console.log(`✓ ${successCount}/${toGenerate.length} generated in ${totalElapsed}s · FREE`);
if (failCount > 0) {
  console.log(`✗ ${failCount} failed — re-run with --only <slug> to retry`);
}
console.log(`\nFiles in: ${outDir}`);
