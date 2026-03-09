import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RESEARCH_ARTICLES } from "@/lib/research-data";
import type { Conviction } from "@/lib/research-data";
import RelatedStocks from "@/components/RelatedStocks";

// ── Static generation ─────────────────────────────────────────────────────────
export function generateStaticParams() {
  return RESEARCH_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = RESEARCH_ARTICLES.find((a) => a.slug === slug);
  return {
    title: article ? `${article.title} — Athena Research` : "Research — Athena",
    description: article?.summary,
  };
}

// ── Conviction styling ────────────────────────────────────────────────────────
const CONVICTION_STYLE: Record<
  Conviction,
  { color: string; border: string; bg: string }
> = {
  High: {
    color: "#d4a017",
    border: "rgba(212,160,23,0.28)",
    bg: "rgba(212,160,23,0.07)",
  },
  Medium: {
    color: "#b89438",
    border: "rgba(184,148,56,0.25)",
    bg: "rgba(184,148,56,0.06)",
  },
  Developing: {
    color: "#888",
    border: "rgba(136,136,136,0.22)",
    bg: "rgba(136,136,136,0.06)",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = RESEARCH_ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  const cv = CONVICTION_STYLE[article.conviction];

  return (
    <div className="relative flex-1 bg-black flex flex-col">

      {/* Top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 35% at 50% -5%, rgba(212,160,23,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center gap-6 px-8 py-4 border-b border-[#1a1a1a]">
        <Link
          href="/"
          className="shrink-0 font-bold tracking-widest hover:opacity-80 transition-opacity"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "1.1rem",
            background:
              "linear-gradient(135deg, #d4a017 0%, #f0c040 50%, #a07810 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ATHENA
        </Link>

        <div className="ml-auto flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-5">
            <Link
              href="/markets"
              className="text-[11px] text-[#555] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
            >
              Markets
            </Link>
            <Link
              href="/screener"
              className="text-[11px] text-[#555] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
            >
              Screener
            </Link>
            <Link
              href="/research"
              className="text-[11px] tracking-widest uppercase font-semibold transition-colors duration-200"
              style={{ color: "#d4a017" }}
            >
              Research
            </Link>
            <Link
              href="/portfolio"
              className="text-[11px] text-[#555] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
            >
              Portfolio
            </Link>
          </nav>
          <Link
            href="/research"
            className="text-[11px] text-[#555] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            ← Research
          </Link>
        </div>
      </header>

      {/* ── Article ── */}
      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-6 md:px-10 py-12">

        {/* ── Meta row ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Tag */}
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#8a6820",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "2px 9px",
              borderRadius: 4,
              background: "rgba(212,160,23,0.06)",
              border: "1px solid rgba(212,160,23,0.14)",
            }}
          >
            {article.tag}
          </span>

          {/* Conviction */}
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: cv.color,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "2px 9px",
              borderRadius: 4,
              background: cv.bg,
              border: `1px solid ${cv.border}`,
            }}
          >
            Conviction · {article.conviction}
          </span>

          {/* Divider */}
          <span style={{ color: "#2a2a2a", fontSize: 10 }}>·</span>

          {/* Read time */}
          <span
            style={{
              fontSize: 9,
              color: "#555",
              letterSpacing: "0.1em",
            }}
          >
            {article.readTime}
          </span>
        </div>

        {/* ── Title ── */}
        <h1
          className="mb-5"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            fontWeight: 700,
            color: "#f0f0f0",
            letterSpacing: "0.03em",
            lineHeight: 1.2,
          }}
        >
          {article.title}
        </h1>

        {/* ── Summary lead ── */}
        <p
          className="mb-10"
          style={{
            fontSize: "1.05rem",
            color: "#999",
            lineHeight: 1.8,
            borderLeft: "2px solid rgba(212,160,23,0.3)",
            paddingLeft: "1.25rem",
          }}
        >
          {article.summary}
        </p>

        {/* ── Divider ── */}
        <div
          className="mb-10"
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, rgba(212,160,23,0.15) 0%, transparent 80%)",
          }}
        />

        {/* ── Body paragraphs ── */}
        <div className="flex flex-col gap-6 mb-12">
          {article.body.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: "0.93rem",
                color: "#aaa",
                lineHeight: 1.9,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            ATHENA INSIGHT
        ══════════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl p-8 mb-10"
          style={{
            background:
              "linear-gradient(160deg, #0d0900 0%, #080500 60%, #0d0900 100%)",
            border: "1px solid rgba(212,160,23,0.2)",
            boxShadow: "0 0 50px rgba(212,160,23,0.06), inset 0 0 30px rgba(212,160,23,0.02)",
          }}
        >
          {/* Label row */}
          <div className="flex items-center gap-3 mb-5">
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#d4a017",
                boxShadow: "0 0 8px rgba(212,160,23,0.7)",
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#d4a017",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Athena Insight
            </p>
          </div>

          {/* Insight text */}
          <p
            style={{
              fontSize: "0.9rem",
              color: "#bbb",
              lineHeight: 1.85,
            }}
          >
            {article.athenaInsight}
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            RELATED STOCKS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-5">
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "#999",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Related Stocks
            </p>
            <div
              style={{
                flex: 1,
                height: 1,
                background:
                  "linear-gradient(90deg, #222 0%, transparent 100%)",
              }}
            />
          </div>

          {/* Ticker chips */}
          <RelatedStocks tickers={article.relatedStocks} />
        </div>

        {/* ── Divider ── */}
        <div
          className="mb-8"
          style={{
            height: 1,
            background: "linear-gradient(90deg, #1a1a1a 0%, transparent 100%)",
          }}
        />

        {/* ── Back link ── */}
        <div className="flex items-center justify-between">
          <Link
            href="/research"
            className="text-[11px] tracking-widest uppercase font-medium transition-colors duration-200 hover:text-[#d4a017]"
            style={{ color: "#444" }}
          >
            ← Back to Research
          </Link>
          <p
            style={{
              fontSize: 9,
              color: "#2a2a2a",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Simulated · Not financial advice
          </p>
        </div>

      </main>
    </div>
  );
}
