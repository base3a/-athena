import Link from "next/link";
import NavLink from "@/components/NavLink";
import AthenaLogo from "@/components/AthenaLogo";
import TickerInput from "@/components/TickerInputNoSSR";
import StatCard from "@/components/StatCard";
import FeatureCards from "@/components/FeatureCards";
import FeaturedAnalysis from "@/components/FeaturedAnalysis";
import PopularAnalyses from "@/components/PopularAnalyses";
import MarketBrief from "@/components/MarketBrief";
import MarketPulse from "@/components/MarketPulse";
import MobileNav from "@/components/MobileNav";
import ValueProp from "@/components/ValueProp";
import MarketNews from "@/components/MarketNews";
import EarlyAccess from "@/components/EarlyAccess";

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
          <NavLink href="/markets"   label="Markets"   tooltip="Live market intelligence" size="md" />
          <NavLink href="/screener"  label="Screener"  tooltip="Discover quality stocks"   size="md" />
          <NavLink href="/research"  label="Research"  tooltip="AI market insights"       size="md" />
          <NavLink href="/portfolio" label="Portfolio" tooltip="Track your holdings"      size="md" />
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="#early-access"
            className="text-[13px] text-[#888] hover:text-white tracking-widest uppercase font-medium transition-colors duration-200 hidden md:block"
          >
            Sign In
          </a>
          <a
            href="#early-access"
            className="hidden sm:block text-[12px] font-semibold tracking-widest uppercase px-4 py-2 rounded transition-all duration-200 hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
              color: "#000",
            }}
          >
            Get Access
          </a>
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
            Powered by Advanced AI
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
          <p className="mb-1 text-[#999] text-sm font-normal tracking-wide">
            Institutional-grade intelligence for every investor.
          </p>
          <p className="mb-10 text-[#666] text-sm font-normal tracking-wide">
            Enter any ticker to receive a complete AI-driven investment analysis.
          </p>

          {/* Ticker Input */}
          <TickerInput />

          {/* Featured Analysis */}
          <FeaturedAnalysis />

          {/* Popular Analyses */}
          <PopularAnalyses />

        </div>

        {/* ── Mobile-only hero block ── */}
        <div className="md:hidden flex flex-col items-center w-full">
          {/* Logo */}
          <div className="mb-4">
            <AthenaLogo />
          </div>

          {/* Product description */}
          <p className="mb-6 font-semibold tracking-[0.4em] uppercase text-[#d4a017] text-sm">
            AI-Powered Stock Analysis
          </p>

          {/* Ticker Input */}
          <TickerInput />

          {/* Quick action buttons — mobile only */}
          <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 14 }}>
            <Link
              href="/markets"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 36,
                fontSize: 10,
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#d4a017",
                border: "1px solid rgba(212,160,23,0.28)",
                borderRadius: 6,
                textDecoration: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              View Markets →
            </Link>
            <Link
              href="/screener"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 36,
                fontSize: 10,
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#d4a017",
                border: "1px solid rgba(212,160,23,0.28)",
                borderRadius: 6,
                textDecoration: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Browse Screener →
            </Link>
          </div>

          {/* Featured Analysis */}
          <FeaturedAnalysis />

          {/* Popular Analyses */}
          <PopularAnalyses />

        </div>

        {/* Divider — desktop only */}
        <div className="hidden md:flex items-center gap-4 my-8 w-full max-w-[900px]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#333] to-[#333]" />
          <span className="text-[10px] text-[#666] tracking-widest uppercase">Analysis Suite</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#333] to-[#333]" />
        </div>

        {/* Feature cards — desktop only */}
        <div className="hidden md:block w-full max-w-[900px]">
          <FeatureCards />
        </div>

        {/* Market Brief — daily habit loop */}
        <MarketBrief />

        {/* Market Pulse — live sector snapshot */}
        <MarketPulse />

        {/* Stats — 2-col mobile, 4-col desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 w-full max-w-[900px]">
          <StatCard value="100K+" label="Global Stocks" />
          <StatCard value="99.9%" label="Uptime" />
          <StatCard value="< 3s" label="Analysis Speed" />
          <StatCard value="Real-time" label="Market Data" />
        </div>

        {/* Value proposition */}
        <ValueProp />

        {/* Market News */}
        <MarketNews />

        {/* Early Access */}
        <EarlyAccess />
        </div>
      </main>

    </div>
  );
}
