import type { Metadata } from "next";
import Link from "next/link";
import NavLink from "@/components/NavLink";
import TickerInput from "@/components/TickerInput";
import ScreenerClient from "@/components/ScreenerClient";

export const metadata: Metadata = {
  title: "Screener",
  description:
    "Discover quality stocks for long-term investors. Filter by ROE, margins, growth, and more. Athena's quality-first stock screener.",
  alternates: {
    canonical: "/screener",
  },
};

export default function ScreenerPage() {
  return (
    <div className="relative flex-1 bg-black flex flex-col">
      {/* Top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(212,160,23,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center gap-6 px-8 py-4 border-b border-[#1a1a1a]">
        <Link
          href="/"
          className="shrink-0 font-bold tracking-widest hover:opacity-80 transition-opacity"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize:   "1.1rem",
            background: "linear-gradient(135deg, #d4a017 0%, #f0c040 50%, #a07810 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
          }}
        >
          ATHENA
        </Link>

        {/* Inline search */}
        <div className="flex-1 max-w-xs hidden md:block">
          <TickerInput compact />
        </div>

        {/* Right nav */}
        <div className="ml-auto flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-5">
            <NavLink href="/markets"   label="Markets"   tooltip="Live market intelligence" />
            <NavLink href="/screener"  label="Screener"  tooltip="Discover quality stocks"   active />
            <NavLink href="/research"  label="Research"  tooltip="AI market insights"       />
            <NavLink href="/portfolio" label="Portfolio" tooltip="Track your holdings"      />
          </nav>
          <Link
            href="/"
            className="text-[11px] text-[#555] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            ← Home
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 md:px-12 py-10">

        {/* Page title */}
        <div className="flex items-start justify-between gap-4 mb-10 pb-8 border-b border-[#161616]">
          <div>
            <h1
              className="text-white font-bold tracking-wider mb-2"
              style={{ fontFamily: "'Cinzel', serif", fontSize: "2rem", lineHeight: 1 }}
            >
              Screener
            </h1>
            <p className="text-sm font-light" style={{ color: "#9A9A9A" }}>
              Filter the market by fundamentals. Built for long-term investors.
            </p>
          </div>

          {/* Live Data badge */}
          <span
            className="shrink-0"
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           6,
              padding:       "4px 12px",
              borderRadius:  20,
              border:        "1px solid rgba(74,222,128,0.2)",
              background:    "rgba(74,222,128,0.05)",
              fontSize:      9,
              color:         "#4ade80",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight:    600,
            }}
          >
            <span
              style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "#4ade80", display: "inline-block", opacity: 0.8,
              }}
            />
            Live Data
          </span>
        </div>

        <ScreenerClient />
      </main>

    </div>
  );
}
