import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer
      className="relative z-10 border-t border-[#141414] px-4 md:px-8 py-8 md:py-10"
      style={{ background: "#000" }}
    >
      <div className="max-w-6xl mx-auto">

        {/* ── Main row ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">

          {/* Left: brand */}
          <div className="shrink-0">
            <span
              className="text-gold-gradient font-bold tracking-widest"
              style={{ fontFamily: "'Cinzel', serif", fontSize: "0.95rem" }}
            >
              ATHENA
            </span>
            <p className="text-[11px] text-[#3a3a3a] tracking-wide mt-1 font-light">
              AI-powered investment intelligence
            </p>
          </div>

          {/* Center: nav links */}
          <nav className="flex flex-wrap items-center gap-6">
            {[
              { label: "Markets",   href: "/markets"   },
              { label: "Screener",  href: "/screener"  },
              { label: "Research",  href: "/research"  },
              { label: "Portfolio", href: "/portfolio" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[11px] text-[#444] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: legal links */}
          <div className="flex items-center gap-5 shrink-0">
            {[
              { label: "Privacy",    href: "/privacy"    },
              { label: "Terms",      href: "/terms"      },
              { label: "Disclaimer", href: "/disclaimer" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[11px] text-[#333] hover:text-[#555] tracking-widest uppercase transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px mb-6" style={{ background: "#111" }} />

        {/* ── Disclaimer ── */}
        <p className="text-[10px] text-[#2a2a2a] leading-relaxed tracking-wide text-center max-w-3xl mx-auto">
          Athena provides informational analysis only. This platform does not provide financial advice.
          Investing involves risk and past performance does not guarantee future results.
        </p>

      </div>
    </footer>
  );
}
