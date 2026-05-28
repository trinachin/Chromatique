import { NextResponse } from "next/server";

const PROVIDER = process.env.IMAGE_PROVIDER ?? "huggingface";

type GenerateResponse =
  | { dataUrl: string; provider: string }
  | { url: string; provider: string }
  | { error: string };

// ─── Gemini 2.5 Flash Image (Nano Banana) ─────────────────────────────────
// Uses Google's generativelanguage REST API. Image data comes back as base64
// inline within candidates[].content.parts[].inlineData.data.
// Optional `referenceImageBase64` locks style for follow-up icon generations.
async function genGemini(
  prompt: string,
  referenceImageBase64?: string,
  referenceMediaType: string = "image/png",
): Promise<GenerateResponse> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return { error: "GEMINI_API_KEY not configured" };
  }

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (referenceImageBase64) {
    parts.unshift({
      inlineData: { mimeType: referenceMediaType, data: referenceImageBase64 },
    });
  }

  const model = "gemini-2.5-flash-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: `Gemini: ${res.status} ${text.slice(0, 300)}` };
  }

  const data: {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
    }>;
    promptFeedback?: { blockReason?: string };
  } = await res.json();

  if (data.promptFeedback?.blockReason) {
    return { error: `Gemini blocked: ${data.promptFeedback.blockReason}` };
  }

  const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    return { error: "Gemini returned no image in response" };
  }

  const mimeType = imagePart.inlineData.mimeType ?? "image/png";
  return {
    dataUrl: `data:${mimeType};base64,${imagePart.inlineData.data}`,
    provider: "gemini",
  };
}

// ─── Fal.ai (FLUX Pro 1.1, others) ───────────────────────────────────────
// Uses Fal's synchronous queue API. Auth via `Authorization: Key <FAL_KEY>`.
// `image_url` parameter accepted as style reference for icon consistency.
async function genFal(
  prompt: string,
  options: { model?: string; aspect?: string; referenceUrl?: string } = {},
): Promise<GenerateResponse> {
  const key = process.env.FAL_KEY;
  if (!key) {
    return { error: "FAL_KEY not configured" };
  }
  const model = options.model ?? "fal-ai/flux-pro/v1.1";
  const aspect = options.aspect ?? "16_9";

  const body: Record<string, unknown> = {
    prompt,
    image_size: aspect,
    num_images: 1,
    enable_safety_checker: true,
    output_format: "png",
  };
  if (options.referenceUrl) {
    body.image_url = options.referenceUrl;
  }

  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: `Fal: ${res.status} ${text.slice(0, 300)}` };
  }

  const data: { images?: Array<{ url?: string }> } = await res.json();
  const url = data.images?.[0]?.url;
  if (!url) {
    return { error: "Fal returned no image URL" };
  }
  return { url, provider: "fal" };
}

async function genHuggingFace(prompt: string): Promise<GenerateResponse> {
  if (!process.env.HF_API_KEY) {
    return { error: "HF_API_KEY not configured" };
  }
  const res = await fetch(
    "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { num_inference_steps: 4, guidance_scale: 0 },
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    return { error: `Hugging Face: ${res.status} ${text.slice(0, 200)}` };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    dataUrl: `data:image/png;base64,${buf.toString("base64")}`,
    provider: "huggingface",
  };
}

async function genReplicate(prompt: string): Promise<GenerateResponse> {
  if (!process.env.REPLICATE_API_KEY) {
    return { error: "REPLICATE_API_KEY not configured" };
  }
  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      version: "black-forest-labs/flux-schnell",
      input: { prompt, num_outputs: 1, aspect_ratio: "1:1" },
    }),
  });
  if (!res.ok) {
    return { error: `Replicate: ${res.status}` };
  }
  const data = await res.json();
  const url = Array.isArray(data.output) ? data.output[0] : data.output;
  return { url, provider: "replicate" };
}

async function genAstraflow(prompt: string): Promise<GenerateResponse> {
  if (!process.env.ASTRAFLOW_API_KEY || !process.env.ASTRAFLOW_ENDPOINT) {
    return { error: "ASTRAFLOW_API_KEY / ASTRAFLOW_ENDPOINT not configured" };
  }
  const res = await fetch(process.env.ASTRAFLOW_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ASTRAFLOW_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    return { error: `Astraflow: ${res.status}` };
  }
  const data = await res.json();
  return { url: data.url ?? data.imageUrl, provider: "astraflow" };
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (typeof prompt !== "string" || prompt.length < 3) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    let result: GenerateResponse;
    switch (PROVIDER) {
      case "huggingface":
        result = await genHuggingFace(prompt);
        break;
      case "replicate":
        result = await genReplicate(prompt);
        break;
      case "astraflow":
        result = await genAstraflow(prompt);
        break;
      case "gemini":
        result = await genGemini(prompt);
        break;
      case "fal":
        result = await genFal(prompt);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown IMAGE_PROVIDER: ${PROVIDER}` },
          { status: 400 }
        );
    }

    if ("error" in result) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-visual]", err);
    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
