/**
 * MarketPulse — compact live market snapshot for homepage.
 * Server component: fetches VIX, SPY, and sector ETF data on render.
 */
import Link from "next/link";
import { fetchRobustQuotes } from "@/lib/marketRegime";

const SECTORS = [
  { sym: "XLK", label: "Tech" },
  { sym: "XLF", label: "Finance" },
  { sym: "XLV", label: "Health" },
  { sym: "XLY", label: "Cons.D" },
  { sym: "XLE", label: "Energy" },
  { sym: "XLI", label: "Industr." },
];

function pctColor(pct: number): string {
  if (pct >  1.0) return "#4ade80";
  if (pct >  0.2) return "#86efac";
  if (pct > -0.2) return "#888";
  if (pct > -1.0) return "#fca5a5";
  return "#f87171";
}

export default async function MarketPulse() {
  let quotes: Awaited<ReturnType<typeof fetchRobustQuotes>>;
  try {
    quotes = await fetchRobustQuotes([
      "^VIX", "SPY",
      ...SECTORS.map((s) => s.sym),
    ]);
  } catch {
    return null;
  }

  const vix    = quotes["^VIX"]?.price ?? null;
  const spyPct = quotes["SPY"]?.changePct ?? null;

  const vixLabel =
    vix === null ? "—"
    : vix < 13   ? "Calm"
    : vix < 18   ? "Normal"
    : vix < 24   ? "Elevated"
    : "Fear";

  const vixColor =
    vix === null ? "#555"
    : vix < 13   ? "#4ade80"
    : vix < 18   ? "#d4a017"
    : vix < 24   ? "#fb923c"
    : "#f87171";

  return (
    <div className="w-full max-w-[900px] mt-8">
      <div
        className="rounded-2xl p-5"
        style={{
          background:  "#0b0b0b",
          border:      "1px solid rgba(212,175,55,0.12)",
          boxShadow:   "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] text-[#aaa] tracking-[0.4em] uppercase">Market Pulse</p>
          <Link
            href="/markets"
            className="text-[9px] tracking-widest uppercase font-semibold hover:opacity-70 transition-opacity"
            style={{ color: "#d4a017" }}
          >
            View Markets →
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Left: VIX + SPY */}
          <div className="flex gap-4 sm:flex-col sm:gap-3 sm:w-32 shrink-0">
            {/* VIX */}
            <div
              className="flex-1 sm:flex-none rounded-xl p-3"
              style={{ background: "#0f0f0f", border: "1px solid #1a1a1a" }}
            >
              <p className="text-[9px] text-[#555] tracking-widest uppercase mb-1">VIX</p>
              <p className="font-bold" style={{ fontFamily: "'Cinzel', serif", fontSize: "1.2rem", color: vixColor, lineHeight: 1 }}>
                {vix !== null ? vix.toFixed(1) : "—"}
              </p>
              <p className="text-[9px] mt-1" style={{ color: vixColor }}>{vixLabel}</p>
            </div>

            {/* S&P 500 daily */}
            <div
              className="flex-1 sm:flex-none rounded-xl p-3"
              style={{ background: "#0f0f0f", border: "1px solid #1a1a1a" }}
            >
              <p className="text-[9px] text-[#555] tracking-widest uppercase mb-1">S&amp;P 500</p>
              <p className="font-bold" style={{ fontFamily: "'Cinzel', serif", fontSize: "1.2rem", color: spyPct !== null ? pctColor(spyPct) : "#888", lineHeight: 1 }}>
                {spyPct !== null ? `${spyPct >= 0 ? "+" : ""}${spyPct.toFixed(2)}%` : "—"}
              </p>
              <p className="text-[9px] mt-1 text-[#555]">Today</p>
            </div>
          </div>

          {/* Right: Sector bars */}
          <div className="flex-1">
            <p className="text-[9px] text-[#555] tracking-widest uppercase mb-3">Sectors Today</p>
            <div className="flex flex-col gap-2">
              {SECTORS.map(({ sym, label }) => {
                const pct = quotes[sym]?.changePct ?? null;
                const color = pct !== null ? pctColor(pct) : "#333";
                const barPct = pct !== null ? Math.min(100, Math.abs(pct) * 20) : 0;
                const isPos  = pct !== null && pct >= 0;

                return (
                  <div key={sym} className="flex items-center gap-3">
                    <span className="text-[10px] w-16 shrink-0" style={{ color: "#888" }}>{label}</span>
                    <div className="flex-1 relative h-1.5 rounded-full" style={{ background: "#1a1a1a" }}>
                      <div
                        style={{
                          position:     "absolute",
                          top:          0,
                          [isPos ? "left" : "right"]: "50%",
                          width:        `${barPct / 2}%`,
                          height:       "100%",
                          background:   color,
                          borderRadius: 9999,
                        }}
                      />
                      {/* Center line */}
                      <div style={{ position: "absolute", top: 0, left: "50%", width: 1, height: "100%", background: "#333" }} />
                    </div>
                    <span className="text-[10px] w-14 text-right shrink-0 font-mono" style={{ color }}>
                      {pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
