// URL-encoded sharing for ColourResult. Aggressive minification keeps the
// /r/{encoded} URL under ~200 chars by:
//   1. Encoding enum fields as integer codes (e.g. eye shape "Monolid" → 2)
//   2. Dropping the Claude-generated text (styleNote, features.notes) from
//      the URL. On view, recipients see the canonical season description
//      from lib/seasons.ts instead of the personalised paragraph.
//   3. Using single-character field keys.
//
// Privacy: NO photo, NO PII. Just classification + feature category labels.

import type {
  ColourResult, ColourSwatch, EyeShape, NoseType, LipShape, FaceShape, BrowShape,
  RefinedUndertone, SkinTexture, SeasonFamily, Undertone,
} from "./types";
import { getSeasonProfile, SEASON_NAMES, type SeasonName } from "./seasons";

// ── enum code tables ────────────────────────────────────────────────────

// Season family + undertone are short (1 char already plausible)
const FAMILIES: SeasonFamily[] = ["Spring", "Summer", "Autumn", "Winter"];
const UNDERTONES: Undertone[] = ["warm", "cool", "neutral"];

const EYE_SHAPES: EyeShape[] = [
  "Almond","Round","Monolid","Hooded monolid","Parallel double-lid",
  "Outer double-lid","Hooded","Downturned","Upturned","Deep-set",
];
const NOSE_TYPES: NoseType[] = [
  "Button","Straight","Aquiline","Snub","Low-bridge","Wide","Long","Short",
];
const LIP_SHAPES: LipShape[] = [
  "Full","Thin","Heart-shaped","Bow-shaped","Downturned","Wide","Round",
  "Top-heavy","Bottom-heavy",
];
const FACE_SHAPES: FaceShape[] = [
  "Oval","Round","Square","Heart","Diamond","Oblong","Triangle",
];
const BROW_SHAPES: BrowShape[] = [
  "Straight","Soft arch","High arch","Rounded","Flat",
];
const REFINED_UNDERTONES: RefinedUndertone[] = ["warm","cool","neutral","olive"];
const SKIN_TEXTURES: SkinTexture[] = ["Smooth","Combination","Textured"];

function codeOf<T extends string>(list: T[], v: T): number {
  const i = list.indexOf(v);
  return i < 0 ? 0 : i;
}
function fromCode<T extends string>(list: T[], code: number): T {
  return list[code] ?? list[0];
}

// Season name is also coded by its index into SEASON_NAMES (0-15)
function seasonCode(name: string): number {
  const i = SEASON_NAMES.indexOf(name as SeasonName);
  return i < 0 ? 0 : i;
}
function seasonFromCode(code: number): SeasonName {
  return SEASON_NAMES[code] ?? SEASON_NAMES[0];
}

// ── compact wire format ─────────────────────────────────────────────────

/**
 * Wire format. Single-character keys. Integer codes for enums.
 *   s = season code (0-15)
 *   f = family code (0-3)
 *   u = undertone code (0-2)
 *   c = confidence × 100 rounded (0-100)
 *   x = features tuple [eye, nose, lip, face, brow, refUndertone, skin] codes
 *   a = aggregation [inputCount, agreement×100]
 */
interface Wire {
  s: number;
  f: number;
  u: number;
  c: number;
  x?: [number, number, number, number, number, number, number];
  a?: [number, number];
}

function toWire(r: ColourResult): Wire {
  const w: Wire = {
    s: seasonCode(r.season),
    f: codeOf(FAMILIES, r.seasonFamily),
    u: codeOf(UNDERTONES, r.undertone),
    c: Math.round(r.confidence * 100),
  };
  if (r.features) {
    w.x = [
      codeOf(EYE_SHAPES, r.features.eyeShape),
      codeOf(NOSE_TYPES, r.features.noseType),
      codeOf(LIP_SHAPES, r.features.lipShape),
      codeOf(FACE_SHAPES, r.features.faceShape),
      codeOf(BROW_SHAPES, r.features.browShape),
      codeOf(REFINED_UNDERTONES, r.features.refinedUndertone),
      codeOf(SKIN_TEXTURES, r.features.skinTexture),
    ];
  }
  if (r.aggregation) {
    w.a = [r.aggregation.inputCount, Math.round(r.aggregation.agreement * 100)];
  }
  return w;
}

function fromWire(w: Wire): ColourResult | null {
  const seasonName = seasonFromCode(w.s);
  const profile = getSeasonProfile(seasonName);
  if (!profile) return null;

  // styleNote: fall back to the canonical season description so recipients
  // get readable copy without us having to ship Claude's personalised text
  // in the URL.
  const styleNote = profile.description;

  const result: ColourResult = {
    season: seasonName,
    seasonFamily: FAMILIES[w.f] ?? "Spring",
    undertone: UNDERTONES[w.u] ?? "neutral",
    monkToneBand: "",
    palette: profile.palette as ColourSwatch[],
    avoid: profile.avoid as ColourSwatch[],
    styleNote,
    confidence: Math.max(0, Math.min(1, w.c / 100)),
  };
  if (w.x) {
    result.features = {
      eyeShape: fromCode(EYE_SHAPES, w.x[0]),
      noseType: fromCode(NOSE_TYPES, w.x[1]),
      lipShape: fromCode(LIP_SHAPES, w.x[2]),
      faceShape: fromCode(FACE_SHAPES, w.x[3]),
      browShape: fromCode(BROW_SHAPES, w.x[4]),
      refinedUndertone: fromCode(REFINED_UNDERTONES, w.x[5]),
      skinTexture: fromCode(SKIN_TEXTURES, w.x[6]),
      // No personalised notes on shared view; UI degrades gracefully when empty
      notes: "",
    };
  }
  if (w.a) {
    result.aggregation = {
      inputCount: w.a[0],
      agreement: Math.max(0, Math.min(1, w.a[1] / 100)),
    };
  }
  return result;
}

// ── base64url ───────────────────────────────────────────────────────────

function base64urlEncode(s: string): string {
  const utf8 = new TextEncoder().encode(s);
  let bin = "";
  utf8.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(s: string): string {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ── public ──────────────────────────────────────────────────────────────

export function encodeResult(result: ColourResult): string {
  const wire = toWire(result);
  const json = JSON.stringify(wire);
  return base64urlEncode(json);
}

export function decodeResult(encoded: string): ColourResult | null {
  try {
    const json = base64urlDecode(encoded);
    const wire = JSON.parse(json) as Wire;
    return fromWire(wire);
  } catch {
    return null;
  }
}
