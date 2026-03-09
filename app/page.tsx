import Link from "next/link";
import AthenaLogo from "@/components/AthenaLogo";
import TickerInput from "@/components/TickerInput";
import StatCard from "@/components/StatCard";
import FeatureCards from "@/components/FeatureCards";
import LanguageSelector from "@/components/LanguageSelector";
import FeaturedAnalysis from "@/components/FeaturedAnalysis";
import DailyMarketBrief from "@/components/DailyMarketBrief";
import PopularAnalyses from "@/components/PopularAnalyses";
import MarketBrief from "@/components/MarketBrief";
import MobileNav from "@/components/MobileNav";

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
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-[#1a1a1a]">
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
          <Link
            href="/research"
            className="text-[13px] text-[#888] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            Research
          </Link>
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
            className="hidden sm:block text-[12px] font-semibold tracking-widest uppercase px-4 py-2 rounded transition-all duration-200 hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
              color: "#000",
            }}
          >
            Get Access
          </button>
          <MobileNav />
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start md:justify-center pt-5 pb-12 md:pt-14 md:pb-16 text-center">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col items-center">

        {/* ── Desktop-only hero block — focus column ── */}
        <div className="hidden md:flex flex-col items-center w-full max-w-[900px]">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-[11px] font-semibold tracking-widest uppercase"
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
          <p className="mb-3 font-semibold tracking-[0.4em] uppercase text-[#d4a017] text-sm">
            AI-Powered Stock Analysis
          </p>

          {/* Tagline */}
          <p className="mb-10 text-[#888] text-sm max-w-md leading-relaxed font-normal tracking-wide">
            Institutional-grade intelligence for every investor.
            <br />
            Enter a ticker to unlock a complete AI-driven market deep-dive.
          </p>

          {/* Ticker Input */}
          <TickerInput />

          {/* Featured Analysis */}
          <FeaturedAnalysis />

          {/* Popular Analyses */}
          <PopularAnalyses />

          {/* Daily Market Brief */}
          <DailyMarketBrief />

          {/* ── Market Regime — context for all investors ── */}
          <div className="mt-8 flex flex-col items-center gap-3 w-full">
            {/* Regime pill — design unchanged */}
            <Link
              href="/markets"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-opacity duration-200 hover:opacity-70"
              style={{
                border:        "1px solid rgba(212,160,23,0.26)",
                background:    "rgba(212,160,23,0.06)",
                fontSize:      11,
                letterSpacing: "0.14em",
                fontFamily:    "'Cinzel', serif",
                minHeight:     36,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a07820", opacity: 0.8, flexShrink: 0 }} />
              <span style={{ color: "#c49a28", fontWeight: 700 }}>68</span>
              <span style={{ color: "#8a6e2a", fontWeight: 500 }}>&nbsp;·&nbsp;Constructive</span>
            </Link>

            {/* Beginner-friendly explanation */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[12px]" style={{ color: "#7A7A7A" }}>
                Market outlook:{" "}
                <span style={{ color: "#d4a017", fontWeight: 600 }}>Positive</span>
              </p>
              <p className="text-[11px] max-w-xs leading-relaxed" style={{ color: "#555" }}>
                Stocks are favored as risk appetite improves.
              </p>
              <Link
                href="/markets"
                className="text-[10px] tracking-widest uppercase hover:opacity-70 transition-opacity duration-200 mt-0.5"
                style={{ color: "#d4a017" }}
              >
                See full market analysis →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Mobile-only hero block ── */}
        <div className="md:hidden flex flex-col items-center w-full">
          {/* Compact context label */}
          <p className="text-[11px] tracking-widest uppercase mb-6 font-medium" style={{ color: "#7A7A7A" }}>
            AI Stock Analysis
          </p>

          {/* Ticker Input */}
          <TickerInput />

          {/* Featured Analysis */}
          <FeaturedAnalysis />

          {/* Popular Analyses */}
          <PopularAnalyses />

          {/* Daily Market Brief */}
          <DailyMarketBrief />

          {/* ── Market Regime — context for all investors ── */}
          <div className="mt-8 flex flex-col items-center gap-3 w-full">
            {/* Regime pill — design unchanged */}
            <Link
              href="/markets"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-opacity duration-200 hover:opacity-70"
              style={{
                border:        "1px solid rgba(212,160,23,0.26)",
                background:    "rgba(212,160,23,0.06)",
                fontSize:      11,
                letterSpacing: "0.14em",
                fontFamily:    "'Cinzel', serif",
                minHeight:     36,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a07820", opacity: 0.8, flexShrink: 0 }} />
              <span style={{ color: "#c49a28", fontWeight: 700 }}>68</span>
              <span style={{ color: "#8a6e2a", fontWeight: 500 }}>&nbsp;·&nbsp;Constructive</span>
            </Link>

            {/* Beginner-friendly explanation */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[12px]" style={{ color: "#7A7A7A" }}>
                Market outlook:{" "}
                <span style={{ color: "#d4a017", fontWeight: 600 }}>Positive</span>
              </p>
              <p className="text-[11px] max-w-xs leading-relaxed" style={{ color: "#555" }}>
                Stocks are favored as risk appetite improves.
              </p>
              <Link
                href="/markets"
                className="text-[10px] tracking-widest uppercase hover:opacity-70 transition-opacity duration-200 mt-0.5"
                style={{ color: "#d4a017" }}
              >
                See full market analysis →
              </Link>
            </div>
          </div>
        </div>

        {/* Divider — desktop only */}
        <div className="hidden md:flex items-center gap-4 my-8 w-full">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#333] to-[#333]" />
          <span className="text-[10px] text-[#666] tracking-widest uppercase">Analysis Suite</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#333] to-[#333]" />
        </div>

        {/* Feature cards — desktop only */}
        <div className="hidden md:block w-full">
          <FeatureCards />
        </div>

        {/* Market Brief — daily habit loop */}
        <MarketBrief />

        {/* Stats — 2-col mobile, 4-col desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 w-full">
          <StatCard value="50K+" label="Stocks Covered" />
          <StatCard value="99.9%" label="Uptime" />
          <StatCard value="< 3s" label="Analysis Speed" />
          <StatCard value="Real-time" label="Market Data" />
        </div>
        </div>
      </main>

    </div>
  );
}
