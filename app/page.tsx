import Link from "next/link";
import AthenaLogo from "@/components/AthenaLogo";
import TickerInput from "@/components/TickerInput";
import StatCard from "@/components/StatCard";
import FeatureCards from "@/components/FeatureCards";
import LanguageSelector from "@/components/LanguageSelector";

export default function HomePage() {
  return (
    <div className="relative flex-1 bg-black flex flex-col overflow-hidden">
      {/* Background radial glow — top center */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,160,23,0.12) 0%, transparent 70%)",
        }}
      />
      {/* Background radial glow — bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[400px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 110%, rgba(212,160,23,0.06) 0%, transparent 70%)",
        }}
      />

      {/* ── Header / Nav ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <span
            className="text-gold-gradient text-lg font-bold tracking-widest"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            ATHENA
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/markets"
            className="text-[13px] text-[#888] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            Markets
          </Link>
          <Link
            href="/screener"
            className="text-[13px] text-[#888] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            Screener
          </Link>
          <a
            href="#"
            className="text-[13px] text-[#888] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            Research
          </a>
          <Link
            href="/portfolio"
            className="text-[13px] text-[#888] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            Portfolio
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <button className="text-[13px] text-[#888] hover:text-white tracking-widest uppercase font-medium transition-colors duration-200 hidden md:block">
            Sign In
          </button>
          <button
            className="text-[12px] font-semibold tracking-widest uppercase px-4 py-2 rounded transition-all duration-200 hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
              color: "#000",
            }}
          >
            Get Access
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10 text-[11px] font-semibold tracking-widest uppercase"
          style={{
            border: "1px solid #2a1f00",
            background: "rgba(212,160,23,0.07)",
            color: "#d4a017",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
            style={{ background: "#d4a017" }}
          />
          Powered by Advanced AI Models
        </div>

        {/* Logo */}
        <div className="mb-5">
          <AthenaLogo />
        </div>

        {/* Subtitle */}
        <p
          className="mb-3 font-semibold tracking-[0.4em] uppercase text-[#d4a017] text-sm"
        >
          AI-Powered Stock Analysis
        </p>

        {/* Tagline */}
        <p className="mb-14 text-[#888] text-sm max-w-md leading-relaxed font-normal tracking-wide">
          Institutional-grade intelligence for every investor.
          <br />
          Enter a ticker to unlock a complete AI-driven market deep-dive.
        </p>

        {/* Ticker Input */}
        <TickerInput />

        {/* Market Regime Mini-Badge */}
        <Link
          href="/markets"
          className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full transition-opacity duration-200 hover:opacity-70"
          style={{
            border:        "1px solid rgba(212,160,23,0.26)",
            background:    "rgba(212,160,23,0.06)",
            fontSize:      11,
            letterSpacing: "0.14em",
            fontFamily:    "'Cinzel', serif",
          }}
        >
          <span
            style={{
              width:        5,
              height:       5,
              borderRadius: "50%",
              background:   "#a07820",
              opacity:      0.8,
              flexShrink:   0,
            }}
          />
          <span style={{ color: "#c49a28", fontWeight: 700 }}>68</span>
          <span style={{ color: "#8a6e2a", fontWeight: 500 }}>&nbsp;·&nbsp;Constructive</span>
        </Link>

        {/* Divider */}
        <div className="flex items-center gap-4 my-16 w-full max-w-xl">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#333] to-[#333]" />
          <span className="text-[10px] text-[#666] tracking-widest uppercase">Analysis Suite</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#333] to-[#333]" />
        </div>

        {/* Feature cards */}
        <FeatureCards />

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-16">
          <StatCard value="50K+" label="Stocks Covered" />
          <StatCard value="99.9%" label="Uptime" />
          <StatCard value="< 3s" label="Analysis Speed" />
          <StatCard value="Real-time" label="Market Data" />
        </div>
      </main>

    </div>
  );
}
