// Visual swatch backgrounds for each fabric. Renders inside a small square in
// the FabricGuideSection. Primary path: AI-generated macro fabric photographs
// at /generated/fabrics/<slug>.jpg. Fallback path: subtle weave-like CSS
// gradients keyed to fabric category, used when an image is unavailable.

import type { FabricCategory } from "./fabrics";

// Slugs with shipped fabric photo swatches. Adding a fabric here without
// adding the matching JPG will produce a broken image, so keep this list
// in lockstep with /public/generated/fabrics/.
const FABRIC_IMAGES = new Set<string>([
  "linen", "lightweight-cotton", "organic-cotton", "hemp", "ramie",
  "tencel-lyocell", "modal", "ecovero-viscose", "bamboo-lyocell",
  "silk", "wool", "merino-wool",
  "seersucker", "dobby-cotton", "eyelet-cotton",
  "linen-tencel", "cotton-modal", "cotton-linen",
  "polyester", "performance-synthetic", "nylon", "acrylic",
]);

/** Per-category base palette + texture treatment. */
const CATEGORY_PALETTE: Record<FabricCategory, { from: string; to: string; weave: "linen" | "smooth" | "knit" | "ribbed" | "specialty" }> = {
  "natural-plant":   { from: "#EFE4D1", to: "#C9B895", weave: "linen" },
  "natural-animal":  { from: "#F5EBD8", to: "#C8AC7E", weave: "smooth" },
  "regenerated":     { from: "#E8E2D6", to: "#B5AC9A", weave: "smooth" },
  "synthetic":       { from: "#D2D4D8", to: "#797E84", weave: "smooth" },
  "blend":           { from: "#E5DCC8", to: "#B6A586", weave: "linen" },
  "specialty":       { from: "#F0E8D8", to: "#C2AE85", weave: "ribbed" },
};

const PER_FABRIC: Record<string, { from: string; to: string }> = {
  // Adjust specific fabrics to be more identifiable at a glance
  linen:                { from: "#F2E7CC", to: "#C2A876" },
  "lightweight-cotton": { from: "#F5EFE0", to: "#D3C5A8" },
  "organic-cotton":     { from: "#F0E8D2", to: "#C6B58E" },
  hemp:                 { from: "#D8CBA4", to: "#9C8B5E" },
  ramie:                { from: "#EAE0C0", to: "#B69E68" },
  "tencel-lyocell":     { from: "#E8E3D8", to: "#B0A893" },
  modal:                { from: "#EFEADC", to: "#C2B9A4" },
  "ecovero-viscose":    { from: "#E5DDC8", to: "#B0A382" },
  "bamboo-lyocell":     { from: "#E6E2CC", to: "#A8A082" },
  silk:                 { from: "#F4EDD8", to: "#C6B484" },
  wool:                 { from: "#D8C9AE", to: "#8C7858" },
  seersucker:           { from: "#EFE8D9", to: "#B5A684" },
  "dobby-cotton":       { from: "#F0E8D2", to: "#BBA882" },
  "eyelet-cotton":      { from: "#F4EBD2", to: "#C0AC85" },
  "linen-tencel":       { from: "#EFE5CC", to: "#BFA876" },
  "cotton-modal":       { from: "#EFEAD8", to: "#BFB496" },
  polyester:            { from: "#C4C8CC", to: "#7E848C" },
  "performance-synthetic": { from: "#C8CCD4", to: "#6E747E" },
  nylon:                { from: "#CCD0D6", to: "#727884" },
  acrylic:              { from: "#CCC8C4", to: "#807A74" },
};

/** Returns a CSS background for a fabric chip. Uses a real macro photograph
 *  swatch when one is shipped, otherwise falls back to a category gradient. */
export function getFabricBackground(slug: string, category: FabricCategory): string {
  if (FABRIC_IMAGES.has(slug)) {
    return `url('/generated/fabrics/${slug}.jpg') center/cover no-repeat`;
  }

  const colors = PER_FABRIC[slug] ?? CATEGORY_PALETTE[category];
  const weave = CATEGORY_PALETTE[category].weave;

  // Base gradient (diagonal for natural fall)
  const base = `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`;

  // Subtle texture overlay per weave type
  let texture = "";
  if (weave === "linen") {
    texture = `, repeating-linear-gradient(90deg, transparent 0px, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px), repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px)`;
  } else if (weave === "ribbed") {
    texture = `, repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)`;
  } else if (weave === "knit") {
    texture = `, repeating-linear-gradient(45deg, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 5px)`;
  }
  return base + texture;
}
