import type { Metadata } from "next";
import Link from "next/link";
import TickerInput from "@/components/TickerInput";
import LanguageSelector from "@/components/LanguageSelector";
import ResearchHoverCard from "@/components/ResearchHoverCard";
import { RESEARCH_ARTICLES } from "@/lib/research-data";

export const metadata: Metadata = {
  title: "Research — Athena AI",
  description:
    "AI-curated market intelligence for long-term investors. Sector insights, earnings watch, macro briefings, and deep research.",
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
export default function ResearchPage() {
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
          <LanguageSelector />
          <nav className="hidden md:flex items-center gap-5">
            <Link
              href="/markets"
              className="text-[11px] text-[#666] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
            >
              Markets
            </Link>
            <Link
              href="/screener"
              className="text-[11px] text-[#666] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
            >
              Screener
            </Link>
            <Link
              href="/research"
              className="text-[11px] tracking-widest uppercase font-semibold transition-colors duration-200"
              style={{ color: "#d4a017" }}
            >
              Research
            </Link>
            <Link
              href="/portfolio"
              className="text-[11px] text-[#666] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
            >
              Portfolio
            </Link>
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

          {/* Simulated badge */}
          <span
            className="shrink-0"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 20,
              border: "1px solid rgba(212,160,23,0.2)",
              background: "rgba(212,160,23,0.05)",
              fontSize: 9,
              color: "#8a6820",
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
                background: "#8a6820",
                display: "inline-block",
                opacity: 0.7,
              }}
            />
            Simulated Intelligence
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
                {MARKET_BRIEF.regime} · {MARKET_BRIEF.regimeScore}
              </span>
            </div>

            {/* Macro paragraph */}
            <p
              className="mb-8 leading-relaxed"
              style={{ fontSize: "0.92rem", color: "#bbb", maxWidth: 620 }}
            >
              {MARKET_BRIEF.macro}
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
            {SECTORS.map((sector) => (
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
            {EARNINGS.map((ev, i) => (
              <div
                key={ev.ticker}
                className="flex items-start gap-5 px-6 py-5"
                style={{
                  borderBottom:
                    i < EARNINGS.length - 1 ? "1px solid #141414" : "none",
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
            Dates approximate · Simulated data
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
          Simulated intelligence · For illustrative purposes only · Not
          financial advice
        </p>
      </main>
    </div>
  );
}
