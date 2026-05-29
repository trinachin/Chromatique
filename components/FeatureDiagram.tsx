"use client";

// Small SVG diagrams that visualize feature techniques.
// Kept abstract/illustrative — line drawings, not photos — so they read clean
// across all skin tones and don't need AI image generation.

import type { EyeShape, FaceShape } from "@/lib/types";

const STROKE = "#1F1B16";
const ACCENT = "#C2683B";
const SKIN = "#E7DCCB";

interface DiagramProps {
  className?: string;
}

// ─── Blush placement per face shape (ADD_RESEARCH §3f) ─────────────────────
// Backed by ChatGPT-generated editorial PNGs in /public/generated/features/.
// Falls back to the legacy SVG diagram if a face-shape's PNG is missing.

const BLUSH_IMAGES: Partial<Record<FaceShape, string>> = {
  "Oval":     "/generated/features/blush-oval.png",
  "Round":    "/generated/features/blush-round.png",
  "Square":   "/generated/features/blush-square.png",
  "Heart":    "/generated/features/blush-heart.png",
  "Diamond":  "/generated/features/blush-diamond.png",
  "Oblong":   "/generated/features/blush-oblong.png",
  "Triangle": "/generated/features/blush-triangle.png",
};

export function BlushDiagram({ faceShape, className }: { faceShape: FaceShape } & DiagramProps) {
  const src = BLUSH_IMAGES[faceShape];

  // Photo-based illustration (preferred)
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${faceShape} face shape with blush placement`}
        className={className}
      />
    );
  }

  // Fallback: legacy SVG diagram (used for Diamond until PNG is added)
  const placement = BLUSH_PATHS[faceShape] ?? BLUSH_PATHS.Oval;
  return (
    <svg viewBox="0 0 100 110" className={className} aria-hidden="true">
      <ellipse cx="50" cy="55" rx="32" ry="42" fill={SKIN} stroke={STROKE} strokeWidth="1" />
      <ellipse cx="38" cy="48" rx="3" ry="1.5" fill={STROKE} />
      <ellipse cx="62" cy="48" rx="3" ry="1.5" fill={STROKE} />
      <path d="M 42 78 Q 50 82 58 78" stroke={STROKE} strokeWidth="1" fill="none" />
      <path d={placement.left} stroke={ACCENT} strokeWidth="2" fill="none" strokeDasharray="2 1.5" strokeLinecap="round" />
      <path d={placement.right} stroke={ACCENT} strokeWidth="2" fill="none" strokeDasharray="2 1.5" strokeLinecap="round" />
    </svg>
  );
}

const BLUSH_PATHS: Record<FaceShape, { left: string; right: string }> = {
  // Apples + slight upward sweep
  "Oval":     { left: "M 32 60 Q 35 58 40 58",       right: "M 68 60 Q 65 58 60 58" },
  // High diagonal sweep toward temples
  "Round":    { left: "M 28 56 Q 24 50 22 44",       right: "M 72 56 Q 76 50 78 44" },
  // Apples blended outward
  "Square":   { left: "M 30 60 Q 36 60 42 60",       right: "M 70 60 Q 64 60 58 60" },
  // C-shape from cheek to brow tail
  "Heart":    { left: "M 32 60 Q 26 52 26 42",       right: "M 68 60 Q 74 52 74 42" },
  // Tops of cheekbones outward
  "Diamond":  { left: "M 30 54 Q 26 52 22 50",       right: "M 70 54 Q 74 52 78 50" },
  // Horizontal across apples
  "Oblong":   { left: "M 28 58 L 40 58",             right: "M 72 58 L 60 58" },
  // Apples + slight upward
  "Triangle": { left: "M 30 60 Q 30 56 34 54",       right: "M 70 60 Q 70 56 66 54" },
};

// ─── Eye + eyeliner per eye shape (ADD_RESEARCH §3a) ──────────────────────
// Now backed by editorial illustration PNGs generated via ChatGPT and saved
// to /public/generated/features/. Each eye shape maps to one PNG. Falls back
// to the legacy SVG render below if a PNG is missing.

const EYE_IMAGES: Partial<Record<EyeShape, string>> = {
  "Almond":              "/generated/features/eye-almond.png",
  "Round":               "/generated/features/eye-round.png",
  "Monolid":             "/generated/features/eye-monolid.png",
  "Hooded monolid":      "/generated/features/eye-hooded-monolid.png",
  "Parallel double-lid": "/generated/features/eye-parallel-double-lid.png",
  "Outer double-lid":    "/generated/features/eye-outer-double-lid.png",
  "Hooded":              "/generated/features/eye-hooded.png",
  "Downturned":          "/generated/features/eye-downturned.png",
  "Upturned":            "/generated/features/eye-upturned.png",
  "Deep-set":            "/generated/features/eye-deep-set.png",
};

export function EyelinerDiagram({ eyeShape, className }: { eyeShape: EyeShape } & DiagramProps) {
  const src = EYE_IMAGES[eyeShape];

  // Photo-based illustration (preferred)
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${eyeShape} eye shape with eyeliner technique`}
        className={className}
      />
    );
  }

  // Fallback: legacy SVG line drawing if an image is missing for this shape
  const lines = EYE_PATHS[eyeShape] ?? EYE_PATHS.Almond;
  return (
    <svg viewBox="0 0 100 50" className={className} aria-hidden="true">
      <path d={lines.brow} stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d={lines.eyeOutline} stroke={STROKE} strokeWidth="1" fill="white" />
      <circle cx={lines.irisX} cy={lines.irisY} r={lines.irisR} fill={STROKE} />
      <path d={lines.liner} stroke={ACCENT} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const EYE_PATHS: Record<EyeShape, {
  brow: string;
  eyeOutline: string;
  irisX: number; irisY: number; irisR: number;
  liner: string;
}> = {
  "Almond": {
    brow: "M 18 14 Q 50 8 82 14",
    eyeOutline: "M 20 28 Q 50 18 80 28 Q 50 36 20 28 Z",
    irisX: 50, irisY: 27, irisR: 4,
    liner: "M 22 26 Q 50 19 78 24 L 88 18",
  },
  "Round": {
    brow: "M 18 14 Q 50 8 82 14",
    eyeOutline: "M 22 28 Q 50 16 78 28 Q 50 40 22 28 Z",
    irisX: 50, irisY: 28, irisR: 5,
    liner: "M 25 26 Q 50 19 75 26 L 90 25",
  },
  "Monolid": {
    brow: "M 18 12 Q 50 8 82 12",
    eyeOutline: "M 20 28 Q 50 22 80 28 Q 50 34 20 28 Z",
    irisX: 50, irisY: 28, irisR: 4,
    liner: "M 22 27 L 78 27",
  },
  "Hooded monolid": {
    brow: "M 18 12 Q 50 9 82 12",
    eyeOutline: "M 22 28 Q 50 23 78 28 Q 50 34 22 28 Z",
    irisX: 50, irisY: 28, irisR: 4,
    liner: "M 24 27 L 76 27 L 82 22",
  },
  "Parallel double-lid": {
    brow: "M 18 13 Q 50 8 82 13",
    eyeOutline: "M 20 28 Q 50 20 80 28 Q 50 35 20 28 Z",
    irisX: 50, irisY: 27, irisR: 4,
    liner: "M 22 26 Q 50 20 78 25 L 86 21",
  },
  "Outer double-lid": {
    brow: "M 18 13 Q 50 8 82 13",
    eyeOutline: "M 20 28 Q 50 21 80 28 Q 50 35 20 28 Z",
    irisX: 50, irisY: 27, irisR: 4,
    liner: "M 45 25 Q 65 22 78 25 L 88 20",
  },
  "Hooded": {
    brow: "M 18 10 Q 50 6 82 10",
    eyeOutline: "M 22 28 Q 50 22 78 28 Q 50 34 22 28 Z",
    irisX: 50, irisY: 28, irisR: 4,
    liner: "M 22 24 Q 50 18 78 22 L 86 18",
  },
  "Downturned": {
    brow: "M 18 14 Q 50 8 82 14",
    eyeOutline: "M 20 26 Q 50 18 78 28 Q 50 36 22 30 Z",
    irisX: 49, irisY: 27, irisR: 4,
    liner: "M 22 24 Q 50 18 72 23 L 78 16",
  },
  "Upturned": {
    brow: "M 18 14 Q 50 8 82 14",
    eyeOutline: "M 22 30 Q 50 18 78 24 Q 50 34 22 30 Z",
    irisX: 50, irisY: 26, irisR: 4,
    liner: "M 22 28 Q 50 17 78 22",
  },
  "Deep-set": {
    brow: "M 18 12 Q 50 7 82 12",
    eyeOutline: "M 22 30 Q 50 22 78 30 Q 50 36 22 30 Z",
    irisX: 50, irisY: 29, irisR: 3.5,
    liner: "M 24 28 Q 50 22 76 28",
  },
};
