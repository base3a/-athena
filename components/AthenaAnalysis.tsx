"use client";

import { useEffect, useState, useMemo } from "react";
import type { StockOverview, GlobalQuote } from "@/lib/alphaVantage";
import { getStoredLang } from "@/components/LanguageSelector";

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

      result.verdictReason = content
        .replace(/VERDICT:\s*(BUY|HOLD|WATCH|AVOID)\s*/im, "")
        .replace(/TAKEAWAY_\d:\s*.+\n?/gim, "")
        .replace(/WHO_FOR:\s*.+\n?/gim, "")
        .replace(/WHO_AVOID:\s*.+\n?/gim, "")
        .replace(/TIMEFRAME:\s*.+\n?/gim, "")
        .trim();
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

// ── Loading card ───────────────────────────────────────────────────────────────
function LoadingCard({ symbol }: { symbol: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl flex flex-col items-center justify-center gap-6 text-center"
      style={{
        background: "linear-gradient(160deg, #090806 0%, #0c0a00 60%, #090806 100%)",
        border: "1px solid #2a1f00",
        boxShadow: "0 0 80px rgba(212,160,23,0.04)",
        minHeight: 240,
        padding: "3rem 2rem",
      }}
    >
      <div
        className="absolute inset-x-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(212,160,23,0.5) 50%, transparent 100%)",
          animation: "scan-line 3.5s ease-in-out infinite",
        }}
      />
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
            <circle cx="9.8" cy="8" r="1.3" fill="#d4a017" />
            <circle cx="14.2" cy="8" r="1.3" fill="#d4a017" />
            <path d="M9 15L9 17C9 18.5 10.2 19.5 12 19.5C13.8 19.5 15 18.5 15 17L15 15" stroke="#d4a017" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div>
        <p className="uppercase mb-2" style={{ fontFamily: "'Cinzel', serif", color: "#d4a017", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.32em" }}>
          Athena Intelligence
        </p>
        <p className="text-[#555] text-sm">
          Running 13-point analysis on <span className="text-[#c8901a] font-semibold">{symbol}</span>…
        </p>
      </div>
      <div className="w-44 relative overflow-hidden rounded-full" style={{ height: 2, background: "#1a1300" }}>
        <div
          className="absolute inset-y-0"
          style={{ width: "40%", background: "linear-gradient(90deg, transparent, #d4a017, transparent)", animation: "progress-sweep 1.8s ease-in-out infinite" }}
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
    <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: "#080808", border: "1px solid #181818" }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#555] tracking-widest uppercase font-medium">{label}</span>
        {score !== null ? (
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.05rem", fontWeight: 700, color: "#d4a017" }}>
            {score}<span style={{ fontSize: "0.58rem", color: "#3a3a3a", fontFamily: "inherit" }}>/10</span>
          </span>
        ) : (
          <span className="text-[#2a2a2a] text-xs">—</span>
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
        border: isOpen ? "1px solid rgba(212,160,23,0.22)" : "1px solid #161616",
        background: isOpen ? "linear-gradient(145deg, #0a0800 0%, #080700 100%)" : "#080808",
      }}
    >
      <button onClick={onToggle} className="w-full px-4 py-3.5 flex items-start gap-3 text-left" style={{ cursor: "pointer" }}>
        <div
          className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold mt-0.5"
          style={{
            background: isOpen ? "#1a1200" : "#0d0d0d",
            color: isOpen ? "#d4a017" : "#3a3a3a",
            border: `1px solid ${isOpen ? "rgba(212,160,23,0.35)" : "#1c1c1c"}`,
          }}
        >
          {section.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] tracking-[0.15em] uppercase font-semibold" style={{ color: isOpen ? "#d4a017" : "#4a4a4a" }}>
              {label}
            </span>
            <svg
              width="11" height="11" viewBox="0 0 12 12" fill="none"
              className="shrink-0 transition-transform duration-200"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M2 4l4 4 4-4" stroke={isOpen ? "#d4a017" : "#333"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {!isOpen && (
            <p className="text-[12px] leading-relaxed mt-0.5 line-clamp-1" style={{ color: "#2e2e2e" }}>
              {summary}
            </p>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-5" style={{ animation: "fade-in-up 0.18s ease-out" }}>
          <div className="h-px mb-3.5" style={{ background: "linear-gradient(90deg, rgba(212,160,23,0.18), transparent)" }} />
          <p className="text-[0.82rem] leading-[1.85] whitespace-pre-line" style={{ color: "#7a7a7a" }}>
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
      style={{ background: "#070707", border: "1px solid #181818" }}
    >
      <p className="text-[9px] text-[#333] tracking-[0.4em] uppercase mb-5">
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
              <p className="text-[10px] text-[#3a3a3a] tracking-[0.18em] uppercase mb-1">{row.label}</p>
              {hasData ? (
                <p className="text-[13px] leading-relaxed" style={{ color: "#888" }}>
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
      style={{ background: "#000", border: "1px solid #181818" }}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="text-[9px] text-[#333] tracking-[0.4em] uppercase">Price Performance</p>
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
  // Increments each time the visible data slice changes — remounts the path
  // element so the CSS stroke-dashoffset animation replays from scratch.
  const [animKey, setAnimKey] = useState(0);

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

  // Re-fire the draw animation whenever the visible slice changes
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
  // 6% padding top and bottom so line doesn't touch edges
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

  // Find high and low within visible data
  let highIdx = 0, lowIdx = 0;
  prices.forEach((p, i) => {
    if (p > prices[highIdx]) highIdx = i;
    if (p < prices[lowIdx]) lowIdx = i;
  });

  const currentIdx = data.length - 1;
  const currentPrice = prices[currentIdx];

  // 4 horizontal grid lines
  const gridLines = [0.25, 0.5, 0.75].map((t) => minPadded + t * paddedRange);

  // Date labels: start, mid, end
  const dateLabels = [
    { i: 0 },
    { i: Math.floor(data.length / 2) },
    { i: data.length - 1 },
  ].map(({ i }) => ({ i, label: formatChartDate(data[i].date) }));

  const formatPrice = (p: number) =>
    p >= 1000 ? `$${(p / 1000).toFixed(1)}k` : `$${p.toFixed(0)}`;

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{ background: "#000", border: "1px solid #181818" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] text-[#333] tracking-[0.4em] uppercase">
          Price Performance
        </p>
        <div className="flex gap-1.5">
          {(["3M", "6M", "1Y"] as ChartPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "3px 11px",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                border: period === p ? "1px solid rgba(212,160,23,0.45)" : "1px solid #1c1c1c",
                background: period === p ? "rgba(212,160,23,0.09)" : "transparent",
                color: period === p ? "#d4a017" : "#383838",
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
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
        aria-label={`${symbol} price chart`}
      >
        <defs>
          {/* Keyframes for the 400ms line-draw reveal — scoped inside SVG */}
          <style>{`
            @keyframes athena-draw-line {
              from { stroke-dashoffset: 10000; }
              to   { stroke-dashoffset: 0; }
            }
            @keyframes athena-fade-area {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
          <linearGradient id={`areaGrad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a017" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#d4a017" stopOpacity="0" />
          </linearGradient>
          <filter id={`glow-${symbol}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {gridLines.map((price, i) => (
          <g key={i}>
            <line
              x1={pL} y1={toY(price)}
              x2={W - pR} y2={toY(price)}
              stroke="#0f0f0f"
              strokeWidth={1}
              strokeDasharray="4,6"
            />
            <text
              x={W - pR + 6} y={toY(price) + 4}
              fill="#2a2a2a" fontSize={9}
              fontFamily="Inter, sans-serif"
            >
              {formatPrice(price)}
            </text>
          </g>
        ))}

        {/* Area fill — fades in alongside the line draw */}
        <path
          key={`area-${animKey}`}
          d={areaPath}
          fill={`url(#areaGrad-${symbol})`}
          style={{ animation: "athena-fade-area 0.45s ease-out forwards" }}
        />

        {/* Price line — draws left-to-right in 400ms */}
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

        {/* 52W High marker */}
        {highIdx !== currentIdx && (
          <g>
            <circle
              cx={toX(highIdx)} cy={toY(prices[highIdx])}
              r={3.5} fill="none"
              stroke="#d4a017" strokeWidth={1}
              opacity={0.7}
            />
            <text
              x={toX(highIdx)} y={toY(prices[highIdx]) - 9}
              fill="#3a3a3a" fontSize={8}
              textAnchor="middle" fontFamily="Inter, sans-serif"
            >
              HIGH
            </text>
          </g>
        )}

        {/* 52W Low marker */}
        {lowIdx !== currentIdx && (
          <g>
            <circle
              cx={toX(lowIdx)} cy={toY(prices[lowIdx])}
              r={3.5} fill="none"
              stroke="#d4a017" strokeWidth={1}
              opacity={0.7}
            />
            <text
              x={toX(lowIdx)} y={toY(prices[lowIdx]) + 16}
              fill="#3a3a3a" fontSize={8}
              textAnchor="middle" fontFamily="Inter, sans-serif"
            >
              LOW
            </text>
          </g>
        )}

        {/* Current price — gold dot with glow */}
        <circle
          cx={toX(currentIdx)} cy={toY(currentPrice)}
          r={5} fill="#d4a017"
          filter={`url(#glow-${symbol})`}
        />
        {/* Vertical dashed line from dot to bottom */}
        <line
          x1={toX(currentIdx)} y1={toY(currentPrice) + 6}
          x2={toX(currentIdx)} y2={pT + cH}
          stroke="rgba(212,160,23,0.12)"
          strokeWidth={1}
          strokeDasharray="3,4"
        />

        {/* Price right label for current */}
        <text
          x={W - pR + 6} y={toY(currentPrice) + 4}
          fill="#d4a017" fontSize={9}
          fontFamily="Inter, sans-serif"
          fontWeight="600"
        >
          {formatPrice(currentPrice)}
        </text>

        {/* Date labels */}
        {dateLabels.map(({ i, label }) => (
          <text
            key={i}
            x={toX(i)} y={H - 4}
            fill="#2a2a2a" fontSize={9}
            textAnchor={i === 0 ? "start" : i === currentIdx ? "end" : "middle"}
            fontFamily="Inter, sans-serif"
          >
            {label}
          </text>
        ))}
      </svg>

      {/* Bottom stats row */}
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #0d0d0d" }}>
        <span className="text-[10px]" style={{ color: "#2a2a2a" }}>
          {data[0]?.date} — {data[currentIdx]?.date}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[10px]" style={{ color: "#2a2a2a" }}>
            High: <span style={{ color: "#555" }}>{formatPrice(prices[highIdx])}</span>
          </span>
          <span className="text-[10px]" style={{ color: "#2a2a2a" }}>
            Low: <span style={{ color: "#555" }}>{formatPrice(prices[lowIdx])}</span>
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

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  overview: StockOverview;
  quote: GlobalQuote | null;
}

export default function AthenaAnalysis({ overview, quote }: Props) {
  const [raw, setRaw] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

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

        if (!res.ok) throw new Error(await res.text());
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
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "Analysis failed");
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="flex items-center gap-4 mb-6">
        <span className="text-[10px] text-[#555] tracking-[0.25em] uppercase font-semibold shrink-0">
          Athena Intelligence
        </span>
        <span className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #1f1f1f, transparent)" }} />
        {(phase === "loading" || phase === "streaming") && (
          <span className="text-[10px] text-[#d4a017] tracking-widest uppercase font-semibold" style={{ animation: "pulse 2s ease-in-out infinite" }}>
            ● Analyzing
          </span>
        )}
        {phase === "done" && (
          <span className="text-[10px] text-[#3a3a3a] tracking-widest uppercase">✓ Complete</span>
        )}
        {phase === "error" && (
          <span className="text-[10px] text-[#f87171] tracking-widest uppercase">✗ Error</span>
        )}
      </div>

      {/* Loading state */}
      {phase === "loading" && <LoadingCard symbol={overview.Symbol} />}

      {/* Error state */}
      {phase === "error" && (
        <div className="p-6 rounded-xl text-center" style={{ background: "#080303", border: "1px solid #2a0e0e" }}>
          <p className="text-[#f87171] text-sm font-medium mb-1.5">Athena Intelligence is temporarily unavailable.</p>
          <p className="text-[#555] text-xs leading-relaxed">The market data above is still accurate.</p>
        </div>
      )}

      {/* Analysis content (streaming + done) */}
      {(phase === "streaming" || phase === "done") && (
        <div className="flex flex-col gap-4">

          {/* ══════════════════════════════════════════════
              1. INSTANT DECISION
          ══════════════════════════════════════════════ */}
          {verdict && vConf ? (
            <div
              className="rounded-2xl overflow-hidden animate-fade-in-up"
              style={{
                background: vConf.bg,
                border: `1px solid ${vConf.border}`,
                boxShadow: `0 0 100px ${vConf.glow}, 0 0 60px ${vConf.glow}`,
              }}
            >
              <div className="p-6 md:p-10">
                <p className="text-[9px] text-[#333] tracking-[0.4em] uppercase mb-5">
                  Instant Decision
                </p>

                {/* Giant verdict */}
                <div className="mb-4">
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

                {/* Core reason — first sentence only */}
                {verdictReason && (
                  <p
                    className="text-base md:text-lg leading-relaxed mb-7 max-w-2xl font-light"
                    style={{ color: "#aaa" }}
                  >
                    {(verdictReason.match(/^[^.!?]+[.!?]/) ?? [verdictReason])[0].trim()}
                  </p>
                )}

                {/* Confidence bar */}
                {confidenceScore !== null && (
                  <div className="mb-7 max-w-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-[#444] tracking-[0.25em] uppercase">
                        Confidence
                      </span>
                      <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: "#d4a017", fontSize: "1.15rem", lineHeight: 1 }}>
                        {confidenceScore}
                        <span style={{ fontSize: "0.62rem", color: "#3a3a3a", fontFamily: "inherit" }}>/10</span>
                      </span>
                    </div>
                    <div className="relative overflow-hidden rounded-full" style={{ height: 6, background: "#1a1300" }}>
                      <ConfidenceBarFill score={confidenceScore} />
                    </div>
                  </div>
                )}

                {/* 3 takeaways */}
                {takeaways.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {takeaways.map((t, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="shrink-0 w-1.5 h-1.5 rounded-full mt-[0.4rem]" style={{ background: "#d4a017" }} />
                        <span className="text-sm leading-snug font-medium" style={{ color: "#999" }}>{t}</span>
                      </div>
                    ))}
                  </div>
                )}

                {isStreaming && (
                  <div className="mt-5 flex items-center gap-2">
                    <StreamingPulse />
                    <span className="text-[#2a2a2a] text-[10px] tracking-widest">Completing analysis…</span>
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
              <p className="text-[9px] text-[#2a2a2a] tracking-[0.4em] uppercase mb-6">Instant Decision</p>
              <div className="h-20 w-52 rounded-xl skeleton mb-5" />
              <div className="h-4 w-full max-w-sm rounded skeleton mb-2.5" />
              <div className="h-4 w-3/4 max-w-xs rounded skeleton" />
            </div>
          )}

          {/* ══════════════════════════════════════════════
              2. PRICE PERFORMANCE CHART
              Sits directly under the verdict for immediate
              visual context before the explanatory sections.
          ══════════════════════════════════════════════ */}
          <StockChart symbol={overview.Symbol} />

          {/* ══════════════════════════════════════════════
              3. WHAT THIS MEANS FOR YOU
          ══════════════════════════════════════════════ */}
          <WhatThisMeansForYou
            whoFor={whoFor}
            whoAvoid={whoAvoid}
            timeframe={timeframe}
            streaming={isStreaming}
          />

          {/* ══════════════════════════════════════════════
              4. VISUAL SNAPSHOT — 2×2 score grid
          ══════════════════════════════════════════════ */}
          <div
            className="rounded-2xl p-5 md:p-6"
            style={{ background: "#070707", border: "1px solid #181818" }}
          >
            <p className="text-[9px] text-[#333] tracking-[0.4em] uppercase mb-4">Visual Snapshot</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ScoreBar label="Business Quality" score={businessQualityScore} />
              <ScoreBar label="Financial Strength" score={financialStrengthScore} />
              <ScoreBar label="Valuation Score" score={valuationScore} />
              <ScoreBar label="Risk Level" score={riskScore} />
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              5. DEEP DIVE — 13-Point Analysis
          ══════════════════════════════════════════════ */}
          {sections.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid #181818", background: "#070707" }}
            >
              <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "#111" }}>
                <p className="text-[9px] text-[#333] tracking-[0.4em] uppercase">
                  Deep Dive — 13-Point Analysis
                </p>
                <p className="text-[9px] text-[#222] tracking-widest uppercase">
                  Click to expand
                </p>
              </div>

              <div className="p-3 flex flex-col gap-1.5">
                {sections.map((section) => (
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
                    <span className="text-[#1e1e1e] text-[10px] tracking-widest uppercase">
                      Processing remaining sections…
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-[9px] text-[#1c1c00] tracking-[0.2em] uppercase">
            Powered by Claude · Athena Investment AI · For informational purposes only · Not financial advice
          </p>
        </div>
      )}
    </div>
  );
}
