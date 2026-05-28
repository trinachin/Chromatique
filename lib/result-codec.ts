// URL-encoded sharing: pack the analysis-specific fields into a base64url
// string that lives in /r/{encoded}. The palette + avoid colours are looked
// up from seasons.ts at view-time, so we don't need to ship them in the URL.
//
// Why this approach: no backend storage, no signup, no credit card, no
// monthly limits. The URL is the database. Trade-off is a longer URL
// (~400-700 chars) but messaging apps handle that fine.
//
// Privacy: still no photo. We encode only the season name + classification
// + features + style note (text) + optional aggregation metadata.

import type {
  ColourResult, EyeShape, NoseType, LipShape, FaceShape, BrowShape,
  RefinedUndertone, SkinTexture,
} from "./types";
import { getSeasonProfile } from "./seasons";

/** Minimal payload that lives in the URL. Palette/avoid reconstructed at decode time. */
interface CompactResult {
  s: string;          // season name (key into seasons.ts)
  f: ColourResult["seasonFamily"];
  u: ColourResult["undertone"];
  m?: string;         // monkToneBand (optional)
  c: number;          // confidence (0..1, 2 decimals)
  n: string;          // styleNote
  // features (optional, compact letter keys)
  ft?: {
    e: string; // eyeShape
    no: string; // noseType
    l: string; // lipShape
    fa: string; // faceShape
    b: string; // browShape
    ru: string; // refinedUndertone
    sk: string; // skinTexture
    nt: string; // notes
  };
  // aggregation (optional)
  a?: { ic: number; ag: number };
}

function toCompact(r: ColourResult): CompactResult {
  const compact: CompactResult = {
    s: r.season,
    f: r.seasonFamily,
    u: r.undertone,
    c: Math.round(r.confidence * 100) / 100,
    n: r.styleNote,
  };
  if (r.monkToneBand) compact.m = r.monkToneBand;
  if (r.features) {
    compact.ft = {
      e:  r.features.eyeShape,
      no: r.features.noseType,
      l:  r.features.lipShape,
      fa: r.features.faceShape,
      b:  r.features.browShape,
      ru: r.features.refinedUndertone,
      sk: r.features.skinTexture,
      nt: r.features.notes,
    };
  }
  if (r.aggregation) {
    compact.a = {
      ic: r.aggregation.inputCount,
      ag: Math.round(r.aggregation.agreement * 100) / 100,
    };
  }
  return compact;
}

function fromCompact(c: CompactResult): ColourResult | null {
  const profile = getSeasonProfile(c.s);
  if (!profile) return null;

  const result: ColourResult = {
    season: c.s,
    seasonFamily: c.f,
    undertone: c.u,
    monkToneBand: c.m ?? "",
    palette: profile.palette,
    avoid: profile.avoid,
    styleNote: c.n,
    confidence: c.c,
  };
  if (c.ft) {
    result.features = {
      eyeShape: c.ft.e as EyeShape,
      noseType: c.ft.no as NoseType,
      lipShape: c.ft.l as LipShape,
      faceShape: c.ft.fa as FaceShape,
      browShape: c.ft.b as BrowShape,
      refinedUndertone: c.ft.ru as RefinedUndertone,
      skinTexture: c.ft.sk as SkinTexture,
      notes: c.ft.nt,
    };
  }
  if (c.a) {
    result.aggregation = { inputCount: c.a.ic, agreement: c.a.ag };
  }
  return result;
}

// ── base64url ────────────────────────────────────────────────────────────

function base64urlEncode(s: string): string {
  // Browser: btoa over a UTF-8 byte string
  const utf8 = new TextEncoder().encode(s);
  let bin = "";
  utf8.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(s: string): string {
  // Pad to multiple of 4
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ── public ───────────────────────────────────────────────────────────────

export function encodeResult(result: ColourResult): string {
  const compact = toCompact(result);
  const json = JSON.stringify(compact);
  return base64urlEncode(json);
}

export function decodeResult(encoded: string): ColourResult | null {
  try {
    const json = base64urlDecode(encoded);
    const compact = JSON.parse(json) as CompactResult;
    return fromCompact(compact);
  } catch {
    return null;
  }
}
