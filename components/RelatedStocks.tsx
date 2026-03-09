"use client";

import Link from "next/link";

export default function RelatedStocks({ tickers }: { tickers: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {tickers.map((ticker) => (
        <Link
          key={ticker}
          href={`/analyze/${ticker}`}
          style={{ textDecoration: "none" }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 18px",
              borderRadius: 8,
              background: "#0c0c0c",
              border: "1px solid #222",
              fontFamily: "'Cinzel', serif",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#bbb",
              letterSpacing: "0.1em",
              transition: "all 0.18s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLSpanElement;
              el.style.borderColor = "rgba(212,160,23,0.4)";
              el.style.color = "#d4a017";
              el.style.background = "rgba(212,160,23,0.05)";
              el.style.boxShadow = "0 0 16px rgba(212,160,23,0.08)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLSpanElement;
              el.style.borderColor = "#222";
              el.style.color = "#bbb";
              el.style.background = "#0c0c0c";
              el.style.boxShadow = "none";
            }}
          >
            {ticker}
            <span
              style={{
                fontSize: 10,
                opacity: 0.45,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 400,
              }}
            >
              →
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
