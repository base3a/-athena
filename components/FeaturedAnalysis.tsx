import Link from "next/link";

export default function FeaturedAnalysis() {
  return (
    <div className="w-full max-w-xl md:max-w-[900px] mt-8">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "#0b0b0b",
          border: "1px solid rgba(212,175,55,0.15)",
          borderLeft: "3px solid rgba(212,160,23,0.45)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Subtle inner glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 10% 50%, rgba(212,160,23,0.04) 0%, transparent 65%)",
          }}
        />

        <div className="relative p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-[#555] tracking-widest uppercase font-medium">
              Featured Analysis
            </span>
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(212,160,23,0.07)",
                border: "1px solid rgba(212,160,23,0.15)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
                style={{ background: "#d4a017" }}
              />
              <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: "#d4a017" }}>
                Live
              </span>
            </div>
          </div>

          {/* Ticker + Verdict + Confidence */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xl font-bold text-white"
              style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}
            >
              NVDA
            </span>
            <span
              className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded"
              style={{
                background: "rgba(74, 222, 128, 0.1)",
                color: "#4ade80",
                border: "1px solid rgba(74, 222, 128, 0.2)",
              }}
            >
              BUY
            </span>
            <div className="ml-auto flex items-baseline gap-1">
              <span className="text-[10px] text-[#444] tracking-widest uppercase mr-1">
                Confidence
              </span>
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "'Cinzel', serif", color: "#d4a017" }}
              >
                9
              </span>
              <span className="text-xs" style={{ color: "#333" }}>/10</span>
            </div>
          </div>

          {/* Gold fade divider */}
          <div
            className="h-px mb-3"
            style={{
              background: "linear-gradient(to right, rgba(212,160,23,0.15), transparent)",
            }}
          />

          {/* Description */}
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#CFCFCF" }}>
            AI infrastructure demand continues accelerating as hyperscalers expand datacenter
            capacity. Margin expansion and pricing power remain intact.
          </p>

          {/* CTA */}
          <Link
            href="/analyze/NVDA"
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase hover:text-white transition-colors duration-200"
            style={{ color: "#d4a017" }}
          >
            View Full Analysis
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
