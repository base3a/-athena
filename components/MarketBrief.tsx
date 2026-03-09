import Link from "next/link";

export default function MarketBrief() {
  return (
    <div className="w-full max-w-[900px] mt-8">
      <div
        className="rounded-2xl px-6 py-5"
        style={{
          background: "#0b0b0b",
          border: "1px solid rgba(212,175,55,0.12)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Content */}
          <div className="flex-1 min-w-0">
            {/* Label row */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "#d4a017" }}
              />
              <span className="text-[10px] tracking-widest uppercase font-medium" style={{ color: "#7A7A7A" }}>
                Athena Market Brief
              </span>
              <span className="text-[10px]" style={{ color: "#3a3a3a" }}>·</span>
              <span className="text-[10px] tracking-wide" style={{ color: "#555" }}>Mar 7, 2026</span>
            </div>

            {/* Regime row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] tracking-wide" style={{ color: "#7A7A7A" }}>Market Regime:</span>
              <span
                className="text-[11px] font-semibold tracking-wide"
                style={{ color: "#d4a017" }}
              >
                Constructive
              </span>
              <span
                className="text-[11px] font-bold"
                style={{ fontFamily: "'Cinzel', serif", color: "#c49a28" }}
              >
                68
              </span>
            </div>

            {/* Brief text */}
            <p className="text-[13px] leading-relaxed max-w-2xl" style={{ color: "#CFCFCF" }}>
              Technology leadership remains strong as AI infrastructure spending continues to
              expand. Bond yields remain stable near recent highs — risk appetite favors quality
              growth.
            </p>
          </div>

          {/* Right: CTA */}
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase hover:text-white transition-colors duration-200 flex-shrink-0"
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
    </div>
  );
}
