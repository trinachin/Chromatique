#!/usr/bin/env node
/**
 * Batch generate the 17 feature illustrations via Fal.ai using Recraft V3.
 *
 *   10 eye-shape eyeliner technique illustrations
 *    7 face-shape blush placement illustrations
 *
 * Why Recraft V3 over FLUX Pro:
 *   - Recraft V3 is purpose-built for design-asset generation with a
 *     `style` parameter that LOCKS the illustration style across a series.
 *   - FLUX Pro produces photorealistic faces that drift between calls.
 *   - Recraft V3 with style=digital_illustration gives the editorial
 *     beauty-diagram look the brief asks for, consistently.
 *
 * Usage:
 *   node scripts/generate-features.mjs
 *   node scripts/generate-features.mjs --only eye-almond
 *   node scripts/generate-features.mjs --model fal-ai/flux-pro/v1.1   # fallback
 *
 * Reads FAL_KEY from .env.local.
 * Saves PNGs to public/generated/features/<slug>.png
 *
 * Cost: ~$0.04/image with Recraft V3 → 17 × $0.04 = ~$0.68 total
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env.local");
const outDir = resolve(projectRoot, "public", "generated", "features");

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

// ─── STYLE BRIEF (must keep prompt under Recraft's 1000-char limit) ──────
const STYLE_BRIEF = `Editorial beauty diagram illustration, refined hand-drawn style (NOT cartoon, NOT photorealistic). Warm cream background #FBF6EE. Medium warm Asian skin tone. Soft natural lighting upper left. Subtle dashed dark-brown (#3A2A1E) lines for liner technique, dusty rose (#E0928C) for blush. No text, no logos. Single subject centered.`;

// ─── 17 SUBJECT PROMPTS (verbatim from user-provided spec) ───────────────
const SUBJECTS = [
  // ─── 10 EYE SHAPES ──────────────────────────────────────────────────────
  {
    slug: "eye-almond",
    subject: `Eye shape: ALMOND. Tapered both ends, visible crease, iris touching top and bottom of lid. Illustration shows the eye open from front-facing angle. Add a subtle dashed dark-brown line indicating a CLASSIC WINGED LINER along the upper lash line with a clean wing at the outer corner.`,
  },
  {
    slug: "eye-round",
    subject: `Eye shape: ROUND. Iris with white visible above and below, circular opening. Illustration shows the eye open from front. Add a subtle dashed dark-brown line indicating OUTWARD-ELONGATING liner — line extends along upper lash and pushes horizontally past the outer corner (not thickened in the middle).`,
  },
  {
    slug: "eye-monolid",
    subject: `Eye shape: MONOLID. Single upper lid without visible crease fold. Illustration shows the eye open from front. Add a thin dark-brown dashed line indicating TIGHTLINE + LASH-HUGGING line — sits right against the lash root, very close, builds gradually.`,
  },
  {
    slug: "eye-hooded-monolid",
    subject: `Eye shape: HOODED MONOLID. Monolid with additional brow-bone skin partially obscuring the lid when open. Illustration shows the eye open from front. Add a thin dark-brown dashed line indicating TIGHTLINE + small wing drawn with eye OPEN sitting just above the hooded fold.`,
  },
  {
    slug: "eye-parallel-double-lid",
    subject: `Eye shape: PARALLEL DOUBLE-LID. Crease line runs parallel to the upper lash line throughout. Illustration shows the eye open. Add a subtle dark-brown dashed line indicating SOFT LID WASH WITH THIN LINER following the lash root with a slight extension past the outer corner.`,
  },
  {
    slug: "eye-outer-double-lid",
    subject: `Eye shape: OUTER DOUBLE-LID. Crease visible only in the outer third of the eye (also called "outer fold"). Illustration shows the eye open. Add a dark-brown dashed line indicating OUTER-EMPHASIS LINER — liner thickness and wing concentrated in the outer third only.`,
  },
  {
    slug: "eye-hooded",
    subject: `Eye shape: HOODED (Western). Brow-bone skin partially covers crease when eye open. Illustration shows the eye open from front. Add a dark-brown dashed line indicating ABOVE-CREASE LINER — drawn just above the natural crease so it stays visible when eye is open.`,
  },
  {
    slug: "eye-downturned",
    subject: `Eye shape: DOWNTURNED. Outer corner slopes slightly downward. Illustration shows the eye open from front. Add a dark-brown dashed line indicating LIFT-STYLE WING — liner stops SHORT of the outer corner and angles UPWARD well before the natural eye end.`,
  },
  {
    slug: "eye-upturned",
    subject: `Eye shape: UPTURNED. Outer corner naturally tilts upward. Illustration shows the eye open. Add subtle dark-brown dashed lines on BOTH upper and lower lash lines equally (balanced, no wing).`,
  },
  {
    slug: "eye-deep-set",
    subject: `Eye shape: DEEP-SET. Eye recessed into socket, prominent brow bone casting subtle shadow. Illustration shows the eye open. Add a very thin SOFT BROWN dashed line (lighter than dark brown) indicating LIGHT-HAND LINER — minimal, no thick upper line to avoid recessing the eye further.`,
  },

  // ─── 7 BLUSH PLACEMENTS ─────────────────────────────────────────────────
  {
    slug: "blush-oval",
    subject: `Face shape: OVAL. Show a front-facing face illustration (cropped chin to mid-forehead). Indicate APPLES OR CHEEKBONES blush placement with two subtle dusty-rose dashed line indicators — one round shape on the apples of the cheeks, one diagonal shape along the top of the cheekbones.`,
  },
  {
    slug: "blush-round",
    subject: `Face shape: ROUND. Show a front-facing face illustration. Indicate HIGH DIAGONAL SWEEP blush placement with a subtle dusty-rose dashed line indicator: high on the cheekbones, sweeping diagonally UPWARD toward the temples (lifting/elongating direction).`,
  },
  {
    slug: "blush-square",
    subject: `Face shape: SQUARE. Show a front-facing face illustration. Indicate APPLES BLENDED OUTWARD blush placement with a subtle dusty-rose dashed line: round shape on the apples of the cheeks, blending outward toward the temples (softening the jaw).`,
  },
  {
    slug: "blush-heart",
    subject: `Face shape: HEART. Show a front-facing face illustration. Indicate C-SHAPE blush placement with a subtle dusty-rose dashed line: a C curve carrying from the top of the cheekbone UP toward the brow tail (softens forehead width).`,
  },
  {
    slug: "blush-diamond",
    subject: `Face shape: DIAMOND. Show a front-facing face illustration. Indicate TOPS OF CHEEKBONES blush placement with a subtle dusty-rose dashed line on the highest part of the cheekbones, blending outward but NOT inward toward the nose.`,
  },
  {
    slug: "blush-oblong",
    subject: `Face shape: OBLONG. Show a front-facing face illustration (slightly elongated). Indicate HORIZONTAL SWEEP blush placement with a subtle dusty-rose dashed line going HORIZONTALLY across the apples of the cheeks (adds width, visually shortens face).`,
  },
  {
    slug: "blush-triangle",
    subject: `Face shape: TRIANGLE. Show a front-facing face illustration (wider jaw than forehead). Indicate APPLES WITH UPWARD SWEEP blush placement with a subtle dusty-rose dashed line on the apples extending with a slight upward sweep toward the temples (balances wider jaw).`,
  },
];

// ─── Argument parsing ────────────────────────────────────────────────────
const args = process.argv.slice(2);
let onlySlug = null;
let model = "fal-ai/recraft-v3";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--only" && args[i + 1]) onlySlug = args[++i];
  else if (args[i] === "--model" && args[i + 1]) model = args[++i];
}

const toGenerate = onlySlug
  ? SUBJECTS.filter((s) => s.slug === onlySlug)
  : SUBJECTS;

if (toGenerate.length === 0) {
  console.error(`✗ No subject matches --only ${onlySlug}`);
  console.error(`  Available: ${SUBJECTS.map((s) => s.slug).join(", ")}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

// ─── Per-model request body shape ────────────────────────────────────────
function buildBody(prompt, model) {
  if (model.includes("recraft")) {
    return {
      prompt,
      // Recraft style options for editorial illustrations:
      //   digital_illustration / digital_illustration/2d_art_poster /
      //   digital_illustration/hand_drawn / digital_illustration/grain
      // "hand_drawn" gives the soft editorial diagram look closest to Vogue.
      style: "digital_illustration/hand_drawn",
      image_size: "square_hd",
      colors: [
        { r: 251, g: 246, b: 238 }, // cream background
        { r: 224, g: 146, b: 140 }, // dusty rose for blush indicators
        { r: 58, g: 42, b: 30 },     // dark brown for liner indicators
        { r: 198, g: 165, b: 134 }, // skin mid-tone
      ],
    };
  }
  // FLUX fallback
  return {
    prompt,
    image_size: "square_hd",
    num_images: 1,
    enable_safety_checker: true,
    output_format: "png",
  };
}

console.log(`\n→ Batch generating ${toGenerate.length} feature illustrations via Fal.ai`);
console.log(`  Model: ${model}`);
console.log(`  Output: ${outDir}\n`);

let successCount = 0;
let failCount = 0;
const totalStart = Date.now();

for (let i = 0; i < toGenerate.length; i++) {
  const item = toGenerate[i];
  const idx = `${(i + 1).toString().padStart(2, " ")}/${toGenerate.length}`;
  const fullPrompt = `${STYLE_BRIEF}\n\n${item.subject}`;
  const outPath = resolve(outDir, `${item.slug}.png`);

  process.stdout.write(`${idx}  ${item.slug.padEnd(30, " ")} `);

  const start = Date.now();
  try {
    const res = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildBody(fullPrompt, model)),
    });

    if (!res.ok) {
      const text = await res.text();
      console.log(`✗ ${res.status} ${text.slice(0, 150)}`);
      failCount++;
      continue;
    }

    const data = await res.json();
    const imageUrl = data.images?.[0]?.url ?? data.image?.url;
    if (!imageUrl) {
      console.log(`✗ no image url`);
      failCount++;
      continue;
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.log(`✗ download ${imgRes.status}`);
      failCount++;
      continue;
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    writeFileSync(outPath, buffer);

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const kb = (buffer.length / 1024).toFixed(0);
    console.log(`✓ ${elapsed}s · ${kb} KB`);
    successCount++;
  } catch (err) {
    console.log(`✗ ${err.message}`);
    failCount++;
  }
}

const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
const estCost = (successCount * 0.04).toFixed(2);

console.log(`\n${"─".repeat(60)}`);
console.log(`✓ ${successCount}/${toGenerate.length} generated in ${totalElapsed}s · est. cost $${estCost}`);
if (failCount > 0) {
  console.log(`✗ ${failCount} failed — re-run with --only <slug> to retry`);
}
console.log(`\nFiles in: ${outDir}`);
console.log(`Open folder: open "${outDir}"`);
