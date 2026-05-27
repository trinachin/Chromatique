// Canvas-generated "Makeup Card" — a vertical Instagram-Story format (1080×1920)
// infographic combining season + facial features + technique recommendations.
//
// Saved as PNG via `downloadAs("makeup-card.png")` from the result page.

import type { ColourResult, FacialFeatures } from "./types";
import { getSeasonProfile, getSeasonDetails, SEASON_FAMILY_ACCENT } from "./seasons";
import {
  EYELINER_TECHNIQUE,
  BLUSH_TECHNIQUE,
  LIP_TECHNIQUE,
  NOSE_TECHNIQUE,
  BROW_TECHNIQUE,
} from "./feature-techniques";

export async function generateMakeupCard(
  result: ColourResult,
  features: FacialFeatures
): Promise<Blob> {
  const W = 1080;
  const H = 1920;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* fall through */ }
  }

  const familyAccent = SEASON_FAMILY_ACCENT[result.seasonFamily] ?? "#C2683B";
  const profile = getSeasonProfile(result.season);
  const details = getSeasonDetails(result.season);
  const BG = "#F6F1EA";
  const INK = "#1F1B16";
  const INK_SOFT = "#6B6258";
  const LINE = "#E3D9CC";
  const SURFACE = "#FFFFFF";

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Soft top accent wash
  const grad = ctx.createRadialGradient(W, 0, 100, W, 0, 900);
  grad.addColorStop(0, familyAccent + "33");
  grad.addColorStop(1, familyAccent + "00");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Brand wordmark
  ctx.fillStyle = INK;
  ctx.font = "600 36px 'Fraunces', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("chromatique", W / 2, 90);
  ctx.fillStyle = familyAccent;
  ctx.fillRect(W / 2 - 32, 110, 64, 2);

  // Title
  ctx.fillStyle = familyAccent;
  ctx.font = "600 26px 'Hanken Grotesk', system-ui, sans-serif";
  ctx.fillText("YOUR MAKEUP & FEATURES", W / 2, 170);

  // Season heading
  ctx.fillStyle = familyAccent;
  ctx.font = "700 100px 'Fraunces', Georgia, serif";
  let sz = 100;
  while (ctx.measureText(result.season).width > W - 120 && sz > 60) {
    sz -= 4;
    ctx.font = `700 ${sz}px 'Fraunces', Georgia, serif`;
  }
  ctx.fillText(result.season, W / 2, 280);

  // Notes (italic appreciation)
  if (features.notes) {
    ctx.fillStyle = INK_SOFT;
    ctx.font = "italic 400 30px 'Hanken Grotesk', system-ui, sans-serif";
    wrapText(ctx, `"${features.notes}"`, W / 2, 350, W - 160, 38, 3);
  }

  // ─── FEATURES GRID ─────────────────────────────────────────────────────
  const undertoneLabels: Record<string, string> = {
    warm: "Warm", cool: "Cool", neutral: "Neutral", olive: "Olive",
  };
  const cards: { label: string; value: string }[] = [
    { label: "Eyes",     value: features.eyeShape },
    { label: "Nose",     value: features.noseType },
    { label: "Lips",     value: features.lipShape },
    { label: "Face",     value: features.faceShape },
    { label: "Brows",    value: features.browShape },
    { label: "Undertone", value: undertoneLabels[features.refinedUndertone] ?? features.refinedUndertone },
    { label: "Skin",     value: features.skinTexture },
  ];

  const gridTop = 510;
  const gridCols = 3;
  const gridGap = 18;
  const cardW = (W - 80 - gridGap * (gridCols - 1)) / gridCols;
  const cardH = 110;

  cards.forEach((c, i) => {
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);
    const x = 40 + col * (cardW + gridGap);
    const y = gridTop + row * (cardH + gridGap);

    ctx.fillStyle = SURFACE;
    roundRect(ctx, x, y, cardW, cardH, 18);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, cardW, cardH, 18);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = INK_SOFT;
    ctx.font = "500 18px 'Hanken Grotesk', system-ui, sans-serif";
    ctx.fillText(c.label.toUpperCase(), x + 18, y + 36);

    ctx.fillStyle = INK;
    ctx.font = "600 26px 'Hanken Grotesk', system-ui, sans-serif";
    const v = truncate(c.value, 16);
    ctx.fillText(v, x + 18, y + 76);
  });

  // ─── PALETTE BAND ──────────────────────────────────────────────────────
  const paletteY = gridTop + Math.ceil(cards.length / gridCols) * (cardH + gridGap) + 30;
  if (profile) {
    ctx.fillStyle = INK_SOFT;
    ctx.font = "600 22px 'Hanken Grotesk', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("YOUR PALETTE", 40, paletteY);

    const swatchSize = 80;
    const swatchGap = 14;
    const swatchesPerRow = 6;
    const swatches = profile.palette.slice(0, 12);
    swatches.forEach((s, i) => {
      const col = i % swatchesPerRow;
      const row = Math.floor(i / swatchesPerRow);
      const x = 40 + col * (swatchSize + swatchGap);
      const y = paletteY + 30 + row * (swatchSize + swatchGap);
      ctx.fillStyle = s.hex;
      roundRect(ctx, x, y, swatchSize, swatchSize, 14);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, swatchSize, swatchSize, 14);
      ctx.stroke();
    });
  }

  // ─── TECHNIQUE LIST ────────────────────────────────────────────────────
  const techY = paletteY + 250;
  ctx.fillStyle = INK_SOFT;
  ctx.font = "600 22px 'Hanken Grotesk', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("TECHNIQUES FOR YOU", 40, techY);

  const techniques = [
    { title: "Eyeliner",  t: EYELINER_TECHNIQUE[features.eyeShape] },
    { title: "Blush",     t: BLUSH_TECHNIQUE[features.faceShape] },
    { title: "Lips",      t: LIP_TECHNIQUE[features.lipShape] },
    { title: "Brows",     t: BROW_TECHNIQUE[features.faceShape] },
    { title: "Nose",      t: NOSE_TECHNIQUE[features.noseType] },
  ];

  let ty = techY + 40;
  techniques.forEach((tech) => {
    // Title row
    ctx.fillStyle = familyAccent;
    ctx.font = "600 20px 'Hanken Grotesk', system-ui, sans-serif";
    ctx.fillText(tech.title.toUpperCase(), 40, ty);
    ty += 32;
    // Technique name
    ctx.fillStyle = INK;
    ctx.font = "600 26px 'Hanken Grotesk', system-ui, sans-serif";
    ctx.fillText(tech.t.name, 40, ty);
    ty += 34;
    // Description (wrapped)
    ctx.fillStyle = INK_SOFT;
    ctx.font = "400 22px 'Hanken Grotesk', system-ui, sans-serif";
    ty = wrapText(ctx, tech.t.description, 40, ty, W - 80, 30, 3, "left");
    ty += 22;
  });

  // ─── FOOTER ────────────────────────────────────────────────────────────
  const footerY = H - 110;
  ctx.fillStyle = LINE;
  ctx.fillRect(40, footerY, W - 80, 1);

  ctx.fillStyle = INK_SOFT;
  ctx.font = "500 24px 'Hanken Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("chromatique-trina1.vercel.app", W / 2, footerY + 50);

  if (details) {
    ctx.fillStyle = INK_SOFT + "AA";
    ctx.font = "400 18px 'Hanken Grotesk', system-ui, sans-serif";
    ctx.fillText("AI colour & feature analysis · photo never stored", W / 2, footerY + 78);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode image"))),
      "image/png",
      0.95
    );
  });
}

// ── helpers ─────────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  align: CanvasTextAlign = "center"
): number {
  ctx.textAlign = align;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}
