"use client";

import Link from "next/link";
import type { ResearchArticle, Conviction } from "@/lib/research-data";

// ── Conviction colour map ─────────────────────────────────────────────────────
const CONVICTION_STYLE: Record<
  Conviction,
  { color: string; border: string; bg: string }
> = {
  High: {
    color: "#d4a017",
    border: "rgba(212,160,23,0.25)",
    bg: "rgba(212,160,23,0.07)",
  },
  Medium: {
    color: "#b89438",
    border: "rgba(184,148,56,0.22)",
    bg: "rgba(184,148,56,0.06)",
  },
  Developing: {
    color: "#777",
    border: "rgba(120,120,120,0.22)",
    bg: "rgba(120,120,120,0.06)",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ResearchHoverCard({
  card,
}: {
  card: ResearchArticle;
}) {
  const cv = CONVICTION_STYLE[card.conviction];

  return (
    <Link
      href={`/research/${card.slug}`}
      className="block rounded-2xl transition-all duration-200 group"
      style={{
        background: "linear-gradient(135deg, #0e0e0e 0%, #090909 100%)",
        border: "1px solid #1e1e1e",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor =
          "rgba(212,160,23,0.22)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow =
          "0 0 40px rgba(212,160,23,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1e1e1e";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
      }}
    >
      {/* ── Card body ── */}
      <div className="p-7 pb-5">
        {/* Tag + read time */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#8a6820",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(212,160,23,0.06)",
              border: "1px solid rgba(212,160,23,0.12)",
            }}
          >
            {card.tag}
          </span>
          <span
            style={{
              fontSize: 9,
              color: "#555",
              letterSpacing: "0.08em",
              flexShrink: 0,
            }}
          >
            {card.readTime}
          </span>
        </div>

        {/* Title */}
        <h3
          className="mb-3"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#e8e8e8",
            letterSpacing: "0.04em",
            lineHeight: 1.35,
          }}
        >
          {card.title}
        </h3>

        {/* Summary */}
        <p
          style={{
            fontSize: "0.83rem",
            color: "#888",
            lineHeight: 1.75,
          }}
        >
          {card.summary}
        </p>
      </div>

      {/* ── Card footer ── */}
      <div
        className="flex items-center justify-between px-7 py-3"
        style={{ borderTop: "1px solid #161616" }}
      >
        {/* Conviction badge */}
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 8,
              color: "#444",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Conviction
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: cv.color,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "1px 7px",
              borderRadius: 3,
              background: cv.bg,
              border: `1px solid ${cv.border}`,
            }}
          >
            {card.conviction}
          </span>
        </div>

        {/* Read arrow */}
        <span
          style={{
            fontSize: "0.7rem",
            color: "#444",
            letterSpacing: "0.1em",
            transition: "color 0.2s",
          }}
          className="group-hover:!text-[#d4a017]"
        >
          Read →
        </span>
      </div>
    </Link>
  );
}
