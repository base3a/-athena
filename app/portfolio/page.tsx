import Link from "next/link";
import type { Metadata } from "next";
import TickerInput from "@/components/TickerInput";
import LanguageSelector from "@/components/LanguageSelector";
import PortfolioClient from "@/components/PortfolioClient";

export const metadata: Metadata = {
  title: "Portfolio — Athena AI",
  description:
    "Track your holdings and watchlist. AI-powered Athena verdicts update automatically when you add a stock.",
};

export default function PortfolioPage() {
  return (
    <div className="relative min-h-screen bg-black flex flex-col">
      {/* Subtle top glow */}
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
          className="shrink-0 text-gold-gradient font-bold tracking-widest hover:opacity-80 transition-opacity"
          style={{ fontFamily: "'Cinzel', serif", fontSize: "1.1rem" }}
        >
          ATHENA
        </Link>

        {/* Inline search */}
        <div className="flex-1 max-w-xs hidden md:block">
          <TickerInput compact />
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-4">
          <LanguageSelector />
          <Link
            href="/"
            className="text-[11px] text-[#666] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            ← Home
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 md:px-12 py-10">

        {/* Page title */}
        <div className="mb-10 pb-8 border-b border-[#161616]">
          <h1
            className="text-white font-bold tracking-wider mb-2"
            style={{ fontFamily: "'Cinzel', serif", fontSize: "2rem", lineHeight: 1 }}
          >
            Portfolio
          </h1>
          <p className="text-[#3a3a3a] text-sm font-light leading-relaxed">
            Your positions. Your watchlist. Athena&apos;s verdict on each.
          </p>
        </div>

        {/* Interactive portfolio client */}
        <PortfolioClient />
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[#1a1a1a] px-8 py-5 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span
            className="text-[11px] text-[#333] tracking-widest uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Athena &copy; {new Date().getFullYear()}
          </span>
          <p className="text-[10px] text-[#2a2a2a] tracking-wide">
            For informational purposes only. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
