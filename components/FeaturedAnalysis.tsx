import Link from "next/link";
import { computeScore } from "@/lib/scoring";

// ── Static featured card — manually curated, never driven by live API ─────────
// Score and verdict are derived from the shared Athena formula so they always
// match what the Analyze page and Screener show for this stock.
//
// Update these manually when market conditions change:
const FEATURED_METRICS = {
  ticker:        "NVDA",
  pe:            44.2,
  roe:           91.4,
  profitMargin:  53.4,
  revenueGrowth: 122.4,
  beta:          1.7,
  summary: "NVIDIA is a dominant and highly profitable business, but its current stock price fully reflects its exceptional growth.",
} as const;

const { score: FEATURED_SCORE, verdict: FEATURED_VERDICT } = computeScore(FEATURED_METRICS);

// ── Shared card shell ─────────────────────────────────────────────────────────
function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full mt-8">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:  "#0b0b0b",
          border:      "1px solid rgba(212,175,55,0.15)",
          borderLeft:  "3px solid rgba(212,160,23,0.45)",
          boxShadow:   "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Subtle inner glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 10% 50%, rgba(212,160,23,0.04) 0%, transparent 65%)",
          }}
        />
        <div className="relative p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FeaturedAnalysis() {
  return (
    <CardShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-[#555] tracking-widest uppercase font-medium">
          Featured Analysis
        </span>
        <span className="text-[10px] text-[#555] tracking-widest uppercase font-medium">
          Athena AI
        </span>
      </div>

      {/* Ticker · Verdict · Confidence */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-xl font-bold text-white"
          style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}
        >
          {FEATURED_METRICS.ticker}
        </span>

        {/* Verdict badge — color from formula */}
        <span
          className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded"
          style={{
            background: "rgba(212,160,23,0.1)",
            color:      "#d4a017",
            border:     "1px solid rgba(212,160,23,0.2)",
          }}
        >
          {FEATURED_VERDICT}
        </span>

        <div className="ml-auto flex items-baseline gap-1">
          <span className="text-[10px] text-[#444] tracking-widest uppercase mr-1">
            Confidence
          </span>
          <span
            className="text-lg font-bold"
            style={{ fontFamily: "'Cinzel', serif", color: "#d4a017" }}
          >
            {Math.round(FEATURED_SCORE)}
          </span>
          <span className="text-xs" style={{ color: "#333" }}>/10</span>
        </div>
      </div>

      {/* Gold fade divider */}
      <div
        className="h-px mb-3"
        style={{
          background: "linear-gradient(to right, rgba(212,160,23,0.15), transparent)",
        }}
      />

      {/* Editorial summary */}
      <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#CFCFCF" }}>
        {FEATURED_METRICS.summary}
      </p>

      {/* CTA */}
      <Link
        href={`/analyze/${FEATURED_METRICS.ticker}`}
        className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase hover:text-white transition-colors duration-200"
        style={{ color: "#d4a017" }}
      >
        View Full Analysis
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </CardShell>
  );
}
