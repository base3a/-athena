"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function TickerInput({ compact = false }: { compact?: boolean }) {
  const [ticker, setTicker] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const symbol = ticker.trim().toUpperCase();
    if (!symbol) return;
    router.push(`/analyze/${symbol}`);
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "w-full" : "w-full max-w-xl mx-auto"}>
      <div
        className="relative flex items-stretch gap-0 rounded-lg overflow-hidden"
        style={{
          boxShadow: focused
            ? "0 0 0 1px #d4a017, 0 0 24px rgba(212,160,23,0.25)"
            : "0 0 0 1px #2a2a2a",
          transition: "box-shadow 0.25s ease",
        }}
      >
        {/* Ticker symbol icon */}
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
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={compact ? "New ticker…" : "Enter ticker symbol  (e.g. AAPL, TSLA, NVDA)"}
          maxLength={10}
          autoComplete="off"
          spellCheck={false}
          className={`flex-1 bg-[#111] text-white placeholder-[#444] px-4
                     text-sm font-medium tracking-widest uppercase outline-none
                     transition-colors duration-200 ${compact ? "py-2.5" : "py-4"}`}
          style={{ letterSpacing: ticker ? "0.15em" : "0.05em" }}
        />

        {/* Analyze button */}
        <button
          type="submit"
          disabled={!ticker.trim()}
          className={`relative font-semibold text-sm tracking-widest uppercase
                     transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                     overflow-hidden group ${compact ? "px-5 py-2.5" : "px-7 py-4"}`}
          style={{
            background: "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
            color: "#000",
          }}
        >
          <span className="relative z-10">Analyze</span>
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, #f0c040 0%, #d4a017 50%, #a07810 100%)",
            }}
          />
        </button>
      </div>

      {!compact && (
        <p className="mt-3 text-center text-[11px] text-[#555] tracking-widest uppercase">
          NYSE &bull; NASDAQ &bull; S&amp;P 500 &bull; Global Markets
        </p>
      )}
    </form>
  );
}
