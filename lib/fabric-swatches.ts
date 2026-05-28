// Per-fabric visual swatches matching the /result page material-chip quality.
//
// Technique (mirrors lib/material-swatches.ts):
//   4-stop linear gradient (light → body → highlight → shadow) simulates
//   light playing across a real fabric surface. This is what makes the
//   /result metals/lipstick chips read as "polished material" instead of
//   "flat color block".
//
// Layered on top: a VERY subtle SVG texture overlay (~10% opacity) so each
// fabric still shows its weave identity (linen cross-hatch, silk sheen, wool
// fuzz, seersucker pucker, etc.) without competing with the gradient drama.

import type { FabricCategory } from "./fabrics";

// ─── SVG TEXTURE PATTERNS (low-opacity overlays) ─────────────────────────
// Opacities are tuned ~half what they were so the 4-stop gradient dominates.

const TEXTURES = {
  linen: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'>
      <path d='M0 0h10M0 5h10' stroke='rgba(0,0,0,0.10)' stroke-width='0.5'/>
      <path d='M0 0v10M5 0v10' stroke='rgba(0,0,0,0.10)' stroke-width='0.5'/>
      <path d='M1.5 0h0.6M6.5 0h0.6M1.5 5h0.6M6.5 5h0.6'
            stroke='rgba(255,255,255,0.18)' stroke-width='0.4'/>
    </svg>`),

  cotton: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'>
      <path d='M0 1h8M0 4h8M0 7h8' stroke='rgba(0,0,0,0.05)' stroke-width='0.4'/>
      <path d='M0 0v8M4 0v8' stroke='rgba(0,0,0,0.03)' stroke-width='0.3'/>
    </svg>`),

  silk: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'>
      <path d='M-2 14L14 -2M-2 18L18 -2M-2 22L22 -2'
            stroke='rgba(255,255,255,0.18)' stroke-width='0.6'/>
      <path d='M-2 12L12 -2' stroke='rgba(255,255,255,0.22)' stroke-width='0.8'/>
    </svg>`),

  wool: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'>
      <circle cx='2' cy='3' r='0.6' fill='rgba(0,0,0,0.08)'/>
      <circle cx='9' cy='1' r='0.5' fill='rgba(255,255,255,0.18)'/>
      <circle cx='5' cy='7' r='0.7' fill='rgba(0,0,0,0.06)'/>
      <circle cx='12' cy='9' r='0.5' fill='rgba(0,0,0,0.09)'/>
      <circle cx='3' cy='11' r='0.6' fill='rgba(255,255,255,0.15)'/>
      <circle cx='10' cy='12' r='0.5' fill='rgba(0,0,0,0.07)'/>
    </svg>`),

  hemp: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'>
      <path d='M0 2h12M0 7h12' stroke='rgba(0,0,0,0.10)' stroke-width='0.5'/>
      <path d='M0 0v12M5 0v12M10 0v12' stroke='rgba(0,0,0,0.08)' stroke-width='0.4'/>
      <path d='M2 4l3 1M7 8l3 -1' stroke='rgba(0,0,0,0.06)' stroke-width='0.4'/>
    </svg>`),

  seersucker: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='10'>
      <path d='M0 2Q3.5 0 7 2T14 2' stroke='rgba(255,255,255,0.30)' stroke-width='1.6' fill='none'/>
      <path d='M0 7Q3.5 5 7 7T14 7' stroke='rgba(0,0,0,0.08)' stroke-width='0.6' fill='none'/>
    </svg>`),

  eyelet: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'>
      <circle cx='4' cy='4' r='1.6' fill='rgba(0,0,0,0.18)' stroke='rgba(255,255,255,0.25)' stroke-width='0.4'/>
      <circle cx='10' cy='10' r='1.6' fill='rgba(0,0,0,0.18)' stroke='rgba(255,255,255,0.25)' stroke-width='0.4'/>
      <circle cx='4' cy='11' r='0.7' fill='rgba(0,0,0,0.10)'/>
      <circle cx='11' cy='4' r='0.7' fill='rgba(0,0,0,0.10)'/>
    </svg>`),

  dobby: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'>
      <circle cx='2' cy='2' r='0.7' fill='rgba(0,0,0,0.10)'/>
      <circle cx='6' cy='6' r='0.7' fill='rgba(0,0,0,0.10)'/>
      <circle cx='6' cy='2' r='0.4' fill='rgba(255,255,255,0.22)'/>
      <circle cx='2' cy='6' r='0.4' fill='rgba(255,255,255,0.22)'/>
    </svg>`),

  synthetic: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'>
      <path d='M-2 8L8 -2' stroke='rgba(255,255,255,0.18)' stroke-width='1.2'/>
      <path d='M-2 12L12 -2' stroke='rgba(0,0,0,0.08)' stroke-width='0.8'/>
    </svg>`),

  performance: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='6' height='6'>
      <rect x='0' y='0' width='6' height='6' fill='transparent'/>
      <path d='M0 3h6M3 0v6' stroke='rgba(255,255,255,0.22)' stroke-width='0.4'/>
      <circle cx='3' cy='3' r='0.4' fill='rgba(0,0,0,0.14)'/>
    </svg>`),

  acrylic: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'>
      <circle cx='3' cy='3' r='1.2' fill='rgba(0,0,0,0.10)'/>
      <circle cx='9' cy='5' r='1.5' fill='rgba(255,255,255,0.10)'/>
      <circle cx='5' cy='9' r='1.1' fill='rgba(0,0,0,0.08)'/>
      <circle cx='10' cy='10' r='0.9' fill='rgba(0,0,0,0.09)'/>
    </svg>`),

  cellulose: encodeSvg(`
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'>
      <path d='M0 3Q7 1 14 3' stroke='rgba(255,255,255,0.22)' stroke-width='0.6' fill='none'/>
      <path d='M0 8Q7 6 14 8' stroke='rgba(255,255,255,0.16)' stroke-width='0.6' fill='none'/>
      <path d='M0 12Q7 10 14 12' stroke='rgba(0,0,0,0.05)' stroke-width='0.4' fill='none'/>
    </svg>`),
} as const;

// ─── PER-FABRIC 4-STOP GRADIENT DEFINITIONS ──────────────────────────────
// Each fabric has 4 colours mapped to a 0% / 40% / 55% / 100% gradient.
// This is the same technique used for the /result page metal swatches and
// it's what creates the "polished material under light" look.

type FabricVisual = {
  /** Light edge (top-left where the highlight begins) */
  light: string;
  /** Body — the dominant fabric tone */
  body: string;
  /** Brightest catch (where the sun hits the weave) */
  highlight: string;
  /** Deep shadow (recessed/dark side) */
  shadow: string;
  /** Optional SVG weave overlay for fabric identity */
  texture: keyof typeof TEXTURES;
};

const PER_FABRIC: Record<string, FabricVisual> = {
  // ─── Natural plant — warm earthy oats, with green undertones for hemp/ramie
  linen:                { light: "#EBDEB8", body: "#C9AC74", highlight: "#F1E5C5", shadow: "#806239", texture: "linen" },
  "lightweight-cotton": { light: "#F0E6CE", body: "#D7C4A0", highlight: "#F5EEDA", shadow: "#98815C", texture: "cotton" },
  "organic-cotton":     { light: "#ECE1CA", body: "#D2BD93", highlight: "#F2EAD8", shadow: "#927B53", texture: "cotton" },
  hemp:                 { light: "#CDB884", body: "#AA9560", highlight: "#D6C597", shadow: "#6E5D32", texture: "hemp" },
  ramie:                { light: "#DACBA2", body: "#BCA97A", highlight: "#E2D7B5", shadow: "#80703F", texture: "linen" },

  // ─── Regenerated cellulose — silky drape, pale cool naturals
  "tencel-lyocell":     { light: "#E0DCCB", body: "#B6B1A0", highlight: "#EDE9DA", shadow: "#6F6B5C", texture: "cellulose" },
  modal:                { light: "#E8DCC2", body: "#C5B493", highlight: "#F2E8D2", shadow: "#877755", texture: "cellulose" },
  "ecovero-viscose":    { light: "#DECEAA", body: "#BCA98A", highlight: "#E8DABA", shadow: "#7F6F4F", texture: "cellulose" },
  "bamboo-lyocell":     { light: "#D2D0B0", body: "#AFAC8B", highlight: "#DDDBBF", shadow: "#6F6E54", texture: "cellulose" },

  // ─── Natural animal — silk gets max sheen drama
  silk:                 { light: "#F0E0B0", body: "#D5BB7E", highlight: "#FAEFC0", shadow: "#8B6E36", texture: "silk" },
  wool:                 { light: "#CFBB94", body: "#AB976D", highlight: "#DCC8A4", shadow: "#6C5C3A", texture: "wool" },
  "merino-wool":        { light: "#D5C7AA", body: "#B5A381", highlight: "#DFD3BA", shadow: "#6F6044", texture: "wool" },

  // ─── Specialty weaves — distinctive constructions
  seersucker:           { light: "#DDE5EB", body: "#BAC9D2", highlight: "#ECF1F4", shadow: "#758E9C", texture: "seersucker" },
  "dobby-cotton":       { light: "#E8DCC0", body: "#CDBA94", highlight: "#F0E7CE", shadow: "#8E7B55", texture: "dobby" },
  "eyelet-cotton":      { light: "#F0E6CE", body: "#D9C49A", highlight: "#F5EED7", shadow: "#9C8358", texture: "eyelet" },

  // ─── Blends
  "linen-tencel":       { light: "#E1D7BA", body: "#BFB18A", highlight: "#E8DFC4", shadow: "#7C6E47", texture: "linen" },
  "cotton-modal":       { light: "#E7D9B7", body: "#CCB98F", highlight: "#EFE3C7", shadow: "#897650", texture: "cellulose" },
  "cotton-linen":       { light: "#E5D6AE", body: "#C3AE82", highlight: "#ECE0BD", shadow: "#806B40", texture: "linen" },

  // ─── Synthetics — cool plastic-leaning greys with strong sheen for poly/nylon
  polyester:                { light: "#C8CAD0", body: "#999CA3", highlight: "#D8DAE0", shadow: "#535860", texture: "synthetic" },
  "performance-synthetic":  { light: "#BEC8D2", body: "#8E99A5", highlight: "#CED7DE", shadow: "#424E5C", texture: "performance" },
  nylon:                    { light: "#CFD4D9", body: "#9DA3AE", highlight: "#DCE0E5", shadow: "#585E6D", texture: "synthetic" },
  acrylic:                  { light: "#C5B9AE", body: "#A0938A", highlight: "#CCC0B6", shadow: "#635850", texture: "acrylic" },
};

// Category fallback if a slug isn't in PER_FABRIC
const CATEGORY_FALLBACK: Record<FabricCategory, FabricVisual> = {
  "natural-plant":  { light: "#EBDEB8", body: "#C9AC74", highlight: "#F1E5C5", shadow: "#806239", texture: "linen" },
  "natural-animal": { light: "#F0E0B0", body: "#D5BB7E", highlight: "#FAEFC0", shadow: "#8B6E36", texture: "silk" },
  regenerated:      { light: "#E0DCCB", body: "#B6B1A0", highlight: "#EDE9DA", shadow: "#6F6B5C", texture: "cellulose" },
  synthetic:        { light: "#C8CAD0", body: "#999CA3", highlight: "#D8DAE0", shadow: "#535860", texture: "synthetic" },
  blend:            { light: "#E5D6AE", body: "#C3AE82", highlight: "#ECE0BD", shadow: "#806B40", texture: "linen" },
  specialty:        { light: "#E8DCC0", body: "#CDBA94", highlight: "#F0E7CE", shadow: "#8E7B55", texture: "dobby" },
};

/**
 * Returns a CSS `background` value for a fabric chip combining:
 *   1. The 4-stop highlight/shadow gradient (primary visual — same technique as
 *      /result page material chips, simulates light on a polished material)
 *   2. A subtle SVG weave overlay on top for fabric identity
 * Use directly in `style={{ background: getFabricBackground(slug, category) }}`.
 */
export function getFabricBackground(slug: string, category: FabricCategory): string {
  const v = PER_FABRIC[slug] ?? CATEGORY_FALLBACK[category];
  const texture = TEXTURES[v.texture];
  const gradient = `linear-gradient(135deg, ${v.light} 0%, ${v.body} 40%, ${v.highlight} 55%, ${v.shadow} 100%)`;
  // SVG texture layer on top (subtle), polished gradient base underneath.
  return `url("${texture}"), ${gradient}`;
}

// ─── helpers ─────────────────────────────────────────────────────────────

function encodeSvg(svg: string): string {
  const minified = svg.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
  return `data:image/svg+xml;utf8,${minified
    .replace(/"/g, "'")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/#/g, "%23")}`;
}
