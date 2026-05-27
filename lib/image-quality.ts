// Lightweight client-side image quality checker. Pure canvas math, no ML
// dependencies. Runs on a downsampled copy of the image (~256px) so it's fast
// even on phones.
//
// Returns severity = "block" | "warn" | "ok" plus a human-readable message list.
//   block → disable analyse button, surface fix-it instructions
//   warn  → allow analyse, show advisory chip ("Use anyway" implicit)
//   ok    → proceed normally
//
// We deliberately avoid bundled ML face detection — instead we use a cheap
// skin-tone heuristic that asks: "is there a concentration of warm mid-tones
// in the central/upper region of the photo?" This catches the common bad
// inputs (landscape, very small face, full-body) without false-rejecting
// legitimate selfies across all skin tones.

export type QualitySeverity = "ok" | "warn" | "block";

export interface QualityIssue {
  severity: "warn" | "block";
  message: string;
}

export interface QualityReport {
  severity: QualitySeverity;
  issues: QualityIssue[];
  // Raw measurements (useful for debugging / future tuning)
  metrics: {
    avgLuminance: number;          // 0-255
    centerLuminance: number;       // 0-255, weighted to image center
    colourCast: "warm" | "cool" | "magenta" | "green" | "neutral";
    castStrength: number;          // 0-1
    skinPixelRatio: number;        // 0-1, fraction of pixels that look like skin
    skinInCentralRegion: number;   // 0-1, fraction of skin pixels in central region
  };
}

const SAMPLE_EDGE = 256;

export async function analyzeImageQuality(dataUrl: string): Promise<QualityReport> {
  const img = await loadImage(dataUrl);

  // Downsample to SAMPLE_EDGE on longest side for fast pixel scanning
  const scale = SAMPLE_EDGE / Math.max(img.naturalWidth, img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { severity: "ok", issues: [], metrics: defaultMetrics() };
  }
  ctx.drawImage(img, 0, 0, w, h);

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, w, h).data;
  } catch {
    // Cross-origin or other tainted-canvas error — skip checks
    return { severity: "ok", issues: [], metrics: defaultMetrics() };
  }

  // ── Pass 1: luminance + colour cast on the brightest pixels ──────────────
  let totalLum = 0;
  let centerLumSum = 0;
  let centerLumWeight = 0;
  // Top 20% brightness pixels used to estimate white-point (colour cast)
  let highlightRsum = 0;
  let highlightGsum = 0;
  let highlightBsum = 0;
  let highlightCount = 0;
  const highlightThreshold = 180;

  // Skin-tone counters
  let skinPixels = 0;
  let skinInCenter = 0;
  let totalPixels = 0;

  // Central rectangle: middle 60% horizontally, upper-middle 60% vertically
  const centerXMin = w * 0.2;
  const centerXMax = w * 0.8;
  const centerYMin = h * 0.1;
  const centerYMax = h * 0.7;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      totalLum += lum;
      totalPixels++;

      // Gaussian-ish weight toward image center for "where the face usually is"
      const dx = (x - w / 2) / (w / 2);
      const dy = (y - h * 0.4) / (h / 2); // bias slightly up
      const wCenter = Math.exp(-(dx * dx + dy * dy) * 2);
      centerLumSum += lum * wCenter;
      centerLumWeight += wCenter;

      if (lum > highlightThreshold) {
        highlightRsum += r;
        highlightGsum += g;
        highlightBsum += b;
        highlightCount++;
      }

      // Heuristic skin detection (works across tones — uses YCbCr-style bounds)
      // Convert to YCbCr
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      // Skin tone broad gate (Hsu et al., calibrated wide for inclusivity)
      const isSkin =
        Y > 30 && Y < 240 &&
        Cb > 77 && Cb < 135 &&
        Cr > 133 && Cr < 180;
      if (isSkin) {
        skinPixels++;
        if (x >= centerXMin && x <= centerXMax && y >= centerYMin && y <= centerYMax) {
          skinInCenter++;
        }
      }
    }
  }

  const avgLuminance = totalLum / totalPixels;
  const centerLuminance = centerLumSum / centerLumWeight;

  // Colour cast: compare highlight RGB ratios to perfect-grey (1:1:1)
  let colourCast: QualityReport["metrics"]["colourCast"] = "neutral";
  let castStrength = 0;
  if (highlightCount > 50) {
    const rAvg = highlightRsum / highlightCount;
    const gAvg = highlightGsum / highlightCount;
    const bAvg = highlightBsum / highlightCount;
    const norm = (rAvg + gAvg + bAvg) / 3 || 1;
    const rRatio = rAvg / norm;
    const gRatio = gAvg / norm;
    const bRatio = bAvg / norm;

    // Detect dominant cast
    const warm = (rRatio + gRatio * 0.5 - bRatio * 1.5) / 2; // yellow/orange
    const cool = (bRatio - (rRatio + gRatio) / 2);           // blue
    const magenta = (rRatio + bRatio) / 2 - gRatio;          // magenta/pink
    const green = gRatio - (rRatio + bRatio) / 2;            // green

    const strongest = Math.max(warm, cool, magenta, green);
    castStrength = Math.min(1, Math.max(0, strongest));
    if (castStrength > 0.08) {
      if (strongest === warm) colourCast = "warm";
      else if (strongest === cool) colourCast = "cool";
      else if (strongest === magenta) colourCast = "magenta";
      else colourCast = "green";
    }
  }

  const skinPixelRatio = skinPixels / totalPixels;
  const skinInCentralRegion = skinPixels > 0 ? skinInCenter / skinPixels : 0;

  // ── Decision tree ────────────────────────────────────────────────────────
  const issues: QualityIssue[] = [];

  // BLOCKING checks
  if (avgLuminance < 25) {
    issues.push({
      severity: "block",
      message: "This photo is too dark to analyse. Try natural daylight or move closer to a window.",
    });
  } else if (avgLuminance > 240) {
    issues.push({
      severity: "block",
      message: "This photo is over-exposed (washed out). Try moving out of direct sun or harsh light.",
    });
  }

  // Face presence heuristic (only block if both skin ratio AND central concentration fail)
  if (skinPixelRatio < 0.02) {
    issues.push({
      severity: "block",
      message: "We can't see a face in this photo. Please upload a clear selfie with your face centered.",
    });
  } else if (skinPixelRatio < 0.06 && skinInCentralRegion < 0.5) {
    issues.push({
      severity: "block",
      message: "Your face is too small or off-centre. Get closer and centre your face in the frame.",
    });
  }

  // WARNING checks (only fire if no blocking issue already)
  if (issues.length === 0) {
    if (avgLuminance < 70) {
      issues.push({
        severity: "warn",
        message: "Lighting is a bit dim — accuracy improves with natural daylight.",
      });
    } else if (avgLuminance > 220) {
      issues.push({
        severity: "warn",
        message: "Lighting is very bright — accuracy may be affected by glare.",
      });
    }

    if (castStrength > 0.18) {
      const castMsg: Record<typeof colourCast, string> = {
        warm: "Strong yellow cast detected (indoor light) — natural daylight gives more accurate results.",
        cool: "Strong blue cast detected — natural daylight gives more accurate results.",
        magenta: "Strong magenta cast detected (filter or fluorescent light) — try natural daylight without filters.",
        green: "Strong green cast detected (fluorescent light) — try natural daylight.",
        neutral: "",
      };
      const msg = castMsg[colourCast];
      if (msg) issues.push({ severity: "warn", message: msg });
    }

    if (skinPixelRatio < 0.10) {
      issues.push({
        severity: "warn",
        message: "Your face could be larger in the frame for a better read.",
      });
    }
  }

  // Final severity: block > warn > ok
  const severity: QualitySeverity = issues.some((i) => i.severity === "block")
    ? "block"
    : issues.length > 0
      ? "warn"
      : "ok";

  return {
    severity,
    issues,
    metrics: {
      avgLuminance,
      centerLuminance,
      colourCast,
      castStrength,
      skinPixelRatio,
      skinInCentralRegion,
    },
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function defaultMetrics(): QualityReport["metrics"] {
  return {
    avgLuminance: 128,
    centerLuminance: 128,
    colourCast: "neutral",
    castStrength: 0,
    skinPixelRatio: 0,
    skinInCentralRegion: 0,
  };
}
