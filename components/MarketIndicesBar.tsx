"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

interface IndexQuote {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePct: number;
}

function formatPrice(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

function formatPct(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export default function MarketIndicesBar() {
  const [indices, setIndices] = useState<IndexQuote[] | null>(null);
  const [error, setError]     = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market-indices");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setIndices(data);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  return (
    <div className="w-full mt-8">
      <div
        style={{
          background:   "#0b0b0b",
          borderRadius: 16,
          border:       "1px solid rgba(212,175,55,0.12)",
          boxShadow:    "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
          padding:      "18px 20px",
        }}
      >
        <p
          className="text-[10px] tracking-widest uppercase font-medium mb-3"
          style={{ color: "#7A7A7A" }}
        >
          Market Indices
        </p>

        {/* Skeleton while loading */}
        {indices === null && !error && (
          <div className="flex flex-wrap gap-3">
            {["S&P 500", "Dow Jones", "Nasdaq"].map((label) => (
              <div
                key={label}
                style={{
                  display:      "inline-flex",
                  alignItems:   "center",
                  gap:          10,
                  padding:      "10px 16px",
                  minHeight:    44,
                  borderRadius: 8,
                  background:   "#0d0d0d",
                  border:       "1px solid #1a1a1a",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#444", fontFamily: "'Cinzel', serif", fontWeight: 600, letterSpacing: "0.04em" }}>
                  {label}
                </span>
                <span style={{ display: "inline-block", width: 60, height: 9, borderRadius: 3, background: "#1e1e1e" }} />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <p style={{ fontSize: "0.75rem", color: "#555" }}>Unable to load market data.</p>
        )}

        {/* Live data */}
        {indices && (
          <div className="flex flex-wrap gap-3">
            {indices.map(({ symbol, label, price, change, changePct }) => {
              const positive = change >= 0;
              const color    = positive ? "#4ade80" : "#f87171";
              return (
                <Link
                  key={symbol}
                  href="/markets"
                  style={{
                    display:        "inline-flex",
                    alignItems:     "center",
                    gap:            12,
                    padding:        "10px 16px",
                    minHeight:      44,
                    borderRadius:   8,
                    background:     "#0d0d0d",
                    border:         "1px solid #1e1e1e",
                    boxShadow:      "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
                    textDecoration: "none",
                    cursor:         "pointer",
                    transition:     "border-color 0.2s ease, background 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(212,160,23,0.3)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "#111";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1e1e1e";
                    (e.currentTarget as HTMLAnchorElement).style.background = "#0d0d0d";
                  }}
                >
                  {/* Index name */}
                  <span
                    style={{
                      fontFamily:    "'Cinzel', serif",
                      fontWeight:    600,
                      fontSize:      "0.8rem",
                      letterSpacing: "0.04em",
                      color:         "#BFBFBF",
                      whiteSpace:    "nowrap",
                    }}
                  >
                    {label}
                  </span>

                  {/* Price */}
                  <span
                    style={{
                      fontSize:   "0.82rem",
                      fontWeight: 600,
                      color:      "#e5e5e5",
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatPrice(price)}
                  </span>

                  {/* Change + % */}
                  <span
                    style={{
                      fontSize:   "0.75rem",
                      fontWeight: 500,
                      color,
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatChange(change)}&nbsp;({formatPct(changePct)})
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
