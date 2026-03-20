/**
 * lib/athenaScore.ts — Re-exports the canonical Athena scoring function.
 *
 * All scoring logic now lives in lib/scoring.ts.
 * This file exists only for backward-compatible imports in ScreenerClient.tsx.
 */

export type { ScoringInputs as ScoreInputs } from "@/lib/scoring";
export { computeScore as computeAthenaScore, formatScoreForPrompt } from "@/lib/scoring";
