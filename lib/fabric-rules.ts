// Rules engine: given a user context (climate, lifestyle, skin sensitivity,
// season family), produce a personalised set of recommended + avoid fabrics
// plus a "why this works for you" explanation.
//
// Scoring approach:
//   - Each fabric has objective property scores (lib/fabrics.ts)
//   - User context defines weights for those properties
//   - Score = weighted sum, then sort descending → anchors / skips

import { FABRICS, type Fabric } from "./fabrics";
import type { SeasonFamily } from "./types";

export type Climate = "Tropical" | "Temperate" | "Mixed" | "Cold";
export type Lifestyle = "Office indoor" | "Outdoor commute" | "Active" | "Mixed";
export type SkinSensitivity = "Normal" | "Sensitive";

export interface FabricContext {
  climate: Climate;
  lifestyle: Lifestyle;
  skin: SkinSensitivity;
  seasonFamily?: SeasonFamily;
}

export interface FabricRecommendation {
  anchors: Fabric[];
  skip: Fabric[];
  whyItWorks: string;
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

// Skin sensitivity multiplies the skinFriendly weight
const SKIN_FRIENDLY_WEIGHT: Record<SkinSensitivity, number> = {
  Normal:    0.5,
  Sensitive: 2,
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

  return { anchors, skip, whyItWorks };
}

function composeWhy(ctx: FabricContext, anchors: Fabric[]): string {
  const topNames = anchors.slice(0, 3).map((f) => f.name).join(", ");

  const climatePart = {
    Tropical: "In hot, humid weather, breathable plant and cellulosic fibres wick sweat and let air move across your skin.",
    Temperate: "In moderate weather, you want fabrics that drape well and adapt to layering through the day.",
    Mixed: "Your changing climate calls for fabrics that breathe in the heat and layer cleanly when it cools.",
    Cold: "In cool weather, drape and warmth matter more than wicking. Look for fabrics that hold their shape.",
  }[ctx.climate];

  const lifestylePart = {
    "Office indoor": "Your office commute and air-conditioned days mean fabrics that resist wrinkles and feel polished.",
    "Outdoor commute": "Outdoor stretches mean wicking matters as much as breathability. Fast-drying fibres win.",
    "Active": "Active days demand performance: fast wicking, quick drying, durable washing.",
    "Mixed": "A varied day-to-day calls for versatile fibres that handle indoor cool and outdoor heat.",
  }[ctx.lifestyle];

  const skinPart = ctx.skin === "Sensitive"
    ? "Your sensitive skin benefits from natural and OEKO-TEX certified fibres without chemical finishes."
    : "";

  return [
    `${topNames} are your wardrobe anchors.`,
    climatePart,
    lifestylePart,
    skinPart,
  ].filter(Boolean).join(" ");
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
