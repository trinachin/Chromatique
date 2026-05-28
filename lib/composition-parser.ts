// Composition Parser
//
// Takes a fibre composition string like:
//   "60% cotton, 35% polyester, 5% elastane"
//   "100% Linen, 180 GSM"
//   "78% Polyester / 18% Nylon / 4% Elastane"
//
// Returns a plain-English verdict with comfort, care, climate-fit lines plus
// any red flags the user should know about.
//
// Sourced from FABRIC_RESEARCH §2 (Smart vs Problematic blends), §6b
// (Plain-English label translations), §1d (synthetic-fibre microplastic +
// pilling numbers), §1f (weave/construction).
//
// Pure functions, no DOM access, easy to unit-test.

export type ClimateFitVerdict = "excellent" | "good" | "okay" | "risky" | "avoid";

export interface FibreShare {
  fibre: string;          // canonical name, e.g. "cotton", "polyester"
  pct: number;            // 0-100
  raw: string;            // original token from the input
}

export interface CompositionResult {
  fibres: FibreShare[];
  totalPct: number;       // useful sanity check (often != 100 in real labels)
  dominantFibre?: FibreShare;

  // Plain-English summary lines, ready to render
  comfort: string;
  care: string;
  climateFit: string;
  climateFitVerdict: ClimateFitVerdict;

  // Red-flag warnings, e.g. "100% acrylic knit", ">15% elastane outside activewear",
  // "Bamboo (likely chemical viscose)"
  redFlags: string[];
  /** True if there is a serious red flag (acrylic, fleece, mystery viscose) */
  isRedFlag: boolean;

  /** Bonuses the user should celebrate, e.g. "Smart 5% elastane stretch" */
  greenFlags: string[];

  /** Optional weight info parsed out, e.g. "180 GSM" */
  weightHint?: string;
}

// ─── Fibre name canonicaliser ─────────────────────────────────────────────

const FIBRE_ALIASES: { match: RegExp; canonical: string }[] = [
  { match: /\borganic cotton\b/i,                        canonical: "organic cotton" },
  { match: /\bpima\b|\bsupima\b/i,                       canonical: "pima cotton" },
  { match: /\begyptian cotton\b/i,                       canonical: "egyptian cotton" },
  { match: /\bcotton\b/i,                                canonical: "cotton" },
  { match: /\blinen\b|\bflax\b/i,                        canonical: "linen" },
  { match: /\bhemp\b/i,                                  canonical: "hemp" },
  { match: /\bramie\b/i,                                 canonical: "ramie" },
  { match: /\btencel\b|\blyocell\b/i,                    canonical: "tencel" },
  { match: /\bmodal\b/i,                                 canonical: "modal" },
  { match: /\becovero\b/i,                               canonical: "ecovero viscose" },
  { match: /\b(viscose|rayon)\b/i,                       canonical: "viscose" },
  { match: /\bbamboo\b/i,                                canonical: "bamboo" },
  { match: /\bsilk\b/i,                                  canonical: "silk" },
  { match: /\bmerino\b/i,                                canonical: "merino wool" },
  { match: /\bcashmere\b/i,                              canonical: "cashmere" },
  { match: /\balpaca\b/i,                                canonical: "alpaca" },
  { match: /\bmohair\b/i,                                canonical: "mohair" },
  { match: /\bwool\b/i,                                  canonical: "wool" },
  { match: /\b(elastane|spandex|lycra)\b/i,              canonical: "elastane" },
  { match: /\bpolyester\b|\bpet\b/i,                     canonical: "polyester" },
  { match: /\b(nylon|polyamide)\b/i,                     canonical: "nylon" },
  { match: /\bacrylic\b/i,                               canonical: "acrylic" },
  { match: /\b(polypropylene|olefin)\b/i,                canonical: "polypropylene" },
  { match: /\b(acetate)\b/i,                             canonical: "acetate" },
  { match: /\b(cupro)\b/i,                               canonical: "cupro" },
];

function canonicalFibre(token: string): string | null {
  for (const { match, canonical } of FIBRE_ALIASES) {
    if (match.test(token)) return canonical;
  }
  return null;
}

// ─── Parser ───────────────────────────────────────────────────────────────

const PCT_FIBRE_RE = /(\d{1,3})\s*%\s*([a-zA-Z][a-zA-Z\s\-]*?)(?=(?:,|\/|;|\d{1,3}\s*%|$))/g;
const WEIGHT_RE = /(\d{2,4})\s*(gsm|g\/m2|g\/m²|oz)/i;

export function parseComposition(input: string): CompositionResult {
  const cleaned = input.replace(/[–—]/g, "-").trim();

  const fibres: FibreShare[] = [];
  let m: RegExpExecArray | null;
  PCT_FIBRE_RE.lastIndex = 0;
  while ((m = PCT_FIBRE_RE.exec(cleaned)) !== null) {
    const pct = Math.min(100, Math.max(0, parseInt(m[1], 10)));
    const rawName = m[2].trim().replace(/\s+/g, " ");
    const canonical = canonicalFibre(rawName);
    if (canonical) {
      fibres.push({ fibre: canonical, pct, raw: rawName });
    }
  }

  const totalPct = fibres.reduce((s, f) => s + f.pct, 0);
  const dominantFibre = fibres.slice().sort((a, b) => b.pct - a.pct)[0];

  const weightMatch = WEIGHT_RE.exec(cleaned);
  const weightHint = weightMatch ? `${weightMatch[1]} ${weightMatch[2].toUpperCase()}` : undefined;

  const redFlags = detectRedFlags(fibres, cleaned);
  const greenFlags = detectGreenFlags(fibres);

  const { comfort, care, climateFit, climateFitVerdict } = composeVerdict(fibres, dominantFibre, redFlags);

  return {
    fibres,
    totalPct,
    dominantFibre,
    comfort,
    care,
    climateFit,
    climateFitVerdict,
    redFlags,
    isRedFlag: redFlags.length > 0 && redFlags.some((r) =>
      r.includes("acrylic") ||
      r.includes("fleece") ||
      r.includes("Bamboo (likely chemical viscose)") ||
      r.includes(">15% elastane")
    ),
    greenFlags,
    weightHint,
  };
}

// ─── Red-flag detection (per FABRIC_RESEARCH §2c) ────────────────────────

function detectRedFlags(fibres: FibreShare[], raw: string): string[] {
  const flags: string[] = [];
  const get = (canonical: string) => fibres.find((f) => f.fibre === canonical)?.pct ?? 0;

  const acrylic = get("acrylic");
  const wool = get("wool") + get("merino wool") + get("cashmere");
  const elastane = get("elastane");
  const polyester = get("polyester");
  const viscose = get("viscose");
  const bamboo = get("bamboo");
  const cotton = get("cotton") + get("organic cotton") + get("pima cotton") + get("egyptian cotton");
  const tencel = get("tencel");

  if (acrylic >= 90) {
    flags.push("Almost-pure acrylic knitwear pills within weeks and feels plasticky in heat.");
  } else if (acrylic >= 30 && wool > 0 && wool < acrylic) {
    flags.push("Acrylic-dominant wool blend (acrylic > wool) pills like pure acrylic without the warmth benefit.");
  }

  if (elastane > 15 && polyester < 50 && get("nylon") < 50) {
    flags.push(">15% elastane outside activewear bags out quickly with sweat, heat, and chlorine exposure.");
  }

  if (polyester > 0 && /fleece/i.test(raw)) {
    flags.push("Polyester fleece sheds ~7,360 microfibres per litre per wash (Carney Almroth et al. 2018).");
  }

  if (viscose > 0 && fibres.length === 1 && !/ecovero|tencel|modal/i.test(raw)) {
    flags.push("100% generic viscose loses 30-50% strength when wet. Look for EcoVero or Lenzing on the label.");
  }

  if (bamboo > 0 && !/lyocell|linen/i.test(raw)) {
    flags.push('Bamboo (likely chemical viscose). "100% bamboo" is almost always chemically processed viscose with the eco claim overstated.');
  }

  if (cotton > 0 && polyester >= 50 && cotton < polyester) {
    flags.push("Polyester-dominant cotton blend: polyester anchors broken cotton fibres as pills on shoulders, back, underarms.");
  }

  if (/egyptian cotton/i.test(raw) && !/gots|oeko|supima|certified/i.test(raw)) {
    flags.push('Unverified "Egyptian cotton" - a 2009 audit found ~89% of products mislabelled. Look for GOTS or Supima.');
  }

  if (viscose > 0 && polyester > 0 && elastane > 0 && polyester >= 50) {
    flags.push("Mystery poly+viscose+elastane tri-blend. Sub-$10 fast-fashion classic: viscose loses structure, polyester pills, elastane fails.");
  }

  return flags;
}

// ─── Green-flag detection (per FABRIC_RESEARCH §2b) ──────────────────────

function detectGreenFlags(fibres: FibreShare[]): string[] {
  const flags: string[] = [];
  const get = (canonical: string) => fibres.find((f) => f.fibre === canonical)?.pct ?? 0;

  const cotton = get("cotton") + get("organic cotton") + get("pima cotton");
  const elastane = get("elastane");
  const tencel = get("tencel");
  const linen = get("linen");
  const modal = get("modal");

  if (cotton >= 90 && elastane >= 2 && elastane <= 5) {
    flags.push("Smart 95/5 cotton-elastane: sweet spot for fitted tees, jeans, work pants.");
  }
  if (tencel > 0 && cotton > 0) {
    flags.push("TENCEL-cotton blend: cooler than pure cotton, longer-lasting than viscose.");
  }
  if (linen > 0 && cotton > 0) {
    flags.push("Linen-cotton: the sweet spot for SEA tropical shirts. Linen coolness, cotton structure.");
  }
  if (modal > 0 && cotton > 0) {
    flags.push("Modal-cotton: silky drape with cotton's familiarity.");
  }
  if (get("organic cotton") > 80) {
    flags.push("Organic cotton: free of formaldehyde easy-care finishes, gentler on sensitive skin.");
  }
  if (linen >= 95) {
    flags.push("100% linen: the coolest fabric you can wear. Wrinkles are part of the look.");
  }
  if (tencel >= 95) {
    flags.push("100% TENCEL Lyocell: closed-loop process, anti-pilling, moisture-wicking, anti-bacterial.");
  }

  return flags;
}

// ─── Plain-English verdict builder ───────────────────────────────────────

function composeVerdict(
  fibres: FibreShare[],
  dominant: FibreShare | undefined,
  redFlags: string[]
): { comfort: string; care: string; climateFit: string; climateFitVerdict: ClimateFitVerdict } {
  if (!dominant) {
    return {
      comfort: "We couldn't recognise the fibres in this composition.",
      care: "Try a string like '60% cotton, 35% polyester, 5% elastane'.",
      climateFit: "No verdict available.",
      climateFitVerdict: "okay",
    };
  }

  const has = (canonical: string) => fibres.some((f) => f.fibre === canonical && f.pct > 0);
  const pct = (canonical: string) => fibres.find((f) => f.fibre === canonical)?.pct ?? 0;

  // Comfort line — driven by dominant fibre and any softening agents
  const comfortParts: string[] = [];
  if (dominant.fibre === "cotton" || dominant.fibre === "organic cotton" || dominant.fibre === "pima cotton") {
    comfortParts.push("Soft cotton hand, familiar and breathable.");
  } else if (dominant.fibre === "linen") {
    comfortParts.push("Maximum breathability, the coolest fabric you can wear in tropical heat.");
  } else if (dominant.fibre === "tencel") {
    comfortParts.push("Silky-smooth, naturally cool against skin, anti-bacterial.");
  } else if (dominant.fibre === "modal") {
    comfortParts.push("Buttery-soft drape, twice as absorbent as cotton.");
  } else if (dominant.fibre === "silk") {
    comfortParts.push("Liquid drape, thermo-regulating, dermatologist-recommended for sensitive skin.");
  } else if (dominant.fibre === "merino wool") {
    comfortParts.push("Fine, not the itchy wool you remember. Naturally odour-resistant.");
  } else if (dominant.fibre === "wool") {
    comfortParts.push("Warm and structured, but coarse wool can itch sensitive skin.");
  } else if (dominant.fibre === "polyester") {
    comfortParts.push("Smooth but synthetic-warm. Traps body heat and odour over time.");
  } else if (dominant.fibre === "acrylic") {
    comfortParts.push("Fluffy on the rack but plastic. Pills heavily within weeks.");
  } else if (dominant.fibre === "viscose" || dominant.fibre === "ecovero viscose") {
    comfortParts.push("Fluid silk-like drape from plant cellulose.");
  } else if (dominant.fibre === "nylon") {
    comfortParts.push("Smooth and stretchy, engineered for movement.");
  } else if (dominant.fibre === "hemp") {
    comfortParts.push("Crisp initially, softens dramatically with washing. UPF 50+ sun protection.");
  } else {
    comfortParts.push(`Dominant fibre: ${dominant.fibre}.`);
  }
  if (pct("elastane") >= 2 && pct("elastane") <= 8) {
    comfortParts.push("Smart stretch from a low elastane percentage adds movement without bagging.");
  }
  const comfort = comfortParts.join(" ");

  // Care line
  const careParts: string[] = [];
  if (has("silk") || has("cashmere") || has("wool")) {
    careParts.push("Hand-wash cold or dry-clean. Avoid hot water and tumble drying.");
  } else if (dominant.fibre === "linen" || dominant.fibre === "hemp") {
    careParts.push("Machine wash cold, air-dry. Iron when slightly damp if you want crisp lines.");
  } else if (dominant.fibre === "viscose" || dominant.fibre === "ecovero viscose") {
    careParts.push("Cold wash, line-dry, no tumble. Weak when wet, handle gently.");
  } else if (dominant.fibre === "tencel" || dominant.fibre === "modal") {
    careParts.push("Easy machine wash, hangs back into shape. Resists pilling.");
  } else if (dominant.fibre === "polyester" || dominant.fibre === "nylon" || dominant.fibre === "acrylic") {
    careParts.push("Machine wash cold, skip the dryer. Synthetics retain odour, so wash sooner.");
  } else {
    careParts.push("Standard machine wash, gentle detergent, air-dry to preserve fibres.");
  }
  if (pct("elastane") > 0) {
    careParts.push("Avoid hot drying, elastane degrades above ~150°C and with repeated heat.");
  }
  const care = careParts.join(" ");

  // Climate fit
  let climateFitVerdict: ClimateFitVerdict = "okay";
  let climateFit = "";

  const tropicalFriendly =
    pct("linen") + pct("hemp") + pct("tencel") + pct("modal") + pct("organic cotton") + pct("cotton") +
    pct("ramie") + pct("silk");
  const tropicalUnfriendly =
    pct("polyester") + pct("nylon") + pct("acrylic") + pct("wool") + pct("cashmere");

  if (tropicalFriendly >= 95 && tropicalUnfriendly < 5) {
    climateFitVerdict = "excellent";
    climateFit = "Excellent for SEA daily wear, breathes outdoors, comfortable indoors. A long-life choice.";
  } else if (tropicalUnfriendly >= 70) {
    climateFitVerdict = "avoid";
    climateFit = "Best avoided for daily tropical wear, traps heat and holds odour. Air-con only.";
  } else if (tropicalUnfriendly >= 40) {
    climateFitVerdict = "risky";
    climateFit = "Will feel warmer than 100% natural fibres outdoors. Fine for air-con offices, less so for street.";
  } else if (tropicalFriendly >= 70) {
    climateFitVerdict = "good";
    climateFit = "Good for daily SEA wear. The synthetic fraction adds wrinkle-resistance and shape.";
  } else {
    climateFitVerdict = "okay";
    climateFit = "Mixed: comfortable in some situations, not in others. Check the dominant fibre.";
  }

  if (redFlags.length > 0) {
    climateFit += " See red flags below before buying.";
  }

  return { comfort, care, climateFit, climateFitVerdict };
}
