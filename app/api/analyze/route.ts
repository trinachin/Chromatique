import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ANALYSIS_PROMPT } from "@/lib/analysis-prompt";
import type { ColourResult } from "@/lib/types";
import { getSeasonProfile, isSeasonName } from "@/lib/seasons";

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
    max_tokens: 1024,
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

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
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
    for (let attempt = 0; attempt < 2 && !classification; attempt++) {
      try {
        const raw = await callClaude(imageBase64, mediaType);
        classification = validateClassification(raw);
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
      // Should be impossible because validateClassification rejects unknown names,
      // but guard belt-and-suspenders.
      return NextResponse.json(
        { error: "Unknown season returned by classifier" },
        { status: 502 }
      );
    }

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
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
