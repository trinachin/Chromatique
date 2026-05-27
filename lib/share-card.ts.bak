import type { ColourResult } from "./types";
import { getSeasonProfile, SEASON_FAMILY_ACCENT } from "./seasons";

// Renders the result to a 1080x1350 portrait card (Instagram-friendly).
// Returns a Promise<Blob> (PNG) suitable for download or navigator.share.
export async function generateShareCard(result: ColourResult): Promise<Blob> {
  const W = 1080;
  const H = 1350;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // Wait for brand fonts to be loaded before drawing
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* fall through to system fallback */
    }
  }

  const familyAccent = SEASON_FAMILY_ACCENT[result.seasonFamily] ?? "#C2683B";
  const description = getSeasonProfile(result.season)?.description ?? "";
  const BG = "#F6F1EA";
  const INK = "#1F1B16";
  const INK_SOFT = "#6B6258";
  const LINE = "#E3D9CC";

  // ── Background ──────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Subtle accent corner wash
  const grad = ctx.createRadialGradient(W, 0, 50, W, 0, 700);
  grad.addColorStop(0, familyAccent + "30");
  grad.addColorStop(1, familyAccent + "00");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Brand wordmark at top ──────────────────────────────────
  ctx.fillStyle = INK;
  ctx.font = "600 32px 'Fraunces', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("chromatique", W / 2, 100);

  // Small accent rule under wordmark
  ctx.fillStyle = familyAccent;
  ctx.fillRect(W / 2 - 28, 122, 56, 2);

  // ── Eyebrow label ──────────────────────────────────────────
  ctx.fillStyle = familyAccent;
  ctx.font = "600 22px 'Hanken Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MY COLOUR SEASON", W / 2, 220);

  // ── Big season name ────────────────────────────────────────
  ctx.fillStyle = familyAccent;
  ctx.font = "700 110px 'Fraunces', Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  // Auto-shrink for very long names
  let fontSize = 110;
  while (ctx.measureText(result.season).width > W - 120 && fontSize > 60) {
    fontSize -= 6;
    ctx.font = `700 ${fontSize}px 'Fraunces', Georgia, serif`;
  }
  ctx.fillText(result.season, W / 2, 330);

  // ── Description ────────────────────────────────────────────
  ctx.fillStyle = INK_SOFT;
  ctx.font = "400 28px 'Hanken Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center";
  const descMaxWidth = W - 200;
  const descLines = wrapText(ctx, description, descMaxWidth);
  descLines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, W / 2, 400 + i * 36);
  });

  // ── Palette grid ───────────────────────────────────────────
  const paletteY = 560;
  const swatches = result.palette.slice(0, 12);
  const cols = swatches.length <= 6 ? swatches.length : 6;
  const rows = Math.ceil(swatches.length / cols);
  const swatchSize = 140;
  const gap = 22;
  const gridW = cols * swatchSize + (cols - 1) * gap;
  const gridX = (W - gridW) / 2;

  swatches.forEach((swatch, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gridX + col * (swatchSize + gap);
    const y = paletteY + row * (swatchSize + gap + 30);

    // Rounded swatch
    ctx.fillStyle = swatch.hex;
    roundRect(ctx, x, y, swatchSize, swatchSize, 18);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, swatchSize, swatchSize, 18);
    ctx.stroke();

    // Swatch name below
    ctx.fillStyle = INK;
    ctx.font = "500 18px 'Hanken Grotesk', system-ui, sans-serif";
    ctx.textAlign = "center";
    const name = truncate(swatch.name, 14);
    ctx.fillText(name, x + swatchSize / 2, y + swatchSize + 22);
  });

  // ── Tagline near bottom ────────────────────────────────────
  ctx.fillStyle = INK;
  ctx.font = "italic 600 36px 'Fraunces', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Find your colours.", W / 2, H - 220);

  // ── Divider ────────────────────────────────────────────────
  ctx.fillStyle = LINE;
  ctx.fillRect(W / 2 - 80, H - 180, 160, 1);

  // ── URL ────────────────────────────────────────────────────
  ctx.fillStyle = INK_SOFT;
  ctx.font = "500 28px 'Hanken Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("chromatique-trina1.vercel.app", W / 2, H - 130);

  // ── Tiny privacy line ─────────────────────────────────────
  ctx.fillStyle = INK_SOFT + "AA";
  ctx.font = "400 20px 'Hanken Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("AI colour analysis · photo never stored", W / 2, H - 90);

  // ── Tiny mini-wheel decoration top-left ───────────────────
  drawMiniWheel(ctx, 100, 100, 36);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/png",
      0.95
    );
  });
}

// ── Helpers ──────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function drawMiniWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const quadrants = [
    "#F4C06A", // spring
    "#9BBDD4", // summer
    "#4A6B8A", // winter
    "#C2683B", // autumn
  ];
  quadrants.forEach((color, i) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  });
  // Outer ring
  ctx.strokeStyle = "#1F1B16";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}
