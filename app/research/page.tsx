import type { Metadata } from "next";
import Link from "next/link";
import NavLink from "@/components/NavLink";
import TickerInput from "@/components/TickerInput";
import ResearchHoverCard from "@/components/ResearchHoverCard";
import { RESEARCH_ARTICLES } from "@/lib/research-data";
import { fetchSimpleQuotes } from "@/lib/yahoo";

export const metadata: Metadata = {
  title: "Research",
  description:
    "AI-curated market intelligence for long-term investors. Sector insights, earnings watch, macro briefings, and deep research.",
  alternates: {
    canonical: "/research",
  },
};

// ── Static data ────────────────────────────────────────────────────────────────

const MARKET_BRIEF = {
  regime: "Constructive",
  regimeScore: 68,
  macro:
    "Technology leadership continues as AI infrastructure spending remains strong while defensive sectors lag. Bond yields stable near 4.3%, indicating neutral macro pressure. Credit spreads tight — risk appetite intact.",
  signals: [
    {
      label: "Yield Curve",
      value: "Slight inversion · caution flag",
      status: "cautious" as const,
    },
    {
      label: "Credit Spreads",
      value: "Tightening · risk appetite healthy",
      status: "positive" as const,
    },
    {
      label: "Fed Stance",
      value: "Data-dependent · 2 cuts priced for 2026",
      status: "neutral" as const,
    },
  ],
};

interface SectorCard {
  name: string;
  trend: "bullish" | "neutral" | "bearish";
  insight: string;
}

const SECTORS: SectorCard[] = [
  {
    name: "Technology",
    trend: "bullish",
    insight:
      "Momentum strong — AI infrastructure demand accelerating across hyperscalers.",
  },
  {
    name: "Healthcare",
    trend: "neutral",
    insight:
      "Defensive positioning improving as GLP-1 drug cycle reshapes pharma revenue.",
  },
  {
    name: "Financials",
    trend: "neutral",
    insight:
      "Margins pressured by yield curve dynamics; watch for net interest income updates.",
  },
  {
    name: "Energy",
    trend: "bearish",
    insight: "Demand uncertainty weighing on crude; geopolitical premium fading.",
  },
  {
    name: "Consumer Disc.",
    trend: "bullish",
    insight:
      "Resilient spending data supports premium brands; travel & leisure outperforming.",
  },
  {
    name: "Industrials",
    trend: "neutral",
    insight:
      "Re-shoring tailwind intact but order books softening into H2 2026.",
  },
];

interface EarningsEvent {
  ticker: string;
  company: string;
  date: string;
  insight: string;
  importance: "high" | "medium";
}

const EARNINGS: EarningsEvent[] = [
  {
    ticker: "NVDA",
    company: "Nvidia",
    date: "May 28",
    insight:
      "AI demand expectations extremely elevated. Any guidance miss will be punished.",
    importance: "high",
  },
  {
    ticker: "MSFT",
    company: "Microsoft",
    date: "Jul 23",
    insight:
      "Azure cloud growth and Copilot monetisation are the key metrics to monitor.",
    importance: "high",
  },
  {
    ticker: "AMZN",
    company: "Amazon",
    date: "Aug 1",
    insight:
      "AWS margin expansion and advertising revenue will drive the reaction.",
    importance: "high",
  },
  {
    ticker: "META",
    company: "Meta",
    date: "Jul 30",
    insight:
      "Ad spend recovery and AI capex efficiency are the two swing factors.",
    importance: "medium",
  },
  {
    ticker: "AAPL",
    company: "Apple",
    date: "Aug 5",
    insight:
      "iPhone cycle and Services margin are the focal points. China risk watch.",
    importance: "medium",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  positive: "#4ade80",
  neutral: "#60a5fa",
  cautious: "#fb923c",
} as const;

const TREND_COLOR = {
  bullish: "#4ade80",
  neutral: "#777",
  bearish: "#f87171",
} as const;

const TREND_LABEL = {
  bullish: "Bullish",
  neutral: "Neutral",
  bearish: "Bearish",
} as const;

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-7">
      <p
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.78rem",
          color: "#999",
          letterSpacing: "0.14em",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </p>
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(90deg, #2a2a2a 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ResearchPage() {
  // ── Fetch live market data ─────────────────────────────────────────────────
  const quotes = await fetchSimpleQuotes([
    "SPY", "^VIX",
    "XLK", "XLC", "XLY", "XLF", "XLI", "XLB", "XLV", "XLP", "XLRE", "XLU", "XLE",
  ]);

  // Fetch live earnings calendar
  let liveEarnings: Array<{ ticker: string; company: string; date: string; hour: string }> = [];
  try {
    const earningsRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/earnings-calendar`,
      { next: { revalidate: 3600 } },
    );
    if (earningsRes.ok) {
      const earningsData = await earningsRes.json();
      liveEarnings = earningsData.earnings ?? [];
    }
  } catch {
    // fall through to static data
  }

  const vixPrice     = quotes["^VIX"]?.price ?? 20;
  const spyChangePct = quotes["SPY"]?.changePct ?? 0;

  // Compute live regime score (same formula as markets page)
  let vixPts: number;
  if (vixPrice < 12)       vixPts = 55;
  else if (vixPrice < 15)  vixPts = 46;
  else if (vixPrice < 18)  vixPts = 36;
  else if (vixPrice < 22)  vixPts = 24;
  else if (vixPrice < 27)  vixPts = 12;
  else if (vixPrice < 35)  vixPts = 4;
  else                     vixPts = 0;

  let spyPts: number;
  if (spyChangePct > 2)         spyPts = 45;
  else if (spyChangePct > 1)    spyPts = 36;
  else if (spyChangePct > 0.3)  spyPts = 26;
  else if (spyChangePct > -0.3) spyPts = 18;
  else if (spyChangePct > -1)   spyPts = 10;
  else if (spyChangePct > -2)   spyPts = 4;
  else                          spyPts = 0;

  const liveScore = Math.min(100, Math.max(0, vixPts + spyPts));

  const liveRegimeLabel =
    liveScore >= 80 ? "Risk-On" :
    liveScore >= 60 ? "Constructive" :
    liveScore >= 40 ? "Neutral" :
    liveScore >= 20 ? "Defensive" : "Risk-Off";

  const liveMacro =
    liveScore >= 60
      ? `Technology leadership continues as AI infrastructure spending remains strong. Bond yields stable, credit spreads tight — risk appetite intact. VIX at ${vixPrice.toFixed(1)} confirms a low-fear environment.`
      : liveScore >= 40
      ? `Market environment mixed with sectors rotating defensively. VIX at ${vixPrice.toFixed(1)} indicates elevated caution. Balanced positioning recommended until trend clarifies.`
      : `Risk-off signals dominate — VIX elevated at ${vixPrice.toFixed(1)}, defensives outperforming. Capital preservation priority; monitor credit spreads and Fed commentary for re-entry signals.`;

  // Derive sector trends from live ETF performance
  function getSectorTrend(sym: string): "bullish" | "neutral" | "bearish" {
    const pct = quotes[sym]?.changePct ?? 0;
    if (pct > 0.5)  return "bullish";
    if (pct < -0.5) return "bearish";
    return "neutral";
  }

  const LIVE_SECTORS: SectorCard[] = [
    {
      name: "Technology",
      trend: getSectorTrend("XLK"),
      insight: "AI infrastructure demand accelerating across hyperscalers; momentum in semis and cloud.",
    },
    {
      name: "Healthcare",
      trend: getSectorTrend("XLV"),
      insight: "Defensive positioning improving as GLP-1 drug cycle reshapes pharma revenue.",
    },
    {
      name: "Financials",
      trend: getSectorTrend("XLF"),
      insight: "Margins shaped by yield curve dynamics; net interest income key metric to watch.",
    },
    {
      name: "Energy",
      trend: getSectorTrend("XLE"),
      insight: "Demand uncertainty weighing on crude; geopolitical premium fading.",
    },
    {
      name: "Consumer Disc.",
      trend: getSectorTrend("XLY"),
      insight: "Resilient spending data supports premium brands; travel and leisure outperforming.",
    },
    {
      name: "Industrials",
      trend: getSectorTrend("XLI"),
      insight: "Re-shoring tailwind intact but order books softening into H2 2026.",
    },
  ];

  return (
    <div className="relative flex-1 bg-black flex flex-col">
      {/* Top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(212,160,23,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center gap-6 px-8 py-4 border-b border-[#1a1a1a]">
        <Link
          href="/"
          className="shrink-0 font-bold tracking-widest hover:opacity-80 transition-opacity"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "1.1rem",
            background:
              "linear-gradient(135deg, #d4a017 0%, #f0c040 50%, #a07810 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ATHENA
        </Link>

        <div className="flex-1 max-w-xs hidden md:block">
          <TickerInput compact />
        </div>

        <div className="ml-auto flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-5">
            <NavLink href="/markets"   label="Markets"   tooltip="Live market intelligence" />
            <NavLink href="/screener"  label="Screener"  tooltip="Discover quality stocks"   />
            <NavLink href="/research"  label="Research"  tooltip="AI market insights"       active />
            <NavLink href="/portfolio" label="Portfolio" tooltip="Track your holdings"      />
          </nav>
          <Link
            href="/"
            className="text-[11px] text-[#555] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            ← Home
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 md:px-12 py-10">

        {/* ── Page title ── */}
        <div className="flex items-start justify-between gap-4 mb-12 pb-8 border-b border-[#161616]">
          <div>
            <h1
              className="text-white font-bold tracking-wider mb-2"
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "2rem",
                lineHeight: 1,
              }}
            >
              Research
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#666",
                fontWeight: 300,
              }}
            >
              AI-curated intelligence for long-term investors.
            </p>
          </div>

          {/* Live badge */}
          <span
            className="shrink-0"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 20,
              border: "1px solid rgba(74,222,128,0.2)",
              background: "rgba(74,222,128,0.05)",
              fontSize: 9,
              color: "#4ade80",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#4ade80",
                display: "inline-block",
                opacity: 0.85,
              }}
            />
            Live · 15min delay
          </span>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            1. ATHENA MARKET BRIEF
        ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-14">
          <SectionLabel>Athena Market Brief</SectionLabel>

          <div
            className="rounded-2xl p-8 md:p-10"
            style={{
              background:
                "linear-gradient(160deg, #0c0900 0%, #080600 60%, #0c0900 100%)",
              border: "1px solid rgba(212,160,23,0.16)",
              boxShadow: "0 0 60px rgba(212,160,23,0.05)",
            }}
          >
            {/* Regime row */}
            <div className="flex items-center gap-3 mb-6">
              <span
                style={{
                  fontSize: 9,
                  color: "#666",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                }}
              >
                Market Regime
              </span>
              <span
                style={{
                  padding: "2px 10px",
                  borderRadius: 20,
                  background: "rgba(212,160,23,0.1)",
                  border: "1px solid rgba(212,160,23,0.25)",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#d4a017",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                {liveRegimeLabel} · {liveScore}
              </span>
            </div>

            {/* Macro paragraph */}
            <p
              className="mb-8 leading-relaxed"
              style={{ fontSize: "0.92rem", color: "#bbb", maxWidth: 620 }}
            >
              {liveMacro}
            </p>

            {/* Signal rows */}
            <div
              className="flex flex-col"
              style={{ borderTop: "1px solid #1a1a1a" }}
            >
              {MARKET_BRIEF.signals.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-4 py-3"
                  style={{ borderBottom: "1px solid #141414" }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: STATUS_COLOR[s.status],
                      flexShrink: 0,
                      boxShadow: `0 0 5px ${STATUS_COLOR[s.status]}`,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "#999",
                      letterSpacing: "0.08em",
                      width: 110,
                      flexShrink: 0,
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#888",
                      lineHeight: 1.5,
                    }}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. SECTOR INTELLIGENCE
        ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-14">
          <SectionLabel>Sector Intelligence</SectionLabel>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LIVE_SECTORS.map((sector) => (
              <div
                key={sector.name}
                className="p-5 rounded-2xl flex flex-col gap-3"
                style={{
                  background:
                    "linear-gradient(135deg, #0f0f0f 0%, #0a0a0a 100%)",
                  border: "1px solid #1e1e1e",
                }}
              >
                {/* Name + trend */}
                <div className="flex items-center justify-between gap-2">
                  <p
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#ddd",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {sector.name}
                  </p>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: TREND_COLOR[sector.trend],
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      padding: "1px 7px",
                      borderRadius: 10,
                      background: `${TREND_COLOR[sector.trend]}12`,
                      border: `1px solid ${TREND_COLOR[sector.trend]}30`,
                    }}
                  >
                    {TREND_LABEL[sector.trend]}
                  </span>
                </div>

                {/* Insight */}
                <p
                  style={{
                    fontSize: "0.79rem",
                    color: "#888",
                    lineHeight: 1.65,
                  }}
                >
                  {sector.insight}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. EARNINGS WATCH
        ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-14">
          <SectionLabel>Earnings Watch</SectionLabel>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
          >
            {(liveEarnings.length > 0
              ? liveEarnings.map((e) => ({
                  ticker:     e.ticker,
                  company:    e.company,
                  date:       new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                  insight:    EARNINGS.find((s) => s.ticker === e.ticker)?.insight ?? "Monitor earnings for results vs. consensus estimates.",
                  importance: (EARNINGS.find((s) => s.ticker === e.ticker)?.importance ?? "medium") as "high" | "medium",
                }))
              : EARNINGS
            ).map((ev, i) => (
              <div
                key={ev.ticker}
                className="flex items-start gap-5 px-6 py-5"
                style={{
                  borderBottom:
                    i < (liveEarnings.length > 0 ? liveEarnings.length : EARNINGS.length) - 1 ? "1px solid #141414" : "none",
                }}
              >
                {/* Importance dot */}
                <div
                  className="shrink-0 mt-1"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      ev.importance === "high" ? "#d4a017" : "#333",
                    boxShadow:
                      ev.importance === "high"
                        ? "0 0 6px rgba(212,160,23,0.5)"
                        : "none",
                  }}
                />

                {/* Ticker + company */}
                <div className="shrink-0 w-28">
                  <p
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#d4a017",
                      letterSpacing: "0.06em",
                      lineHeight: 1,
                      marginBottom: 4,
                    }}
                  >
                    {ev.ticker}
                  </p>
                  <p
                    style={{
                      fontSize: 9,
                      color: "#666",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {ev.company}
                  </p>
                </div>

                {/* Date */}
                <div className="shrink-0 w-16 mt-0.5">
                  <span
                    style={{
                      fontSize: 9,
                      color: "#777",
                      letterSpacing: "0.08em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {ev.date}
                  </span>
                </div>

                {/* Insight */}
                <p
                  className="flex-1"
                  style={{
                    fontSize: "0.8rem",
                    color: "#888",
                    lineHeight: 1.65,
                  }}
                >
                  {ev.insight}
                </p>
              </div>
            ))}
          </div>

          <p
            className="mt-3 text-right"
            style={{
              fontSize: 9,
              color: "#333",
              letterSpacing: "0.1em",
            }}
          >
            Dates approximate · Verify with investor relations
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            4. DEEP INTELLIGENCE
        ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <SectionLabel>Deep Intelligence</SectionLabel>

          <div className="flex flex-col gap-4">
            {RESEARCH_ARTICLES.map((card) => (
              <ResearchHoverCard key={card.slug} card={card} />
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p
          className="text-center text-[9px] tracking-[0.22em] uppercase"
          style={{ color: "#2a2a2a" }}
        >
          Market data via Yahoo Finance · 15-min delay · For informational purposes only · Not financial advice
        </p>
      </main>
    </div>
  );
}
