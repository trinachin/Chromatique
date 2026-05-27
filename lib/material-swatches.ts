// Visual swatch + texture mapping for metals, makeup, and hair categories
// referenced in lib/seasons.ts SEASON_DETAILS.
//
// Each mapping returns either a single hex (for solid swatches like lipstick
// or hair) or a multi-stop linear-gradient string (for metallic sheen).
//
// When a label isn't in the map we fall back to a reasonable default for the
// category so the UI never breaks on a typo or new addition.

// ───────────────────────────────────────────────────────────────────────────
// METALS, multi-stop linear-gradients with highlight + shadow stops to
// simulate metallic sheen. Use as `background: <gradient>` on a circle.
// ───────────────────────────────────────────────────────────────────────────

const METAL: Record<string, string> = {
  // Yellow gold family
  "Warm gold":         "linear-gradient(135deg, #F2D17A 0%, #DBA53C 40%, #F4DC95 55%, #B17B1F 100%)",
  "Warm yellow gold":  "linear-gradient(135deg, #F2D17A 0%, #DBA53C 40%, #F4DC95 55%, #B17B1F 100%)",
  "Yellow gold":       "linear-gradient(135deg, #F4D068 0%, #D29830 45%, #F0CE5C 60%, #A06E18 100%)",
  "Deep gold":         "linear-gradient(135deg, #D9A93C 0%, #A47820 45%, #D9A93C 60%, #6E4C12 100%)",
  "Bright gold":       "linear-gradient(135deg, #FCDE6C 0%, #E2B53A 45%, #FCDE6C 60%, #B58418 100%)",
  "Matte gold":        "linear-gradient(135deg, #D4B466 0%, #A78A40 50%, #C1A258 100%)",
  "Antique gold":      "linear-gradient(135deg, #B59750 0%, #856825 50%, #A78A40 100%)",
  "Light brass":       "linear-gradient(135deg, #E4C481 0%, #B59052 50%, #E0BE7A 100%)",

  // Rose gold
  "Rose gold":         "linear-gradient(135deg, #F4C9B8 0%, #C97B5A 45%, #F4C9B8 60%, #A8554A 100%)",
  "Soft rose gold":    "linear-gradient(135deg, #F0D2C5 0%, #C99C8C 50%, #B27968 100%)",

  // Copper
  "Copper":            "linear-gradient(135deg, #E5A06D 0%, #B5602E 45%, #E5A06D 60%, #7E3F18 100%)",
  "Bright copper":     "linear-gradient(135deg, #ECA871 0%, #BF6A35 45%, #ECA871 60%, #8A4419 100%)",
  "Antique copper":    "linear-gradient(135deg, #B57850 0%, #885028 50%, #A87248 100%)",
  "Rich copper":       "linear-gradient(135deg, #D88A55 0%, #A55525 50%, #C77D49 100%)",

  // Bronze
  "Bronze":            "linear-gradient(135deg, #B5814B 0%, #7E5430 45%, #B5814B 60%, #5C3A1F 100%)",
  "Brushed bronze":    "linear-gradient(135deg, #A47A50 0%, #7C5938 50%, #94704A 100%)",
  "Dark bronze":       "linear-gradient(135deg, #8A6238 0%, #5C401E 50%, #7A532E 100%)",

  // Silver / platinum / white gold
  "Silver":            "linear-gradient(135deg, #EBEBEB 0%, #B8B8B8 45%, #EBEBEB 60%, #8C8C8C 100%)",
  "Bright silver":     "linear-gradient(135deg, #F6F6F6 0%, #C8C8C8 45%, #F6F6F6 60%, #9A9A9A 100%)",
  "Antique silver":    "linear-gradient(135deg, #C4C4C0 0%, #8E8E88 50%, #ABABA4 100%)",
  "Brushed silver":    "linear-gradient(135deg, #C9C9C9 0%, #9C9C9C 50%, #BABABA 100%)",
  "White gold":        "linear-gradient(135deg, #F4F2EC 0%, #C8C5BC 45%, #F4F2EC 60%, #9D9A92 100%)",
  "Platinum":          "linear-gradient(135deg, #ECECEA 0%, #B8B6B0 45%, #ECECEA 60%, #898784 100%)",
  "Light platinum":    "linear-gradient(135deg, #F0F0EE 0%, #C8C6C0 50%, #ECEAE6 100%)",
  "Cool platinum":     "linear-gradient(135deg, #E5E7EA 0%, #ABADB2 45%, #E5E7EA 60%, #7E8084 100%)",
  "Pewter":            "linear-gradient(135deg, #A0A0A2 0%, #6E6E70 50%, #909092 100%)",
  "Gunmetal":          "linear-gradient(135deg, #6A6E72 0%, #3D4046 45%, #6A6E72 60%, #2A2C30 100%)",

  // Misc
  "Brushed metals":      "linear-gradient(135deg, #B8B5AE 0%, #88857E 50%, #ABA8A0 100%)",
  "Brushed/antique metals": "linear-gradient(135deg, #ADA8A0 0%, #807A72 50%, #A09B92 100%)",
  "Heavy silver":        "linear-gradient(135deg, #B0B0B0 0%, #828282 45%, #B0B0B0 60%, #5C5C5C 100%)",
  "Bright shiny silver": "linear-gradient(135deg, #FAFAFA 0%, #C0C0C0 45%, #FAFAFA 60%, #909090 100%)",
  "Brass":               "linear-gradient(135deg, #D4B062 0%, #A38130 50%, #C19E50 100%)",
  "Muted gold":          "linear-gradient(135deg, #C9B070 0%, #968048 50%, #B59E5E 100%)",
  "Cool silvers":        "linear-gradient(135deg, #DFE3E6 0%, #A8AEB4 50%, #C9CDD2 100%)",
  "Light pastel metals": "linear-gradient(135deg, #EFE8DC 0%, #C9C3B6 50%, #E0DACE 100%)",
};
const METAL_DEFAULT = "linear-gradient(135deg, #C4C4C4 0%, #888888 50%, #B8B8B8 100%)";

export function getMetalGradient(label: string): string {
  return METAL[label] ?? METAL_DEFAULT;
}

// ───────────────────────────────────────────────────────────────────────────
// LIPSTICK, single representative hex per category.
// ───────────────────────────────────────────────────────────────────────────

const LIPSTICK: Record<string, string> = {
  // Pinks / nudes
  "Peachy nude":      "#E8A38A",
  "Warm nude":        "#C4856B",
  "Warm pink":        "#D86683",
  "Hot warm pink":    "#E04A85",
  "Cool pink":        "#C66380",
  "Rose pink":        "#C8627A",
  "Rosy pink":        "#C46B82",
  "Soft mauve":       "#A87286",
  "Mauve":            "#90647A",
  // Coral / salmon / peach
  "Soft coral":       "#E07A6A",
  "Warm coral":       "#D85F4F",
  "Bright coral":     "#E05442",
  "Salmon":           "#E07060",
  "Apricot":          "#D88858",
  "Watermelon":       "#E84365",
  // Reds
  "Light warm red":   "#C8463A",
  "Warm terracotta":  "#B85436",
  "Muted terracotta": "#A05A47",
  "Terracotta":       "#B05A3E",
  "Brick red":        "#9C3B2A",
  "Brick":            "#9C3B2A",
  "Brick rose":       "#9E5052",
  "Deep warm red":    "#962F26",
  "Deep red":         "#8C1B28",
  "True red":         "#C8202F",
  "True cool red":    "#B82238",
  "True warm red":    "#C8392E",
  // Berry / plum / wine
  "Berry":            "#8B2655",
  "Cool berry":       "#822850",
  "Soft berry":       "#A55074",
  "Muted berry":      "#8E5872",
  "Light warm berry": "#B0496B",
  "Soft brown-red":   "#8A4942",
  "Plum":             "#5F2350",
  "Cool plum":        "#582148",
  "Soft plum":        "#74446A",
  "Burgundy":         "#5C1A1A",
  "Wine":             "#621A2C",
  "Mahogany":         "#5E2F23",
  "Copper-red":       "#9C4424",
  // Brights
  "Magenta":          "#A4276E",
  "Fuchsia":          "#C2257B",
  "Hot pink":         "#E13A8E",
  "Raspberry":        "#B23A60",
  "Cool rose":        "#B45078",
};
const LIPSTICK_DEFAULT = "#A85068";

export function getLipstickHex(label: string): string {
  return LIPSTICK[label] ?? LIPSTICK_DEFAULT;
}

// ───────────────────────────────────────────────────────────────────────────
// BLUSH, soft swatch hexes
// ───────────────────────────────────────────────────────────────────────────

const BLUSH: Record<string, string> = {
  "Soft peach":       "#F4B5A0",
  "Warm peach":       "#EE9F86",
  "Warm pink":        "#E89AA7",
  "Cool pink":        "#DC8FA0",
  "Rose":             "#D08496",
  "Rosy pink":        "#DC92A6",
  "Soft mauve":       "#BD8E9E",
  "Muted mauve":      "#A88090",
  "Dusty rose":       "#C99CA5",
  "Warm bronze":      "#C28560",
  "Russet":           "#B0613E",
  "Apricot":          "#EE9F86",
  "Bright coral":     "#EE7A6E",
  "Warm coral":       "#E68872",
  "Bright berry":     "#B05074",
  "Cool berry":       "#A04866",
  "Berry":            "#A8527A",
  "Plum":             "#7F406A",
  "Cool plum":        "#7A3E66",
  "Muted terracotta": "#B07060",
  "Peach":            "#F2B194",
};
const BLUSH_DEFAULT = "#D08496";

export function getBlushHex(label: string): string {
  return BLUSH[label] ?? BLUSH_DEFAULT;
}

// ───────────────────────────────────────────────────────────────────────────
// EYELINER, narrow shade range (browns / bronzes / blacks)
// ───────────────────────────────────────────────────────────────────────────

const EYELINER: Record<string, string> = {
  "Warm brown":       "#5A3A22",
  "Soft brown":       "#6B4A30",
  "Cool brown":       "#4A382E",
  "Black-brown":      "#2A1E18",
  "Dark brown":       "#3A2418",
  "Dark warm brown":  "#42281A",
  "Soft bronze":      "#8C5F36",
  "Bronze":           "#7A5430",
  "Bright bronze":    "#9A6840",
  "Bronze-black":     "#3A2818",
  "Black":            "#0A0A0A",
  "Charcoal":         "#2A2C30",
  "Cool brown":       "#4A382E",
  "Cool grey":        "#6A6E72",
  "Soft grey":        "#888A8E",
  "Smoky grey":       "#5A5C60",
  "Soft taupe":       "#7A6E62",
};
const EYELINER_DEFAULT = "#3A2418";

export function getEyelinerHex(label: string): string {
  return EYELINER[label] ?? EYELINER_DEFAULT;
}

// ───────────────────────────────────────────────────────────────────────────
// HAIR, single representative hex
// ───────────────────────────────────────────────────────────────────────────

const HAIR: Record<string, string> = {
  // Blondes
  "Golden blonde":               "#D4A958",
  "Warm golden blonde":          "#CFA255",
  "Honey":                       "#C99450",
  "Strawberry blonde":           "#C28560",
  "Ash blonde":                  "#B8AC92",
  "Cool dark blonde":            "#8A7E64",
  "Dusty/ash neutral blonde":    "#A89E84",
  "Cool platinum":               "#D5D3CE",
  "Platinum (for grey)":         "#D5D3CE",

  // Light browns
  "Light warm brown":            "#8C6240",
  "Light cool brown":            "#8A7466",
  "Light golden brown":          "#996F45",
  "Soft mushroom":               "#9C8A78",
  "Mushroom":                    "#8A7866",
  "Soft cool brown":             "#6F5C4E",
  "Taupe":                       "#7E7468",
  "Soft chestnut":               "#7A5235",
  "Warm chestnut":               "#6B3F1F",

  // Medium browns
  "Cool brown":                  "#4E3C30",
  "Ash brown":                   "#5C4E40",
  "Muted warm brown":            "#5E4030",
  "Dusty golden brown":          "#6E5238",
  "Deep golden brown":           "#5C3A1F",
  "Dark warm brown":             "#3F2412",
  "Rich golden brown":           "#553820",
  "Cool dark brown":             "#3A2A22",
  "Cool dark tones":             "#332624",
  "Rich dark brown":             "#3A2A1E",
  "Ash dark":                    "#332C26",

  // Copper / auburn
  "Copper":                      "#A45026",
  "Rich copper":                 "#9A4820",
  "Copper highlights":           "#B45A2A",
  "Rich auburn":                 "#7C3018",
  "Deep auburn":                 "#642614",
  "Dark auburn":                 "#5A1F10",
  "Vibrant warm tones":          "#8E3E1A",

  // Blacks
  "Blue-black":                  "#0E141C",
  "True black":                  "#080808",
  "Cool espresso":               "#1F1812",
  "Espresso with warm tones":    "#241A12",
  "Deep warm brown":             "#2A1810",
  "Warm tones":                  "#6B3F1F",
};
const HAIR_DEFAULT = "#5C4030";

export function getHairHex(label: string): string {
  return HAIR[label] ?? HAIR_DEFAULT;
}
