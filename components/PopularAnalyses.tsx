"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ── Tickers shown in the Popular Analyses bar ─────────────────────────────
// Edit this list to change which tickers appear.
// Verdicts are sourced from localStorage ("athena_verdict_cache") — populated
// automatically after each real AI analysis completes on /analyze/[ticker].
// If no cached verdict exists for a ticker, it shows a skeleton (never a fake).
const POPULAR_TICKERS = ["NVDA", "AAPL", "TSLA", "MSFT", "ASML"] as const;

const CACHE_KEY = "athena_verdict_cache";

// ── Types ────────────────────────────────────────────────────────────────
type Verdict = "BUY" | "HOLD" | "WATCH" | "AVOID";

interface CacheEntry {
  verdict:   Verdict;
  updatedAt: number; // Unix ms
}

interface PillData {
  symbol:    string;
  verdict:   Verdict  | null; // null = no cached verdict yet → show skeleton
  updatedAt: number   | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function verdictColor(verdict: Verdict): string {
  if (verdict === "BUY")   return "#4ade80";
  if (verdict === "HOLD")  return "#d4a017";
  if (verdict === "WATCH") return "#888888";
  return "#f87171"; // AVOID
}

function timeAgo(unixMs: number): string {
  const secs = Math.floor((Date.now() - unixMs) / 1_000);
  if (secs < 60)                        return "just now";
  const mins = Math.floor(secs  / 60);
  if (mins < 60)                        return `${mins}m ago`;
  const hrs  = Math.floor(mins  / 60);
  if (hrs  < 24)                        return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function readCache(): Record<string, CacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

// ── Skeleton pill ────────────────────────────────────────────────────────

function SkeletonPill({ symbol }: { symbol: string }) {
  return (
    <div
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          8,
        padding:      "10px 16px",
        minHeight:    44,
        borderRadius: 8,
        background:   "#0d0d0d",
        border:       "1px solid #1a1a1a",
        cursor:       "default",
      }}
      title={`Run an analysis on ${symbol} to see its verdict here`}
    >
      {/* Ticker — always shown even when verdict is unknown */}
      <span
        style={{
          fontFamily:    "'Cinzel', serif",
          fontWeight:    600,
          fontSize:      "0.8rem",
          letterSpacing: "0.04em",
          color:         "#444",
          whiteSpace:    "nowrap",
        }}
      >
        {symbol}
      </span>

      <span style={{ fontSize: "0.72rem", color: "#252525", userSelect: "none" }}>—</span>

      {/* Verdict placeholder bar */}
      <span
        style={{
          display:      "inline-block",
          width:        34,
          height:       9,
          borderRadius: 3,
          background:   "#1e1e1e",
          verticalAlign: "middle",
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function PopularAnalyses() {
  // null = not yet read from localStorage (SSR / first paint)
  const [pills,   setPills]   = useState<PillData[] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const cache = readCache();
    const data: PillData[] = POPULAR_TICKERS.map((sym) => {
      const entry = cache[sym];
      return entry
        ? { symbol: sym, verdict: entry.verdict, updatedAt: entry.updatedAt }
        : { symbol: sym, verdict: null,           updatedAt: null };
    });
    setPills(data);
  }, []);

  return (
    <div className="w-full mt-8">
      <div
        style={{
          background:  "#0b0b0b",
          borderRadius: 16,
          border:       "1px solid rgba(212,175,55,0.12)",
          boxShadow:    "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
          padding:      "18px 20px",
        }}
      >
        {/* Section label */}
        <p
          className="text-[10px] tracking-widest uppercase font-medium mb-3"
          style={{ color: "#7A7A7A" }}
        >
          Popular Analyses Today
        </p>

        {/* Pills row — always 5 slots */}
        <div className="flex flex-wrap gap-2">
          {/* Before localStorage is read, render skeleton for every slot */}
          {pills === null && POPULAR_TICKERS.map((t) => (
            <SkeletonPill key={t} symbol={t} />
          ))}

          {/* After mount: real verdict if cached, skeleton if not */}
          {pills !== null && pills.map(({ symbol, verdict, updatedAt }) => {
            if (!verdict || updatedAt === null) {
              return <SkeletonPill key={symbol} symbol={symbol} />;
            }

            const active = hovered === symbol;
            return (
              <Link
                key={symbol}
                href={`/analyze/${symbol}`}
                onMouseEnter={() => setHovered(symbol)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  gap:            8,
                  padding:        "10px 16px",
                  minHeight:      44,
                  borderRadius:   8,
                  background:     active ? "#111" : "#0d0d0d",
                  border:         `1px solid ${active ? "rgba(212,160,23,0.3)" : "#1e1e1e"}`,
                  boxShadow:      active
                    ? "0 0 14px rgba(212,160,23,0.07), inset 0 1px 0 rgba(255,255,255,0.02)"
                    : "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
                  transition:     "all 0.2s ease",
                  textDecoration: "none",
                }}
              >
                {/* Ticker */}
                <span
                  style={{
                    fontFamily:    "'Cinzel', serif",
                    fontWeight:    600,
                    fontSize:      "0.8rem",
                    letterSpacing: "0.04em",
                    color:         active ? "#d4a017" : "#BFBFBF",
                    transition:    "color 0.2s ease",
                    whiteSpace:    "nowrap",
                  }}
                >
                  {symbol}
                </span>

                {/* Em-dash separator */}
                <span
                  style={{
                    fontSize:   "0.72rem",
                    color:      "#444",
                    lineHeight: 1,
                    userSelect: "none",
                    flexShrink: 0,
                  }}
                >
                  —
                </span>

                {/* Verdict */}
                <span
                  style={{
                    fontFamily:    "'Cinzel', serif",
                    fontWeight:    700,
                    fontSize:      "0.72rem",
                    letterSpacing: "0.06em",
                    color:         verdictColor(verdict),
                    transition:    "color 0.2s ease",
                    whiteSpace:    "nowrap",
                  }}
                >
                  {verdict}
                </span>

                {/* Timestamp */}
                <span
                  style={{
                    fontSize:   "0.62rem",
                    color:      "#383838",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  · {timeAgo(updatedAt)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
