// ─────────────────────────────────────────────────────────────────────────────
// Canonical 16-season system — Chromatique's single source of truth.
//
// Sources synthesised:
//   • House of Colour 16-tone system (houseofcolour.com)
//   • Sci\ART 12-season (Kathryn Kalisz)
//   • 12 Blueprints (Christine Scaman, 12blueprints.com)
//   • The Concept Wardrobe 16-season subdivision (the-concept-wardrobe.com)
//   • Truth is Beauty 16-tone reference (truth-is-beauty.com)
//
// Each season has a stable 12-colour palette and 5 avoid colours so that
// repeat analyses for the same season always render identically. Claude only
// classifies the season — the palette comes from this table.
// ─────────────────────────────────────────────────────────────────────────────

import type { ColourSwatch, SeasonFamily, Undertone } from "./types";

export const SEASON_NAMES = [
  // Spring family — warm, light, clear
  "Light Spring",
  "True Spring",
  "Bright Spring",
  "Warm Spring",
  // Summer family — cool, light, soft
  "Light Summer",
  "True Summer",
  "Soft Summer",
  "Cool Summer",
  // Autumn family — warm, deep, muted
  "Soft Autumn",
  "True Autumn",
  "Warm Autumn",
  "Deep Autumn",
  // Winter family — cool, deep, clear
  "Bright Winter",
  "True Winter",
  "Cool Winter",
  "Deep Winter",
] as const;

export type SeasonName = (typeof SEASON_NAMES)[number];

export interface SeasonProfile {
  name: SeasonName;
  family: SeasonFamily;
  undertone: Undertone;
  description: string;
  palette: ColourSwatch[];
  avoid: ColourSwatch[];
}

// ─── SPRING FAMILY ─────────────────────────────────────────────────────────

export const LIGHT_SPRING: SeasonProfile = {
  name: "Light Spring",
  family: "Spring",
  undertone: "warm",
  description: "Fresh and luminous. You're radiant in light, warm-toned pastels.",
  palette: [
    { name: "Ivory",          hex: "#F7EFE0" },
    { name: "Cream",          hex: "#F4E6CC" },
    { name: "Peach Sorbet",   hex: "#F8C6A4" },
    { name: "Apricot",        hex: "#F2A878" },
    { name: "Coral Pink",     hex: "#F5A29F" },
    { name: "Warm Buttercup", hex: "#F4D26B" },
    { name: "Soft Mint",      hex: "#BCE3C2" },
    { name: "Aqua",           hex: "#82CFD0" },
    { name: "Sky Blue",       hex: "#A8C7E4" },
    { name: "Light Camel",    hex: "#D1B493" },
    { name: "Warm Taupe",     hex: "#B5A28C" },
    { name: "Light Rose",     hex: "#E6B3B0" },
  ],
  avoid: [
    { name: "Black",          hex: "#000000" },
    { name: "Burgundy",       hex: "#5C1A1A" },
    { name: "Charcoal",       hex: "#2E2E2E" },
    { name: "Cool Magenta",   hex: "#A8326B" },
    { name: "Pure White",     hex: "#FFFFFF" },
  ],
};

export const TRUE_SPRING: SeasonProfile = {
  name: "True Spring",
  family: "Spring",
  undertone: "warm",
  description: "Warm and delicate. You shine in soft, golden-toned colours.",
  palette: [
    { name: "Warm Ivory",     hex: "#F4E5C7" },
    { name: "Camel",          hex: "#C5946A" },
    { name: "Peach",          hex: "#F2A878" },
    { name: "Coral",          hex: "#F08068" },
    { name: "Warm Red",       hex: "#D14D3A" },
    { name: "Golden Yellow",  hex: "#F0C24F" },
    { name: "Warm Green",     hex: "#83A95C" },
    { name: "Turquoise",      hex: "#3CB4A3" },
    { name: "Periwinkle",     hex: "#8AA1D8" },
    { name: "Warm Pink",      hex: "#EE9098" },
    { name: "Light Navy",     hex: "#3F5380" },
    { name: "Chocolate",      hex: "#6B4423" },
  ],
  avoid: [
    { name: "Pure Black",     hex: "#000000" },   // too stark, dark
    { name: "Icy Pink",       hex: "#F4C7D2" },   // cool pastel
    { name: "Burgundy",       hex: "#5C1A1A" },   // cool dark red
    { name: "Slate Blue",     hex: "#5C6772" },   // cool muted blue
    { name: "Cool Grey",      hex: "#8C9097" },   // cool neutral
  ],
};

export const BRIGHT_SPRING: SeasonProfile = {
  name: "Bright Spring",
  family: "Spring",
  undertone: "warm",
  description: "Vivid, warm, and high-contrast. You glow in clear, saturated hues.",
  palette: [
    { name: "Ivory",          hex: "#F7EFDF" },
    { name: "Soft Black",     hex: "#202020" },
    { name: "Bright Coral",   hex: "#F25C4F" },
    { name: "Tomato Red",     hex: "#D9342B" },
    { name: "Hot Pink",       hex: "#E84A8E" },
    { name: "Lemon Yellow",   hex: "#F2D03C" },
    { name: "Bright Green",   hex: "#3FAE5B" },
    { name: "Emerald",        hex: "#1F8C5F" },
    { name: "Bright Aqua",    hex: "#1FB4C0" },
    { name: "Cobalt",         hex: "#214AC7" },
    { name: "Violet",         hex: "#6A4FB8" },
    { name: "Cool Camel",     hex: "#A78060" },
  ],
  avoid: [
    { name: "Dusty Rose",     hex: "#C99CA5" },
    { name: "Muted Olive",    hex: "#7E7A5E" },
    { name: "Pure Beige",     hex: "#E6CFA8" },
    { name: "Mauve",          hex: "#9B7B8E" },
    { name: "Soft Grey",      hex: "#B6B6B6" },
  ],
};

export const WARM_SPRING: SeasonProfile = {
  name: "Warm Spring",
  family: "Spring",
  undertone: "warm",
  description: "Golden and rich. You shine in warm, sunlit tones with a hint of depth.",
  palette: [
    { name: "Warm Cream",     hex: "#F1E0BB" },
    { name: "Honey",          hex: "#D6A155" },
    { name: "Apricot",        hex: "#EB9A6B" },
    { name: "Salmon",         hex: "#EE8170" },
    { name: "Tomato",         hex: "#D6502F" },
    { name: "Mustard",        hex: "#C09A2B" },
    { name: "Olive Green",    hex: "#7A8B3E" },
    { name: "Teal",           hex: "#2E8A82" },
    { name: "Warm Turquoise", hex: "#3FAFAE" },
    { name: "Pumpkin",        hex: "#D9762C" },
    { name: "Camel",          hex: "#B58D5A" },
    { name: "Cocoa",          hex: "#6E4B2A" },
  ],
  avoid: [
    { name: "Black",          hex: "#000000" },
    { name: "Icy Blue",       hex: "#C7DCEA" },
    { name: "Pure White",     hex: "#FFFFFF" },
    { name: "Fuchsia",        hex: "#C2257B" },
    { name: "Cool Grey",      hex: "#8C9097" },
  ],
};

// ─── SUMMER FAMILY ─────────────────────────────────────────────────────────

export const LIGHT_SUMMER: SeasonProfile = {
  name: "Light Summer",
  family: "Summer",
  undertone: "cool",
  description: "Soft and cool. You're lifted by muted, airy tones.",
  palette: [
    { name: "Soft White",     hex: "#F4EFE7" },
    { name: "Powder Blue",    hex: "#BBD4E2" },
    { name: "Sky Blue",       hex: "#A5C7E0" },
    { name: "Dusty Lavender", hex: "#C9B6D6" },
    { name: "Periwinkle",     hex: "#8FA6D9" },
    { name: "Soft Rose",      hex: "#E6A8B0" },
    { name: "Rose Pink",      hex: "#D88891" },
    { name: "Cool Mint",      hex: "#A8D5C1" },
    { name: "Pearl Grey",     hex: "#C8C5C0" },
    { name: "Soft Plum",      hex: "#8C6E83" },
    { name: "Cocoa",          hex: "#8B6B5D" },
    { name: "Berry Rose",     hex: "#B25D74" },
  ],
  avoid: [
    { name: "Black",          hex: "#000000" },
    { name: "Bright Orange",  hex: "#EE6F2D" },
    { name: "Mustard",        hex: "#C09A2B" },
    { name: "Tomato Red",     hex: "#D9342B" },
    { name: "Pure White",     hex: "#FFFFFF" },
  ],
};

export const TRUE_SUMMER: SeasonProfile = {
  name: "True Summer",
  family: "Summer",
  undertone: "cool",
  description: "Cool and elegant. Rosy, soft hues bring out your quiet radiance.",
  palette: [
    { name: "Soft White",     hex: "#F1ECE3" },
    { name: "Rose Pink",      hex: "#D78A98" },
    { name: "Berry",          hex: "#A04362" },
    { name: "Raspberry",      hex: "#B23656" },
    { name: "Cool Plum",      hex: "#704067" },
    { name: "Powder Blue",    hex: "#A6C5DA" },
    { name: "True Navy",      hex: "#2F3F66" },
    { name: "Spruce",         hex: "#39655B" },
    { name: "Sage Green",     hex: "#8FA98A" },
    { name: "Mauve",          hex: "#9C7892" },
    { name: "Soft Grey",      hex: "#A9A6A1" },
    { name: "Cool Taupe",     hex: "#9A8F84" },
  ],
  avoid: [
    { name: "Bright Orange",  hex: "#EE6F2D" },   // warm clear
    { name: "Mustard",        hex: "#C09A2B" },   // warm muted yellow
    { name: "Camel",          hex: "#C5946A" },   // warm neutral brown
    { name: "Olive Green",    hex: "#7A8B3E" },   // warm muted green
    { name: "Tomato Red",     hex: "#D9342B" },   // warm clear red
  ],
};

export const SOFT_SUMMER: SeasonProfile = {
  name: "Soft Summer",
  family: "Summer",
  undertone: "cool",
  description: "Muted and cool. You bloom in dusty, understated shades.",
  palette: [
    { name: "Cool Ivory",     hex: "#EEE8DC" },
    { name: "Dusty Pink",     hex: "#C99CA5" },
    { name: "Soft Berry",     hex: "#9D6377" },
    { name: "Dusty Rose",     hex: "#B98092" },
    { name: "Mauve",          hex: "#8B6B82" },
    { name: "Dusty Blue",     hex: "#8AAAB9" },
    { name: "Sage",           hex: "#8E9F84" },
    { name: "Cool Olive",     hex: "#7C7C5A" },
    { name: "Slate",          hex: "#5C6772" },
    { name: "Smoky Plum",     hex: "#634F62" },
    { name: "Soft Taupe",     hex: "#9C8C7F" },
    { name: "Charcoal",       hex: "#4B4B4F" },
  ],
  avoid: [
    { name: "Bright Coral",   hex: "#F25C4F" },
    { name: "Pure Black",     hex: "#000000" },
    { name: "Pure White",     hex: "#FFFFFF" },
    { name: "Lemon Yellow",   hex: "#F2D03C" },
    { name: "Hot Pink",       hex: "#E84A8E" },
  ],
};

export const COOL_SUMMER: SeasonProfile = {
  name: "Cool Summer",
  family: "Summer",
  undertone: "cool",
  description: "Crisp and cool. Clear, refreshing hues highlight your contrast.",
  palette: [
    { name: "Cool White",     hex: "#F2F1ED" },
    { name: "Light Grey",     hex: "#C7C8CB" },
    { name: "True Pink",      hex: "#D87A91" },
    { name: "Raspberry",      hex: "#B23A60" },
    { name: "Cool Red",       hex: "#B83346" },
    { name: "Plum",           hex: "#6B3E63" },
    { name: "Cool Blue",      hex: "#5783B5" },
    { name: "Navy",           hex: "#2A3C66" },
    { name: "Emerald",        hex: "#1F7A60" },
    { name: "Teal",           hex: "#34707E" },
    { name: "Pearl Grey",     hex: "#B5B2AD" },
    { name: "Charcoal",       hex: "#3E4046" },
  ],
  avoid: [
    { name: "Bright Orange",  hex: "#EE6F2D" },   // warm clear
    { name: "Mustard",        hex: "#C09A2B" },   // warm muted yellow
    { name: "Camel",          hex: "#C5946A" },   // warm neutral brown
    { name: "Olive Green",    hex: "#7A8B3E" },   // warm muted green
    { name: "Peach",          hex: "#F2A878" },   // warm pastel
  ],
};

// ─── AUTUMN FAMILY ─────────────────────────────────────────────────────────

export const SOFT_AUTUMN: SeasonProfile = {
  name: "Soft Autumn",
  family: "Autumn",
  undertone: "warm",
  description: "Warm and muted. Earthy, blended tones are made for you.",
  palette: [
    { name: "Warm Cream",     hex: "#EDDFC4" },
    { name: "Soft Camel",     hex: "#B8956C" },
    { name: "Salmon",         hex: "#D88373" },
    { name: "Terracotta",     hex: "#C26A4A" },
    { name: "Muted Coral",    hex: "#C97A6B" },
    { name: "Soft Gold",      hex: "#C7A45A" },
    { name: "Sage",           hex: "#8E9F7B" },
    { name: "Moss Green",     hex: "#6C7A4F" },
    { name: "Dusty Teal",     hex: "#5E8989" },
    { name: "Mauve Taupe",    hex: "#A28679" },
    { name: "Warm Brown",     hex: "#7B5640" },
    { name: "Plum",           hex: "#7B5167" },
  ],
  avoid: [
    { name: "Pure Black",     hex: "#000000" },
    { name: "Icy Blue",       hex: "#C7DCEA" },
    { name: "Hot Pink",       hex: "#E84A8E" },
    { name: "Cobalt",         hex: "#214AC7" },
    { name: "Pure White",     hex: "#FFFFFF" },
  ],
};

export const TRUE_AUTUMN: SeasonProfile = {
  name: "True Autumn",
  family: "Autumn",
  undertone: "warm",
  description: "Rich and warm. Deep, golden and russet tones make you glow.",
  palette: [
    { name: "Cream",          hex: "#EFDFB8" },
    { name: "Camel",          hex: "#B58853" },
    { name: "Pumpkin",        hex: "#CC6A2A" },
    { name: "Rust",           hex: "#B14A28" },
    { name: "Brick Red",      hex: "#9C3B2A" },
    { name: "Mustard",        hex: "#C29A2C" },
    { name: "Olive",          hex: "#7E7A2F" },
    { name: "Forest Green",   hex: "#3B5E3A" },
    { name: "Teal",           hex: "#2E7E78" },
    { name: "Chocolate",      hex: "#5C3A24" },
    { name: "Warm Bronze",    hex: "#8C6438" },
    { name: "Deep Aubergine", hex: "#4B2E32" },
  ],
  avoid: [
    { name: "Pure Black",     hex: "#000000" },
    { name: "Icy Pink",       hex: "#F4C7D2" },
    { name: "Pure White",     hex: "#FFFFFF" },
    { name: "Fuchsia",        hex: "#C2257B" },
    { name: "Pastel Blue",    hex: "#BBD4E2" },
  ],
};

export const WARM_AUTUMN: SeasonProfile = {
  name: "Warm Autumn",
  family: "Autumn",
  undertone: "warm",
  description: "Golden and earthy. Spice-toned warmth radiates from your colouring.",
  palette: [
    { name: "Warm Ivory",     hex: "#F1E1B8" },
    { name: "Honey",          hex: "#D6A146" },
    { name: "Burnt Orange",   hex: "#C45A29" },
    { name: "Rust",           hex: "#A6471F" },
    { name: "Burgundy",       hex: "#7A2A2A" },
    { name: "Mustard",        hex: "#B98E20" },
    { name: "Olive Green",    hex: "#7A8A37" },
    { name: "Moss",           hex: "#5D6B30" },
    { name: "Forest Teal",    hex: "#2E5F58" },
    { name: "Chocolate",      hex: "#4F3322" },
    { name: "Cinnamon",       hex: "#9B5B2A" },
    { name: "Bronze",         hex: "#8E5A2C" },
  ],
  avoid: [
    { name: "Pure White",     hex: "#FFFFFF" },   // too stark
    { name: "Fuchsia",        hex: "#C2257B" },   // cool clear pink
    { name: "Cobalt",         hex: "#214AC7" },   // cool clear blue
    { name: "Lavender",       hex: "#B8A0D8" },   // cool pastel purple
    { name: "Pure Black",     hex: "#000000" },   // too stark dark
  ],
};

export const DEEP_AUTUMN: SeasonProfile = {
  name: "Deep Autumn",
  family: "Autumn",
  undertone: "warm",
  description: "Dark and warm. You command attention in bold, earthy richness.",
  palette: [
    { name: "Off-White",      hex: "#EAE0C8" },
    { name: "Toffee",         hex: "#9C6D3E" },
    { name: "Deep Rust",      hex: "#8E3520" },
    { name: "Tomato",         hex: "#B8412B" },
    { name: "Mahogany",       hex: "#5E2F23" },
    { name: "Burnt Gold",     hex: "#A57825" },
    { name: "Forest Green",   hex: "#2F4A2E" },
    { name: "Deep Teal",      hex: "#1F4B49" },
    { name: "Dark Chocolate", hex: "#3A241A" },
    { name: "Aubergine",      hex: "#3D2230" },
    { name: "Bronze",         hex: "#8E5A2C" },
    { name: "Charcoal Brown", hex: "#2E2620" },
  ],
  avoid: [
    { name: "Pastel Pink",    hex: "#F2C8D2" },   // cool pastel
    { name: "Icy Blue",       hex: "#C7DCEA" },   // cool pastel blue
    { name: "Lemon Yellow",   hex: "#F2D03C" },   // bright pale yellow
    { name: "Pure White",     hex: "#FFFFFF" },   // too stark
    { name: "Hot Pink",       hex: "#E84A8E" },   // cool clear pink (different value)
  ],
};

// ─── WINTER FAMILY ─────────────────────────────────────────────────────────

export const BRIGHT_WINTER: SeasonProfile = {
  name: "Bright Winter",
  family: "Winter",
  undertone: "cool",
  description: "Clear and cool. You come alive in crisp, brilliant contrasts.",
  palette: [
    { name: "Pure White",     hex: "#FFFFFF" },
    { name: "Pure Black",     hex: "#0A0A0A" },
    { name: "True Red",       hex: "#D32330" },
    { name: "Hot Pink",       hex: "#E13A8E" },
    { name: "Fuchsia",        hex: "#C2257B" },
    { name: "Royal Purple",   hex: "#5A2A8C" },
    { name: "Cobalt",         hex: "#1F46C0" },
    { name: "Ice Blue",       hex: "#BFE3F0" },
    { name: "Emerald",        hex: "#0F8A5A" },
    { name: "Lemon",          hex: "#F1E13A" },
    { name: "Magenta",        hex: "#A4276E" },
    { name: "Charcoal",       hex: "#2A2C30" },
  ],
  avoid: [
    { name: "Mustard",        hex: "#C09A2B" },   // muted warm yellow
    { name: "Dusty Rose",     hex: "#C99CA5" },   // muted cool pink (chroma issue)
    { name: "Camel",          hex: "#C5946A" },   // warm neutral brown
    { name: "Sage Green",     hex: "#A0AE92" },   // muted cool-green
    { name: "Peach",          hex: "#F2A878" },   // warm pastel
  ],
};

export const TRUE_WINTER: SeasonProfile = {
  name: "True Winter",
  family: "Winter",
  undertone: "cool",
  description: "Cool and high-contrast. Pure, icy, and vivid colours electrify you.",
  palette: [
    { name: "Pure White",     hex: "#FFFFFF" },
    { name: "Pure Black",     hex: "#000000" },
    { name: "True Red",       hex: "#C8202F" },
    { name: "Crimson",        hex: "#9C1B33" },
    { name: "Icy Pink",       hex: "#F2C7D2" },
    { name: "Magenta",        hex: "#A8266A" },
    { name: "Royal Blue",     hex: "#1F39A6" },
    { name: "Icy Blue",       hex: "#C7DCEA" },
    { name: "Emerald",        hex: "#0F7E54" },
    { name: "Pine Green",     hex: "#21513C" },
    { name: "Charcoal",       hex: "#1F2024" },
    { name: "Silver Grey",    hex: "#B7BABE" },
  ],
  avoid: [
    { name: "Bright Orange",  hex: "#EE6F2D" },   // warm clear
    { name: "Mustard",        hex: "#C09A2B" },   // warm muted yellow
    { name: "Camel",          hex: "#C5946A" },   // warm neutral brown
    { name: "Olive Green",    hex: "#7A8B3E" },   // warm muted green
    { name: "Pastel Peach",   hex: "#F8C6A4" },   // warm pastel
  ],
};

export const COOL_WINTER: SeasonProfile = {
  name: "Cool Winter",
  family: "Winter",
  undertone: "cool",
  description: "Crisp, cool, and refined. Jewel and ice tones flatter you most.",
  palette: [
    { name: "Pure White",     hex: "#FBFAF6" },
    { name: "Cool Black",     hex: "#16181B" },
    { name: "Crimson",        hex: "#9C1B33" },
    { name: "Cool Berry",     hex: "#902A55" },
    { name: "Icy Pink",       hex: "#F2C7D2" },
    { name: "Cool Pink",      hex: "#D26A88" },
    { name: "True Blue",      hex: "#1F47A3" },
    { name: "Icy Blue",       hex: "#CFE2EB" },
    { name: "Pine Green",     hex: "#214B36" },
    { name: "Aubergine",      hex: "#3D1F3C" },
    { name: "Silver Grey",    hex: "#B7BABE" },
    { name: "Slate",          hex: "#4F5662" },
  ],
  avoid: [
    { name: "Bright Orange",  hex: "#EE6F2D" },   // warm clear
    { name: "Mustard",        hex: "#C09A2B" },   // warm muted yellow
    { name: "Camel",          hex: "#C5946A" },   // warm neutral brown
    { name: "Olive Green",    hex: "#7A8B3E" },   // warm muted green
    { name: "Cream",          hex: "#F4E6CC" },   // warm pale neutral
  ],
};

export const DEEP_WINTER: SeasonProfile = {
  name: "Deep Winter",
  family: "Winter",
  undertone: "cool",
  description: "Dark and cool. Dramatic, bold jewel tones are your power palette.",
  palette: [
    { name: "Soft White",     hex: "#F4F1EA" },
    { name: "Pure Black",     hex: "#0A0A0A" },
    { name: "Deep Red",       hex: "#8C1B28" },
    { name: "Burgundy",       hex: "#5E1A29" },
    { name: "Hot Pink",       hex: "#C2257B" },
    { name: "Plum",           hex: "#5F2350" },
    { name: "Royal Purple",   hex: "#4A2280" },
    { name: "Navy",           hex: "#1B2A55" },
    { name: "Emerald",        hex: "#125C46" },
    { name: "Pine",           hex: "#1C3A2C" },
    { name: "Chocolate",      hex: "#33231A" },
    { name: "Charcoal",       hex: "#22232A" },
  ],
  avoid: [
    { name: "Pastel Peach",   hex: "#F8C6A4" },   // warm pastel (light + warm)
    { name: "Mustard",        hex: "#C09A2B" },   // muted warm yellow
    { name: "Camel",          hex: "#C5946A" },   // warm neutral brown
    { name: "Olive Green",    hex: "#7A8B3E" },   // muted warm green (different family)
    { name: "Dusty Rose",     hex: "#C99CA5" },   // muted cool pink (chroma issue)
  ],
};

// ─── REGISTRY ──────────────────────────────────────────────────────────────

export const SEASONS: Record<SeasonName, SeasonProfile> = {
  "Light Spring":  LIGHT_SPRING,
  "True Spring":   TRUE_SPRING,
  "Bright Spring": BRIGHT_SPRING,
  "Warm Spring":   WARM_SPRING,
  "Light Summer":  LIGHT_SUMMER,
  "True Summer":   TRUE_SUMMER,
  "Soft Summer":   SOFT_SUMMER,
  "Cool Summer":   COOL_SUMMER,
  "Soft Autumn":   SOFT_AUTUMN,
  "True Autumn":   TRUE_AUTUMN,
  "Warm Autumn":   WARM_AUTUMN,
  "Deep Autumn":   DEEP_AUTUMN,
  "Bright Winter": BRIGHT_WINTER,
  "True Winter":   TRUE_WINTER,
  "Cool Winter":   COOL_WINTER,
  "Deep Winter":   DEEP_WINTER,
};

export function isSeasonName(value: string): value is SeasonName {
  return (SEASON_NAMES as readonly string[]).includes(value);
}

export function getSeasonProfile(name: string): SeasonProfile | null {
  return isSeasonName(name) ? SEASONS[name] : null;
}

// Family-level accent colours used in the result-page hero card.
export const SEASON_FAMILY_ACCENT: Record<SeasonFamily, string> = {
  Spring: "#D4A057",
  Summer: "#8BAABB",
  Autumn: "#C2683B",
  Winter: "#3D4565",
};
