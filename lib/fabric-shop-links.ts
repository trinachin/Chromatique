// Search-link builder for shopping each fabric anchor on real retailers.
//
// Strategy: no scraping, no API, no affiliate. We construct a plain search URL
// per retailer using the fabric's identifier word plus an optional garment
// hint inferred from lifestyle/occasion. Users click out, browse fresh
// inventory, and we carry zero maintenance risk if any retailer renames a path.
//
// SEA-first selection (per CLAUDE.md positioning): Uniqlo SG, H&M SG, Zara SG,
// Cos SG, Muji SG, Pomelo (regional). Falls back to global pages if a SEA
// store-front does not exist.

import type { Lifestyle } from "./fabric-rules";

export interface Retailer {
  id: string;
  name: string;
  /** Build a search URL for the given query string. */
  build: (query: string) => string;
}

export const RETAILERS: Retailer[] = [
  {
    id: "uniqlo",
    name: "Uniqlo",
    build: (q) => `https://www.uniqlo.com/sg/en/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "hm",
    name: "H&M",
    build: (q) => `https://www2.hm.com/en_sg/search-results.html?q=${encodeURIComponent(q)}`,
  },
  {
    id: "zara",
    name: "Zara",
    build: (q) => `https://www.zara.com/sg/en/search?searchTerm=${encodeURIComponent(q)}`,
  },
  {
    id: "cos",
    name: "Cos",
    build: (q) => `https://www.cos.com/en_sgd/search.html?q=${encodeURIComponent(q)}`,
  },
  {
    id: "muji",
    name: "Muji",
    build: (q) => `https://www.muji.com/sg/en/store/cmdty/section/S20000?searchKeyword=${encodeURIComponent(q)}`,
  },
  {
    id: "pomelo",
    name: "Pomelo",
    build: (q) => `https://www.pomelofashion.com/sg/en/catalogsearch/result?q=${encodeURIComponent(q)}`,
  },
];

/** The word retailers actually use on labels and tags for each fabric. */
const FABRIC_SEARCH_TERM: Record<string, string> = {
  linen: "linen",
  "lightweight-cotton": "cotton",
  "organic-cotton": "organic cotton",
  hemp: "hemp",
  ramie: "ramie",
  "tencel-lyocell": "tencel",
  modal: "modal",
  "ecovero-viscose": "viscose",
  "bamboo-lyocell": "bamboo",
  silk: "silk",
  wool: "wool",
  seersucker: "seersucker",
  "dobby-cotton": "dobby cotton",
  "eyelet-cotton": "broderie",
  "linen-tencel": "linen blend",
  "cotton-modal": "cotton modal",
  polyester: "polyester",
  "performance-synthetic": "dri fit",
  nylon: "nylon",
  acrylic: "acrylic",
};

/** Garment hint, biased to what people buy in this lifestyle. */
function lifestyleHint(lifestyle?: Lifestyle): string {
  switch (lifestyle) {
    case "Office indoor":   return "shirt";
    case "Outdoor commute": return "shirt";
    case "Active":          return "tee";
    case "Mixed":           return "";
    default:                return "";
  }
}

export interface ShopLink {
  retailerId: string;
  retailerName: string;
  url: string;
}

/** Build a row of shop links for a given fabric, biased by lifestyle. */
export function buildShopLinks(fabricSlug: string, lifestyle?: Lifestyle): ShopLink[] {
  const term = FABRIC_SEARCH_TERM[fabricSlug] ?? fabricSlug.replace(/-/g, " ");
  const hint = lifestyleHint(lifestyle);
  const query = hint ? `${term} ${hint}` : term;

  return RETAILERS.map((r) => ({
    retailerId: r.id,
    retailerName: r.name,
    url: r.build(query),
  }));
}

/** Build a single search URL targeted at one retailer + fabric + occasion. */
export function buildOccasionShopLink(retailerId: string, fabricSlug: string, occasion?: string): string | null {
  const retailer = RETAILERS.find((r) => r.id === retailerId);
  if (!retailer) return null;
  const term = FABRIC_SEARCH_TERM[fabricSlug] ?? fabricSlug.replace(/-/g, " ");

  let hint = "";
  switch (occasion) {
    case "Office":    hint = "shirt"; break;
    case "Weekend":   hint = ""; break;
    case "Going out": hint = "dress"; break;
    case "Outdoor":   hint = "tee"; break;
    case "Travel":    hint = ""; break;
  }
  const query = hint ? `${term} ${hint}` : term;
  return retailer.build(query);
}
