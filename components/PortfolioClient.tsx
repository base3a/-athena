"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
type Verdict = "BUY" | "HOLD" | "WATCH" | "AVOID";

interface PortfolioStock {
  symbol: string;
  name: string;
  exchange: string | null;
  sector: string | null;
  price: string | null;
  change: string | null;
  changePct: string | null;
  isPositive: boolean | null;
  verdict: Verdict | null;
  addedAt: number;
}

type AddResult = { success: true } | { success: false; error: string };

// ── Constants ──────────────────────────────────────────────────────────────────
const HOLDINGS_KEY = "athena_holdings";
const WATCHLIST_KEY = "athena_watchlist";

const VERDICT_STYLE: Record<
  Verdict,
  { color: string; bg: string; border: string }
> = {
  BUY:   { color: "#4ade80", bg: "rgba(74,222,128,0.09)",  border: "rgba(74,222,128,0.22)" },
  HOLD:  { color: "#d4a017", bg: "rgba(212,160,23,0.09)",  border: "rgba(212,160,23,0.22)" },
  WATCH: { color: "#60a5fa", bg: "rgba(96,165,250,0.09)",  border: "rgba(96,165,250,0.22)" },
  AVOID: { color: "#f87171", bg: "rgba(248,113,113,0.09)", border: "rgba(248,113,113,0.22)" },
};

const ERROR_COPY: Record<string, string> = {
  already_exists: "Already in this list",
  invalid_ticker: "Ticker not found — check the symbol",
  rate_limited:   "Market data temporarily unavailable",
  network_error:  "Connection error — please try again",
  fetch_failed:   "Could not load stock data",
};

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadList(key: string): PortfolioStock[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

function saveList(key: string, list: PortfolioStock[]): void {
  localStorage.setItem(key, JSON.stringify(list));
}

// ── VerdictBadge ──────────────────────────────────────────────────────────────
function VerdictBadge({ verdict }: { verdict: Verdict | null }) {
  if (!verdict) {
    return <span className="text-[#2a2a2a] text-[10px] tracking-widest">—</span>;
  }
  const s = VERDICT_STYLE[verdict];
  return (
    <span
      style={{
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        padding: "2px 10px",
        borderRadius: 5,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.14em",
        fontFamily: "'Cinzel', serif",
        display: "inline-block",
        lineHeight: "1.6",
      }}
    >
      {verdict}
    </span>
  );
}

// ── AddRow ────────────────────────────────────────────────────────────────────
function AddRow({
  onAdd,
}: {
  onAdd: (symbol: string) => Promise<AddResult>;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = useCallback(async () => {
    const sym = input.trim().toUpperCase();
    if (!sym || loading) return;
    setError(null);
    setLoading(true);
    const result = await onAdd(sym);
    setLoading(false);
    if (result.success) {
      setInput("");
      inputRef.current?.focus();
    } else {
      setError(ERROR_COPY[result.error] ?? "Something went wrong. Try again.");
    }
  }, [input, loading, onAdd]);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Ticker…"
          maxLength={10}
          disabled={loading}
          style={{
            background: "#0a0a0a",
            border: `1px solid ${error ? "rgba(248,113,113,0.4)" : "#222"}`,
            color: "#fff",
            borderRadius: 8,
            padding: "7px 12px",
            fontSize: 12,
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.1em",
            outline: "none",
            width: 130,
            transition: "border-color 0.15s",
          }}
          onFocus={(e) =>
            !error && (e.target.style.borderColor = "rgba(212,160,23,0.4)")
          }
          onBlur={(e) =>
            !error && (e.target.style.borderColor = "#222")
          }
        />
        <button
          onClick={handleAdd}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim()
              ? "transparent"
              : "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
            border: loading
              ? "1px solid #2a1f00"
              : !input.trim()
              ? "1px solid #1a1a1a"
              : "none",
            color: loading
              ? "#d4a017"
              : !input.trim()
              ? "#2a2a2a"
              : "#000",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {loading ? "Fetching…" : "Add"}
        </button>
      </div>
      {error && (
        <p
          className="text-[10px]"
          style={{ color: "#f87171", letterSpacing: "0.02em" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ── StockRow ──────────────────────────────────────────────────────────────────
function StockRow({
  stock,
  onRemove,
}: {
  stock: PortfolioStock;
  onRemove: () => void;
}) {
  const changePctNum =
    stock.changePct !== null ? Math.abs(parseFloat(stock.changePct)) : null;

  return (
    <div
      className="group flex items-center gap-3 md:gap-4 px-4 py-3.5 rounded-xl transition-all duration-150"
      style={{ border: "1px solid #141414", background: "#080808" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "#242424")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "#141414")
      }
    >
      {/* Ticker */}
      <Link
        href={`/analyze/${stock.symbol}`}
        className="shrink-0 hover:opacity-75 transition-opacity"
        title={`Full analysis for ${stock.symbol}`}
      >
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: 13,
            color: "#d4a017",
            letterSpacing: "0.08em",
          }}
        >
          {stock.symbol}
        </span>
      </Link>

      {/* Company name + sector */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[12px] truncate leading-tight"
          style={{ color: "#666" }}
        >
          {stock.name}
        </p>
        {stock.sector && (
          <p className="text-[10px] text-[#2e2e2e] tracking-wide truncate mt-0.5">
            {stock.sector}
          </p>
        )}
      </div>

      {/* Price — hidden on very small screens */}
      <div className="shrink-0 text-right hidden sm:block" style={{ minWidth: 72 }}>
        {stock.price ? (
          <p
            className="text-[13px] font-semibold"
            style={{ color: "#e0e0e0", fontVariantNumeric: "tabular-nums" }}
          >
            ${stock.price}
          </p>
        ) : (
          <p className="text-[#2a2a2a] text-sm">—</p>
        )}
      </div>

      {/* Daily change % — hidden on very small screens */}
      <div
        className="shrink-0 text-right hidden sm:block"
        style={{ minWidth: 72 }}
      >
        {changePctNum !== null && stock.isPositive !== null ? (
          <p
            className="text-[12px] font-semibold"
            style={{
              color: stock.isPositive ? "#4ade80" : "#f87171",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {stock.isPositive ? "▲" : "▼"}&nbsp;{changePctNum.toFixed(2)}%
          </p>
        ) : (
          <p className="text-[#2a2a2a] text-sm">—</p>
        )}
      </div>

      {/* Mobile: price + change stacked */}
      <div className="shrink-0 sm:hidden text-right">
        {stock.price && (
          <p className="text-[13px] font-semibold text-[#e0e0e0]">
            ${stock.price}
          </p>
        )}
        {changePctNum !== null && (
          <p
            className="text-[11px] font-semibold"
            style={{ color: stock.isPositive ? "#4ade80" : "#f87171" }}
          >
            {stock.isPositive ? "▲" : "▼"}&nbsp;{changePctNum.toFixed(2)}%
          </p>
        )}
      </div>

      {/* Verdict badge */}
      <div className="shrink-0">
        <VerdictBadge verdict={stock.verdict} />
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded transition-all duration-150 opacity-0 group-hover:opacity-100"
        style={{ color: "#2e2e2e", fontSize: 16, lineHeight: 1 }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "#f87171")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "#2e2e2e")
        }
        aria-label={`Remove ${stock.symbol}`}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl py-12"
      style={{ border: "1px dashed #191919" }}
    >
      <p
        className="text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "#2a2a2a" }}
      >
        {label}
      </p>
    </div>
  );
}

// ── Column header row ─────────────────────────────────────────────────────────
function ColumnHeaders() {
  return (
    <div className="hidden sm:flex items-center gap-3 md:gap-4 px-4 mb-2">
      <div
        className="shrink-0"
        style={{ width: 44 }} // ticker column width placeholder
      />
      <div className="flex-1 text-[9px] text-[#252525] tracking-[0.2em] uppercase">
        Company
      </div>
      <div
        className="shrink-0 text-[9px] text-[#252525] tracking-[0.2em] uppercase text-right"
        style={{ minWidth: 72 }}
      >
        Price
      </div>
      <div
        className="shrink-0 text-[9px] text-[#252525] tracking-[0.2em] uppercase text-right"
        style={{ minWidth: 72 }}
      >
        Today
      </div>
      <div className="shrink-0 text-[9px] text-[#252525] tracking-[0.2em] uppercase">
        Verdict
      </div>
      <div className="shrink-0 w-6" />
    </div>
  );
}

// ── PortfolioSection ──────────────────────────────────────────────────────────
function PortfolioSection({
  title,
  subtitle,
  list,
  onAdd,
  onRemove,
}: {
  title: string;
  subtitle: string;
  list: PortfolioStock[];
  onAdd: (sym: string) => Promise<AddResult>;
  onRemove: (sym: string) => void;
}) {
  return (
    <section>
      {/* Section title row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          {/* Label + count badge */}
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-[#555] tracking-[0.25em] uppercase font-semibold">
                {title}
              </span>
              <span
                className="flex-1 h-px"
                style={{
                  background: "linear-gradient(90deg, #1f1f1f, transparent)",
                  minWidth: 48,
                }}
              />
            </div>
            {list.length > 0 && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: "#110e00",
                  color: "#d4a017",
                  border: "1px solid #2a1f00",
                }}
              >
                {list.length}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#2e2e2e] tracking-wider">{subtitle}</p>
        </div>

        {/* Add input + button */}
        <AddRow onAdd={onAdd} />
      </div>

      {/* Column headers */}
      {list.length > 0 && <ColumnHeaders />}

      {/* Stock rows / empty state */}
      {list.length === 0 ? (
        <EmptyState label={`No ${title.toLowerCase()} yet — add a ticker above`} />
      ) : (
        <div className="flex flex-col gap-1.5">
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
  const [holdings, setHoldings] = useState<PortfolioStock[]>([]);
  const [watchlist, setWatchlist] = useState<PortfolioStock[]>([]);
  const [mounted, setMounted] = useState(false);

  // ── Hydrate from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    setHoldings(loadList(HOLDINGS_KEY));
    setWatchlist(loadList(WATCHLIST_KEY));
    setMounted(true);
  }, []);

  // ── Persist to localStorage whenever lists change ────────────────────────────
  useEffect(() => {
    if (mounted) saveList(HOLDINGS_KEY, holdings);
  }, [holdings, mounted]);

  useEffect(() => {
    if (mounted) saveList(WATCHLIST_KEY, watchlist);
  }, [watchlist, mounted]);

  // ── Add stock (fetch price + verdict, then push to list) ─────────────────────
  const addStock = useCallback(
    async (
      symbol: string,
      list: PortfolioStock[],
      setList: React.Dispatch<React.SetStateAction<PortfolioStock[]>>
    ): Promise<AddResult> => {
      // Duplicate guard
      if (list.some((s) => s.symbol === symbol)) {
        return { success: false, error: "already_exists" };
      }

      try {
        const res = await fetch(
          `/api/portfolio-stock?symbol=${encodeURIComponent(symbol)}&verdict=true`
        );
        const data = await res.json();

        if (!res.ok) {
          return { success: false, error: data.error ?? "fetch_failed" };
        }

        const stock: PortfolioStock = { ...data, addedAt: Date.now() };
        setList((prev) => [...prev, stock]);
        return { success: true };
      } catch {
        return { success: false, error: "network_error" };
      }
    },
    []
  );

  // ── Remove stock ─────────────────────────────────────────────────────────────
  const removeStock = useCallback(
    (
      symbol: string,
      setList: React.Dispatch<React.SetStateAction<PortfolioStock[]>>
    ) => {
      setList((prev) => prev.filter((s) => s.symbol !== symbol));
    },
    []
  );

  // ── Bound helpers for each section ──────────────────────────────────────────
  const addToHoldings = useCallback(
    (sym: string) => addStock(sym, holdings, setHoldings),
    [addStock, holdings]
  );
  const addToWatchlist = useCallback(
    (sym: string) => addStock(sym, watchlist, setWatchlist),
    [addStock, watchlist]
  );
  const removeFromHoldings = useCallback(
    (sym: string) => removeStock(sym, setHoldings),
    [removeStock]
  );
  const removeFromWatchlist = useCallback(
    (sym: string) => removeStock(sym, setWatchlist),
    [removeStock]
  );

  // ── Loading skeleton (before hydration) ──────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex flex-col gap-12">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-4">
            <div
              className="h-4 rounded"
              style={{ width: 120, background: "#111" }}
            />
            <div
              className="h-16 rounded-xl"
              style={{ background: "#080808", border: "1px dashed #191919" }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-14">
      {/* Holdings */}
      <PortfolioSection
        title="My Holdings"
        subtitle="Stocks you own"
        list={holdings}
        onAdd={addToHoldings}
        onRemove={removeFromHoldings}
      />

      {/* Divider */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, #181818 0%, #1f1f1f 50%, transparent 100%)",
        }}
      />

      {/* Watchlist */}
      <PortfolioSection
        title="My Watchlist"
        subtitle="Stocks you're tracking"
        list={watchlist}
        onAdd={addToWatchlist}
        onRemove={removeFromWatchlist}
      />

      {/* Footer note */}
      <p
        className="text-center text-[9px] tracking-[0.25em] uppercase"
        style={{ color: "#1c1c00" }}
      >
        Verdicts powered by Athena AI · Cached locally · Not financial advice
      </p>
    </div>
  );
}
