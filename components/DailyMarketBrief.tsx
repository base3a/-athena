import Link from "next/link";

// ── Types — ready for future dynamic AI-generated data ──────────────────────
export interface MarketSignal {
  text: string;
  sentiment?: "positive" | "neutral" | "caution";
}

export interface DailyBriefData {
  date: string;
  regime: string;
  regimeScore: number;
  summaryLines: string[];
  signals: MarketSignal[];
}

// ── Placeholder data — replace with live AI-generated summary ───────────────
const BRIEF_DATA: DailyBriefData = {
  date: "Mar 8, 2026",
  regime: "Constructive",
  regimeScore: 68,
  summaryLines: [
    "Markets opening positive.",
    "AI infrastructure demand accelerating.",
    "Semiconductor momentum remains strong.",
    "Bond volatility stabilizing.",
  ],
  signals: [
    { text: "AI infrastructure demand accelerating", sentiment: "positive" },
    { text: "Semiconductor momentum remains strong",  sentiment: "positive" },
    { text: "Bond volatility stabilizing",            sentiment: "positive" },
    { text: "Risk appetite improving across equities", sentiment: "positive" },
  ],
};

function sentimentDot(sentiment: MarketSignal["sentiment"]): string {
  if (sentiment === "positive") return "#4ade80";
  if (sentiment === "caution")  return "#f59e0b";
  return "#d4a017";
}

export default function DailyMarketBrief({ data = BRIEF_DATA }: { data?: DailyBriefData }) {
  return (
    <div className="w-full max-w-xl md:max-w-[900px] mt-8">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:  "#0b0b0b",
          border:      "1px solid rgba(212,175,55,0.15)",
          borderLeft:  "3px solid rgba(212,160,23,0.45)",
          boxShadow:   "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Inner glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 10% 50%, rgba(212,160,23,0.04) 0%, transparent 65%)",
          }}
        />

        <div className="relative p-5 text-left">

          {/* ── Header row ── */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse-slow"
                style={{ background: "#d4a017" }}
              />
              <span
                className="text-[10px] tracking-widest uppercase font-medium"
                style={{ color: "#7A7A7A" }}
              >
                Athena Daily Market Brief
              </span>
            </div>
            <span
              className="text-[10px] tracking-wide tabular-nums"
              style={{ color: "#444" }}
            >
              {data.date}
            </span>
          </div>

          {/* ── Regime row ── */}
          <div className="flex items-center gap-2.5 mb-4">
            <span
              className="text-[11px] tracking-wide"
              style={{ color: "#7A7A7A" }}
            >
              Market Regime:
            </span>
            <span
              className="text-[11px] font-semibold tracking-wide"
              style={{ color: "#d4a017" }}
            >
              {data.regime}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ fontFamily: "'Cinzel', serif", color: "#c49a28" }}
            >
              {data.regimeScore}
            </span>

            {/* Score bar */}
            <div
              className="flex-1 h-px ml-1"
              style={{
                background: `linear-gradient(to right, rgba(212,160,23,0.4) ${data.regimeScore}%, rgba(255,255,255,0.05) ${data.regimeScore}%)`,
              }}
            />
          </div>

          {/* Gold fade divider */}
          <div
            className="h-px mb-4"
            style={{
              background:
                "linear-gradient(to right, rgba(212,160,23,0.15), transparent)",
            }}
          />

          {/* ── Summary lines ── */}
          <div className="flex flex-col gap-1.5 mb-5">
            {data.summaryLines.map((line, i) => (
              <p
                key={i}
                className="text-[13px] leading-relaxed"
                style={{ color: "#CFCFCF" }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* ── Key Signals ── */}
          <div className="mb-5">
            <p
              className="text-[9px] tracking-widest uppercase font-semibold mb-3 text-left"
              style={{ color: "#555" }}
            >
              Key Signals Today
            </p>
            <ul className="flex flex-col gap-2">
              {data.signals.map((signal, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5"
                >
                  <span
                    className="w-1 h-1 rounded-full flex-shrink-0 mt-[6px]"
                    style={{ background: sentimentDot(signal.sentiment) }}
                  />
                  <span
                    className="text-[13px] leading-snug"
                    style={{ color: "#CFCFCF" }}
                  >
                    {signal.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── CTA ── */}
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase hover:text-white transition-colors duration-200"
            style={{ color: "#d4a017" }}
          >
            Full Market View
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

        </div>
      </div>
    </div>
  );
}
