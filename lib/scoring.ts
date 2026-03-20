/**
 * lib/scoring.ts — Athena's canonical scoring function.
 *
 * THE single source of truth for stock scores and verdicts.
 * Used by: Screener · Analyze page · Featured Analysis · Popular Analyses
 *
 * Score range : 1.0 – 10.0  (one decimal place)
 * Verdict map : 8.0–10.0 = BUY · 6.0–7.9 = HOLD · 4.0–5.9 = WATCH · 1.0–3.9 = AVOID
 *
 * Inputs (all as plain numbers, percentages as decimals × 100):
 *   pe             P/E ratio (TTM). ≤ 0 means unprofitable.
 *   roe            Return on equity, % (e.g. 38.2 = 38.2 %)
 *   profitMargin   Net profit margin, % (e.g. 26.4 = 26.4 %)
 *   revenueGrowth  Revenue growth YoY, %. Use 0 when unavailable (neutral).
 *   beta           Beta vs market. Optional — defaults to 1.0 (market-neutral).
 *
 * Component weights (max 100 raw points):
 *   P/E ratio       35 pts  — lower is better  (valuation discipline)
 *   ROE             30 pts  — higher is better  (capital efficiency)
 *   Profit Margin   25 pts  — higher is better  (business quality)
 *   Revenue Growth  10 pts  — higher is better  (growth momentum)
 *   Beta modifier   ±0–0.8  — applied after scaling (risk adjustment)
 */

export interface ScoringInputs {
  /** P/E ratio (TTM). ≤ 0 = unprofitable. */
  pe: number;
  /** Return on equity, as a percentage (e.g. 38.2 = 38.2 %). */
  roe: number;
  /** Net profit margin, as a percentage (e.g. 26.4 = 26.4 %). */
  profitMargin: number;
  /** Revenue growth YoY, as a percentage. Use 0 when unavailable. */
  revenueGrowth: number;
  /** Beta vs market. Defaults to 1.0 (neutral) when omitted. */
  beta?: number;
}

export interface ScoringResult {
  /** Final score: 1.0 – 10.0, one decimal. */
  score: number;
  /** Verdict derived from score thresholds. */
  verdict: "BUY" | "HOLD" | "WATCH" | "AVOID";
}

// ── Component scoring ──────────────────────────────────────────────────────────

function scorePE(pe: number): number {
  if (pe <= 0 || pe > 200) return 5;   // unprofitable or absurd — not zero, avoids AVOID for great cos
  if (pe <= 12)  return 35;
  if (pe <= 18)  return 30;
  if (pe <= 25)  return 26;
  if (pe <= 35)  return 24;            // reasonable premium for quality
  if (pe <= 50)  return 12;            // expensive — significant drag
  if (pe <= 80)  return 6;
  return 3;                            // > 80: near-speculative valuation
}

function scoreROE(roe: number): number {
  if (roe >= 80)  return 30;
  if (roe >= 50)  return 27;
  if (roe >= 30)  return 22;
  if (roe >= 20)  return 17;
  if (roe >= 12)  return 12;
  if (roe >= 5)   return 6;
  return 2;
}

function scoreMargin(margin: number): number {
  if (margin >= 35) return 25;
  if (margin >= 30) return 24;         // extra tier: 30–35% is near-elite
  if (margin >= 22) return 21;
  if (margin >= 14) return 17;
  if (margin >= 8)  return 12;
  if (margin >= 3)  return 7;
  if (margin >= 0)  return 3;
  return 0;                            // negative margin
}

function scoreGrowth(growth: number): number {
  if (growth >= 30)  return 10;
  if (growth >= 20)  return 9;
  if (growth >= 15)  return 8;         // extra tier: 15–20% is strong
  if (growth >= 10)  return 7;
  if (growth >= 5)   return 5;
  if (growth >= 0)   return 3;
  if (growth >= -5)  return 2;
  return 1;
}

function betaAdjustment(beta: number): number {
  if (beta <= 0.8)  return  0.3;       // defensive / low-vol bonus
  if (beta <= 1.5)  return  0.0;       // market-neutral: no change
  if (beta <= 2.5)  return -0.3;       // elevated risk: modest penalty
  return -0.8;                         // extreme volatility: larger penalty
}

// ── Verdict from score ─────────────────────────────────────────────────────────

export function verdictFromScore(score: number): "BUY" | "HOLD" | "WATCH" | "AVOID" {
  if (score >= 8.0) return "BUY";
  if (score >= 6.0) return "HOLD";
  if (score >= 4.0) return "WATCH";
  return "AVOID";
}

// ── Main export ────────────────────────────────────────────────────────────────

export function computeScore(inputs: ScoringInputs): ScoringResult {
  const { pe, roe, profitMargin, revenueGrowth, beta = 1.0 } = inputs;

  const raw =
    scorePE(pe) +
    scoreROE(roe) +
    scoreMargin(profitMargin) +
    scoreGrowth(revenueGrowth); // max = 35+30+25+10 = 100

  // Scale 0–100 raw → 1.0–10.0 base score
  const base = 1.0 + (raw / 100) * 9.0;

  // Apply Beta risk modifier
  const adjusted = base + betaAdjustment(beta);

  // Clamp and round to 1 decimal
  const score = Math.min(10.0, Math.max(1.0, Math.round(adjusted * 10) / 10));

  return { score, verdict: verdictFromScore(score) };
}

// ── Prompt helper (used by Analyze page AI route) ──────────────────────────────
// Formats the deterministic result for injection into the AI prompt.

export function formatScoreForPrompt(inputs: ScoringInputs): string {
  const { score, verdict } = computeScore(inputs);
  return `${score.toFixed(1)} / 10.0 — verdict: ${verdict}`;
}
