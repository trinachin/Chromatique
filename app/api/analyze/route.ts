import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ANALYSIS_PROMPT } from "@/lib/analysis-prompt";
import type { ColourResult, FacialFeatures } from "@/lib/types";
import { getSeasonProfile, isSeasonName } from "@/lib/seasons";

const EYE_SHAPES = ["Almond","Round","Monolid","Hooded monolid","Parallel double-lid","Outer double-lid","Hooded","Downturned","Upturned","Deep-set"] as const;
const NOSE_TYPES = ["Button","Straight","Aquiline","Snub","Low-bridge","Wide","Long","Short"] as const;
const LIP_SHAPES = ["Full","Thin","Heart-shaped","Bow-shaped","Downturned","Wide","Round","Top-heavy","Bottom-heavy"] as const;
const FACE_SHAPES = ["Oval","Round","Square","Heart","Diamond","Oblong","Triangle"] as const;
const BROW_SHAPES = ["Straight","Soft arch","High arch","Rounded","Flat"] as const;
const UNDERTONES_4 = ["warm","cool","neutral","olive"] as const;
const SKIN_TEXTURES = ["Smooth","Combination","Textured"] as const;

function validateFeatures(raw: unknown): FacialFeatures | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const inAny = <T extends readonly string[]>(list: T, v: unknown): v is T[number] =>
    typeof v === "string" && (list as readonly string[]).includes(v);

  if (
    inAny(EYE_SHAPES, r.eyeShape) &&
    inAny(NOSE_TYPES, r.noseType) &&
    inAny(LIP_SHAPES, r.lipShape) &&
    inAny(FACE_SHAPES, r.faceShape) &&
    inAny(BROW_SHAPES, r.browShape) &&
    inAny(UNDERTONES_4, r.refinedUndertone) &&
    inAny(SKIN_TEXTURES, r.skinTexture)
  ) {
    return {
      eyeShape: r.eyeShape,
      noseType: r.noseType,
      lipShape: r.lipShape,
      faceShape: r.faceShape,
      browShape: r.browShape,
      refinedUndertone: r.refinedUndertone,
      skinTexture: r.skinTexture,
      notes: typeof r.notes === "string" ? r.notes : "",
    };
  }
  return undefined;
}

// Claude vision on a real photo typically takes 8-20s. Default Vercel function
// timeout is 10s on Hobby, extend so analysis doesn't get cut off mid-call.
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ClaudeClassification {
  season: string;
  seasonFamily: "Spring" | "Summer" | "Autumn" | "Winter";
  undertone: "warm" | "cool" | "neutral";
  monkToneBand?: string;
  fabricNote?: string;
  styleNote?: string;
  confidence: number;
}

function validateClassification(raw: unknown): ClaudeClassification | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const season = typeof r.season === "string" ? r.season : null;
  const seasonFamily = ["Spring", "Summer", "Autumn", "Winter"].includes(r.seasonFamily as string)
    ? (r.seasonFamily as ClaudeClassification["seasonFamily"])
    : null;
  const undertone = ["warm", "cool", "neutral"].includes(r.undertone as string)
    ? (r.undertone as ClaudeClassification["undertone"])
    : null;
  const confidence = typeof r.confidence === "number" ? Math.min(1, Math.max(0, r.confidence)) : null;

  if (!season || !seasonFamily || !undertone || confidence === null) return null;
  if (!isSeasonName(season)) return null; // must be one of the 16 canonical names

  return {
    season,
    seasonFamily,
    undertone,
    confidence,
    monkToneBand: typeof r.monkToneBand === "string" ? r.monkToneBand : "",
    fabricNote: typeof r.fabricNote === "string" ? r.fabricNote : "",
    styleNote: typeof r.styleNote === "string" ? r.styleNote : "",
  };
}

async function callClaude(imageBase64: string, mediaType: string): Promise<unknown> {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1500,  // bumped from 1024 to fit features object
    // Note: temperature is deprecated/rejected for opus-4-7. Determinism comes
    // from the structured step-by-step rubric in ANALYSIS_PROMPT itself.
    // identical photos route through identical reasoning steps.
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
              data: imageBase64,
            },
          },
          { type: "text", text: ANALYSIS_PROMPT },
        ],
      },
    ],
  });

  // Find the first text block (in case future thinking blocks come first)
  const textBlock = msg.content.find((b) => b.type === "text");
  const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Claude response");
  return JSON.parse(jsonMatch[0]);
}

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    // Try once, retry once on parse/validation failure
    let classification: ClaudeClassification | null = null;
    let rawResponse: unknown = null;
    for (let attempt = 0; attempt < 2 && !classification; attempt++) {
      try {
        rawResponse = await callClaude(imageBase64, mediaType);
        classification = validateClassification(rawResponse);
      } catch (err) {
        if (attempt === 1) throw err;
      }
    }

    if (!classification) {
      return NextResponse.json(
        { error: "Could not parse analysis result. Please try a different photo." },
        { status: 502 }
      );
    }

    // Merge canonical palette + avoid from the seasons table.
    // Claude only classifies; the palette is fixed per season.
    const profile = getSeasonProfile(classification.season);
    if (!profile) {
      return NextResponse.json(
        { error: "Unknown season returned by classifier" },
        { status: 502 }
      );
    }

    // Optional facial-feature analysis (best-effort: present if Claude returned
    // a valid features object, absent otherwise — UI degrades gracefully).
    const featuresRaw = (rawResponse as { features?: unknown } | null)?.features;
    const features = validateFeatures(featuresRaw);

    const result: ColourResult = {
      season: classification.season,
      seasonFamily: classification.seasonFamily,
      undertone: classification.undertone,
      monkToneBand: classification.monkToneBand,
      palette: profile.palette,
      avoid: profile.avoid,
      fabricNote: classification.fabricNote ?? "",
      styleNote: classification.styleNote ?? "",
      confidence: classification.confidence,
      ...(features ? { features } : {}),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
