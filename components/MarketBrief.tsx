import Link from "next/link";
import { getRegimeData } from "@/lib/marketRegime";

// Async server component — pulls live regime from the shared source of truth.
// The same getRegimeData() call is used by the Markets page, so both pages
// always display the same score.
export default async function MarketBrief() {
  // Graceful fallback if data is temporarily unavailable
  let regime;
  try {
    regime = await getRegimeData();
  } catch {
    regime = { score: null as unknown as number, label: "Unavailable", color: "#555" };
  }

  // Convert "CONSTRUCTIVE" → "Constructive" for the brief display style
  const labelTitle =
    regime.label.charAt(0).toUpperCase() + regime.label.slice(1).toLowerCase();

  return (
    <div className="w-full max-w-[900px] mt-8">
      <div
        className="rounded-r-2xl px-6 py-5"
        style={{
          background:  "#0b0b0b",
          border:      "1px solid rgba(212,175,55,0.12)",
          borderLeft:  "2px solid rgba(212,160,23,0.45)",
          boxShadow:   "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Top row: label left · date right */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "#d4a017" }}
            />
            <span
              className="text-[10px] tracking-widest uppercase font-medium"
              style={{ color: "#7A7A7A" }}
            >
              Athena Market Brief
            </span>
          </div>
          <span className="text-[10px] tracking-wide" style={{ color: "#555" }}>
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day:   "numeric",
              year:  "numeric",
            })}
          </span>
        </div>

        {/* Regime */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] tracking-wide" style={{ color: "#7A7A7A" }}>
            Market Regime:
          </span>
          <span
            className="text-[11px] font-semibold tracking-wide"
            style={{ color: regime.color }}
          >
            {labelTitle}
          </span>
          {regime.score != null && (
            <span
              className="text-[11px] font-bold"
              style={{ fontFamily: "'Cinzel', serif", color: regime.color }}
            >
              {regime.score}
            </span>
          )}
        </div>

        {/* Brief text */}
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#CFCFCF" }}>
          Technology leadership remains strong as AI infrastructure spending continues to
          expand. Bond yields remain stable near recent highs — risk appetite favors quality
          growth.
        </p>

        {/* CTA — bottom left */}
        <Link
          href="/markets"
          className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase hover:text-white transition-colors duration-200"
          style={{ color: "#d4a017" }}
        >
          View Markets
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
