"use client";

import { useState, useMemo, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { searchStocks, type Stock } from "@/lib/stockList";

export default function TickerInput({ compact = false }: { compact?: boolean }) {
  const [query,     setQuery]     = useState("");
  const [focused,   setFocused]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const router     = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // ── Suggestions ────────────────────────────────────────────────────────────
  const suggestions: Stock[] = useMemo(
    () => searchStocks(query, 5),
    [query],
  );

  const showDropdown = focused && query.length >= 2 && suggestions.length > 0;

  // ── Click-outside closes dropdown ─────────────────────────────────────────
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

  // ── Navigation helper ─────────────────────────────────────────────────────
  const navigate = (ticker: string) => {
    setQuery("");
    setFocused(false);
    setActiveIdx(-1);
    router.push(`/analyze/${ticker}`);
  };

  // ── Form submit (type-in ticker and hit Enter/button) ─────────────────────
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      navigate(suggestions[activeIdx].ticker);
      return;
    }
    const symbol = query.trim().toUpperCase();
    if (!symbol) return;
    navigate(symbol);
  };

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
      inputRef.current?.blur();
    }
    // Enter is handled by form onSubmit
  };

  // ── Ring style (focus glow) ───────────────────────────────────────────────
  const ringStyle: React.CSSProperties = {
    boxShadow: focused
      ? "0 0 0 1px #d4a017, 0 0 24px rgba(212,160,23,0.25)"
      : "0 0 0 1px #2a2a2a",
    transition: "box-shadow 0.25s ease",
  };

  return (
    <div
      ref={wrapperRef}
      className={compact ? "w-full" : "w-full max-w-xl mx-auto"}
      style={{ position: "relative" }}
    >
      <form onSubmit={handleSubmit} className="w-full">
        <div
          className="relative flex items-stretch gap-0 rounded-lg overflow-hidden"
          style={ringStyle}
        >
          {/* Ticker icon */}
          <div className="flex items-center justify-center px-4 bg-[#111] border-r border-[#2a2a2a]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d4a017"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(-1);
            }}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              compact
                ? "Enter a ticker or company name"
                : "Enter any company or ticker symbol"
            }
            maxLength={40}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            suppressHydrationWarning
            className={`flex-1 bg-[#111] text-white placeholder-[#444] px-4 text-sm font-medium tracking-widest uppercase outline-none transition-colors duration-200 ${compact ? "py-2.5" : "py-4"}`}
            style={{
              letterSpacing: "0.05em",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          />

          {/* Analyze button */}
          <button
            type="submit"
            disabled={!query.trim()}
            suppressHydrationWarning
            className={`relative font-semibold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden group ${compact ? "px-5 py-2.5" : "px-4 sm:px-7"}`}
            style={{
              background: "linear-gradient(135deg, #d4af37 0%, #c9a227 100%)",
              color: "#000",
              minHeight: compact ? 44 : 54,
              boxShadow: "0 6px 20px rgba(212,175,55,0.25)",
            }}
          >
            <span className="relative z-10">Analyze</span>
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "linear-gradient(135deg, #f0c040 0%, #d4af37 50%, #c9a227 100%)",
              }}
            />
          </button>
        </div>
      </form>

      {/* ── Dropdown ──────────────────────────────────────────────────────── */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "#111111",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            overflow: "hidden",
            animation: "dropdown-appear 0.12s ease-out forwards",
            boxShadow: "0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,160,23,0.08)",
          }}
        >
          {suggestions.map((stock, idx) => {
            const isActive = idx === activeIdx;
            return (
              <div
                key={stock.ticker}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click fires
                  navigate(stock.ticker);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: compact ? "8px 14px" : "10px 16px",
                  cursor: "pointer",
                  background: isActive
                    ? "rgba(212,160,23,0.10)"
                    : "rgba(212,160,23,0.00)",
                  transition: "background 0.1s ease",
                  borderBottom: idx < suggestions.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                }}
              >
                {/* Ticker */}
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    fontSize: compact ? "0.78rem" : "0.82rem",
                    color: "#d4a017",
                    letterSpacing: "0.08em",
                    minWidth: compact ? 44 : 52,
                    flexShrink: 0,
                  }}
                >
                  {stock.ticker}
                </span>

                {/* Divider */}
                <div
                  style={{
                    width: 1,
                    alignSelf: "stretch",
                    background: "rgba(212,160,23,0.18)",
                    flexShrink: 0,
                  }}
                />

                {/* Company name */}
                <span
                  style={{
                    color: isActive ? "#aaa" : "#555",
                    fontSize: compact ? "0.78rem" : "0.82rem",
                    fontWeight: 400,
                    letterSpacing: "0.01em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    transition: "color 0.1s ease",
                    textTransform: "none",
                  }}
                >
                  {stock.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom hint text */}
      {!compact && (
        <div className="flex flex-col items-center gap-1 mt-3">
          <p className="text-center text-[12px] font-medium" style={{ color: "#9A9A9A" }}>
            Complete AI analysis. In seconds.
          </p>
          <p className="text-center text-[11px] tracking-widest uppercase" style={{ color: "#555" }}>
            NYSE &bull; NASDAQ &bull; LSE &bull; TSE &bull; Global Exchanges
          </p>
        </div>
      )}

    </div>
  );
}
