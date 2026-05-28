// Rules engine: given a user context (climate, lifestyle, body thermal,
// skin sensitivity, season family), produce a personalised set of
// recommended + avoid fabrics plus a "why this works for YOU" explanation.
//
// Scoring approach:
//   - Each fabric has objective property scores (lib/fabrics.ts)
//   - User context defines weights for those properties
//   - Score = weighted sum, then sort descending → anchors / skips
//
// USP axes (per FABRIC_RESEARCH + user direction):
//   - bodyThermal: hot-runners vs cold-runners get different fabric biases
//   - skin: 3-level (Normal / Sensitive / Eczema) drives a strong
//     eczemaFriendly multiplier when set to Eczema

import { FABRICS, type Fabric } from "./fabrics";
import type { SeasonFamily } from "./types";

export type Climate = "Tropical" | "Temperate" | "Mixed" | "Cold";
export type Lifestyle = "Office indoor" | "Outdoor commute" | "Active" | "Mixed";
export type SkinSensitivity = "Normal" | "Sensitive" | "Dry";
export type BodyThermal = "Hot-prone" | "Balanced" | "Cold-prone";

export interface FabricContext {
  climate: Climate;
  lifestyle: Lifestyle;
  skin: SkinSensitivity;
  bodyThermal: BodyThermal;
  seasonFamily?: SeasonFamily;
}

export interface FabricRecommendation {
  anchors: Fabric[];
  skip: Fabric[];
  whyItWorks: string;
  /** Plain-language matchup chips, e.g. "Smooth for eczema", "Warms in air-con" */
  personalReasons: string[];
}

// Property weights per climate. Higher = matters more for THIS climate.
const CLIMATE_WEIGHTS: Record<Climate, {
  breathability: number;
  wicking: number;
  drape: number;
  wrinkle: number;
  durability: number;
  tropicalFit: number;
}> = {
  Tropical:   { breathability: 3, wicking: 3, drape: 1, wrinkle: -0.5, durability: 1, tropicalFit: 3 },
  Temperate:  { breathability: 1.5, wicking: 1, drape: 2, wrinkle: -1, durability: 1.5, tropicalFit: 0 },
  Mixed:      { breathability: 2, wicking: 2, drape: 1.5, wrinkle: -0.75, durability: 1.5, tropicalFit: 1.5 },
  Cold:       { breathability: 0.5, wicking: 0.5, drape: 2, wrinkle: -1, durability: 2, tropicalFit: -1 },
};

// Lifestyle modifiers
const LIFESTYLE_BIAS: Record<Lifestyle, Partial<{ tropicalFit: number; wicking: number; drape: number; durability: number; }>> = {
  "Office indoor":     { drape: 1, durability: 0.5 },
  "Outdoor commute":   { wicking: 2, tropicalFit: 1 },
  "Active":            { wicking: 3, durability: 2, tropicalFit: 1 },
  "Mixed":             { wicking: 1, tropicalFit: 0.5 },
};

// Skin sensitivity multiplies the skinFriendly weight; Sensitive additionally
// applies a strong eczemaFriendly multiplier so silk, organic cotton, TENCEL,
// modal, seersucker rank way above wool, acrylic, polyester fleece. Dry skin
// uses a separate dryFriendly weight that favours moisture-retaining smooth
// fibres (silk, modal, TENCEL) and penalises moisture-stripping performance
// synthetics.
const SKIN_FRIENDLY_WEIGHT: Record<SkinSensitivity, number> = {
  Normal:    0.25,
  Sensitive: 2,
  Dry:       1.5,
};
const SENSITIVE_BONUS_WEIGHT = 2.5;  // applied on eczemaFriendly when skin === "Sensitive"
const DRY_BONUS_WEIGHT = 3;          // applied on dryFriendly when skin === "Dry"

// Body-thermal weights: hot-prone users care about hotRunner score, cold-prone
// users care about coldRunner score. Balanced users get a mild blend.
// (The Fabric data property is still named thermalFit.hotRunner / coldRunner
// because those are well-known textile-science terms; the user-facing label is
// the friendlier Hot-prone / Cold-prone.)
const BODY_THERMAL_HOT_WEIGHT: Record<BodyThermal, number> = {
  "Hot-prone":  2.5,
  "Balanced":   1,
  "Cold-prone": 0,
};
const BODY_THERMAL_COLD_WEIGHT: Record<BodyThermal, number> = {
  "Hot-prone":  0,
  "Balanced":   0.5,
  "Cold-prone": 2.5,
};

function scoreFabric(f: Fabric, ctx: FabricContext): number {
  const w = CLIMATE_WEIGHTS[ctx.climate];
  let score =
    f.breathability * w.breathability +
    f.wicking       * w.wicking +
    f.drape         * w.drape +
    f.wrinkle       * w.wrinkle +
    f.durability    * w.durability +
    f.tropicalFit   * w.tropicalFit +
    f.skinFriendly  * SKIN_FRIENDLY_WEIGHT[ctx.skin];

  // Sensitive: heavy eczemaFriendly weight (smooth, no harsh finishes)
  // Dry: heavy dryFriendly weight (moisture-retaining, low friction)
  if (ctx.skin === "Sensitive") {
    score += f.eczemaFriendly * SENSITIVE_BONUS_WEIGHT;
  } else if (ctx.skin === "Dry") {
    score += f.dryFriendly * DRY_BONUS_WEIGHT;
  }

  // Body thermal preference
  score += f.thermalFit.hotRunner  * BODY_THERMAL_HOT_WEIGHT[ctx.bodyThermal];
  score += f.thermalFit.coldRunner * BODY_THERMAL_COLD_WEIGHT[ctx.bodyThermal];

  const lifestyleBias = LIFESTYLE_BIAS[ctx.lifestyle];
  if (lifestyleBias.tropicalFit) score += f.tropicalFit * lifestyleBias.tropicalFit;
  if (lifestyleBias.wicking)     score += f.wicking     * lifestyleBias.wicking;
  if (lifestyleBias.drape)       score += f.drape       * lifestyleBias.drape;
  if (lifestyleBias.durability)  score += f.durability  * lifestyleBias.durability;

  return score;
}

export function recommendFabrics(ctx: FabricContext): FabricRecommendation {
  const scored = FABRICS.map((f) => ({ fabric: f, score: scoreFabric(f, ctx) }));
  scored.sort((a, b) => b.score - a.score);

  // Anchors: top 8 fabrics by score, excluding any with negative or very low
  const anchors = scored.filter((s) => s.score > 0).slice(0, 8).map((s) => s.fabric);

  // Skip: bottom 4 with lowest scores
  const skipRaw = [...scored].sort((a, b) => a.score - b.score).slice(0, 4);
  const skip = skipRaw.map((s) => s.fabric);

  const whyItWorks = composeWhy(ctx, anchors);
  const personalReasons = composePersonalReasons(ctx);

  return { anchors, skip, whyItWorks, personalReasons };
}

function composeWhy(ctx: FabricContext, anchors: Fabric[]): string {
  const topNames = anchors.slice(0, 3).map((f) => f.name).join(", ");

  const climatePart = {
    Tropical: "In hot, humid weather, plant and cellulosic fibres wick sweat and let air move across your skin.",
    Temperate: "In moderate weather, drape and adaptability through the day matter most.",
    Mixed: "Your changing climate calls for fabrics that breathe in the heat and layer cleanly when it cools.",
    Cold: "In cool weather, drape, warmth, and shape-keeping matter more than wicking.",
  }[ctx.climate];

  const thermalPart: Record<BodyThermal, string> = {
    "Hot-prone":  "You overheat easily, so the engine pushes maximum airflow and moisture release to the top.",
    "Balanced":   "",
    "Cold-prone": "You feel cold easily, so thermo-regulating fibres (silk, fine merino, TENCEL) and layering pieces bias toward the top.",
  };

  const skinPart: Record<SkinSensitivity, string> = {
    Normal: "",
    Sensitive: "For sensitive or reactive skin: smooth-surface fibres and OEKO-TEX certified options without harsh finishes. Silk, organic cotton, TENCEL, modal, and silky bamboo lyocell rise to the top. Wool and pill-prone acrylic are filtered out.",
    Dry: "For dry skin: moisture-retaining smooth fibres (silk, modal, TENCEL, cotton-modal) are prioritised. Moisture-stripping performance synthetics drop, friction-prone weaves are deprioritised.",
  };

  const lifestylePart = {
    "Office indoor": "Your air-conditioned days call for fabrics that resist wrinkles and feel polished.",
    "Outdoor commute": "Wicking matters as much as breathability. Fast-drying fibres win.",
    "Active": "Fast wicking, quick drying, durable washing.",
    "Mixed": "A varied day calls for versatile fibres that handle indoor cool and outdoor heat.",
  }[ctx.lifestyle];

  return [
    `${topNames} are your wardrobe anchors.`,
    climatePart,
    thermalPart[ctx.bodyThermal],
    lifestylePart,
    skinPart[ctx.skin],
  ].filter(Boolean).join(" ");
}

/** Short chip-sized reasons that explain why this user's anchors are this way. */
function composePersonalReasons(ctx: FabricContext): string[] {
  const reasons: string[] = [];

  if (ctx.climate === "Tropical") reasons.push("Tropical-optimised");
  if (ctx.climate === "Cold") reasons.push("Cool-climate biased");

  if (ctx.bodyThermal === "Hot-prone") reasons.push("Maximum airflow for hot-prone bodies");
  if (ctx.bodyThermal === "Cold-prone") reasons.push("Thermoregulating for cold-prone bodies");

  if (ctx.skin === "Sensitive") reasons.push("Smooth and finish-free for sensitive skin");
  else if (ctx.skin === "Dry") reasons.push("Moisture-retaining for dry skin");

  if (ctx.lifestyle === "Office indoor") reasons.push("Polished for indoor air-con");
  if (ctx.lifestyle === "Outdoor commute") reasons.push("Sweat-handling for commutes");
  if (ctx.lifestyle === "Active") reasons.push("Sport-grade wicking");

  return reasons;
}

// ─── BY-OCCASION SUGGESTIONS ─────────────────────────────────────────────

export type Occasion = "Office" | "Weekend" | "Going out" | "Outdoor" | "Travel";

export interface OccasionSuggestion {
  occasion: Occasion;
  description: string;
  fabricSlugs: string[];
}

export function occasionFabrics(ctx: FabricContext): OccasionSuggestion[] {
  // For each occasion, filter fabrics that list this occasion AND score well
  const reco = recommendFabrics(ctx);
  const goodSet = new Set(reco.anchors.map((f) => f.slug));

  const occasionMeta: Record<Occasion, string> = {
    Office: "Polished, wrinkle-tolerant fibres that handle air-conditioning and a walk to the car.",
    Weekend: "Easy, soft fibres that feel comfortable from coffee runs to dinner.",
    "Going out": "Fabrics with drape and presence. Less workhorse, more moment.",
    Outdoor: "Fast wicking, fast drying. Built for sweat and direct sun.",
    Travel: "Pack-flat, wrinkle-resistant, multi-day reliable.",
  };

  const occasions: Occasion[] = ["Office", "Weekend", "Going out", "Outdoor", "Travel"];

  return occasions.map((o) => {
    const slugs = FABRICS
      .filter((f) =>
        (f.occasions as readonly string[]).includes(o) &&
        (goodSet.has(f.slug) || (ctx.climate !== "Tropical" && f.tropicalFit < 3))
      )
      .slice(0, 4)
      .map((f) => f.slug);
    return { occasion: o, description: occasionMeta[o], fabricSlugs: slugs };
  });
}
