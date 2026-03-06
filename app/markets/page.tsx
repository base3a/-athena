import Link from "next/link";
import type { Metadata } from "next";
import TickerInput from "@/components/TickerInput";
import LanguageSelector from "@/components/LanguageSelector";

export const metadata: Metadata = {
  title: "Markets — Athena AI",
  description:
    "Is this a risk-on or risk-off environment? Athena's composite market regime indicator gives you a clear answer in seconds.",
};

// ── Mock Data ──────────────────────────────────────────────────────────────────

interface MarketCard {
  label: string;
  symbol: string;
  value: string;
  change: string;
  changePct: number;
  sparkData: number[];
  interpretation: string;
  invert?: boolean; // true = falling value is positive (VIX, DXY)
}

const SNAPSHOT_CARDS: MarketCard[] = [
  {
    label: "S&P 500",
    symbol: "SPX",
    value: "5,648",
    change: "+46.2",
    changePct: 0.82,
    sparkData: [5590, 5604, 5598, 5615, 5622, 5619, 5634, 5641, 5645, 5648],
    interpretation: "Trading near highs; earnings momentum intact.",
  },
  {
    label: "Nasdaq 100",
    symbol: "NDX",
    value: "17,824",
    change: "+218",
    changePct: 1.24,
    sparkData: [17520, 17565, 17540, 17600, 17640, 17625, 17710, 17768, 17800, 17824],
    interpretation: "Tech premium holds; AI spend cycle continuing.",
  },
  {
    label: "Dow Jones",
    symbol: "DJI",
    value: "41,510",
    change: "+186",
    changePct: 0.45,
    sparkData: [41280, 41310, 41295, 41340, 41360, 41350, 41390, 41415, 41490, 41510],
    interpretation: "Value and defensives holding; rotation cautious.",
  },
  {
    label: "VIX",
    symbol: "VIX",
    value: "16.4",
    change: "−0.65",
    changePct: -3.81,
    sparkData: [17.1, 16.9, 17.0, 16.7, 16.5, 16.6, 16.4, 16.3, 16.4, 16.4],
    interpretation: "Volatility suppressed; low fear environment.",
    invert: true,
  },
  {
    label: "US 10Y Yield",
    symbol: "TNX",
    value: "4.38%",
    change: "+0.03",
    changePct: 0.69,
    sparkData: [4.35, 4.36, 4.35, 4.37, 4.38, 4.37, 4.38, 4.39, 4.38, 4.38],
    interpretation: "Yield range-bound; no rate shock priced.",
  },
  {
    label: "Gold",
    symbol: "GC",
    value: "$3,140",
    change: "+18.4",
    changePct: 0.59,
    sparkData: [3118, 3122, 3115, 3125, 3130, 3128, 3135, 3138, 3141, 3140],
    interpretation: "Haven demand mild; not signalling stress.",
  },
  {
    label: "Bitcoin",
    symbol: "BTC",
    value: "$87,200",
    change: "+1,820",
    changePct: 2.13,
    sparkData: [85400, 86200, 85900, 86500, 87000, 86800, 87100, 87300, 87150, 87200],
    interpretation: "Risk assets bid; crypto echoing equity strength.",
  },
  {
    label: "Dollar Index",
    symbol: "DXY",
    value: "104.2",
    change: "−0.16",
    changePct: -0.15,
    sparkData: [104.5, 104.4, 104.5, 104.3, 104.2, 104.3, 104.2, 104.1, 104.2, 104.2],
    interpretation: "Dollar softening; tailwind for non-US assets.",
    invert: true,
  },
];

// ── Regime ────────────────────────────────────────────────────────────────────
const REGIME = {
  score: 68,
  label: "CONSTRUCTIVE",
  color: "#d4a017",
  bg: "rgba(212,160,23,0.05)",
  border: "rgba(212,160,23,0.18)",
  glow: "rgba(212,160,23,0.10)",
  interpretation:
    "Risk appetite healthy — equities lead as volatility stays suppressed.",
  positioning: "Positioning bias: Moderate risk exposure.",
};

const REGIME_ZONES = [
  { label: "Risk-Off",     start: 0,  end: 20,  color: "#f87171" },
  { label: "Defensive",    start: 20, end: 40,  color: "#fb923c" },
  { label: "Neutral",      start: 40, end: 60,  color: "#60a5fa" },
  { label: "Constructive", start: 60, end: 80,  color: "#d4a017" },
  { label: "Risk-On",      start: 80, end: 100, color: "#4ade80" },
];

// ── Market Internals ──────────────────────────────────────────────────────────
const INTERNALS = {
  above50MA:      71,
  above200MA:     62,
  advDecline:     1.41,
  summary:
    "Breadth confirms the trend — most S&P 500 stocks in healthy technical position.",
};

interface Sector {
  label: string;
  short: string;
  pct: number;
}

const SECTORS: Sector[] = [
  { label: "Technology",       short: "Tech",    pct: +1.8 },
  { label: "Communication",    short: "Comm",    pct: +1.2 },
  { label: "Consumer Disc",    short: "Cons D",  pct: +0.9 },
  { label: "Financials",       short: "Fin",     pct: +0.7 },
  { label: "Industrials",      short: "Indust",  pct: +0.4 },
  { label: "Materials",        short: "Mat",     pct: +0.2 },
  { label: "Healthcare",       short: "Health",  pct: -0.1 },
  { label: "Staples",          short: "Staples", pct: -0.2 },
  { label: "Real Estate",      short: "RE",      pct: -0.3 },
  { label: "Utilities",        short: "Util",    pct: -0.4 },
  { label: "Energy",           short: "Energy",  pct: -0.6 },
];

// ── Risk Structure ────────────────────────────────────────────────────────────
type SignalStatus = "positive" | "neutral" | "cautious" | "negative";

interface RiskSignal {
  label:  string;
  value:  string;
  detail: string;
  status: SignalStatus;
}

const RISK_SIGNALS: RiskSignal[] = [
  {
    label:  "Yield Curve",
    value:  "Slight Inversion",
    detail: "2Y/10Y at −18bps · historically a caution flag",
    status: "cautious",
  },
  {
    label:  "Credit Spreads",
    value:  "Tightening",
    detail: "HY at 240bps · below 5Y average · risk appetite intact",
    status: "positive",
  },
  {
    label:  "Liquidity",
    value:  "Supportive",
    detail: "Fed RRP at $82B · banking system well-funded",
    status: "positive",
  },
  {
    label:  "Fed Stance",
    value:  "Data-Dependent",
    detail: "2 cuts priced for 2026 · no urgency to move",
    status: "neutral",
  },
];

const STATUS_DOT: Record<SignalStatus, string> = {
  positive: "#4ade80",
  neutral:  "#60a5fa",
  cautious: "#fb923c",
  negative: "#f87171",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function sectorBg(pct: number): string {
  if (pct >=  1.5) return "rgba(74,222,128,0.09)";
  if (pct >=  0.5) return "rgba(74,222,128,0.055)";
  if (pct >=  0)   return "rgba(74,222,128,0.025)";
  if (pct >= -0.5) return "rgba(248,113,113,0.025)";
  if (pct >= -1.5) return "rgba(248,113,113,0.055)";
  return "rgba(248,113,113,0.09)";
}
function sectorBorder(pct: number): string {
  if (pct >= 0.5)  return "rgba(74,222,128,0.08)";
  if (pct >= 0)    return "rgba(255,255,255,0.03)";
  if (pct >= -0.5) return "rgba(255,255,255,0.03)";
  return "rgba(248,113,113,0.08)";
}
function sectorPctColor(pct: number): string {
  return pct >= 0 ? "#7abf9a" : "#c47878";
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({
  data,
  positive,
  id,
}: {
  data:     number[];
  positive: boolean;
  id:       string;
}) {
  const W = 80, H = 32;
  if (data.length < 2) return null;

  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const span = max - min || 1;
  const px = 2, py = 4;

  const toX = (i: number) =>
    (px + (i / (data.length - 1)) * (W - px * 2)).toFixed(1);
  const toY = (v: number) =>
    (py + (1 - (v - min) / span) * (H - py * 2)).toFixed(1);

  const pts = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");

  const areaPath = [
    `M ${toX(0)},${H - py}`,
    `L ${toX(0)},${toY(data[0])}`,
    ...data.map((v, i) => `L ${toX(i)},${toY(v)}`),
    `L ${toX(data.length - 1)},${H - py}`,
    "Z",
  ].join(" ");

  // Slightly dimmed strokes — data present, motion subtle
  const stroke = positive ? "#3db870" : "#e06060";
  const gId    = `spk-${id}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={stroke} stopOpacity="0.12" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gId})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeOpacity="0.82"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Section Divider Label ─────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-7">
      <p
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.78rem",
          color: "#888",
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

// ── Snapshot Card ─────────────────────────────────────────────────────────────
function SnapshotCard({ card }: { card: MarketCard }) {
  const isPositive = card.invert ? card.changePct < 0 : card.changePct >= 0;
  const pctColor   = isPositive ? "#4ade80" : "#f87171";
  const pctSign    = isPositive ? "▲" : "▼";

  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-2xl transition-colors duration-200"
      style={{
        background: "linear-gradient(135deg, #0f0f0f 0%, #0a0a0a 100%)",
        border:     "1px solid #1e1e1e",
      }}
    >
      {/* Label + symbol */}
      <div className="flex items-center justify-between">
        <p
          style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      10,
            fontWeight:    600,
            color:         "#888",
            letterSpacing: "0.1em",
          }}
        >
          {card.label}
        </p>
        <span
          style={{
            fontSize:      8,
            color:         "#444",
            letterSpacing: "0.08em",
          }}
        >
          {card.symbol}
        </span>
      </div>

      {/* Value */}
      <p
        style={{
          fontFamily:         "'Cinzel', serif",
          fontSize:           "1.35rem",
          fontWeight:         700,
          color:              "#e8e8e8",
          lineHeight:         1,
          letterSpacing:      "0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {card.value}
      </p>

      {/* Change + sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontSize:           11,
              fontWeight:         600,
              color:              pctColor,
              fontVariantNumeric: "tabular-nums",
              letterSpacing:      "0.01em",
            }}
          >
            {pctSign}&nbsp;{Math.abs(card.changePct).toFixed(2)}%
          </span>
          <span
            style={{
              fontSize:           10,
              color:              "#555",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {card.change}
          </span>
        </div>
        <Sparkline data={card.sparkData} positive={isPositive} id={card.symbol} />
      </div>

      {/* Interpretation */}
      <p
        style={{
          fontSize:   10,
          color:      "#777",
          lineHeight: 1.55,
          borderTop:  "1px solid #161616",
          paddingTop: 10,
          marginTop:  2,
        }}
      >
        {card.interpretation}
      </p>
    </div>
  );
}

// ── Internal Bar (% above MA, etc.) ──────────────────────────────────────────
function InternalBar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct:   number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p
          style={{
            fontSize:      9,
            color:         "#666",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize:   "1.1rem",
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {value}
        </p>
      </div>
      <div
        style={{
          height:       3,
          borderRadius: 2,
          background:   "#1a1a1a",
          position:     "relative",
          overflow:     "hidden",
        }}
      >
        <div
          style={{
            position:         "absolute",
            top:              0,
            left:             0,
            height:           "100%",
            width:            `${pct}%`,
            borderRadius:     2,
            background:       color,
            opacity:          0.7,
            transition:       "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Regime Indicator ─────────────────────────────────────────────────────────
function RegimeIndicator() {
  const score = REGIME.score;

  return (
    <div
      className="rounded-3xl p-10 md:p-14"
      style={{
        background: REGIME.bg,
        border:     `1px solid ${REGIME.border}`,
        boxShadow:  `0 0 48px ${REGIME.glow}`,
      }}
    >
      {/* Classification + score */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <p
          style={{
            fontSize:      9,
            color:         "#555",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
          }}
        >
          Market Regime
        </p>

        {/* Score number — most dominant element */}
        <div className="flex items-baseline gap-5">
          <p
            style={{
              fontFamily:    "'Cinzel', serif",
              fontSize:      "clamp(3rem, 7.5vw, 5rem)",
              fontWeight:    700,
              color:         "#e0b82a",   /* slightly brighter for contrast */
              lineHeight:    1,
              letterSpacing: "0.02em",
            }}
          >
            {score}
          </p>
          <div className="flex flex-col gap-1">
            <span
              style={{
                fontSize:      9,
                color:         "#555",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              out of 100
            </span>
            <span
              style={{
                fontFamily:    "'Cinzel', serif",
                fontSize:      "0.95rem",
                fontWeight:    700,
                color:         REGIME.color,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {REGIME.label}
            </span>
          </div>
        </div>

        {/* Interpretation */}
        <p
          style={{
            fontSize:   "0.84rem",
            color:      "#888",
            lineHeight: 1.6,
            textAlign:  "center",
            maxWidth:   480,
          }}
        >
          {REGIME.interpretation}
        </p>

        {/* Positioning bias — actionable, muted */}
        <p
          style={{
            fontSize:      10,
            color:         "#4a4a4a",
            letterSpacing: "0.06em",
            textAlign:     "center",
            marginTop:     2,
          }}
        >
          {REGIME.positioning}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ position: "relative", paddingTop: 20, maxWidth: 600, margin: "0 auto" }}>
        {/* Score marker */}
        <div
          style={{
            position:  "absolute",
            top:       0,
            left:      `${score}%`,
            transform: "translateX(-50%)",
            display:   "flex",
            flexDirection: "column",
            alignItems:    "center",
            gap:           2,
          }}
        >
          <span
            style={{
              fontFamily:    "'Cinzel', serif",
              fontSize:      9,
              fontWeight:    700,
              color:         REGIME.color,
              letterSpacing: "0.06em",
            }}
          >
            {score}
          </span>
          {/* Triangle pointer */}
          <div
            style={{
              width:     0,
              height:    0,
              borderLeft:  "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop:   `6px solid ${REGIME.color}`,
            }}
          />
        </div>

        {/* Gradient bar */}
        <div
          style={{
            height:       4,
            borderRadius: 3,
            background:
              "linear-gradient(to right, #f87171 0%, #fb923c 20%, #60a5fa 40%, #60a5fa 60%, #d4a017 70%, #4ade80 100%)",
            opacity:      0.75,
          }}
        />

        {/* Zone labels */}
        <div
          className="hidden sm:flex items-center justify-between mt-2.5"
          style={{ paddingLeft: "0%", paddingRight: "0%" }}
        >
          {REGIME_ZONES.map((zone) => (
            <span
              key={zone.label}
              style={{
                fontSize:      7.5,
                color:         zone.color,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                opacity:       0.7,
              }}
            >
              {zone.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sector Heatmap ────────────────────────────────────────────────────────────
function SectorHeatmap() {
  return (
    <div>
      <p
        style={{
          fontSize:      9,
          color:         "#555",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom:  10,
        }}
      >
        Sector Performance · Today
      </p>
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))",
          gap:                 6,
        }}
      >
        {SECTORS.map((sector) => (
          <div
            key={sector.label}
            style={{
              padding:      "8px 10px",
              borderRadius: 8,
              background:   sectorBg(sector.pct),
              border:       `1px solid ${sectorBorder(sector.pct)}`,
            }}
          >
            <p
              style={{
                fontSize:      8,
                color:         "#666",
                letterSpacing: "0.06em",
                marginBottom:  4,
                whiteSpace:    "nowrap",
                overflow:      "hidden",
                textOverflow:  "ellipsis",
              }}
            >
              {sector.label}
            </p>
            <p
              style={{
                fontFamily:    "'Cinzel', serif",
                fontSize:      "0.82rem",
                fontWeight:    700,
                color:         sectorPctColor(sector.pct),
                letterSpacing: "0.02em",
              }}
            >
              {sector.pct >= 0 ? "+" : ""}{sector.pct.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Risk Signal Row ───────────────────────────────────────────────────────────
function RiskRow({ signal }: { signal: RiskSignal }) {
  const dotColor = STATUS_DOT[signal.status];
  return (
    <div
      className="flex items-center gap-5 py-5"
      style={{ borderBottom: "1px solid #141414" }}
    >
      {/* Status dot */}
      <div
        style={{
          width:        6,
          height:       6,
          borderRadius: "50%",
          background:   dotColor,
          flexShrink:   0,
          boxShadow:    `0 0 6px ${dotColor}`,
        }}
      />

      {/* Label */}
      <p
        style={{
          fontFamily:    "'Cinzel', serif",
          fontSize:      "0.75rem",
          fontWeight:    600,
          color:         "#888",
          letterSpacing: "0.08em",
          width:         130,
          flexShrink:    0,
        }}
      >
        {signal.label}
      </p>

      {/* Value */}
      <p
        style={{
          fontSize:      "0.8rem",
          fontWeight:    600,
          color:         dotColor,
          letterSpacing: "0.04em",
          width:         160,
          flexShrink:    0,
        }}
      >
        {signal.value}
      </p>

      {/* Detail */}
      <p
        style={{
          fontSize:   "0.78rem",
          color:      "#555",
          lineHeight: 1.5,
          flex:       1,
        }}
      >
        {signal.detail}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MarketsPage() {
  const ad    = INTERNALS.advDecline;
  const adColor = ad >= 1 ? "#4ade80" : "#f87171";

  return (
    <div className="relative flex-1 bg-black flex flex-col">
      {/* Top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% -8%, rgba(212,160,23,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center gap-6 px-8 py-4 border-b border-[#1a1a1a]">
        <Link
          href="/"
          className="shrink-0 font-bold tracking-widest hover:opacity-80 transition-opacity"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize:   "1.1rem",
            background: "linear-gradient(135deg, #d4a017 0%, #f0c040 50%, #a07810 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ATHENA
        </Link>

        {/* Inline search */}
        <div className="flex-1 max-w-xs hidden md:block">
          <TickerInput compact />
        </div>

        {/* Right nav */}
        <div className="ml-auto flex items-center gap-6">
          <LanguageSelector />
          <nav className="hidden md:flex items-center gap-5">
            <Link
              href="/markets"
              className="text-[11px] tracking-widest uppercase font-semibold transition-colors duration-200"
              style={{ color: "#d4a017" }}
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

        {/* Page title + badge */}
        <div className="flex items-start justify-between gap-4 mb-12 pb-8 border-b border-[#161616]">
          <div>
            <h1
              className="text-white font-bold tracking-wider mb-2"
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize:   "2rem",
                lineHeight: 1,
              }}
            >
              Markets
            </h1>
            <p className="text-[#3a3a3a] text-sm font-light">
              Risk-on or risk-off? One answer. No noise.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Simulated Data badge */}
            <span
              style={{
                display:       "inline-flex",
                alignItems:    "center",
                gap:           6,
                padding:       "4px 12px",
                borderRadius:  20,
                border:        "1px solid rgba(212,160,23,0.2)",
                background:    "rgba(212,160,23,0.05)",
                fontSize:      9,
                color:         "#8a6820",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight:    600,
              }}
            >
              <span
                style={{
                  width:        5,
                  height:       5,
                  borderRadius: "50%",
                  background:   "#8a6820",
                  display:      "inline-block",
                  opacity:      0.7,
                }}
              />
              Simulated Data
            </span>
            <p style={{ fontSize: 9, color: "#333", letterSpacing: "0.12em" }}>
              Mar 2, 2026 · 16:00 EST
            </p>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* LAYER 2 — REGIME INDICATOR (most dominant)                         */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <RegimeIndicator />
        </div>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* LAYER 1 — GLOBAL SNAPSHOT                                          */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <div className="mb-16">
          <SectionLabel>Global Snapshot</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SNAPSHOT_CARDS.map((card) => (
              <SnapshotCard key={card.symbol} card={card} />
            ))}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* LAYER 3 — MARKET INTERNALS                                         */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <div className="mb-16">
          <SectionLabel>Market Internals</SectionLabel>

          {/* Summary sentence */}
          <p
            className="mb-8"
            style={{ fontSize: "0.84rem", color: "#666", lineHeight: 1.7 }}
          >
            {INTERNALS.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Breadth meters */}
            <div
              className="flex flex-col gap-6 p-6 rounded-2xl"
              style={{
                background: "#0a0a0a",
                border:     "1px solid #1a1a1a",
              }}
            >
              <InternalBar
                label="% Stocks Above 50-Day MA"
                value={`${INTERNALS.above50MA}%`}
                pct={INTERNALS.above50MA}
                color="#d4a017"
              />
              <InternalBar
                label="% Stocks Above 200-Day MA"
                value={`${INTERNALS.above200MA}%`}
                pct={INTERNALS.above200MA}
                color="#d4a017"
              />
              {/* Advance / Decline */}
              <div
                style={{
                  borderTop: "1px solid #161616",
                  paddingTop: 20,
                  display:   "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize:      9,
                      color:         "#555",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      marginBottom:  6,
                    }}
                  >
                    Advance / Decline Ratio
                  </p>
                  <p
                    style={{
                      fontFamily:    "'Cinzel', serif",
                      fontSize:      "1.6rem",
                      fontWeight:    700,
                      color:         adColor,
                      lineHeight:    1,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {ad.toFixed(2)}
                    <span
                      style={{
                        fontSize:  "0.75rem",
                        color:     "#555",
                        fontWeight: 400,
                        marginLeft: 6,
                      }}
                    >
                      advancing/declining
                    </span>
                  </p>
                </div>
                <div
                  style={{
                    padding:      "4px 12px",
                    borderRadius: 6,
                    background:   "rgba(74,222,128,0.07)",
                    border:       "1px solid rgba(74,222,128,0.2)",
                    fontSize:     9,
                    color:        "#4ade80",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight:   600,
                  }}
                >
                  Broad
                </div>
              </div>
            </div>

            {/* Sector heatmap */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: "#0a0a0a",
                border:     "1px solid #1a1a1a",
              }}
            >
              <SectorHeatmap />
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* LAYER 4 — RISK STRUCTURE                                           */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <div className="mb-16">
          <SectionLabel>Risk Structure</SectionLabel>

          <div
            className="rounded-2xl px-6"
            style={{
              background: "#0a0a0a",
              border:     "1px solid #1a1a1a",
            }}
          >
            {RISK_SIGNALS.map((signal, i) => (
              <RiskRow
                key={signal.label}
                signal={
                  i === RISK_SIGNALS.length - 1
                    ? { ...signal }
                    : signal
                }
              />
            ))}
            {/* Remove last border by overriding on the container */}
            <style>{`
              .risk-panel > div:last-child { border-bottom: none; }
            `}</style>
          </div>
        </div>

        {/* Data note */}
        <p
          className="text-center text-[9px] tracking-[0.22em] uppercase"
          style={{ color: "#2a2a2a" }}
        >
          Simulated data · For illustrative purposes only · Not financial advice
        </p>
      </main>

    </div>
  );
}
