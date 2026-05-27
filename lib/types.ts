export type ColourSwatch = {
  name: string;
  hex: string;
  /** Hero = signature/statement colours (typically 2-3 per season). Everyday = wardrobe base. */
  tier?: "hero" | "everyday";
};

export type SeasonFamily = "Spring" | "Summer" | "Autumn" | "Winter";
export type Undertone = "warm" | "cool" | "neutral";

// 4-way refined undertone (per ADD_RESEARCH §1f: olive must be distinct because
// it's the most-misclassified, common in SEA / South Asian / olive-Mediterranean
// users, and gets oxidised foundation when classified as plain warm).
export type RefinedUndertone = "warm" | "cool" | "neutral" | "olive";

// Simplified but inclusive taxonomies per ADD_RESEARCH §1a-e.
// Eye shapes intentionally include monolid / parallel double-lid / outer
// double-lid distinctions that Western taxonomies omit.
export type EyeShape =
  | "Almond" | "Round" | "Monolid" | "Hooded monolid"
  | "Parallel double-lid" | "Outer double-lid" | "Hooded"
  | "Downturned" | "Upturned" | "Deep-set";

export type NoseType =
  | "Button" | "Straight" | "Aquiline" | "Snub"
  | "Low-bridge" | "Wide" | "Long" | "Short";

export type LipShape =
  | "Full" | "Thin" | "Heart-shaped" | "Bow-shaped"
  | "Downturned" | "Wide" | "Round" | "Top-heavy" | "Bottom-heavy";

export type FaceShape =
  | "Oval" | "Round" | "Square" | "Heart"
  | "Diamond" | "Oblong" | "Triangle";

export type BrowShape =
  | "Straight" | "Soft arch" | "High arch" | "Rounded" | "Flat";

export type SkinTexture = "Smooth" | "Combination" | "Textured";

export interface FacialFeatures {
  eyeShape: EyeShape;
  noseType: NoseType;
  lipShape: LipShape;
  faceShape: FaceShape;
  browShape: BrowShape;
  refinedUndertone: RefinedUndertone;
  skinTexture: SkinTexture;
  /** One- to two-sentence respectful appreciation. No "fix" or "exotic" language. */
  notes: string;
}

export type ColourResult = {
  season: string;
  seasonFamily: SeasonFamily;
  undertone: Undertone;
  monkToneBand?: string;
  palette: ColourSwatch[];
  avoid: ColourSwatch[];
  /** Reserved for the future Fabric module; not populated by colour analysis. */
  fabricNote?: string;
  styleNote: string;
  confidence: number;
  /** Present when result was aggregated from multiple photos. */
  aggregation?: {
    inputCount: number;
    agreement: number; // 0-1
  };
  /** Facial-feature analysis (eye/nose/lip/face/brow shapes, refined undertone, skin texture). */
  features?: FacialFeatures;
};
