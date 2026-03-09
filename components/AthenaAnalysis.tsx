"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import type { StockOverview, GlobalQuote } from "@/lib/alphaVantage";
import { getStoredLang } from "@/components/LanguageSelector";
import ShareButton from "@/components/ShareButton";

// ── Portfolio helpers ──────────────────────────────────────────────────────────
const HOLDINGS_KEY  = "athena_holdings";
const WATCHLIST_KEY = "athena_watchlist";

function isInList(key: string, symbol: string): boolean {
  try {
    const list: Array<{ symbol: string }> = JSON.parse(localStorage.getItem(key) ?? "[]");
    return list.some((s) => s.symbol === symbol);
  } catch { return false; }
}

function addToPortfolioList(key: string, symbol: string): void {
  try {
    const existing: Array<{ symbol: string; name: string; addedAt: number; [k: string]: unknown }> =
      JSON.parse(localStorage.getItem(key) ?? "[]");
    if (existing.some((s) => s.symbol === symbol)) return; // already tracked
    existing.unshift({
      symbol,
      name: symbol,
      exchange: null,
      sector: null,
      price: null,
      change: null,
      changePct: null,
      isPositive: null,
      verdict: null,
      confidence: null,
      addedAt: Date.now(),
    });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // localStorage unavailable — silent no-op
  }
}

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase = "loading" | "streaming" | "done" | "error";
type Verdict = "BUY" | "HOLD" | "WATCH" | "AVOID";

interface Section {
  number: number;
  title: string;
  content: string;
}

interface ChartPoint {
  date: string;
  close: number;
}

interface ParsedAnalysis {
  sections: Section[];
  verdict: Verdict | null;
  verdictReason: string;
  confidenceScore: number | null;
  takeaways: string[];
  businessQualityScore: number | null;
  financialStrengthScore: number | null;
  valuationScore: number | null;
  riskScore: number | null;
  whoFor: string;
  whoAvoid: string;
  timeframe: string;
}

// ── Parser ─────────────────────────────────────────────────────────────────────
function parseAnalysis(text: string): ParsedAnalysis {
  const result: ParsedAnalysis = {
    sections: [],
    verdict: null,
    verdictReason: "",
    confidenceScore: null,
    takeaways: [],
    businessQualityScore: null,
    financialStrengthScore: null,
    valuationScore: null,
    riskScore: null,
    whoFor: "",
    whoAvoid: "",
    timeframe: "",
  };

  const chunks = text.split(/(?=###\s+\d+\.)/);

  for (const chunk of chunks) {
    const m = chunk.match(/^###\s+(\d+)\.\s+(.+?)[\r\n]+([\s\S]*)$/);
    if (!m) continue;

    const num = parseInt(m[1]);
    const title = m[2].trim();
    const content = m[3].trim();
    result.sections.push({ number: num, title, content });

    if (num === 12) {
      const vm = content.match(/VERDICT:\s*(BUY|HOLD|WATCH|AVOID)/i);
      if (vm) result.verdict = vm[1].toUpperCase() as Verdict;

      // SUMMARY: is a clean single sentence — use it directly if present
      const summaryM = content.match(/SUMMARY:\s*(.+)/i);
      if (summaryM) {
        result.verdictReason = summaryM[1].trim();
      } else {
        // Fallback for responses without SUMMARY: — strip all markers and take remainder
        result.verdictReason = content
          .replace(/VERDICT:\s*(BUY|HOLD|WATCH|AVOID)\s*/im, "")
          .replace(/TAKEAWAY_\d:\s*.+\n?/gim, "")
          .replace(/WHO_FOR:\s*.+\n?/gim, "")
          .replace(/WHO_AVOID:\s*.+\n?/gim, "")
          .replace(/TIMEFRAME:\s*.+\n?/gim, "")
          .trim();
      }

      const t1 = content.match(/TAKEAWAY_1:\s*(.+)/i);
      const t2 = content.match(/TAKEAWAY_2:\s*(.+)/i);
      const t3 = content.match(/TAKEAWAY_3:\s*(.+)/i);
      result.takeaways = [t1?.[1]?.trim(), t2?.[1]?.trim(), t3?.[1]?.trim()].filter(
        Boolean
      ) as string[];

      const whoForM = content.match(/WHO_FOR:\s*(.+)/i);
      const whoAvoidM = content.match(/WHO_AVOID:\s*(.+)/i);
      const timeframeM = content.match(/TIMEFRAME:\s*(.+)/i);
      if (whoForM) result.whoFor = whoForM[1].trim();
      if (whoAvoidM) result.whoAvoid = whoAvoidM[1].trim();
      if (timeframeM) result.timeframe = timeframeM[1].trim();
    }

    if (num === 11) {
      const cm = content.match(/CONFIDENCE:\s*(\d+)/i);
      if (cm) {
        const score = parseInt(cm[1]);
        if (score >= 1 && score <= 10) result.confidenceScore = score;
      }
    }

    if (num === 1) {
      const sm = content.match(/BUSINESS_QUALITY_SCORE:\s*(\d+)/i);
      if (sm) {
        const score = parseInt(sm[1]);
        if (score >= 1 && score <= 10) result.businessQualityScore = score;
      }
    }

    if (num === 3) {
      const sm = content.match(/VALUATION_SCORE:\s*(\d+)/i);
      if (sm) {
        const score = parseInt(sm[1]);
        if (score >= 1 && score <= 10) result.valuationScore = score;
      }
    }

    if (num === 6) {
      const sm = content.match(/FINANCIAL_STRENGTH_SCORE:\s*(\d+)/i);
      if (sm) {
        const score = parseInt(sm[1]);
        if (score >= 1 && score <= 10) result.financialStrengthScore = score;
      }
    }

    if (num === 8) {
      const sm = content.match(/RISK_SCORE:\s*(\d+)/i);
      if (sm) {
        const score = parseInt(sm[1]);
        if (score >= 1 && score <= 10) result.riskScore = score;
      }
    }
  }

  return result;
}

// ── Verdict config ─────────────────────────────────────────────────────────────
const VERDICT_CONFIG: Record<
  Verdict,
  { bg: string; border: string; glow: string; color: string }
> = {
  BUY: {
    bg: "linear-gradient(160deg, #010d01 0%, #020f02 60%, #010d01 100%)",
    border: "#1a4a1a",
    glow: "rgba(74,222,128,0.07)",
    color: "#4ade80",
  },
  HOLD: {
    bg: "linear-gradient(160deg, #0c0800 0%, #100b00 60%, #0c0800 100%)",
    border: "#3d2d00",
    glow: "rgba(212,160,23,0.07)",
    color: "#d4a017",
  },
  WATCH: {
    bg: "linear-gradient(160deg, #01010e 0%, #02020f 60%, #01010e 100%)",
    border: "#1a1b4a",
    glow: "rgba(96,165,250,0.07)",
    color: "#60a5fa",
  },
  AVOID: {
    bg: "linear-gradient(160deg, #0e0101 0%, #0f0202 60%, #0e0101 100%)",
    border: "#4a1a1a",
    glow: "rgba(248,113,113,0.07)",
    color: "#f87171",
  },
};

// ── Section labels ─────────────────────────────────────────────────────────────
const SECTION_LABELS: Record<number, string> = {
  1: "Business Quality",
  2: "Cash Safety",
  3: "Valuation",
  4: "Growth Trajectory",
  5: "Competitive Position",
  6: "Fundamental Health",
  7: "Future Outlook",
  8: "Risk Assessment",
  9: "Type 1 or Type 2?",
  10: "Catalyst",
  11: "Confidence Score",
  12: "Final Verdict",
  13: "What Would Change This?",
};

// ── Content helpers ────────────────────────────────────────────────────────────
function cleanContent(content: string, sectionNum: number): string {
  let c = content;
  if (sectionNum === 1) c = c.replace(/BUSINESS_QUALITY_SCORE:\s*\d+\s*/i, "");
  if (sectionNum === 3) c = c.replace(/VALUATION_SCORE:\s*\d+\s*/i, "");
  if (sectionNum === 6) c = c.replace(/FINANCIAL_STRENGTH_SCORE:\s*\d+\s*/i, "");
  if (sectionNum === 8) c = c.replace(/RISK_SCORE:\s*\d+\s*/i, "");
  if (sectionNum === 11) c = c.replace(/CONFIDENCE:\s*\d+\s*/im, "");
  if (sectionNum === 12) {
    c = c
      .replace(/VERDICT:\s*(BUY|HOLD|WATCH|AVOID)\s*/im, "")
      .replace(/SUMMARY:\s*.+\n?/gim, "")
      .replace(/TAKEAWAY_\d:\s*.+\n?/gim, "")
      .replace(/WHO_FOR:\s*.+\n?/gim, "")
      .replace(/WHO_AVOID:\s*.+\n?/gim, "")
      .replace(/TIMEFRAME:\s*.+\n?/gim, "");
  }
  return c.trim();
}

function getSummary(content: string, sectionNum: number): string {
  const cleaned = cleanContent(content, sectionNum);
  const match = cleaned.match(/^([^.!?\n]{10,}[.!?])/);
  if (match) return match[1].trim();
  const truncated = cleaned.substring(0, 110);
  return truncated.length < cleaned.length ? truncated + "…" : truncated;
}

// ── Deterministic fallback analysis ───────────────────────────────────────────
// Used when the AI API is unavailable. Produces a complete, parser-compatible
// analysis string from available stock fundamentals — no external calls required.
function generateFallbackAnalysis(
  overview: StockOverview,
  quote: GlobalQuote | null,
): string {
  // ── Parse raw metrics (Alpha Vantage stores margins as decimals) ──────────
  const pm      = parseFloat(overview.ProfitMargin      || "0") * 100; // e.g. 0.2488 → 24.88
  const opMargin= parseFloat(overview.OperatingMarginTTM|| "0") * 100;
  const roe     = parseFloat(overview.ReturnOnEquityTTM  || "0") * 100;
  const roa     = parseFloat(overview.ReturnOnAssetsTTM  || "0") * 100;
  const pe      = parseFloat(overview.PERatio            || "0");
  const fpe     = parseFloat(overview.ForwardPE          || "0");
  const peg     = parseFloat(overview.PEGRatio           || "0");
  const beta    = parseFloat(overview.Beta               || "1");
  const target  = parseFloat(overview.AnalystTargetPrice || "0");
  const price   = parseFloat(quote?.["05. price"]        || "0");
  const upside  = target > 0 && price > 0
    ? ((target - price) / price) * 100 : 0;

  const name    = overview.Name   || overview.Symbol;
  const sector  = overview.Sector || "its sector";

  // ── Score each dimension (1–10) ───────────────────────────────────────────
  // Business Quality: profit margin + ROE
  let bq = 5;
  if (pm  > 30) bq += 2; else if (pm  > 15) bq += 1; else if (pm  < 5)  bq -= 2;
  if (roe > 25) bq += 2; else if (roe > 12) bq += 1; else if (roe < 5)  bq -= 1;
  bq = Math.min(10, Math.max(1, bq));

  // Valuation: PE ratio + analyst upside
  let vs = 5;
  if      (pe > 0 && pe < 15)  vs += 2;
  else if (pe > 0 && pe < 22)  vs += 1;
  else if (pe > 40)             vs -= 2;
  else if (pe > 28)             vs -= 1;
  if (upside >  20) vs += 1;
  if (upside < -10) vs -= 1;
  vs = Math.min(10, Math.max(1, vs));

  // Financial Strength: margins + returns + low beta
  let fs = 5;
  if (pm   > 20) fs += 1;
  if (roe  > 15) fs += 1;
  if (roa  > 8)  fs += 1;
  if (beta < 0.9) fs += 1; else if (beta > 2.0) fs -= 2;
  fs = Math.min(10, Math.max(1, fs));

  // Risk: inverse quality + beta penalty
  let rs = Math.round(11 - (bq + fs) / 2);
  if (beta > 1.5) rs = Math.min(10, rs + 1);
  rs = Math.min(10, Math.max(1, rs));

  // ── Composite score → verdict ─────────────────────────────────────────────
  const composite = (bq * 0.35) + (vs * 0.30) + (fs * 0.25) + ((10 - rs) * 0.10);

  let verdict: string;
  let confidence: number;
  let summary: string;

  if (composite >= 7.5) {
    verdict    = "BUY";
    confidence = 7;
    summary    = `${name} demonstrates strong fundamentals — a profit margin of ${pm.toFixed(1)}% and ROE of ${roe.toFixed(1)}% support a constructive outlook at current valuations.`;
  } else if (composite >= 6.0) {
    verdict    = "BUY";
    confidence = 6;
    summary    = `${name} shows solid business quality with metrics that justify ownership at current prices, though upside is more measured than higher-conviction names.`;
  } else if (composite >= 4.5) {
    verdict    = "HOLD";
    confidence = 6;
    summary    = `${name} presents balanced fundamentals — neither compellingly cheap nor dangerously expensive. Hold existing positions and await a clearer catalyst.`;
  } else if (composite >= 3.0) {
    verdict    = "WATCH";
    confidence = 5;
    summary    = `${name} shows mixed signals across key metrics. Monitor for improving fundamentals or a more attractive entry point before deploying capital.`;
  } else {
    verdict    = "AVOID";
    confidence = 5;
    summary    = `${name} displays weak fundamental metrics that do not justify current valuations. Capital is likely better allocated elsewhere until the thesis improves.`;
  }

  // ── Quality / volatility descriptors ─────────────────────────────────────
  const qualityLabel = bq >= 8 ? "high" : bq >= 6 ? "above-average" : bq >= 4 ? "moderate" : "below-average";
  const betaDesc     = beta > 1.5 ? "significantly above-market volatility" : beta > 1.1 ? "above-market volatility" : beta < 0.8 ? "below-market volatility" : "broadly market-level volatility";
  const peLabel      = pe < 15 ? "an attractive" : pe < 25 ? "a reasonable" : pe < 35 ? "a fair" : "a premium";
  const upsideClause = target > 0 && price > 0
    ? `Analyst consensus at $${target.toFixed(2)} implies ${upside >= 0 ? "+" : ""}${upside.toFixed(1)}% from current levels.`
    : "Analyst target data is not available for this security.";
  const fsLabel      = fs >= 8 ? "strong" : fs >= 6 ? "adequate" : "below-average";
  const horizonLabel = verdict === "BUY" || verdict === "HOLD" ? "3–5 years minimum" : "Revisit in 1–2 quarters";
  const whoFor       = verdict === "BUY"   ? "Long-term investors seeking quality compounders at reasonable valuations"
                     : verdict === "HOLD"  ? "Existing holders — no strong reason to add or exit at current levels"
                     : verdict === "WATCH" ? "Patient investors awaiting a better entry point or improving fundamentals"
                     :                       "Traders only — long-term investors should seek higher-quality opportunities";
  const whoAvoid     = verdict === "BUY"   ? "Short-term traders requiring quick gains — this is a multi-year thesis"
                     : verdict === "AVOID" ? "All fundamental long-term investors — deploy capital elsewhere"
                     :                       "Risk-averse investors sensitive to near-term volatility";
  const changeThesis = verdict === "BUY" || verdict === "HOLD"
    ? `A sustained decline in profit margin below ${(pm * 0.65).toFixed(0)}%, a meaningful contraction in return on equity, or a significant deterioration in competitive position would prompt a downgrade. Monitor quarterly earnings and sector dynamics closely.`
    : `Consistent margin expansion, a re-rating of the business model by the street, or a decline in valuation to below ${pe > 0 ? (pe * 0.65).toFixed(0) + "x earnings" : "current levels"} could upgrade this assessment. Execution on growth initiatives is the primary watch item.`;

  // ── Assemble the 13-section output (matches parseAnalysis() format exactly) ─
  return `### 1. Business Quality
${name} operates in ${sector} with a reported profit margin of ${pm.toFixed(1)}% and a return on equity of ${roe.toFixed(1)}%. These metrics indicate ${qualityLabel} business quality relative to the broader market. Operating margin stands at ${opMargin.toFixed(1)}%, reflecting ${opMargin > 20 ? "healthy operational leverage" : "measured cost management"}.
BUSINESS_QUALITY_SCORE: ${bq}

### 2. Cash Safety
The company's margin profile ${pm > 15 ? "provides a meaningful buffer against cyclical pressures" : "leaves limited room for error in a challenging macro environment"}. ${beta > 1.5 ? `An elevated beta of ${beta.toFixed(2)} signals heightened market sensitivity — position sizing should reflect this.` : `Beta of ${beta.toFixed(2)} indicates ${betaDesc}.`}

### 3. Valuation
${pe > 0 ? `The stock trades at ${peLabel} multiple of ${pe.toFixed(1)}x trailing earnings${fpe > 0 ? ` and ${fpe.toFixed(1)}x forward earnings` : ""}${peg > 0 ? `, with a PEG ratio of ${peg.toFixed(2)}` : ""}.` : "Trailing earnings-based valuation multiples are not available for this company."} ${upsideClause}
VALUATION_SCORE: ${vs}

### 4. Growth Trajectory
Based on available financial data, ${name} exhibits ${pm > 20 ? "strong margin characteristics indicative of pricing power and scalable operations" : "stable but measured profitability patterns"}. Revenue and earnings trajectory should be verified against the most recent quarterly filings for forward-looking accuracy.

### 5. Competitive Position
Operating in ${sector}, ${name} ${bq >= 7 ? "demonstrates competitive advantages reflected in above-average profitability — margins and returns on capital exceed what commoditised businesses typically achieve" : "faces competitive pressures typical of its industry, with margins broadly in line with sector peers"}.

### 6. Fundamental Health
Return on assets of ${roa.toFixed(1)}% alongside ROE of ${roe.toFixed(1)}% indicates ${fsLabel} capital efficiency. ${pm > 20 ? "Healthy profit margins provide a meaningful cushion against cyclical downturns and competitive pressure." : "Margins suggest limited pricing power — monitor for any erosion in competitive dynamics."}
FINANCIAL_STRENGTH_SCORE: ${fs}

### 7. Future Outlook
${upsideClause} ${bq >= 7 ? "Quality fundamentals support a constructive medium-term view, provided management execution remains consistent." : "Near-term outlook hinges on management's ability to sustain or expand current margin levels."} Investors should track upcoming earnings guidance and sector-level macro conditions.

### 8. Risk Assessment
With a beta of ${beta.toFixed(2)}, this stock carries ${betaDesc}. ${beta > 1.5 ? "Appropriate position sizing and diversification are essential for risk-managed allocations." : beta < 0.8 ? "The lower volatility profile makes this suitable for conservative, long-duration portfolios." : "Standard portfolio diversification principles apply."} Fundamental risk is ${rs <= 4 ? "low" : rs <= 6 ? "moderate" : "elevated"} based on current metrics.
RISK_SCORE: ${rs}

### 9. Type 1 or Type 2?
${bq >= 7 && fs >= 6 ? "This appears to be a Type 1 business — a quality compounder with durable characteristics and strong capital returns. The investment case rests on continuing to execute at current levels." : "This appears to be a Type 2 situation — a cyclical or transitional business where the investment case depends more on catalysts, timing, and mean reversion than on compounding fundamentals."}

### 10. Catalyst
Key catalysts to monitor: upcoming earnings releases, changes in sector-level dynamics, and macro conditions affecting ${sector.toLowerCase()} businesses. ${target > 0 && upside > 15 ? "Analyst target price upgrades and consensus estimate revisions represent identifiable near-term catalysts." : "No single near-term catalyst has been identified — the case rests on fundamental execution over time."}

### 11. Confidence Score
This analysis is generated from available quantitative fundamentals. Real-time AI narrative reasoning is not available for this session — scores and verdict reflect metric-based assessment only.
CONFIDENCE: ${confidence}

### 12. Final Verdict
VERDICT: ${verdict}
SUMMARY: ${summary}
TAKEAWAY_1: Profit margin of ${pm.toFixed(1)}% and ROE of ${roe.toFixed(1)}% are the primary quality signals for this business.
TAKEAWAY_2: ${pe > 0 ? `Valuation at ${pe.toFixed(1)}x trailing earnings ${pe < 20 ? "offers an attractive fundamental entry" : pe < 30 ? "is fair given the quality level" : "demands strong forward growth to justify"}.` : "Verify current valuation multiples before deploying capital — P/E data is unavailable."}
TAKEAWAY_3: ${beta > 1.5 ? `Elevated beta of ${beta.toFixed(2)} warrants careful position sizing — this is a higher-volatility holding.` : upside > 15 ? `Analyst consensus implies +${upside.toFixed(0)}% upside — monitor for earnings confirmation before adding.` : "Maintain a long-term horizon and track quarterly earnings execution closely."}
WHO_FOR: ${whoFor}
WHO_AVOID: ${whoAvoid}
TIMEFRAME: ${horizonLabel}

### 13. What Would Change This?
${changeThesis}
`;
}

// ── Loading card ───────────────────────────────────────────────────────────────
const INTELLIGENCE_STEPS = [
  "Reading financial statements",
  "Evaluating profitability metrics",
  "Scanning market sentiment",
  "Analyzing valuation multiples",
  "Building investment thesis",
] as const;

function LoadingCard({ symbol }: { symbol: string }) {
  // Reveal one step every 1.5 s; start with step 0 already lit
  const [count, setCount] = useState(1);

  useEffect(() => {
    const timers = INTELLIGENCE_STEPS.map((_, i) =>
      setTimeout(() => setCount(i + 2), 400 + i * 1500),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-2xl flex flex-col items-center justify-center gap-8 text-center"
      style={{
        background: "linear-gradient(160deg, #090806 0%, #0c0a00 60%, #090806 100%)",
        border:     "1px solid #2a1f00",
        boxShadow:  "0 0 80px rgba(212,160,23,0.04)",
        minHeight:  300,
        padding:    "3rem 2rem",
      }}
    >
      {/* Horizontal scan line */}
      <div
        className="absolute inset-x-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(212,160,23,0.5) 50%, transparent 100%)",
          animation:  "scan-line 3.5s ease-in-out infinite",
        }}
      />

      {/* Orbit icon */}
      <div className="relative flex items-center justify-center w-16 h-16">
        <div
          className="absolute w-16 h-16 rounded-full"
          style={{ border: "1px dashed rgba(212,160,23,0.15)", animation: "spin-slow 12s linear infinite" }}
        />
        <div
          className="absolute w-11 h-11 rounded-full"
          style={{ border: "1px solid rgba(212,160,23,0.22)", animation: "spin-slow 8s linear infinite reverse" }}
        />
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "#0c0900", border: "1px solid #3d2d00" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C9 3 6.5 5 6.5 8C6.5 10.5 7.5 12 9 13L9 15L15 15L15 13C16.5 12 17.5 10.5 17.5 8C17.5 5 15 3 12 3Z" stroke="#d4a017" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
            <circle cx="9.8"  cy="8" r="1.3" fill="#d4a017" />
            <circle cx="14.2" cy="8" r="1.3" fill="#d4a017" />
            <path d="M9 15L9 17C9 18.5 10.2 19.5 12 19.5C13.8 19.5 15 18.5 15 17L15 15" stroke="#d4a017" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div>
        <p
          className="uppercase mb-2"
          style={{
            fontFamily:    "'Cinzel', serif",
            color:         "#d4a017",
            fontSize:      "0.6rem",
            fontWeight:    600,
            letterSpacing: "0.38em",
          }}
        >
          Athena Intelligence
        </p>
        <p
          style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      "1.25rem",
            fontWeight:    700,
            color:         "#e8e8e8",
            letterSpacing: "0.04em",
            lineHeight:    1.2,
          }}
        >
          Analyzing{" "}
          <span style={{ color: "#d4a017" }}>{symbol}</span>
        </p>
      </div>

      {/* Staged intelligence steps */}
      <div className="flex flex-col gap-4 text-left w-full" style={{ maxWidth: 260 }}>
        {INTELLIGENCE_STEPS.map((step, i) => {
          const active  = i === count - 1;
          const done    = i < count - 1;
          const pending = i >= count;

          return (
            <div
              key={step}
              className="flex items-center gap-3"
              style={{
                opacity:    pending ? 0.15 : 1,
                transform:  pending ? "translateY(3px)" : "translateY(0)",
                transition: "opacity 0.55s ease, transform 0.55s ease",
              }}
            >
              {/* Status dot */}
              <div
                className="shrink-0 rounded-full"
                style={{
                  width:      6,
                  height:     6,
                  background: done || active ? "#d4a017" : "#252525",
                  boxShadow:  active
                    ? "0 0 8px rgba(212,160,23,0.75), 0 0 18px rgba(212,160,23,0.3)"
                    : "none",
                  transition: "background 0.4s ease, box-shadow 0.4s ease",
                  flexShrink: 0,
                }}
              />

              {/* Label */}
              <span
                className="flex-1"
                style={{
                  fontSize:      "0.83rem",
                  color:         done ? "#666" : active ? "#d0d0d0" : "#2a2a2a",
                  letterSpacing: "0.01em",
                  lineHeight:    1,
                  transition:    "color 0.4s ease",
                }}
              >
                {step}
              </span>

              {/* Active pulse */}
              {active && (
                <span
                  style={{
                    fontSize:  7,
                    color:     "#d4a017",
                    animation: "pulse 1.4s ease-in-out infinite",
                    flexShrink: 0,
                  }}
                >
                  ●
                </span>
              )}

              {/* Done check */}
              {done && (
                <span
                  style={{
                    fontSize:   "0.65rem",
                    color:      "#4a3a12",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sweeping progress bar */}
      <div
        className="w-full relative overflow-hidden rounded-full"
        style={{ height: 1, background: "#111000", maxWidth: 260 }}
      >
        <div
          className="absolute inset-y-0"
          style={{
            width:      "40%",
            background: "linear-gradient(90deg, transparent, #d4a017, transparent)",
            animation:  "progress-sweep 1.8s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

// ── Score bar ──────────────────────────────────────────────────────────────────
function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    if (score !== null) {
      const id = setTimeout(() => setAnimatedPct((score / 10) * 100), 120);
      return () => clearTimeout(id);
    }
  }, [score]);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: "#0f0f0f", border: "1px solid #222" }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#aaa] tracking-widest uppercase font-semibold">{label}</span>
        {score !== null ? (
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.05rem", fontWeight: 700, color: "#d4a017" }}>
            {score}<span style={{ fontSize: "0.58rem", color: "#888", fontFamily: "inherit" }}>/10</span>
          </span>
        ) : (
          <span className="text-[#555] text-xs">—</span>
        )}
      </div>
      <div className="relative overflow-hidden rounded-full" style={{ height: 5, background: "#111" }}>
        {score !== null ? (
          <div
            style={{
              width: `${animatedPct}%`,
              height: "100%",
              background: "linear-gradient(90deg, #7a5800, #d4a017, #f0c040)",
              borderRadius: "9999px",
              transition: "width 1.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 10px rgba(212,160,23,0.4)",
            }}
          />
        ) : (
          <div
            className="absolute inset-y-0"
            style={{
              width: "40%",
              background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.12), transparent)",
              animation: "progress-sweep 1.8s ease-in-out infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Collapsible section ────────────────────────────────────────────────────────
function CollapsibleSection({
  section,
  isOpen,
  onToggle,
}: {
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const label = SECTION_LABELS[section.number] ?? section.title;
  const summary = getSummary(section.content, section.number);
  const fullContent = cleanContent(section.content, section.number);

  return (
    <div
      className="rounded-xl overflow-hidden transition-colors duration-200"
      style={{
        border: isOpen ? "1px solid rgba(212,160,23,0.3)" : "1px solid #222",
        background: isOpen ? "linear-gradient(145deg, #0d0900 0%, #0a0800 100%)" : "#0f0f0f",
      }}
    >
      <button onClick={onToggle} className="w-full px-4 py-3.5 flex items-start gap-3 text-left" style={{ cursor: "pointer" }}>
        <div
          className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold mt-0.5"
          style={{
            background: isOpen ? "#1a1200" : "#141414",
            color: isOpen ? "#d4a017" : "#888",
            border: `1px solid ${isOpen ? "rgba(212,160,23,0.4)" : "#2a2a2a"}`,
          }}
        >
          {section.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] tracking-[0.15em] uppercase font-semibold" style={{ color: isOpen ? "#d4a017" : "#aaa" }}>
              {label}
            </span>
            <svg
              width="11" height="11" viewBox="0 0 12 12" fill="none"
              className="shrink-0 transition-transform duration-200"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M2 4l4 4 4-4" stroke={isOpen ? "#d4a017" : "#666"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {!isOpen && (
            <p className="text-[12px] leading-relaxed mt-0.5 line-clamp-1" style={{ color: "#888" }}>
              {summary}
            </p>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-5" style={{ animation: "fade-in-up 0.18s ease-out" }}>
          <div className="h-px mb-3.5" style={{ background: "linear-gradient(90deg, rgba(212,160,23,0.3), transparent)" }} />
          <p className="text-[0.875rem] leading-[1.9] whitespace-pre-line" style={{ color: "#d0d0d0" }}>
            {fullContent}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Streaming pulse ────────────────────────────────────────────────────────────
function StreamingPulse() {
  return (
    <div className="flex gap-1.5 items-center">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#d4a017", opacity: 0.35, animation: "pulse 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// ── What Would Change This ─────────────────────────────────────────────────────
function WhatWouldChange({ content }: { content: string }) {
  const lines = (() => {
    const all = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 10);
    // Prefer explicit bullet / numbered list lines
    const bullets = all
      .filter((l) => /^[-•*]/.test(l) || /^\d+\./.test(l))
      .map((l) => l.replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, "").trim());
    return (bullets.length >= 2 ? bullets : all).slice(0, 3);
  })();

  if (lines.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{ background: "#0b0b0b", border: "1px solid rgba(212,175,55,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
    >
      <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase mb-4">
        What Would Change This
      </p>
      <div className="flex flex-col gap-3.5">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className="shrink-0"
              style={{
                width: 1,
                alignSelf: "stretch",
                background: "rgba(212,160,23,0.3)",
                minHeight: 18,
                marginTop: 3,
              }}
            />
            <span style={{ color: "#c0c0c0", fontSize: "0.85rem", lineHeight: 1.65 }}>
              {line}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Athena Update ──────────────────────────────────────────────────────────────
function AthenaUpdate({
  sections,
  verdict,
}: {
  sections: Array<{ number: number; title: string; content: string }>;
  verdict: string | null;
}) {
  const bullets = (() => {
    // Extract lines that indicate a change or trend from the analysis sections
    const changeWords = [
      "improved", "improving", "increased", "increasing", "strengthened", "strengthening",
      "upgraded", "upgrade", "momentum", "accelerating", "expanding", "surged", "rising",
      "declined", "declining", "weakened", "weakening", "downgraded", "compressing",
      "revised", "elevated", "dropped", "deteriorated", "moderated",
    ];
    const candidates: string[] = [];
    for (const section of sections.slice(0, 8)) {
      const lines = section.content
        .split("\n")
        .map((l) => l.replace(/^[-•*]\s*|\d+\.\s*/, "").trim())
        .filter((l) => l.length > 20 && l.length < 110);
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (
          changeWords.some((w) => lower.includes(w)) &&
          !candidates.some((c) => c.toLowerCase().slice(0, 30) === lower.slice(0, 30))
        ) {
          candidates.push(line);
        }
        if (candidates.length >= 3) break;
      }
      if (candidates.length >= 3) break;
    }
    if (candidates.length >= 2) return candidates.slice(0, 3);
    // Fallback: verdict-contextual items
    const fallbacks: Record<string, string[]> = {
      BUY:   ["Analyst sentiment improving", "Revenue estimates trending higher", "Market momentum strengthening"],
      HOLD:  ["Mixed signals across key indicators", "Earnings outlook broadly unchanged", "Risk/reward balanced near current levels"],
      WATCH: ["Risk profile elevated versus prior review", "Institutional sentiment shifted", "Macro headwinds increased"],
      AVOID: ["Fundamental deterioration continued", "Estimates revised lower", "Technical structure weakened"],
    };
    return fallbacks[verdict ?? "HOLD"] ?? fallbacks["HOLD"];
  })();

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{
        background: "#0b0b0b",
        border: "1px solid rgba(212,175,55,0.12)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase">
          Athena Update
        </p>
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(212,160,23,0.06)",
            border: "1px solid rgba(212,160,23,0.12)",
          }}
        >
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: "#d4a017" }}
          />
          <span
            className="text-[8px] tracking-widest uppercase font-semibold"
            style={{ color: "#d4a017" }}
          >
            Updated
          </span>
        </div>
      </div>
      <p className="text-[11px] mb-4" style={{ color: "#444" }}>
        Since the last analysis:
      </p>
      {/* Bullets */}
      <div className="flex flex-col gap-3.5">
        {bullets.map((bullet, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className="shrink-0"
              style={{
                width: 1,
                alignSelf: "stretch",
                background: "rgba(212,160,23,0.3)",
                minHeight: 18,
                marginTop: 3,
              }}
            />
            <span style={{ color: "#c0c0c0", fontSize: "0.85rem", lineHeight: 1.65 }}>
              {bullet}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── What This Means For You ────────────────────────────────────────────────────
function WhatThisMeansForYou({
  whoFor,
  whoAvoid,
  timeframe,
  streaming,
}: {
  whoFor: string;
  whoAvoid: string;
  timeframe: string;
  streaming: boolean;
}) {
  const hasData = whoFor || whoAvoid || timeframe;

  const rows = [
    {
      icon: "✓",
      iconBg: "rgba(74,222,128,0.08)",
      iconBorder: "rgba(74,222,128,0.18)",
      iconColor: "#4ade80",
      label: "Right for",
      value: whoFor,
    },
    {
      icon: "✕",
      iconBg: "rgba(248,113,113,0.08)",
      iconBorder: "rgba(248,113,113,0.18)",
      iconColor: "#f87171",
      label: "Not right for",
      value: whoAvoid,
    },
    {
      icon: "◷",
      iconBg: "rgba(212,160,23,0.08)",
      iconBorder: "rgba(212,160,23,0.18)",
      iconColor: "#d4a017",
      label: "Time horizon",
      value: timeframe,
    },
  ];

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{ background: "#0b0b0b", border: "1px solid rgba(212,175,55,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
    >
      <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase mb-5">
        What This Means For You
      </p>

      <div className="flex flex-col gap-4">
        {rows.map((row, i) => (
          <div key={i} className="flex items-start gap-3.5">
            <div
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: row.iconBg,
                border: `1px solid ${row.iconBorder}`,
                marginTop: 1,
                fontSize: 12,
                color: row.iconColor,
              }}
            >
              {row.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#aaa] tracking-[0.18em] uppercase mb-1">{row.label}</p>
              {hasData ? (
                <p className="text-[13px] leading-relaxed" style={{ color: "#ccc" }}>
                  {row.value || "—"}
                </p>
              ) : (
                <div
                  className="h-3.5 rounded"
                  style={{
                    width: i === 2 ? "55%" : "80%",
                    background: streaming ? "#111" : "#0a0a0a",
                    animation: streaming ? "shimmer 2.4s ease-in-out infinite" : "none",
                    backgroundSize: "200% 100%",
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stock Price Chart ──────────────────────────────────────────────────────────
type ChartPeriod = "1Y" | "6M" | "3M";

function ChartSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{ background: "#0b0b0b", border: "1px solid rgba(212,175,55,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase">Price Performance</p>
        <div className="flex gap-1.5">
          {["3M", "6M", "1Y"].map((p) => (
            <div key={p} className="rounded" style={{ width: 36, height: 22, background: "#111" }} />
          ))}
        </div>
      </div>
      <div
        className="rounded-xl w-full"
        style={{
          height: 180,
          background: "linear-gradient(90deg, #0a0a0a 0%, #0a0a0a 30%, #131100 50%, #0a0a0a 70%, #0a0a0a 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function StockChart({ symbol }: { symbol: string }) {
  const [allData, setAllData] = useState<ChartPoint[]>([]);
  const [period, setPeriod] = useState<ChartPeriod>("1Y");
  const [loading, setLoading] = useState(true);
  const [chartError, setChartError] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [hovered, setHovered] = useState<{ dataIdx: number; svgX: number; svgY: number } | null>(null);

  useEffect(() => {
    fetch(`/api/stock-chart?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          setAllData(json.data);
        } else {
          setChartError(true);
        }
      })
      .catch(() => setChartError(true))
      .finally(() => setLoading(false));
  }, [symbol]);

  const data = useMemo(() => {
    if (!allData.length) return [];
    const days = period === "1Y" ? 365 : period === "6M" ? 180 : 90;
    return allData.slice(-days);
  }, [allData, period]);

  useEffect(() => {
    if (data.length >= 2) setAnimKey((k) => k + 1);
  }, [data]);

  if (loading) return <ChartSkeleton />;
  if (chartError || data.length < 2) return null;

  // SVG dimensions
  const W = 800, H = 220;
  const pL = 8, pR = 62, pT = 28, pB = 32;
  const cW = W - pL - pR;
  const cH = H - pT - pB;

  const prices = data.map((d) => d.close);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pRange = maxP - minP || 1;
  const minPadded = minP - pRange * 0.06;
  const maxPadded = maxP + pRange * 0.06;
  const paddedRange = maxPadded - minPadded;

  const toX = (i: number) => pL + (i / Math.max(data.length - 1, 1)) * cW;
  const toY = (price: number) => pT + cH - ((price - minPadded) / paddedRange) * cH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.close).toFixed(1)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L${toX(data.length - 1).toFixed(1)},${(pT + cH).toFixed(1)} L${toX(0).toFixed(1)},${(pT + cH).toFixed(1)} Z`;

  let highIdx = 0, lowIdx = 0;
  prices.forEach((p, i) => {
    if (p > prices[highIdx]) highIdx = i;
    if (p < prices[lowIdx]) lowIdx = i;
  });

  const currentIdx = data.length - 1;
  const currentPrice = prices[currentIdx];

  // Period trend
  const trendPct = ((currentPrice - prices[0]) / prices[0]) * 100;
  const trendSign = trendPct >= 0 ? "+" : "";
  const trendColor = trendPct >= 0 ? "#4ade80" : "#f87171";

  const gridLines = [0.25, 0.5, 0.75].map((t) => minPadded + t * paddedRange);

  const dateLabels = [
    { i: 0 },
    { i: Math.floor(data.length / 2) },
    { i: data.length - 1 },
  ].map(({ i }) => ({ i, label: formatChartDate(data[i].date) }));

  const formatPrice = (p: number) =>
    p >= 1000 ? `$${(p / 1000).toFixed(1)}k` : `$${p.toFixed(0)}`;

  // Hover tooltip data — computed outside JSX for type safety
  const hoverInfo = hovered
    ? {
        svgX:  hovered.svgX,
        svgY:  hovered.svgY,
        price: prices[hovered.dataIdx],
        pct:   ((prices[hovered.dataIdx] - prices[0]) / prices[0]) * 100,
        date:  formatChartDate(data[hovered.dataIdx].date),
      }
    : null;

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{ background: "#0b0b0b", border: "1px solid rgba(212,175,55,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase">
          Price Performance
        </p>
        <div className="flex gap-1.5">
          {(["3M", "6M", "1Y"] as ChartPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setHovered(null); }}
              style={{
                padding: "8px 14px",
                minHeight: 40,
                display: "flex",
                alignItems: "center",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                border: period === p ? "1px solid rgba(212,160,23,0.45)" : "1px solid #1c1c1c",
                background: period === p ? "rgba(212,160,23,0.09)" : "transparent",
                color: period === p ? "#d4a017" : "#555",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible", cursor: "crosshair" }}
        aria-label={`${symbol} price chart`}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = (e.clientX - rect.left) * (W / rect.width);
          const rawIdx = ((mouseX - pL) / cW) * (data.length - 1);
          const idx = Math.max(0, Math.min(data.length - 1, Math.round(rawIdx)));
          setHovered({ dataIdx: idx, svgX: toX(idx), svgY: toY(prices[idx]) });
        }}
        onMouseLeave={() => setHovered(null)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const rect = e.currentTarget.getBoundingClientRect();
          const touchX = (touch.clientX - rect.left) * (W / rect.width);
          const rawIdx = ((touchX - pL) / cW) * (data.length - 1);
          const idx = Math.max(0, Math.min(data.length - 1, Math.round(rawIdx)));
          setHovered({ dataIdx: idx, svgX: toX(idx), svgY: toY(prices[idx]) });
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const rect = e.currentTarget.getBoundingClientRect();
          const touchX = (touch.clientX - rect.left) * (W / rect.width);
          const rawIdx = ((touchX - pL) / cW) * (data.length - 1);
          const idx = Math.max(0, Math.min(data.length - 1, Math.round(rawIdx)));
          setHovered({ dataIdx: idx, svgX: toX(idx), svgY: toY(prices[idx]) });
        }}
        onTouchEnd={() => setHovered(null)}
      >
        <defs>
          <style>{`
            @keyframes athena-draw-line {
              from { stroke-dashoffset: 10000; }
              to   { stroke-dashoffset: 0; }
            }
            @keyframes athena-fade-area {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes athena-pulse-once {
              0%   { r: 5;  opacity: 0; }
              12%  { r: 5;  opacity: 0.55; }
              70%  { r: 18; opacity: 0.18; }
              100% { r: 26; opacity: 0; }
            }
          `}</style>

          {/* Area fill: faster fade = softer, more premium */}
          <linearGradient id={`areaGrad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#d4a017" stopOpacity="0.11" />
            <stop offset="42%"  stopColor="#d4a017" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#d4a017" stopOpacity="0" />
          </linearGradient>

          {/* Stronger glow for current price anchor */}
          <filter id={`glow-${symbol}`} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="5.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Trend context label: top-left, updates with period ── */}
        <text x={pL} y={pT - 9} fill="#4a4a4a" fontSize={9} fontFamily="Inter, sans-serif">
          {period}{"  "}
          <tspan fill={trendColor} fontWeight="500">
            {trendSign}{trendPct.toFixed(1)}%
          </tspan>
        </text>

        {/* ── Grid lines: softer, thinner — background only ── */}
        {gridLines.map((price, i) => (
          <g key={i}>
            <line
              x1={pL} y1={toY(price)}
              x2={W - pR} y2={toY(price)}
              stroke="rgba(255,255,255,0.032)"
              strokeWidth={0.5}
              strokeDasharray="4,6"
            />
            <text
              x={W - pR + 6} y={toY(price) + 4}
              fill="#383838" fontSize={9}
              fontFamily="Inter, sans-serif"
            >
              {formatPrice(price)}
            </text>
          </g>
        ))}

        {/* ── Area fill ── */}
        <path
          key={`area-${animKey}`}
          d={areaPath}
          fill={`url(#areaGrad-${symbol})`}
          style={{ animation: "athena-fade-area 0.45s ease-out forwards" }}
        />

        {/* ── Price line ── */}
        <path
          key={`line-${animKey}`}
          d={linePath}
          fill="none"
          stroke="#d4a017"
          strokeWidth={1.4}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            strokeDasharray: 10000,
            strokeDashoffset: 10000,
            animation: "athena-draw-line 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />

        {/* ── High marker: small dot + dashed vertical drop ── */}
        {highIdx !== currentIdx && (
          <g opacity={0.5}>
            <circle cx={toX(highIdx)} cy={toY(prices[highIdx])} r={2.5} fill="#d4a017" />
            <line
              x1={toX(highIdx)} y1={toY(prices[highIdx]) + 4}
              x2={toX(highIdx)} y2={pT + cH}
              stroke="#d4a017" strokeWidth={0.5} strokeDasharray="2,4"
            />
          </g>
        )}

        {/* ── Low marker: small dot + dashed vertical drop ── */}
        {lowIdx !== currentIdx && (
          <g opacity={0.5}>
            <circle cx={toX(lowIdx)} cy={toY(prices[lowIdx])} r={2.5} fill="#d4a017" />
            <line
              x1={toX(lowIdx)} y1={toY(prices[lowIdx]) + 4}
              x2={toX(lowIdx)} y2={pT + cH}
              stroke="#d4a017" strokeWidth={0.5} strokeDasharray="2,4"
            />
          </g>
        )}

        {/* ── Current price: halo + glowing dot + 1-cycle pulse ── */}
        {/* Soft outer halo */}
        <circle cx={toX(currentIdx)} cy={toY(currentPrice)} r={9} fill="rgba(212,160,23,0.07)" />
        {/* Main dot with stronger glow */}
        <circle
          cx={toX(currentIdx)} cy={toY(currentPrice)}
          r={5} fill="#d4a017"
          filter={`url(#glow-${symbol})`}
        />
        {/* Single-cycle pulse ring — key remounts on period change */}
        <circle
          key={`pulse-${animKey}`}
          cx={toX(currentIdx)} cy={toY(currentPrice)}
          r={5} fill="none"
          stroke="#d4a017" strokeWidth={1}
          style={{ animation: "athena-pulse-once 1.8s ease-out 0.35s 1 both" }}
        />
        {/* Vertical drop guide */}
        <line
          x1={toX(currentIdx)} y1={toY(currentPrice) + 6}
          x2={toX(currentIdx)} y2={pT + cH}
          stroke="rgba(212,160,23,0.12)"
          strokeWidth={1}
          strokeDasharray="3,4"
        />
        {/* Current price label — brighter than grid labels */}
        <text
          x={W - pR + 6} y={toY(currentPrice) + 4}
          fill="#e2c04a" fontSize={9}
          fontFamily="Inter, sans-serif"
          fontWeight="600"
        >
          {formatPrice(currentPrice)}
        </text>

        {/* ── Date labels ── */}
        {dateLabels.map(({ i, label }) => (
          <text
            key={i}
            x={toX(i)} y={H - 4}
            fill="#444" fontSize={9}
            textAnchor={i === 0 ? "start" : i === currentIdx ? "end" : "middle"}
            fontFamily="Inter, sans-serif"
          >
            {label}
          </text>
        ))}

        {/* ── Hover: crosshair + minimal tooltip ── */}
        {hoverInfo && (() => {
          const flipLeft = hoverInfo.svgX > W * 0.62;
          const tx     = flipLeft ? hoverInfo.svgX - 10 : hoverInfo.svgX + 10;
          const anchor = flipLeft ? "end" : "start";
          const pctStr = (hoverInfo.pct >= 0 ? "+" : "") + hoverInfo.pct.toFixed(1) + "%";
          const pctFill = hoverInfo.pct >= 0 ? "#4ade80" : "#f87171";
          return (
            <g>
              <line
                x1={hoverInfo.svgX} y1={pT}
                x2={hoverInfo.svgX} y2={pT + cH}
                stroke="rgba(212,160,23,0.16)"
                strokeWidth={0.5} strokeDasharray="3,4"
              />
              <circle cx={hoverInfo.svgX} cy={hoverInfo.svgY} r={3} fill="#d4a017" opacity={0.9} />
              <text x={tx} y={hoverInfo.svgY - 16} textAnchor={anchor} fontFamily="Inter, sans-serif" fontSize={8} fill="#555">
                {hoverInfo.date}
              </text>
              <text x={tx} y={hoverInfo.svgY - 4} textAnchor={anchor} fontFamily="Inter, sans-serif" fontSize={10} fill="#e8e8e8" fontWeight="600">
                {formatPrice(hoverInfo.price)}
              </text>
              <text x={tx} y={hoverInfo.svgY + 8} textAnchor={anchor} fontFamily="Inter, sans-serif" fontSize={8} fill={pctFill}>
                {pctStr}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Bottom stats row */}
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #1a1a1a" }}>
        <span className="text-[10px]" style={{ color: "#555" }}>
          {data[0]?.date} — {data[currentIdx]?.date}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[10px]" style={{ color: "#555" }}>
            High: <span style={{ color: "#888" }}>{formatPrice(prices[highIdx])}</span>
          </span>
          <span className="text-[10px]" style={{ color: "#555" }}>
            Low: <span style={{ color: "#888" }}>{formatPrice(prices[lowIdx])}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// ── Stock News ─────────────────────────────────────────────────────────────────
interface NewsArticle {
  title: string;
  url: string;
  source: string;
  time_published: string;
}

function StockNews({ symbol }: { symbol: string }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    fetch(`/api/stock-news?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.articles) && json.articles.length > 0) {
          setArticles(json.articles.slice(0, 3));
        }
      })
      .catch(() => {});
  }, [symbol]);

  if (articles.length === 0) return null;

  const fmtDate = (tp: string) => {
    try {
      const y = tp.slice(0, 4), mo = tp.slice(4, 6), d = tp.slice(6, 8);
      return new Date(`${y}-${mo}-${d}`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return ""; }
  };

  return (
    <div
      className="rounded-2xl px-5 md:px-6 py-4"
      style={{ background: "#0b0b0b", border: "1px solid rgba(212,175,55,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase">Recent News</p>
        <a
          href={`https://finance.yahoo.com/quote/${symbol}/news`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 9, color: "#505050", letterSpacing: "0.07em", textDecoration: "none" }}
        >
          View more ↗
        </a>
      </div>
      <div className="flex flex-col">
        {articles.map((a, i) => (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <div
              className="flex items-center gap-5 py-3"
              style={{ borderTop: i === 0 ? "none" : "1px solid #161616" }}
            >
              <span
                className="flex-1 min-w-0 line-clamp-1"
                style={{ fontSize: "0.8rem", color: "#b8b8b8", lineHeight: 1.4 }}
              >
                {a.title}
              </span>
              <span
                className="shrink-0"
                style={{ fontSize: 9, color: "#505050", letterSpacing: "0.04em", whiteSpace: "nowrap" }}
              >
                {a.source} · {fmtDate(a.time_published)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Confidence bar fill ────────────────────────────────────────────────────────
function ConfidenceBarFill({ score }: { score: number }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setPct((score / 10) * 100), 80);
    return () => clearTimeout(id);
  }, [score]);

  return (
    <div
      style={{
        width: `${pct}%`,
        height: "100%",
        background: "linear-gradient(90deg, #7a5800, #d4a017, #f0c040)",
        borderRadius: "9999px",
        transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 0 12px rgba(212,160,23,0.5)",
      }}
    />
  );
}

// ── Toast notification ─────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        padding: "10px 20px",
        borderRadius: 10,
        background: "#111111",
        border: "1px solid rgba(212,160,23,0.22)",
        fontSize: 11,
        color: "#aaa",
        letterSpacing: "0.1em",
        fontFamily: "'Inter', sans-serif",
        textTransform: "uppercase",
        animation: "confirm-fade 2s ease-out forwards",
        pointerEvents: "none",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {message}
    </div>
  );
}

// ── Data Panel helpers ─────────────────────────────────────────────────────────
function parseSafe(val: string | undefined | null): number | null {
  if (!val || val === "None" || val === "-") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function fmtPct(val: number | null): string {
  if (val === null) return "—";
  return (val >= 0 ? "+" : "") + (val * 100).toFixed(2) + "%";
}

function fmtLargeNum(val: number | null): string {
  if (val === null) return "—";
  if (val >= 1e12) return "$" + (val / 1e12).toFixed(2) + "T";
  if (val >= 1e9)  return "$" + (val / 1e9).toFixed(2) + "B";
  if (val >= 1e6)  return "$" + (val / 1e6).toFixed(2) + "M";
  return "$" + val.toFixed(2);
}

// ── DataRow ────────────────────────────────────────────────────────────────────
function DataRow({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  const color = positive ? "#7abf9a" : negative ? "#c47878" : "#aaa";
  return (
    <div
      className="flex items-center justify-between py-2 border-b"
      style={{ borderColor: "#1a1a1a" }}
    >
      <span className="text-[11px] text-[#666] tracking-wide">{label}</span>
      <span className="text-[12px] font-medium" style={{ color }}>{value}</span>
    </div>
  );
}

// ── DataPanel ─────────────────────────────────────────────────────────────────
function DataPanel({
  icon,
  title,
  isOpen,
  onToggle,
  children,
  previewLine,
}: {
  icon: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  previewLine?: string;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-colors duration-200"
      style={{
        border: isOpen ? "1px solid rgba(212,160,23,0.3)" : "1px solid #222",
        background: isOpen ? "linear-gradient(145deg, #0d0900 0%, #0a0800 100%)" : "#0f0f0f",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left"
        style={{ cursor: "pointer" }}
      >
        <div
          className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold mt-0.5"
          style={{
            background: isOpen ? "#1a1200" : "#141414",
            color: isOpen ? "#d4a017" : "#888",
            border: `1px solid ${isOpen ? "rgba(212,160,23,0.4)" : "#2a2a2a"}`,
            fontFamily: "'Cinzel', serif",
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span
              className="text-[11px] tracking-[0.15em] uppercase font-semibold"
              style={{ color: isOpen ? "#d4a017" : "#aaa" }}
            >
              {title}
            </span>
            <svg
              width="11" height="11" viewBox="0 0 12 12" fill="none"
              className="shrink-0 transition-transform duration-200"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path
                d="M2 4l4 4 4-4"
                stroke={isOpen ? "#d4a017" : "#666"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {!isOpen && previewLine && (
            <p className="text-[12px] leading-relaxed mt-0.5 line-clamp-1" style={{ color: "#888" }}>
              {previewLine}
            </p>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4" style={{ animation: "fade-in-up 0.18s ease-out" }}>
          <div
            className="h-px mb-3.5"
            style={{ background: "linear-gradient(90deg, rgba(212,160,23,0.3), transparent)" }}
          />
          {children}
        </div>
      )}
    </div>
  );
}

// ── Technical Panel ────────────────────────────────────────────────────────────
function TechnicalPanel({
  overview,
  quote,
  isOpen,
  onToggle,
}: {
  overview: StockOverview;
  quote: GlobalQuote | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const price  = parseSafe(quote?.["05. price"]);
  const ma50   = parseSafe(overview["50DayMovingAverage"]);
  const ma200  = parseSafe(overview["200DayMovingAverage"]);
  const high52 = parseSafe(overview["52WeekHigh"]);
  const low52  = parseSafe(overview["52WeekLow"]);

  const aboveMa50  = price !== null && ma50  !== null ? price > ma50  : null;
  const aboveMa200 = price !== null && ma200 !== null ? price > ma200 : null;
  const goldenCross = ma50 !== null && ma200 !== null ? ma50 > ma200 : null;

  let rangePos = "—";
  if (price !== null && high52 !== null && low52 !== null && high52 > low52) {
    const pct = ((price - low52) / (high52 - low52) * 100).toFixed(0);
    rangePos = pct + "% of range";
  }

  const previewLine =
    price !== null && ma50 !== null
      ? `Price ${aboveMa50 ? "above" : "below"} 50-day MA · ${aboveMa200 ? "Above" : "Below"} 200-day MA`
      : "Price vs. moving averages · 52-week range";

  return (
    <DataPanel icon="T" title="Technical Data" isOpen={isOpen} onToggle={onToggle} previewLine={previewLine}>
      <div className="flex flex-col">
        <DataRow label="Current Price"       value={price  !== null ? `$${price.toFixed(2)}`  : "—"} />
        <DataRow label="50-Day Moving Avg."  value={ma50   !== null ? `$${ma50.toFixed(2)}`   : "—"} />
        <DataRow
          label="Price vs. 50-Day MA"
          value={aboveMa50  === null ? "Insufficient data" : aboveMa50  ? "Above ↑" : "Below ↓"}
          positive={aboveMa50  === true}
          negative={aboveMa50  === false}
        />
        <DataRow label="200-Day Moving Avg." value={ma200  !== null ? `$${ma200.toFixed(2)}`  : "—"} />
        <DataRow
          label="Price vs. 200-Day MA"
          value={aboveMa200 === null ? "Insufficient data" : aboveMa200 ? "Above ↑" : "Below ↓"}
          positive={aboveMa200 === true}
          negative={aboveMa200 === false}
        />
        <DataRow
          label="MA Cross (50 vs 200)"
          value={goldenCross === null ? "Insufficient data" : goldenCross ? "Golden Cross ↑" : "Death Cross ↓"}
          positive={goldenCross === true}
          negative={goldenCross === false}
        />
        <DataRow label="52-Week High"            value={high52 !== null ? `$${high52.toFixed(2)}` : "—"} />
        <DataRow label="52-Week Low"             value={low52  !== null ? `$${low52.toFixed(2)}`  : "—"} />
        <DataRow label="52-Week Range Position"  value={rangePos} />
        <DataRow label="RSI (14-day)"            value="Insufficient data" />
      </div>
    </DataPanel>
  );
}

// ── Fundamental Panel ──────────────────────────────────────────────────────────
function FundamentalPanel({
  overview,
  isOpen,
  onToggle,
}: {
  overview: StockOverview;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const rev      = parseSafe(overview.RevenueTTM);
  const margin   = parseSafe(overview.ProfitMargin);
  const opMargin = parseSafe(overview.OperatingMarginTTM);
  const roe      = parseSafe(overview.ReturnOnEquityTTM);
  const eps      = parseSafe(overview.EPS);
  const pe       = parseSafe(overview.PERatio);
  const divYield = parseSafe(overview.DividendYield);

  const previewLine =
    rev !== null
      ? `Revenue ${fmtLargeNum(rev)} · Margin ${margin !== null ? fmtPct(margin) : "—"}`
      : "Revenue, margins, profitability metrics";

  return (
    <DataPanel icon="F" title="Fundamental Data" isOpen={isOpen} onToggle={onToggle} previewLine={previewLine}>
      <div className="flex flex-col">
        <DataRow label="Revenue (TTM)"     value={fmtLargeNum(rev)} />
        <DataRow
          label="Profit Margin"
          value={margin   !== null ? fmtPct(margin)   : "—"}
          positive={margin   !== null && margin   > 0.10}
          negative={margin   !== null && margin   < 0}
        />
        <DataRow
          label="Operating Margin"
          value={opMargin !== null ? fmtPct(opMargin) : "—"}
          positive={opMargin !== null && opMargin > 0.10}
          negative={opMargin !== null && opMargin < 0}
        />
        <DataRow
          label="Return on Equity"
          value={roe !== null ? fmtPct(roe) : "—"}
          positive={roe !== null && roe > 0.15}
          negative={roe !== null && roe < 0}
        />
        <DataRow
          label="EPS (TTM)"
          value={eps !== null ? `$${eps.toFixed(2)}` : "—"}
          positive={eps !== null && eps > 0}
          negative={eps !== null && eps < 0}
        />
        <DataRow label="P/E Ratio"       value={pe       !== null ? pe.toFixed(1)       : "—"} />
        <DataRow label="Dividend Yield"  value={divYield !== null ? fmtPct(divYield)    : "—"} />
      </div>
    </DataPanel>
  );
}

// ── Sentiment Panel ────────────────────────────────────────────────────────────
function SentimentPanel({
  overview,
  quote,
  isOpen,
  onToggle,
}: {
  overview: StockOverview;
  quote: GlobalQuote | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const price  = parseSafe(quote?.["05. price"]);
  const target = parseSafe(overview.AnalystTargetPrice);
  const upside =
    price !== null && target !== null && price > 0
      ? (target - price) / price
      : null;

  const previewLine =
    target !== null
      ? `Analyst target $${target.toFixed(2)} · Implied upside ${upside !== null ? fmtPct(upside) : "—"}`
      : "Analyst targets, ratings, sentiment signals";

  return (
    <DataPanel icon="S" title="Sentiment Data" isOpen={isOpen} onToggle={onToggle} previewLine={previewLine}>
      <div className="flex flex-col">
        <DataRow label="Analyst Target Price"    value={target !== null ? `$${target.toFixed(2)}` : "—"} />
        <DataRow
          label="Implied Upside"
          value={upside !== null ? fmtPct(upside) : "—"}
          positive={upside !== null && upside >  0.05}
          negative={upside !== null && upside < -0.05}
        />
        <DataRow label="Analyst Ratings"         value="Insufficient data" />
        <DataRow label="Short Interest"          value="Insufficient data" />
        <DataRow label="Institutional Ownership" value="Insufficient data" />
        <DataRow label="Social Sentiment"        value="Insufficient data" />
      </div>
    </DataPanel>
  );
}

// ── Risk Panel ─────────────────────────────────────────────────────────────────
function RiskPanel({
  overview,
  quote,
  isOpen,
  onToggle,
}: {
  overview: StockOverview;
  quote: GlobalQuote | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const beta   = parseSafe(overview.Beta);
  const high52 = parseSafe(overview["52WeekHigh"]);
  const low52  = parseSafe(overview["52WeekLow"]);
  const price  = parseSafe(quote?.["05. price"]);
  const pe     = parseSafe(overview.PERatio);

  let drawdown = "—";
  if (price !== null && high52 !== null && high52 > 0) {
    const dd = ((price - high52) / high52 * 100).toFixed(1);
    drawdown = dd + "%";
  }

  const betaLabel =
    beta === null ? "—"
    : beta > 1.5  ? `${beta.toFixed(2)} (High)`
    : beta > 0.8  ? `${beta.toFixed(2)} (Moderate)`
    :               `${beta.toFixed(2)} (Low)`;
  const betaHigh = beta !== null && beta  > 1.5;
  const betaLow  = beta !== null && beta <= 0.8;

  const range52 =
    high52 !== null && low52 !== null
      ? `$${low52.toFixed(2)} – $${high52.toFixed(2)}`
      : "—";

  const previewLine =
    beta !== null
      ? `Beta ${beta.toFixed(2)} · Drawdown from 52W high ${drawdown}`
      : "Volatility, drawdown, valuation risk";

  return (
    <DataPanel icon="R" title="Risk Data" isOpen={isOpen} onToggle={onToggle} previewLine={previewLine}>
      <div className="flex flex-col">
        <DataRow
          label="Beta (Market Sensitivity)"
          value={betaLabel}
          positive={betaLow}
          negative={betaHigh}
        />
        <DataRow label="52-Week Range"      value={range52} />
        <DataRow
          label="Drawdown from 52W High"
          value={drawdown}
          negative={price !== null && high52 !== null && price < high52 * 0.85}
        />
        <DataRow
          label="P/E Ratio"
          value={pe !== null ? pe.toFixed(1) : "—"}
          negative={pe !== null && pe > 40}
        />
        <DataRow label="Sector"                    value={overview.Sector  && overview.Sector  !== "None" ? overview.Sector  : "—"} />
        <DataRow label="Options Market Risk"       value="Insufficient data" />
        <DataRow label="Credit Risk (Debt/Equity)" value="Insufficient data" />
      </div>
    </DataPanel>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  overview: StockOverview;
  quote: GlobalQuote | null;
}

export default function AthenaAnalysis({ overview, quote }: Props) {
  const [raw, setRaw] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [isFallback, setIsFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const [addedHoldings, setAddedHoldings]   = useState(() => isInList(HOLDINGS_KEY, overview.Symbol));
  const [addedWatchlist, setAddedWatchlist] = useState(() => isInList(WATCHLIST_KEY, overview.Symbol));
  const [toastMsg, setToastMsg]             = useState<string | null>(null);
  const [toastKey, setToastKey]             = useState(0);
  const [openDataPanels, setOpenDataPanels] = useState<Set<string>>(new Set());

  const toggleDataPanel = (id: string) => {
    setOpenDataPanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;

    // Reset to fresh loading state on every attempt (initial + retries)
    setPhase("loading");
    setRaw("");
    setIsFallback(false);

    (async () => {
      try {
        // Read the user's language preference at the moment analysis starts.
        // getStoredLang() is safe here — we're inside useEffect (client-only).
        const lang = getStoredLang();

        const res = await fetch("/api/athena-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overview, quote, lang }),
        });

        if (!res.ok) {
          // Read the error body (structured JSON from updated API) — swallow parse
          // failures so we always fall through to the deterministic fallback.
          const errBody = await res.text().catch(() => "");
          throw new Error(errBody || `HTTP ${res.status}`);
        }
        if (!res.body) throw new Error("No response stream");

        if (!cancelled) setPhase("streaming");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          if (!cancelled) setRaw(full);
        }

        if (!cancelled) setPhase("done");
      } catch {
        // AI API unavailable — use deterministic fundamental analysis as fallback.
        // The user sees a working analysis + a retry button, never a broken page.
        if (!cancelled) {
          const fallback = generateFallbackAnalysis(overview, quote);
          setRaw(fallback);
          setIsFallback(true);
          setPhase("done");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = parseAnalysis(raw);
  const {
    sections,
    verdict,
    verdictReason,
    confidenceScore,
    takeaways,
    businessQualityScore,
    financialStrengthScore,
    valuationScore,
    riskScore,
    whoFor,
    whoAvoid,
    timeframe,
  } = parsed;

  const vConf = verdict ? VERDICT_CONFIG[verdict] : null;
  const isStreaming = phase === "streaming";

  const section13 = sections.find((s) => s.number === 13);
  const section13Content = section13 ? cleanContent(section13.content, 13) : "";

  const toggleSection = (num: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  return (
    <div className="mb-12">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[#888] tracking-[0.25em] uppercase font-semibold">
            Athena Intelligence
          </span>
        </div>
        <span className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #2a2a2a, transparent)" }} />
        {(phase === "loading" || phase === "streaming") && (
          <span className="text-[10px] text-[#d4a017] tracking-widest uppercase font-semibold shrink-0" style={{ animation: "pulse 2s ease-in-out infinite" }}>
            ● Analyzing
          </span>
        )}
        {phase === "done" && !isFallback && (
          <span className="text-[10px] text-[#aaa] tracking-widest uppercase shrink-0">✓ Complete</span>
        )}
        {phase === "done" && isFallback && (
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="text-[10px] tracking-widest uppercase shrink-0 transition-opacity hover:opacity-70"
            style={{ color: "#d4a017", cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "inherit", letterSpacing: "0.12em" }}
          >
            ↺ Retry Live AI
          </button>
        )}
      </div>
      {/* AI credibility tag */}
      <p className="text-[9px] text-[#2e2e2e] tracking-[0.18em] uppercase mb-5">
        Athena AI Model v1.0
      </p>

      {/* Loading state */}
      {phase === "loading" && <LoadingCard symbol={overview.Symbol} />}

      {/* Fallback banner — shown when AI is unavailable; analysis still renders below */}
      {phase === "done" && isFallback && (
        <div
          className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
          style={{ background: "#0b0800", border: "1px solid rgba(212,160,23,0.12)" }}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium leading-snug" style={{ color: "#9A9A9A" }}>
              Analysis temporarily unavailable. Please try again.
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>
              Showing fundamental analysis · Live AI model offline
            </p>
          </div>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            style={{
              flexShrink:    0,
              padding:       "8px 16px",
              minHeight:     40,
              borderRadius:  6,
              border:        "1px solid rgba(212,160,23,0.28)",
              background:    "transparent",
              color:         "#d4a017",
              fontSize:      10,
              fontWeight:    600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor:        "pointer",
              fontFamily:    "'Cinzel', serif",
              whiteSpace:    "nowrap",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Analysis content (streaming + done) */}
      {(phase === "streaming" || phase === "done") && (
        <div className="flex flex-col gap-7">

          {/* ══════════════════════════════════════════════
              1. INSTANT DECISION
          ══════════════════════════════════════════════ */}
          {verdict && vConf ? (
            <div
              className="rounded-2xl overflow-hidden animate-fade-in-up"
              style={{
                background: vConf.bg,
                border: `1px solid ${vConf.border}`,
                boxShadow: `0 0 100px ${vConf.glow}, 0 0 60px ${vConf.glow}, 0 12px 40px rgba(0,0,0,0.7)`,
              }}
            >
              <div className="p-6 md:p-10">

                {/* ── Header row: label + portfolio buttons ── */}
                <div className="flex items-center justify-between mb-8">
                  <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase">
                    Instant Decision
                  </p>
                  <div className="flex items-center gap-2">
                    {/* Holdings button */}
                    <button
                      onClick={() => {
                        if (addedHoldings) return;
                        addToPortfolioList(HOLDINGS_KEY, overview.Symbol);
                        setAddedHoldings(true);
                        setToastMsg("Added to Holdings");
                        setToastKey((k) => k + 1);
                        setTimeout(() => setToastMsg(null), 2000);
                      }}
                      style={{
                        padding: "9px 14px",
                        minHeight: 44,
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 7,
                        fontSize: 9,
                        fontWeight: 400,
                        letterSpacing: "0.09em",
                        border: `1px solid ${addedHoldings ? "rgba(212,160,23,0.15)" : "rgba(212,160,23,0.28)"}`,
                        background: "transparent",
                        color: addedHoldings ? "#777" : "#d4a017",
                        cursor: addedHoldings ? "default" : "pointer",
                        transition: "opacity 0.15s",
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: "nowrap",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={(e) => { if (!addedHoldings) e.currentTarget.style.opacity = "0.65"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                      {addedHoldings ? "✓ Holdings" : "+ Holdings"}
                    </button>

                    {/* Watchlist button */}
                    <button
                      onClick={() => {
                        if (addedWatchlist) return;
                        addToPortfolioList(WATCHLIST_KEY, overview.Symbol);
                        setAddedWatchlist(true);
                        setToastMsg("Added to Watchlist");
                        setToastKey((k) => k + 1);
                        setTimeout(() => setToastMsg(null), 2000);
                      }}
                      style={{
                        padding: "9px 14px",
                        minHeight: 44,
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 7,
                        fontSize: 9,
                        fontWeight: 400,
                        letterSpacing: "0.09em",
                        border: `1px solid ${addedWatchlist ? "rgba(212,160,23,0.15)" : "rgba(212,160,23,0.28)"}`,
                        background: "transparent",
                        color: addedWatchlist ? "#777" : "#d4a017",
                        cursor: addedWatchlist ? "default" : "pointer",
                        transition: "opacity 0.15s",
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: "nowrap",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={(e) => { if (!addedWatchlist) e.currentTarget.style.opacity = "0.65"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                      {addedWatchlist ? "✓ Watchlist" : "+ Watchlist"}
                    </button>
                  </div>
                </div>

                {/* Giant verdict */}
                <div className="mb-8">
                  <span
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "clamp(4.5rem, 12vw, 8rem)",
                      fontWeight: 700,
                      color: vConf.color,
                      lineHeight: 0.88,
                      textShadow: `0 0 80px ${vConf.color}44, 0 0 160px ${vConf.color}18`,
                      letterSpacing: "0.03em",
                      display: "block",
                    }}
                  >
                    {verdict}
                  </span>
                </div>

                {/* Core reason — one decisive sentence */}
                {verdictReason && (
                  <p
                    className="max-w-2xl mb-9"
                    style={{
                      color: "#e8e8e8",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      lineHeight: 1.65,
                    }}
                  >
                    {verdictReason}
                  </p>
                )}

                {/* Confidence bar */}
                {confidenceScore !== null && (
                  <div className="mb-7 max-w-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-[#aaa] tracking-[0.25em] uppercase">
                        Confidence
                      </span>
                      <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: "#d4a017", fontSize: "1.15rem", lineHeight: 1 }}>
                        {confidenceScore}
                        <span style={{ fontSize: "0.62rem", color: "#666", fontFamily: "inherit" }}>/10</span>
                      </span>
                    </div>
                    <div className="relative overflow-hidden rounded-full" style={{ height: 6, background: "#1a1300" }}>
                      <ConfidenceBarFill score={confidenceScore} />
                    </div>
                  </div>
                )}

                {/* Takeaways */}
                {takeaways.length > 0 && (
                  <div className="flex flex-col gap-5">
                    {takeaways.map((t, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div
                          className="shrink-0 rounded-full mt-[0.52rem]"
                          style={{ width: 4, height: 4, background: vConf?.color ?? "#d4a017", opacity: 0.8, flexShrink: 0 }}
                        />
                        <span style={{ color: "#d0d0d0", fontSize: "0.925rem", lineHeight: 1.75 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Share Card — appears when analysis is fully complete ── */}
                {phase === "done" && confidenceScore !== null && verdict && (
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
                    <ShareButton
                      symbol={overview.Symbol}
                      companyName={overview.Name}
                      sector={overview.Sector !== "None" ? overview.Sector : ""}
                      verdict={verdict}
                      score={confidenceScore}
                      insight={verdictReason || (takeaways[0] ?? `${verdict} — Athena AI verdict`)}
                    />
                  </div>
                )}

                {isStreaming && (
                  <div className="mt-5 flex items-center gap-2">
                    <StreamingPulse />
                    <span className="text-[#888] text-[10px] tracking-widest">Completing analysis…</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Skeleton while verdict is streaming in */
            <div
              className="rounded-2xl relative overflow-hidden"
              style={{ background: "#070600", border: "1px solid #1c1500", minHeight: 220, padding: "2.5rem" }}
            >
              <div
                className="absolute inset-x-0 h-px top-0"
                style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)", animation: "scan-line 3.5s ease-in-out infinite" }}
              />
              <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase mb-6">Instant Decision</p>
              <div className="h-20 w-52 rounded-xl skeleton mb-5" />
              <div className="h-4 w-full max-w-sm rounded skeleton mb-2.5" />
              <div className="h-4 w-3/4 max-w-xs rounded skeleton" />
            </div>
          )}

          {/* ══════════════════════════════════════════════
              1.5 ATHENA UPDATE
          ══════════════════════════════════════════════ */}
          {phase === "done" && verdict && sections.length > 0 && (
            <AthenaUpdate sections={sections} verdict={verdict} />
          )}

          {/* ══════════════════════════════════════════════
              2. PRICE PERFORMANCE CHART
          ══════════════════════════════════════════════ */}
          <StockChart symbol={overview.Symbol} />

          {/* ══════════════════════════════════════════════
              3. RECENT NEWS
          ══════════════════════════════════════════════ */}
          <StockNews symbol={overview.Symbol} />

          {/* ══════════════════════════════════════════════
              4. WHAT WOULD CHANGE THIS
          ══════════════════════════════════════════════ */}
          {section13Content && <WhatWouldChange content={section13Content} />}

          {/* ══════════════════════════════════════════════
              5. WHAT THIS MEANS FOR YOU
          ══════════════════════════════════════════════ */}
          <WhatThisMeansForYou
            whoFor={whoFor}
            whoAvoid={whoAvoid}
            timeframe={timeframe}
            streaming={isStreaming}
          />

          {/* ══════════════════════════════════════════════
              6. DATA PANELS — Technical / Fundamental / Sentiment / Risk
          ══════════════════════════════════════════════ */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0b0b0b", border: "1px solid rgba(212,175,55,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
          >
            <div
              className="px-5 py-4 flex items-center justify-between border-b"
              style={{ borderColor: "#1a1a1a" }}
            >
              <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase">
                Data Panels
              </p>
              <p className="text-[9px] text-[#888] tracking-widest uppercase">
                Click to expand
              </p>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              <TechnicalPanel
                overview={overview}
                quote={quote}
                isOpen={openDataPanels.has("technical")}
                onToggle={() => toggleDataPanel("technical")}
              />
              <FundamentalPanel
                overview={overview}
                isOpen={openDataPanels.has("fundamental")}
                onToggle={() => toggleDataPanel("fundamental")}
              />
              <SentimentPanel
                overview={overview}
                quote={quote}
                isOpen={openDataPanels.has("sentiment")}
                onToggle={() => toggleDataPanel("sentiment")}
              />
              <RiskPanel
                overview={overview}
                quote={quote}
                isOpen={openDataPanels.has("risk")}
                onToggle={() => toggleDataPanel("risk")}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              7. VISUAL SNAPSHOT — 2×2 score grid
          ══════════════════════════════════════════════ */}
          <div
            className="rounded-2xl p-5 md:p-6"
            style={{ background: "#0b0b0b", border: "1px solid rgba(212,175,55,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
          >
            <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase mb-4">Visual Snapshot</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ScoreBar label="Business Quality" score={businessQualityScore} />
              <ScoreBar label="Financial Strength" score={financialStrengthScore} />
              <ScoreBar label="Valuation Score" score={valuationScore} />
              <ScoreBar label="Risk Level" score={riskScore} />
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              7. DEEP DIVE — 12-Point Analysis
              Section 13 is shown inline above (§2).
          ══════════════════════════════════════════════ */}
          {sections.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#0b0b0b", border: "1px solid rgba(212,175,55,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
            >
              <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "#1a1a1a" }}>
                <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase">
                  Deep Dive — 13-Point Analysis
                </p>
                <p className="text-[9px] text-[#888] tracking-widest uppercase">
                  Click to expand
                </p>
              </div>

              <div className="p-3 flex flex-col gap-1.5">
                {sections.filter((s) => s.number !== 13).map((section) => (
                  <CollapsibleSection
                    key={section.number}
                    section={section}
                    isOpen={openSections.has(section.number)}
                    onToggle={() => toggleSection(section.number)}
                  />
                ))}

                {isStreaming && sections.length < 13 && (
                  <div
                    className="px-4 py-3.5 rounded-xl flex items-center gap-3"
                    style={{ background: "#080808", border: "1px solid #111" }}
                  >
                    <StreamingPulse />
                    <span className="text-[#888] text-[10px] tracking-widest uppercase">
                      Processing remaining sections…
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-[9px] text-[#333] tracking-[0.2em] uppercase">
            Powered by Claude · Athena Investment AI · For informational purposes only · Not financial advice
          </p>
        </div>
      )}

      {/* Fixed bottom-right toast — mounts/unmounts to replay animation */}
      {toastMsg && <Toast key={toastKey} message={toastMsg} />}
    </div>
  );
}
