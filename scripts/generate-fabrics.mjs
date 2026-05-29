#!/usr/bin/env node
/**
 * Batch generate the 22 fabric macro-photo textures via Fal.ai.
 *
 * Each fabric gets a single close-up photograph showing real texture
 * (weave, sheen, fuzz, drape — whatever defines that fibre).
 *
 * Model: FLUX Pro 1.1 (~$0.04/image)
 * Full batch: 22 × $0.04 = ~$0.88 total
 *
 * Usage:
 *   node scripts/generate-fabrics.mjs --sample        # generate 3 test fabrics
 *   node scripts/generate-fabrics.mjs                 # full 22-fabric batch
 *   node scripts/generate-fabrics.mjs --only linen    # regenerate one
 *   node scripts/generate-fabrics.mjs --model fal-ai/flux-pro/v1.1-ultra
 *
 * Reads FAL_KEY from .env.local.
 * Saves PNGs to public/generated/fabrics/<slug>.png
 *
 * Prompt strategy:
 *   Each prompt is a focused macro-photography brief that emphasises:
 *     - extreme close-up (fabric fills frame)
 *     - REAL visible texture / weave / fibre
 *     - soft natural daylight (consistent lighting across set)
 *     - warm-neutral backdrop (matches site palette)
 *     - product-catalogue photography quality
 *     - explicit colour cue per fabric (drawn from research)
 *
 * Style brief sits as a shared prefix on every prompt for set consistency.
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

const KEY = process.env.FAL_KEY;
if (!KEY) {
  console.error("✗ FAL_KEY not found in .env.local");
  process.exit(1);
}

// ─── SHARED STYLE PREFIX ────────────────────────────────────────────────
// Style brief: editorial fabric retailer product photography (think Mood
// Fabrics, Merchant & Mills, The Cloth House). Top-down macro of one piece
// of fabric filling the frame. Declarative — let the fabric look like itself
// rather than fighting drape with long negative lists.
const STYLE_PREFIX = `Studio product photograph of fabric, shot directly from above with a macro lens. One single large piece of fabric fills the entire square frame as one continuous surface. Sharp tack focus on the weave and surface texture. Soft diffused natural daylight from a large studio window. Warm-neutral editorial colour grading. Clean fabric-library photography in the style of Mood Fabrics, Merchant & Mills, and The Cloth House product pages. No hands, no people, no garments, no labels, no text.`;

// ─── 22 FABRIC SUBJECTS (drawn from FABRIC_RESEARCH §1) ──────────────────
// Each entry: slug, natural fibre colour, key visual identity / texture cue.
const FABRICS = [
  // ─── Natural plant ─────────────────────────────────────────────────────
  {
    slug: "linen",
    subject: `100% natural LINEN fabric in warm oat-beige (#D2B97A). The image shows its characteristic slubby flax weave with clearly visible cross-hatched warp and weft threads. Matte natural hand, soft natural softness, no sheen.`,
  },
  {
    slug: "lightweight-cotton",
    subject: `Lightweight cotton VOILE, approximately 100 GSM plain weave. Cream (#E8DCC0). Very fine even plain weave with each warp and weft thread sharply visible, soft matte finish, high thread count reading as fine refined cotton.`,
  },
  {
    slug: "organic-cotton",
    subject: `Organic cotton INTERLOCK knit fabric, approximately 200 GSM. Undyed cream (#EBDFC2). Soft matte natural hand with subtle cotton fluff, evenly spaced double-knit loops visible across the surface, no chemical sheen, GOTS undyed appearance.`,
  },
  {
    slug: "hemp",
    subject: `Natural HEMP fabric, approximately 220 GSM plain weave. Olive-tan (#A89560). Coarser bast-fibre weave than flax, visible SLUBS and natural fibre irregularities, slightly drier rougher hand than linen, sage-green undertone, characteristic strong hemp yarn structure.`,
  },
  {
    slug: "ramie",
    subject: `RAMIE bast-fibre fabric, approximately 200 GSM plain weave. Pale cream (#D6C599). Crisp linen-like weave with very subtle lustre, whiter and more refined than flax linen, slight stiffness in the hand, smooth straight yarns.`,
  },

  // ─── Regenerated cellulose ─────────────────────────────────────────────
  {
    slug: "tencel-lyocell",
    subject: `TENCEL Lyocell fabric, approximately 150 GSM fine plain weave. Pale dove-cream (#C7BFB0). Smooth silky surface, very fine and tight weave, gentle satin-like soft sheen but still matte not glossy, eucalyptus-derived cellulose look.`,
  },
  {
    slug: "modal",
    subject: `Lenzing MODAL knit fabric, approximately 180 GSM single jersey. Soft pale beige (#C5B493). Buttery-smooth surface, very fine knit loops visible, soft satin-like sheen, beechwood-derived silky cellulose hand.`,
  },
  {
    slug: "ecovero-viscose",
    subject: `EcoVero VISCOSE fabric, approximately 130 GSM plain weave. Warm taupe (#BCA98A). Soft surface with subtle silky sheen, fine even plain weave, slight visible texture, plant-cellulose look.`,
  },
  {
    slug: "bamboo-lyocell",
    subject: `Closed-loop BAMBOO LYOCELL fabric, approximately 160 GSM fine weave. Pale sage-grey (#AFAC8B). Smooth silky surface, very fine tight weave, subtle cool sheen, slightly cooler tone than eucalyptus tencel.`,
  },

  // ─── Natural animal ────────────────────────────────────────────────────
  {
    slug: "silk",
    subject: `Tight macro close-up of CHAMPAGNE MULBERRY SILK CHARMEUSE (#D5BB7E). The fabric lies flat and smooth, almost no drape, only a very gentle natural rest. Lustrous satin surface with a soft directional sheen catching the light, very fine satin weave clearly visible across the frame, refined luxurious silk character. Zoom in tight on the satin surface itself.`,
  },
  {
    slug: "wool",
    subject: `Undyed WORSTED WOOL fabric, approximately 250 GSM plain weave. Warm oatmeal (#AB976D). Visible fuzzy HALO of individual fibres rising from the surface, characteristic woollen halo and crimp, matte not shiny, natural sheep-fleece warmth.`,
  },
  {
    slug: "merino-wool",
    subject: `Fine MERINO WOOL knit, 17-22 micron yarn, approximately 200 GSM single jersey. Soft cream-oat (#B5A381). Very fine smooth wool knit loops, subtle delicate fibre halo, refined non-itchy fine-micron merino appearance.`,
  },

  // ─── Specialty weaves ──────────────────────────────────────────────────
  {
    slug: "seersucker",
    subject: `Cotton SEERSUCKER fabric, approximately 150 GSM slack-tension plain weave. Pale dusty blue (#BAC9D2). Distinctive PUCKERED horizontal stripes — alternating raised three-dimensional bumpy stripes and flat stripes running across the frame, characteristic summer-suit seersucker weave.`,
  },
  {
    slug: "dobby-cotton",
    subject: `DOBBY-weave cotton, approximately 180 GSM. Warm cream-oat (#CDBA94). Small repeating geometric dots or diamond patterns woven INTO the cloth as part of the structure (not printed), subtle dimensional texture, dressy shirt-fabric appearance.`,
  },
  {
    slug: "eyelet-cotton",
    subject: `EYELET broderie anglaise cotton, approximately 150 GSM. Cream (#D9C49A). Visible embroidered perforations and small round holes scattered across the cloth, decorative cutwork pattern, openwork visible, white-on-cream embroidered detail.`,
  },

  // ─── Blends ────────────────────────────────────────────────────────────
  {
    slug: "linen-tencel",
    subject: `LINEN-TENCEL BLEND fabric, approximately 170 GSM plain weave. Warm oat (#BFB18A). Linen's slubby cross-hatched weave but smoother and refined by tencel, slight silky sheen, less wrinkle than pure linen, balanced bast-cellulose texture.`,
  },
  {
    slug: "cotton-modal",
    subject: `Cotton-Modal BLEND single jersey knit, approximately 180 GSM. Soft cream (#CCB98F). Fine knit loops with cotton's matte hand mixed with modal's silky drape, very smooth surface, subtle sheen, premium-tee fabric quality.`,
  },
  {
    slug: "cotton-linen",
    subject: `Cotton-Linen 50/50 BLEND fabric, approximately 180 GSM plain weave. Oat-beige (#C3AE82). Linen's visible cross-hatched weave but softer and less wrinkled by cotton, smoother drape than pure linen, balanced texture.`,
  },

  // ─── Synthetics (cool, plasticky) ──────────────────────────────────────
  {
    slug: "polyester",
    subject: `Standard POLYESTER woven fabric, approximately 150 GSM tight plain weave. Cool mid-grey (#999CA3). Smooth synthetic surface with slight plastic-y sheen, very even tight machine-made weave, sterile uniform appearance, NOT a natural fibre look.`,
  },
  {
    slug: "performance-synthetic",
    subject: `Technical PERFORMANCE POLYESTER DRI-FIT knit, approximately 180 GSM engineered weave. Cool tech-grey (#8E99A5). Visible engineered wicking texture with fine moisture-channel GRID or HONEYCOMB pattern, athletic mesh appearance, propeller-cross-section synthetic.`,
  },
  {
    slug: "nylon",
    subject: `NYLON RIPSTOP fabric, approximately 70 GSM. Cool silver-grey (#9DA3AE). Smooth tight ripstop weave with subtle reinforcement GRID lines crossing the surface at regular intervals, plastic sheen, very even surface, slight silvery shimmer.`,
  },
  {
    slug: "acrylic",
    subject: `Tight macro close-up of cheap ACRYLIC sweater knit in muddy grey-beige (#A0938A). The fabric lies flat against the surface, almost no drape, no folds. Visible PILLING — fuzz balls and bobbles scattered across the loose knit surface clearly resolved, individual knit stitches visible, characteristic worn cheap-sweater texture, dull synthetic hand. Zoom in tight on the knit surface itself.`,
  },
];

// Subset for the --sample run: 3 maximally distinct surfaces covering the
// hardest texture languages, so we can verify the swatch-card format holds
// across the full texture range before burning ~$1.20 on the full batch.
//   linen   = rough natural cross-hatched weave with visible flax slubs
//   silk    = smooth lustrous satin sheen (AI's hardest case — usually drapes)
//   acrylic = pilled fuzz balls / bobbles (distinctive negative texture)
const SAMPLE_SLUGS = ["linen", "silk", "acrylic"];

// ─── Argument parsing ────────────────────────────────────────────────────
const args = process.argv.slice(2);
let onlySlug = null;
let sampleOnly = false;
let skipExisting = false;
let model = "fal-ai/flux-pro/v1.1-ultra";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--only" && args[i + 1]) onlySlug = args[++i];
  else if (args[i] === "--sample") sampleOnly = true;
  else if (args[i] === "--skip-existing") skipExisting = true;
  else if (args[i] === "--model" && args[i + 1]) model = args[++i];
}

let toGenerate;
if (onlySlug) {
  toGenerate = FABRICS.filter((f) => f.slug === onlySlug);
} else if (sampleOnly) {
  toGenerate = FABRICS.filter((f) => SAMPLE_SLUGS.includes(f.slug));
} else {
  toGenerate = FABRICS;
}
if (skipExisting) {
  toGenerate = toGenerate.filter((f) => !existsSync(resolve(outDir, `${f.slug}.png`)));
}

if (toGenerate.length === 0) {
  console.error(`✗ No fabric matches --only ${onlySlug}`);
  console.error(`  Available: ${FABRICS.map((f) => f.slug).join(", ")}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

console.log(`\n→ Batch generating ${toGenerate.length} fabric macro photos via Fal.ai`);
console.log(`  Model: ${model}`);
console.log(`  Output: ${outDir}\n`);

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
  try {
    const res = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        model.includes("ultra")
          ? {
              prompt: fullPrompt,
              aspect_ratio: "1:1",
              num_images: 1,
              enable_safety_checker: true,
              output_format: "png",
              raw: false,
            }
          : {
              prompt: fullPrompt,
              image_size: "square_hd",
              num_images: 1,
              enable_safety_checker: true,
              output_format: "png",
            }
      ),
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
