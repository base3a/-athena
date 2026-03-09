"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { searchStocks, type Stock } from "@/lib/stockList";
import WatchlistIntelligence from "@/components/WatchlistIntelligence";

// ── Types ──────────────────────────────────────────────────────────────────────
type Verdict = "BUY" | "HOLD" | "WATCH" | "AVOID";

interface PortfolioStock {
  symbol:     string;
  name:       string;
  exchange:   string | null;
  sector:     string | null;
  price:      string | null;
  change:     string | null;
  changePct:  string | null;
  isPositive: boolean | null;
  verdict:    Verdict | null;
  confidence: number | null;
  summary?:   string | null;   // one-line Athena decision context
  addedAt:    number;
}

type AddResult = { success: true } | { success: false; error: string };

// ── Constants ──────────────────────────────────────────────────────────────────
const HOLDINGS_KEY  = "athena_holdings";
const WATCHLIST_KEY = "athena_watchlist";

const VERDICT_STYLE: Record<
  Verdict,
  { color: string; bg: string; border: string; glow: string }
> = {
  BUY:   { color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.25)",  glow: "rgba(74,222,128,0.10)" },
  HOLD:  { color: "#d4a017", bg: "rgba(212,160,23,0.08)",   border: "rgba(212,160,23,0.25)",  glow: "rgba(212,160,23,0.10)" },
  WATCH: { color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.25)",  glow: "rgba(96,165,250,0.10)" },
  AVOID: { color: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.25)", glow: "rgba(248,113,113,0.10)" },
};

const ERROR_COPY: Record<string, string> = {
  already_exists: "Already in this list",
  invalid_ticker: "Symbol not recognised",
  rate_limited:   "Market data temporarily unavailable",
  network_error:  "Connection error — please try again",
  fetch_failed:   "Could not load this stock",
};

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadList(key: string): PortfolioStock[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); }
  catch { return []; }
}
function saveList(key: string, list: PortfolioStock[]): void {
  localStorage.setItem(key, JSON.stringify(list));
}

// ── Statistics ─────────────────────────────────────────────────────────────────
function getModeVerdict(stocks: PortfolioStock[]): Verdict | null {
  const counts: Partial<Record<Verdict, number>> = {};
  for (const s of stocks) {
    if (s.verdict) counts[s.verdict] = (counts[s.verdict] ?? 0) + 1;
  }
  let best: Verdict | null = null;
  let bestCount = 0;
  for (const [v, c] of Object.entries(counts) as [Verdict, number][]) {
    if (c > bestCount) { best = v; bestCount = c; }
  }
  return best;
}

function getRiskProfile(stocks: PortfolioStock[]): { label: string; color: string } {
  const verdicts = stocks.filter((s) => s.verdict).map((s) => s.verdict!);
  if (!verdicts.length) return { label: "—", color: "#333" };
  const total    = verdicts.length;
  const avoidPct = verdicts.filter((v) => v === "AVOID").length / total;
  const watchPct = verdicts.filter((v) => v === "WATCH").length / total;
  const buyPct   = verdicts.filter((v) => v === "BUY").length   / total;
  if (avoidPct >= 0.5)            return { label: "Aggressive",   color: "#f87171" };
  if (avoidPct + watchPct >= 0.5) return { label: "Elevated",     color: "#fb923c" };
  if (buyPct >= 0.5)              return { label: "Conservative", color: "#4ade80" };
  return                                 { label: "Balanced",     color: "#d4a017" };
}

// ── Overview Bar ──────────────────────────────────────────────────────────────
function OverviewBar({
  holdings,
  watchlist,
}: {
  holdings:  PortfolioStock[];
  watchlist: PortfolioStock[];
}) {
  const all         = [...holdings, ...watchlist];
  const modeVerdict = getModeVerdict(all);
  const risk        = getRiskProfile(all);
  const vs          = modeVerdict ? VERDICT_STYLE[modeVerdict] : null;

  const stats = [
    { label: "Holdings",     value: String(holdings.length),  valueColor: "#d4a017" },
    { label: "Watchlist",    value: String(watchlist.length), valueColor: "#d4a017" },
    { label: "Consensus",    value: modeVerdict ?? "—",        valueColor: vs?.color ?? "#555" },
    { label: "Risk Profile", value: risk.label,               valueColor: risk.color },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col gap-3 p-5 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #111111 0%, #0d0d0d 100%)",
            border: "1px solid #222",
          }}
        >
          <p className="text-[9px] text-[#555] tracking-[0.28em] uppercase">
            {s.label}
          </p>
          <p
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: s.value.length > 8 ? "1.05rem" : "1.5rem",
              fontWeight: 700,
              color: s.valueColor,
              lineHeight: 1,
              letterSpacing: "0.04em",
            }}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Global first-time empty state ─────────────────────────────────────────────
function GlobalEmptyHero() {
  return (
    <div className="flex items-center justify-center py-8 mb-6">
      <p
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.85rem",
          color: "#555",
          letterSpacing: "0.06em",
          fontWeight: 400,
        }}
      >
        Add your first stock to start tracking Athena insights.
      </p>
    </div>
  );
}

// ── Section Empty State ────────────────────────────────────────────────────────
function SectionEmptyState({
  title,
  subtitle,
  buttonLabel,
  onAddClick,
}: {
  title:       string;
  subtitle:    string;
  buttonLabel: string;
  onAddClick:  () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-5">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ border: "1px solid #2a1f00", background: "#080600" }}
      >
        <svg
          width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="#d4a017" strokeWidth="1.2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>

      <div className="text-center">
        <p
          className="text-sm font-semibold mb-2"
          style={{ fontFamily: "'Cinzel', serif", color: "#bbb", letterSpacing: "0.06em" }}
        >
          {title}
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: "#666" }}>
          {subtitle}
        </p>
      </div>

      <button
        onClick={onAddClick}
        style={{
          background: "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
          color: "#000", border: "none", borderRadius: 8,
          padding: "9px 22px", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.12em", cursor: "pointer",
          fontFamily: "'Inter', sans-serif", transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

// ── Smart Add Row ──────────────────────────────────────────────────────────────
function AddRow({
  onAdd,
  inputRef,
}: {
  onAdd:     (symbol: string) => Promise<AddResult>;
  inputRef:  React.RefObject<HTMLInputElement>;
}) {
  const [query,     setQuery]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [focused,   setFocused]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions: Stock[] = useMemo(
    () => searchStocks(query, 5),
    [query],
  );

  const showDropdown = focused && query.length >= 2 && suggestions.length > 0 && !loading;

  // Click-outside closes dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = useCallback(async (ticker: string) => {
    if (loading) return;
    setQuery("");
    setFocused(false);
    setActiveIdx(-1);
    setError(null);
    setLoading(true);
    const result = await onAdd(ticker);
    setLoading(false);
    if (!result.success) {
      setError(
        ERROR_COPY[(result as { success: false; error: string }).error]
          ?? "Something went wrong.",
      );
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [loading, onAdd, inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        handleAdd(suggestions[activeIdx].ticker);
      } else if (showDropdown && suggestions.length > 0) {
        // auto-select top suggestion when dropdown is visible
        handleAdd(suggestions[0].ticker);
      } else {
        const sym = query.trim().toUpperCase();
        if (sym) handleAdd(sym);
      }
      return;
    }
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setFocused(false);
      setActiveIdx(-1);
    }
  };

  const inputBorderColor = error
    ? "rgba(248,113,113,0.4)"
    : focused
    ? "rgba(212,160,23,0.35)"
    : "#1c1c1c";

  return (
    <div
      ref={wrapperRef}
      className="flex flex-col items-end gap-1.5"
      style={{ position: "relative" }}
    >
      {/* Input + loading dots */}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase());
            setError(null);
            setActiveIdx(-1);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "Fetching…" : "TICKER OR NAME"}
          maxLength={40}
          disabled={loading}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          style={{
            background: "#050505",
            border: `1px solid ${inputBorderColor}`,
            borderRadius: showDropdown ? "8px 8px 0 0" : 8,
            color: "#d4a017",
            padding: "7px 34px 7px 13px",
            fontSize: 11,
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.15em",
            outline: "none",
            width: 196,
            transition: "border-color 0.15s, border-radius 0.1s",
            opacity: loading ? 0.65 : 1,
          }}
        />

        {/* Loading pulse dots */}
        {loading && (
          <div style={{
            position: "absolute", right: 11, top: "50%",
            transform: "translateY(-50%)",
            display: "flex", gap: 3, alignItems: "center",
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 3, height: 3, borderRadius: "50%",
                  background: "#d4a017",
                  animation: `gold-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            width: 196,
            zIndex: 50,
            background: "#090909",
            border: "1px solid rgba(212,160,23,0.25)",
            borderTop: "1px solid rgba(212,160,23,0.12)",
            borderRadius: "0 0 8px 8px",
            overflow: "hidden",
            animation: "dropdown-appear 0.1s ease-out forwards",
            boxShadow: "0 12px 36px rgba(0,0,0,0.75)",
          }}
        >
          {suggestions.map((stock, idx) => {
            const isActive = idx === activeIdx;
            return (
              <div
                key={stock.ticker}
                onMouseDown={(e) => { e.preventDefault(); handleAdd(stock.ticker); }}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "7px 12px",
                  cursor: "pointer",
                  background: isActive ? "rgba(212,160,23,0.09)" : "transparent",
                  borderBottom: idx < suggestions.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                  transition: "background 0.08s ease",
                }}
              >
                {/* Ticker */}
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "0.70rem",
                  color: "#d4a017",
                  letterSpacing: "0.08em",
                  minWidth: 36,
                  flexShrink: 0,
                }}>
                  {stock.ticker}
                </span>

                {/* Divider */}
                <div style={{
                  width: 1, alignSelf: "stretch",
                  background: "rgba(212,160,23,0.14)",
                  flexShrink: 0,
                }} />

                {/* Company name */}
                <span style={{
                  color: isActive ? "#888" : "#444",
                  fontSize: "0.70rem",
                  fontWeight: 400,
                  letterSpacing: "0.01em",
                  fontFamily: "'Inter', sans-serif",
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  transition: "color 0.08s ease",
                }}>
                  {stock.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p
          className="text-[10px]"
          style={{ color: "#f87171", letterSpacing: "0.02em", maxWidth: 196 }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ── Stock Row ──────────────────────────────────────────────────────────────────
function StockRow({
  stock,
  onRemove,
}: {
  stock:    PortfolioStock;
  onRemove: () => void;
}) {
  const changePctNum = stock.changePct !== null
    ? Math.abs(parseFloat(stock.changePct))
    : null;
  const vs = stock.verdict ? VERDICT_STYLE[stock.verdict] : null;

  return (
    <div
      className="group relative flex items-center gap-4 px-6 py-[18px]"
      style={{
        border: "1px solid #1e1e1e",
        background: "linear-gradient(135deg, #0f0f0f 0%, #0a0a0a 100%)",
        borderRadius: 20,
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#2a2a2a";
        e.currentTarget.style.boxShadow = vs
          ? `0 8px 32px ${vs.glow}, 0 2px 12px rgba(0,0,0,0.5)`
          : "0 8px 24px rgba(255,255,255,0.02), 0 2px 8px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#1e1e1e";
        e.currentTarget.style.boxShadow   = "none";
      }}
    >
      {/* ── Ticker block ── */}
      <div className="shrink-0" style={{ width: 76 }}>
        <p style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 15,
          fontWeight: 700,
          color: "#d4a017",
          letterSpacing: "0.08em",
          lineHeight: 1,
        }}>
          {stock.symbol}
        </p>
        {stock.exchange && (
          <p className="mt-1" style={{ fontSize: 8, color: "#444", letterSpacing: "0.12em" }}>
            {stock.exchange}
          </p>
        )}
      </div>

      {/* ── Company + summary (or sector fallback) ── */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] truncate leading-tight" style={{ color: "#c0c0c0" }}>
          {stock.name}
        </p>
        {stock.summary ? (
          <p
            className="truncate mt-1"
            style={{ fontSize: 11, color: "#777", lineHeight: 1.5, fontStyle: "italic" }}
          >
            {stock.summary}
          </p>
        ) : stock.sector ? (
          <p className="truncate mt-1" style={{ fontSize: 9, color: "#444" }}>
            {stock.sector}
          </p>
        ) : null}
      </div>

      {/* ── Price + change (desktop) ── */}
      <div className="shrink-0 text-right hidden sm:block" style={{ minWidth: 96 }}>
        {stock.price ? (
          <p
            className="text-[14px] font-semibold leading-tight"
            style={{ color: "#e8e8e8", fontVariantNumeric: "tabular-nums" }}
          >
            ${stock.price}
          </p>
        ) : (
          <p style={{ color: "#555", fontSize: 13 }}>—</p>
        )}
        {changePctNum !== null && stock.isPositive !== null && (
          <p
            className="text-[11px] font-semibold mt-1"
            style={{
              color: stock.isPositive ? "#4ade80" : "#f87171",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {stock.isPositive ? "▲" : "▼"}&nbsp;{changePctNum.toFixed(2)}%
          </p>
        )}
      </div>

      {/* ── Verdict + Confidence — one unified unit ── */}
      <div className="shrink-0">
        {vs ? (
          <div style={{
            display: "inline-flex",
            alignItems: "stretch",
            border: `1px solid ${vs.border}`,
            borderRadius: 8,
            overflow: "hidden",
            background: vs.bg,
            boxShadow: `0 0 14px ${vs.glow}`,
          }}>
            {/* Verdict label */}
            <span style={{
              color: vs.color,
              padding: "5px 13px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              fontFamily: "'Cinzel', serif",
              lineHeight: 1.6,
              display: "flex",
              alignItems: "center",
            }}>
              {stock.verdict}
            </span>

            {/* Confidence — tightly adjoined */}
            {typeof stock.confidence === "number" && (
              <>
                <div style={{ width: 1, background: vs.border }} />
                <span style={{
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: vs.color,
                  fontFamily: "'Cinzel', serif",
                  letterSpacing: "0.04em",
                  display: "flex",
                  alignItems: "center",
                  opacity: 0.82,
                }}>
                  {stock.confidence}
                  <span style={{ fontSize: 7, opacity: 0.6, marginLeft: 1 }}>/10</span>
                </span>
              </>
            )}
          </div>
        ) : (
          <span style={{
            color: "#555", fontSize: 11,
            fontFamily: "'Cinzel', serif",
          }}>
            —
          </span>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="shrink-0 flex items-center gap-3">
        {/* Chevron → analyze */}
        <Link
          href={`/analyze/${stock.symbol}`}
          className="opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-150"
          style={{ color: "#555", width: 20, height: 20 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#d4a017")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
          title={`Analyze ${stock.symbol}`}
        >
          <svg
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        {/* Remove × */}
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-150"
          style={{ color: "#444", fontSize: 18, lineHeight: 1, width: 20, height: 20 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
          aria-label={`Remove ${stock.symbol}`}
        >
          ×
        </button>
      </div>

      {/* ── Mobile price + change ── */}
      <div className="sm:hidden absolute bottom-3.5 right-6 flex items-center gap-2">
        {stock.price && (
          <span
            className="text-[12px] font-semibold"
            style={{ color: "#e8e8e8", fontVariantNumeric: "tabular-nums" }}
          >
            ${stock.price}
          </span>
        )}
        {changePctNum !== null && (
          <span
            className="text-[11px] font-semibold"
            style={{ color: stock.isPositive ? "#4ade80" : "#f87171" }}
          >
            {stock.isPositive ? "▲" : "▼"}&nbsp;{changePctNum.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Column header row ──────────────────────────────────────────────────────────
function ColumnHeaders() {
  return (
    <div
      className="hidden sm:flex items-center gap-4 mb-2"
      style={{ paddingLeft: 24, paddingRight: 24 }}
    >
      <div style={{ width: 76 }}>
        <span className="text-[8px] text-[#444] tracking-[0.22em] uppercase">Symbol</span>
      </div>
      <div className="flex-1">
        <span className="text-[8px] text-[#444] tracking-[0.22em] uppercase">Company</span>
      </div>
      <div style={{ minWidth: 96, textAlign: "right" }}>
        <span className="text-[8px] text-[#444] tracking-[0.22em] uppercase">Price</span>
      </div>
      <div>
        <span className="text-[8px] text-[#444] tracking-[0.22em] uppercase">Verdict</span>
      </div>
      {/* spacer for chevron + remove */}
      <div style={{ width: 56 }} />
    </div>
  );
}

// ── Portfolio Section ──────────────────────────────────────────────────────────
function PortfolioSection({
  title,
  subtitle,
  emptyTitle,
  emptySubtitle,
  addButtonLabel,
  list,
  onAdd,
  onRemove,
}: {
  title:          string;
  subtitle:       string;
  emptyTitle:     string;
  emptySubtitle:  string;
  addButtonLabel: string;
  list:           PortfolioStock[];
  onAdd:          (sym: string) => Promise<AddResult>;
  onRemove:       (sym: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section>
      {/* Section header */}
      <div className="flex items-start justify-between gap-6 mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#999",
              letterSpacing: "0.1em",
            }}>
              {title}
            </span>
            {list.length > 0 && (
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 9,
                fontWeight: 700,
                color: "#d4a017",
                background: "#0d0b00",
                border: "1px solid #2a1f00",
                padding: "1px 7px",
                borderRadius: 4,
                letterSpacing: "0.06em",
              }}>
                {list.length}
              </span>
            )}
          </div>
          <p className="text-[11px]" style={{ color: "#555" }}>{subtitle}</p>
        </div>

        <AddRow onAdd={onAdd} inputRef={inputRef} />
      </div>

      {/* Column labels */}
      {list.length > 0 && <ColumnHeaders />}

      {/* List or empty state */}
      {list.length === 0 ? (
        <SectionEmptyState
          title={emptyTitle}
          subtitle={emptySubtitle}
          buttonLabel={addButtonLabel}
          onAddClick={() => inputRef.current?.focus()}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((stock) => (
            <StockRow
              key={stock.symbol}
              stock={stock}
              onRemove={() => onRemove(stock.symbol)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Main exported component ────────────────────────────────────────────────────
export default function PortfolioClient() {
  const [holdings,  setHoldings]  = useState<PortfolioStock[]>([]);
  const [watchlist, setWatchlist] = useState<PortfolioStock[]>([]);
  const [mounted,   setMounted]   = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    setHoldings(loadList(HOLDINGS_KEY));
    setWatchlist(loadList(WATCHLIST_KEY));
    setMounted(true);
  }, []);

  // Persist
  useEffect(() => { if (mounted) saveList(HOLDINGS_KEY,  holdings);  }, [holdings,  mounted]);
  useEffect(() => { if (mounted) saveList(WATCHLIST_KEY, watchlist); }, [watchlist, mounted]);

  // Add stock — fetch price + verdict + summary, push to list
  const addStock = useCallback(
    async (
      symbol:  string,
      list:    PortfolioStock[],
      setList: React.Dispatch<React.SetStateAction<PortfolioStock[]>>,
    ): Promise<AddResult> => {
      if (list.some((s) => s.symbol === symbol)) {
        return { success: false, error: "already_exists" };
      }
      try {
        const res  = await fetch(
          `/api/portfolio-stock?symbol=${encodeURIComponent(symbol)}&verdict=true`,
        );
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error ?? "fetch_failed" };
        setList((prev) => [...prev, { ...data, addedAt: Date.now() }]);
        return { success: true };
      } catch {
        return { success: false, error: "network_error" };
      }
    },
    [],
  );

  // Remove stock
  const removeStock = useCallback(
    (symbol: string, setList: React.Dispatch<React.SetStateAction<PortfolioStock[]>>) => {
      setList((prev) => prev.filter((s) => s.symbol !== symbol));
    },
    [],
  );

  // Bound per-section helpers
  const addToHoldings       = useCallback((sym: string) => addStock(sym, holdings, setHoldings),   [addStock, holdings]);
  const addToWatchlist      = useCallback((sym: string) => addStock(sym, watchlist, setWatchlist),  [addStock, watchlist]);
  const removeFromHoldings  = useCallback((sym: string) => removeStock(sym, setHoldings),  [removeStock]);
  const removeFromWatchlist = useCallback((sym: string) => removeStock(sym, setWatchlist), [removeStock]);

  // Intelligence symbols: watchlist first, then holdings, hard-cap at 5
  const intelSymbols = useMemo(() => {
    const wl = watchlist.map((s) => s.symbol);
    const h  = holdings.map((s) => s.symbol).filter((sym) => !wl.includes(sym));
    return [...wl, ...h].slice(0, 5);
  }, [watchlist, holdings]);

  // ── Pre-hydration skeleton ──────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex flex-col gap-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl"
              style={{ background: "#080808", border: "1px solid #111", height: 80 }}
            />
          ))}
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="h-4 rounded" style={{ width: 140, background: "#111" }} />
            <div
              className="h-20 rounded-2xl"
              style={{ background: "#080808", border: "1px solid #111" }}
            />
          </div>
        ))}
      </div>
    );
  }

  const totalStocks = holdings.length + watchlist.length;

  return (
    <div className="flex flex-col gap-12">

      {/* Overview bar — only when stocks exist */}
      {totalStocks > 0 ? (
        <OverviewBar holdings={holdings} watchlist={watchlist} />
      ) : (
        <GlobalEmptyHero />
      )}

      {/* ── Watchlist Intelligence — shown when there are stocks to monitor ── */}
      {intelSymbols.length > 0 && (
        <>
          <WatchlistIntelligence symbols={intelSymbols} />
          <div
            className="h-px"
            style={{
              background:
                "linear-gradient(90deg, #222 0%, #2a2a2a 30%, transparent 100%)",
            }}
          />
        </>
      )}

      {/* ── Holdings ── */}
      <PortfolioSection
        title="My Holdings"
        subtitle="Positions you currently hold"
        emptyTitle="No holdings yet"
        emptySubtitle="Add a ticker to track live prices and Athena verdicts"
        addButtonLabel="+ Add Holding"
        list={holdings}
        onAdd={addToHoldings}
        onRemove={removeFromHoldings}
      />

      {/* Divider */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, #222 0%, #2a2a2a 30%, transparent 100%)",
        }}
      />

      {/* ── Watchlist ── */}
      <PortfolioSection
        title="My Watchlist"
        subtitle="Stocks on your radar"
        emptyTitle="Watchlist is empty"
        emptySubtitle="Track stocks you're watching before you commit"
        addButtonLabel="+ Add to Watchlist"
        list={watchlist}
        onAdd={addToWatchlist}
        onRemove={removeFromWatchlist}
      />

      {/* Subtle footer */}
      <p
        className="text-center text-[9px] tracking-[0.22em] uppercase"
        style={{ color: "#333" }}
      >
        Athena Intelligence · For informational purposes only · Not financial advice
      </p>
    </div>
  );
}
