"use client";

import Link from "next/link";
import { useState } from "react";
import { computeScore } from "@/lib/scoring";
import type { ScoringResult } from "@/lib/scoring";

// Update these manually when market conditions change
const POPULAR_METRICS = [
  { ticker: "NVDA", pe: 44.2, roe: 91.4,  profitMargin: 53.4, revenueGrowth: 122.4, beta: 1.7 },
  { ticker: "AAPL", pe: 29.4, roe: 147.2, profitMargin: 26.4, revenueGrowth:   2.8, beta: 1.2 },
  { ticker: "TSLA", pe: 55.0, roe: 20.2,  profitMargin: 10.8, revenueGrowth:  13.4, beta: 2.0 },
  { ticker: "MSFT", pe: 32.8, roe: 38.2,  profitMargin: 34.1, revenueGrowth:  15.7, beta: 0.9 },
  { ticker: "ASML", pe: 36.2, roe: 42.8,  profitMargin: 26.4, revenueGrowth:  15.8, beta: 1.3 },
] as const;

// Derive verdict and score from the shared Athena formula
const POPULAR = POPULAR_METRICS.map(({ ticker, ...metrics }) => ({
  ticker,
  ...computeScore(metrics),
}));

type Verdict = ScoringResult["verdict"];

function verdictColor(verdict: Verdict): string {
  if (verdict === "BUY")   return "#4ade80";
  if (verdict === "HOLD")  return "#d4a017";
  if (verdict === "WATCH") return "#888888";
  return "#f87171"; // AVOID
}

export default function PopularAnalyses() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="w-full mt-8">
      <div
        style={{
          background: "#0b0b0b",
          borderRadius: 16,
          border: "1px solid rgba(212,175,55,0.12)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
          padding: "18px 20px",
        }}
      >
      <p className="text-[10px] tracking-widest uppercase font-medium mb-3" style={{ color: "#7A7A7A" }}>
        Popular Analyses Today
      </p>

      <div className="flex flex-wrap gap-2">
        {POPULAR.map(({ ticker, verdict }) => {
          const active = hovered === ticker;
          return (
            <Link
              key={ticker}
              href={`/analyze/${ticker}`}
              onMouseEnter={() => setHovered(ticker)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "12px 16px",
                minHeight: 44,
                borderRadius: 8,
                background: active ? "#111" : "#0d0d0d",
                border: `1px solid ${active ? "rgba(212,160,23,0.3)" : "#1e1e1e"}`,
                boxShadow: active
                  ? "0 0 14px rgba(212,160,23,0.07), inset 0 1px 0 rgba(255,255,255,0.02)"
                  : "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
                transition: "all 0.2s ease",
                textDecoration: "none",
              }}
            >
              {/* Ticker */}
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  letterSpacing: "0.04em",
                  color: active ? "#d4a017" : "#BFBFBF",
                  transition: "color 0.2s ease",
                }}
              >
                {ticker}
              </span>

              {/* Em dash separator */}
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "#555",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                —
              </span>

              {/* Verdict */}
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  letterSpacing: "0.06em",
                  color: verdictColor(verdict),
                  transition: "color 0.2s ease",
                }}
              >
                {verdict}
              </span>
            </Link>
          );
        })}
      </div>
      </div>
    </div>
  );
}
