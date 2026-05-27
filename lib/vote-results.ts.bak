import type { ColourResult } from "./types";

export interface VotedResult {
  result: ColourResult;
  agreement: number;        // 0-1, fraction of input results that agreed with the winner
  inputCount: number;       // how many results were aggregated
  totalConsidered: number;  // input count before discarding low-confidence
}

/**
 * Aggregate N classifier results into a single best answer.
 *
 * Strategy:
 *   1. Discard any result with confidence < MIN_INDIVIDUAL_CONFIDENCE
 *   2. Count seasons; pick the majority. Ties broken by highest individual confidence.
 *   3. Return the winning result, with confidence boosted/lowered based on agreement.
 *
 * If ALL inputs were below threshold, falls back to the single highest-confidence one.
 */
const MIN_INDIVIDUAL_CONFIDENCE = 0.3;

export function voteResults(results: ColourResult[]): VotedResult {
  if (results.length === 0) {
    throw new Error("voteResults: empty input");
  }

  const usable = results.filter((r) => r.confidence >= MIN_INDIVIDUAL_CONFIDENCE);
  const pool = usable.length > 0 ? usable : results;

  // Tally season occurrences
  const tally = new Map<string, { count: number; maxConf: number; representative: ColourResult }>();
  for (const r of pool) {
    const existing = tally.get(r.season);
    if (existing) {
      existing.count++;
      if (r.confidence > existing.maxConf) {
        existing.maxConf = r.confidence;
        existing.representative = r;
      }
    } else {
      tally.set(r.season, { count: 1, maxConf: r.confidence, representative: r });
    }
  }

  // Find winning season — highest count, tie-break on max confidence
  let winner: { count: number; maxConf: number; representative: ColourResult } | null = null;
  for (const entry of tally.values()) {
    if (
      !winner ||
      entry.count > winner.count ||
      (entry.count === winner.count && entry.maxConf > winner.maxConf)
    ) {
      winner = entry;
    }
  }
  if (!winner) throw new Error("voteResults: no winner");

  const agreement = winner.count / pool.length;

  // Adjusted confidence: blend the winner's own confidence with agreement boost.
  // 3/3 agreement → boost up to 0.95. 2/3 → modest boost. 1/3 (all different) → no boost.
  const baseConfidence = winner.maxConf;
  let adjusted = baseConfidence;
  if (pool.length >= 2) {
    if (agreement === 1) adjusted = Math.max(baseConfidence, 0.92);
    else if (agreement >= 0.66) adjusted = Math.max(baseConfidence, 0.78);
    else adjusted = baseConfidence * 0.85; // 3-way split — lower the confidence
  }

  return {
    result: {
      ...winner.representative,
      confidence: Math.min(1, Math.max(0, adjusted)),
    },
    agreement,
    inputCount: pool.length,
    totalConsidered: results.length,
  };
}
