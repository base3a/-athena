"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
type Direction = "up" | "down" | "stable" | "new";

interface IntelItem {
  symbol:  string;
  score:   number | null;
  insight: string | null;
}

interface DisplayItem extends IntelItem {
  direction: Direction;
  prevScore: number | null;
}

// ── Score history (localStorage) ─────────────────────────────────────────────
const SCORE_HISTORY_KEY = "athena_intel_scores";

type ScoreHistory = Record<string, number>;

function loadScoreHistory(): ScoreHistory {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(SCORE_HISTORY_KEY) ?? "{}"); }
  catch { return {}; }
}

function saveScoreHistory(h: ScoreHistory): void {
  try { localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(h)); }
  catch { /* storage unavailable */ }
}

// ── Direction helpers ─────────────────────────────────────────────────────────
function getDirection(newScore: number, prevScore: number | null): Direction {
  if (prevScore === null) return "new";
  if (newScore > prevScore) return "up";
  if (newScore < prevScore) return "down";
  return "stable";
}

const DIR: Record<Direction, { arrow: string; color: string }> = {
  up:     { arrow: "↑", color: "#4ade80" },
  down:   { arrow: "↓", color: "#f87171" },
  stable: { arrow: "→", color: "#555"    },
  new:    { arrow: "",  color: "#d4a017"  },
};

// ── Single intelligence row ───────────────────────────────────────────────────
function IntelRow({ item }: { item: DisplayItem }) {
  const dir     = DIR[item.direction];
  const changed = item.direction === "up" || item.direction === "down";
  const upward  = item.direction === "up";

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        gap:           5,
        padding:       "13px 16px",
        borderRadius:  12,
        background:    "#090909",
        border:        "1px solid #1c1c1c",
        borderLeft:    changed
          ? `2px solid ${upward ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.35)"}`
          : "1px solid #1c1c1c",
        transition:    "border-color 0.2s ease",
      }}
    >
      {/* ── Top row: ticker · score · arrow · change badge ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

        {/* Ticker — links to full analysis */}
        <Link
          href={`/analyze/${item.symbol}`}
          style={{
            fontFamily:     "'Cinzel', serif",
            fontSize:       "0.80rem",
            fontWeight:     700,
            color:          "#d4a017",
            letterSpacing:  "0.1em",
            textDecoration: "none",
            minWidth:       48,
            flexShrink:     0,
          }}
        >
          {item.symbol}
        </Link>

        {/* Score */}
        {item.score !== null ? (
          <span style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      "0.80rem",
            fontWeight:    700,
            color:         "#c8c8c8",
            letterSpacing: "0.04em",
          }}>
            {item.score}
            <span style={{ fontSize: "0.62rem", color: "#3a3a3a", marginLeft: 1 }}>/10</span>
          </span>
        ) : (
          <span style={{ fontSize: "0.80rem", color: "#333", fontFamily: "'Cinzel', serif" }}>—</span>
        )}

        {/* Direction arrow */}
        {dir.arrow && (
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: dir.color, lineHeight: 1 }}>
            {dir.arrow}
          </span>
        )}

        {/* Score change badge — only when score actually moved */}
        {changed && item.prevScore !== null && item.score !== null && (
          <span style={{
            display:       "inline-flex",
            alignItems:    "center",
            gap:           4,
            fontSize:      "0.65rem",
            fontWeight:    600,
            letterSpacing: "0.04em",
            fontFamily:    "'Cinzel', serif",
            color:         dir.color,
            background:    upward ? "rgba(74,222,128,0.07)"   : "rgba(248,113,113,0.07)",
            border:        `1px solid ${upward ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
            padding:       "2px 8px",
            borderRadius:  4,
          }}>
            {item.prevScore}
            <span style={{ opacity: 0.5 }}>→</span>
            {item.score}
          </span>
        )}
      </div>

      {/* ── Insight text ── */}
      {item.insight && (
        <p style={{
          fontSize:   "0.72rem",
          color:      "#5a5a5a",
          fontStyle:  "italic",
          lineHeight: 1.55,
          margin:     0,
        }}>
          {item.insight}
        </p>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function IntelSkeleton({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding:       "13px 16px",
            borderRadius:  12,
            background:    "#090909",
            border:        "1px solid #141414",
            display:       "flex",
            flexDirection: "column",
            gap:           7,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 10, borderRadius: 3, background: "#181818" }} />
            <div style={{ width: 22, height: 10, borderRadius: 3, background: "#141414" }} />
            <div style={{ width:  8, height: 10, borderRadius: 3, background: "#121212" }} />
          </div>
          <div style={{ width: "70%", height: 8, borderRadius: 3, background: "#111" }} />
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WatchlistIntelligence({ symbols }: { symbols: string[] }) {
  const [items,   setItems]   = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed,  setFailed]  = useState(false);

  const capped = symbols.slice(0, 5);

  useEffect(() => {
    if (capped.length === 0) {
      setLoading(false);
      return;
    }

    const history = loadScoreHistory();

    const run = async () => {
      try {
        const res = await fetch(
          `/api/watchlist-intelligence?symbols=${capped.join(",")}`,
        );
        if (!res.ok) throw new Error("bad response");

        const data: { items: IntelItem[] } = await res.json();

        // Build display items and update history
        const updated: ScoreHistory = { ...history };
        const display: DisplayItem[] = data.items.map((item) => {
          const prev      = history[item.symbol] ?? null;
          const direction = item.score !== null ? getDirection(item.score, prev) : "stable";
          if (item.score !== null) updated[item.symbol] = item.score;
          return { ...item, direction, prevScore: prev };
        });

        saveScoreHistory(updated);
        setItems(display);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once per page open — daily check pattern

  // Nothing to show
  if (capped.length === 0) return null;

  // Silently hide on total failure — don't break the portfolio page
  if (failed) return null;

  return (
    <div>
      {/* ── Section header ── */}
      <div style={{
        display:        "flex",
        alignItems:     "flex-end",
        justifyContent: "space-between",
        marginBottom:   16,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{
              fontFamily:    "'Cinzel', serif",
              fontSize:      13,
              fontWeight:    600,
              color:         "#999",
              letterSpacing: "0.1em",
            }}>
              Athena Watchlist Intelligence
            </span>
            {/* Live indicator — shown once loaded */}
            {!loading && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "#d4a017", display: "inline-block",
                }} />
                <span style={{
                  fontSize:      9,
                  color:         "#666",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase" as const,
                }}>Live</span>
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#555", margin: 0 }}>
            {loading
              ? "Refreshing intelligence…"
              : `${capped.length} stock${capped.length !== 1 ? "s" : ""} monitored · opens daily`}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <IntelSkeleton count={capped.length} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => (
            <IntelRow key={item.symbol} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
