import Link from "next/link";
import AthenaLogo from "@/components/AthenaLogo";
import TickerInput from "@/components/TickerInput";
import StatCard from "@/components/StatCard";
import FeatureCards from "@/components/FeatureCards";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-black flex flex-col overflow-hidden">
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
          {["Markets", "Screener", "Research"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-[13px] text-[#888] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
            >
              {item}
            </a>
          ))}
          <Link
            href="/portfolio"
            className="text-[13px] text-[#888] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            Portfolio
          </Link>
        </nav>
        <div className="flex items-center gap-3">
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
          className="mb-3 font-light tracking-[0.4em] uppercase text-[#d4a017] text-sm"
        >
          AI-Powered Stock Analysis
        </p>

        {/* Tagline */}
        <p className="mb-14 text-[#666] text-sm max-w-md leading-relaxed font-light tracking-wide">
          Institutional-grade intelligence for every investor.
          <br />
          Enter a ticker to unlock a complete AI-driven market deep-dive.
        </p>

        {/* Ticker Input */}
        <TickerInput />

        {/* Divider */}
        <div className="flex items-center gap-4 my-16 w-full max-w-xl">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-[#2a2a2a]" />
          <span className="text-[10px] text-[#444] tracking-widest uppercase">Analysis Suite</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#2a2a2a] to-[#2a2a2a]" />
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

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[#1a1a1a] px-8 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span
            className="text-[11px] text-[#444] tracking-widest uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Athena &copy; {new Date().getFullYear()}
          </span>
          <p className="text-[11px] text-[#333] tracking-wide">
            For informational purposes only. Not financial advice.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[11px] text-[#444] hover:text-[#d4a017] tracking-widest uppercase transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
