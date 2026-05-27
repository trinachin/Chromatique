import { NextResponse } from "next/server";

const PROVIDER = process.env.IMAGE_PROVIDER ?? "huggingface";

type GenerateResponse =
  | { dataUrl: string; provider: string }
  | { url: string; provider: string }
  | { error: string };

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
