// Canvas-generated "Fabric Card" — vertical Instagram-Story format (1080×1920)
// summarising the user's fabric profile: climate, anchors, skip, care notes.

import type { ColourResult } from "./types";
import type { FabricContext, FabricRecommendation } from "./fabric-rules";
import { SEASON_FAMILY_ACCENT } from "./seasons";

export async function generateFabricCard(
  result: ColourResult,
  ctx: FabricContext,
  reco: FabricRecommendation
): Promise<Blob> {
  const W = 1080;
  const H = 1920;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx2d = canvas.getContext("2d");
  if (!ctx2d) throw new Error("Canvas 2D context unavailable");

  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* fall through */ }
  }

  const familyAccent = SEASON_FAMILY_ACCENT[result.seasonFamily] ?? "#5C7A57";
  const SUCCESS = "#5C7A57";
  const BG = "#F6F1EA";
  const INK = "#1F1B16";
  const INK_SOFT = "#6B6258";
  const LINE = "#E3D9CC";
  const SURFACE = "#FFFFFF";

  ctx2d.fillStyle = BG;
  ctx2d.fillRect(0, 0, W, H);

  // Soft top accent
  const grad = ctx2d.createRadialGradient(0, 0, 100, 0, 0, 900);
  grad.addColorStop(0, SUCCESS + "30");
  grad.addColorStop(1, SUCCESS + "00");
  ctx2d.fillStyle = grad;
  ctx2d.fillRect(0, 0, W, H);

  // Wordmark
  ctx2d.fillStyle = INK;
  ctx2d.font = "600 36px 'Fraunces', Georgia, serif";
  ctx2d.textAlign = "center";
  ctx2d.fillText("chromatique", W / 2, 90);
  ctx2d.fillStyle = SUCCESS;
  ctx2d.fillRect(W / 2 - 32, 110, 64, 2);

  // Title
  ctx2d.font = "600 26px 'Hanken Grotesk', system-ui, sans-serif";
  ctx2d.fillStyle = SUCCESS;
  ctx2d.fillText("FABRIC & CLIMATE GUIDE", W / 2, 170);

  // Climate as the hero
  ctx2d.font = "700 100px 'Fraunces', Georgia, serif";
  ctx2d.fillStyle = familyAccent;
  let sz = 100;
  while (ctx2d.measureText(ctx.climate.toUpperCase()).width > W - 120 && sz > 60) {
    sz -= 4;
    ctx2d.font = `700 ${sz}px 'Fraunces', Georgia, serif`;
  }
  ctx2d.fillText(ctx.climate.toUpperCase(), W / 2, 280);

  // Subline
  ctx2d.font = "italic 400 30px 'Hanken Grotesk', system-ui, sans-serif";
  ctx2d.fillStyle = INK_SOFT;
  wrapText(ctx2d, `${ctx.lifestyle} · ${ctx.skin} skin · ${result.season}`, W / 2, 330, W - 160, 38, 2);

  // Why
  ctx2d.font = "400 26px 'Hanken Grotesk', system-ui, sans-serif";
  ctx2d.fillStyle = INK;
  wrapText(ctx2d, reco.whyItWorks, W / 2, 400, W - 160, 36, 4);

  // ── ANCHORS ───────────────────────────────────────────────────────────
  let y = 560;
  ctx2d.textAlign = "left";
  ctx2d.font = "600 24px 'Hanken Grotesk', system-ui, sans-serif";
  ctx2d.fillStyle = SUCCESS;
  ctx2d.fillText("YOUR WARDROBE ANCHORS", 40, y);
  y += 36;

  reco.anchors.slice(0, 6).forEach((f, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 40 + col * ((W - 80 + 30) / 2);
    const yPos = y + row * 90;

    ctx2d.fillStyle = SURFACE;
    roundRect(ctx2d, x, yPos, (W - 80) / 2 - 15, 76, 16);
    ctx2d.fill();
    ctx2d.strokeStyle = LINE;
    ctx2d.lineWidth = 1;
    ctx2d.stroke();

    // small swatch
    ctx2d.fillStyle = "#D8C8A2";
    roundRect(ctx2d, x + 12, yPos + 12, 52, 52, 10);
    ctx2d.fill();

    ctx2d.fillStyle = INK;
    ctx2d.font = "600 22px 'Hanken Grotesk', system-ui, sans-serif";
    ctx2d.fillText(f.name, x + 80, yPos + 38);
    ctx2d.font = "400 18px 'Hanken Grotesk', system-ui, sans-serif";
    ctx2d.fillStyle = INK_SOFT;
    ctx2d.fillText(`Breathes ${f.breathability}/5 · Wicks ${f.wicking}/5`, x + 80, yPos + 62);
  });

  y += Math.ceil(Math.min(6, reco.anchors.length) / 2) * 90 + 40;

  // ── SKIP ──────────────────────────────────────────────────────────────
  ctx2d.font = "600 24px 'Hanken Grotesk', system-ui, sans-serif";
  ctx2d.fillStyle = "#9c3b2a";
  ctx2d.fillText("SKIP THESE", 40, y);
  y += 30;

  ctx2d.font = "400 24px 'Hanken Grotesk', system-ui, sans-serif";
  ctx2d.fillStyle = INK_SOFT;
  const skipNames = reco.skip.slice(0, 4).map((f) => f.name).join(" · ");
  wrapText(ctx2d, skipNames, 40, y + 30, W - 80, 32, 2, "left");
  y += 90;

  // ── SHOPPING + CARE ───────────────────────────────────────────────────
  const tropical = ctx.climate === "Tropical";
  const shopping = tropical ? [
    "Look for 'linen', 'Tencel' or 'Lyocell', '100% cotton' on labels.",
    "Tencel and Lyocell are the same fibre, just different brand names.",
    "Avoid 100% polyester or acrylic for daily tropical wear.",
    "OEKO-TEX Standard 100 means no harmful chemical residues.",
  ] : [
    "Read fibre composition before price.",
    "Higher natural-fibre percentage means better longevity.",
    "Blends with 5-10% elastane are fine, more becomes plasticky.",
  ];

  ctx2d.font = "600 24px 'Hanken Grotesk', system-ui, sans-serif";
  ctx2d.fillStyle = SUCCESS;
  ctx2d.fillText("SHOPPING NOTES", 40, y);
  y += 36;

  ctx2d.font = "400 22px 'Hanken Grotesk', system-ui, sans-serif";
  ctx2d.fillStyle = INK;
  shopping.forEach((tip) => {
    y = wrapText(ctx2d, `· ${tip}`, 40, y, W - 80, 30, 3, "left");
    y += 10;
  });

  // ── FOOTER ────────────────────────────────────────────────────────────
  const footerY = H - 110;
  ctx2d.fillStyle = LINE;
  ctx2d.fillRect(40, footerY, W - 80, 1);

  ctx2d.fillStyle = INK_SOFT;
  ctx2d.font = "500 24px 'Hanken Grotesk', system-ui, sans-serif";
  ctx2d.textAlign = "center";
  ctx2d.fillText("chromatique-trina1.vercel.app", W / 2, footerY + 50);

  ctx2d.fillStyle = INK_SOFT + "AA";
  ctx2d.font = "400 18px 'Hanken Grotesk', system-ui, sans-serif";
  ctx2d.fillText("Tropical fabric intelligence · personal style profile", W / 2, footerY + 78);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode image"))),
      "image/png",
      0.95
    );
  });
}

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
