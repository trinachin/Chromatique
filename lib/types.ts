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
  fabricNote: string;
  styleNote: string;
  confidence: number;
};
