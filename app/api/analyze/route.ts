import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ANALYSIS_PROMPT } from "@/lib/analysis-prompt";
import type { ColourResult } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function validateAndRepair(raw: unknown): ColourResult | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const season = typeof r.season === "string" ? r.season : null;
  const seasonFamily = ["Spring", "Summer", "Autumn", "Winter"].includes(r.seasonFamily as string)
    ? (r.seasonFamily as ColourResult["seasonFamily"])
    : null;
  const undertone = ["warm", "cool", "neutral"].includes(r.undertone as string)
    ? (r.undertone as ColourResult["undertone"])
    : null;
  const confidence = typeof r.confidence === "number" ? Math.min(1, Math.max(0, r.confidence)) : null;

  const isSwatchArray = (v: unknown): v is { name: string; hex: string }[] =>
    Array.isArray(v) &&
    v.every((s) => typeof s === "object" && s !== null && "name" in s && "hex" in s);

  const palette = isSwatchArray(r.palette) ? r.palette : null;
  const avoid = isSwatchArray(r.avoid) ? r.avoid : null;

  if (!season || !seasonFamily || !undertone || confidence === null || !palette || !avoid) return null;

  return {
    season,
    seasonFamily,
    undertone,
    monkToneBand: typeof r.monkToneBand === "string" ? r.monkToneBand : "",
    palette,
    avoid,
    fabricNote: typeof r.fabricNote === "string" ? r.fabricNote : "",
    styleNote: typeof r.styleNote === "string" ? r.styleNote : "",
    confidence,
  };
}

async function callClaude(imageBase64: string, mediaType: string): Promise<ColourResult> {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: imageBase64 },
          },
          { type: "text", text: ANALYSIS_PROMPT },
        ],
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");
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

    let raw: unknown;
    try {
      raw = await callClaude(imageBase64, mediaType);
    } catch {
      raw = await callClaude(imageBase64, mediaType);
    }

    const result = validateAndRepair(raw);
    if (!result) {
      return NextResponse.json({ error: "Could not parse analysis result" }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
