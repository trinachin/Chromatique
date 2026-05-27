export type ColourSwatch = {
  name: string;
  hex: string;
};

export type SeasonFamily = "Spring" | "Summer" | "Autumn" | "Winter";
export type Undertone = "warm" | "cool" | "neutral";

export type ColourResult = {
  season: string;
  seasonFamily: SeasonFamily;
  undertone: Undertone;
  monkToneBand?: string;
  palette: ColourSwatch[];
  avoid: ColourSwatch[];
  /** Reserved for the future Fabric module; not populated by colour analysis. */
  fabricNote?: string;
  styleNote: string;
  confidence: number;
  /** Present when result was aggregated from multiple photos. */
  aggregation?: {
    inputCount: number;
    agreement: number; // 0-1
  };
};
