import Link from "next/link";
import type { Metadata } from "next";
import { fetchStockData, fmt, type StockOverview, type GlobalQuote } from "@/lib/alphaVantage";
import TickerInput from "@/components/TickerInput";
import AthenaAnalysis from "@/components/AthenaAnalysis";
import LanguageSelector from "@/components/LanguageSelector";
import MobileNav from "@/components/MobileNav";

// ── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  // Pull company name from Alpha Vantage — uses Next.js fetch cache so no extra API calls
  let companyName = symbol;
  let sector: string | null = null;
  let industry: string | null = null;
  try {
    const result = await fetchStockData(symbol);
    if (result.success) {
      companyName = result.overview.Name || symbol;
      if (result.overview.Sector && result.overview.Sector !== "None")
        sector = result.overview.Sector;
      if (result.overview.Industry && result.overview.Industry !== "None")
        industry = result.overview.Industry;
    }
  } catch {
    // Fall back to ticker symbol only
  }

  const sectorTag = sector ? ` · ${sector}` : "";
  const industryTag = industry ? ` · ${industry}` : "";

  const title = `${symbol} Stock Analysis — ${companyName}`;
  const description =
    `AI-powered investment analysis for ${companyName} (${symbol})${sectorTag}${industryTag}. ` +
    `Get real-time fundamental metrics, valuation assessment, risk analysis, and an AI investment ` +
    `verdict powered by Claude. Is ${symbol} a Buy, Hold, or Avoid?`;

  return {
    title,
    description,
    keywords: [
      `${symbol} stock analysis`,
      `${symbol} AI analysis`,
      `${companyName} stock`,
      `${symbol} investment analysis`,
      `${symbol} buy or sell`,
      "AI stock analysis",
      "stock analysis tool",
      "investment analysis AI",
    ],
    openGraph: {
      title: `${symbol} — AI Stock Analysis | Athena`,
      description,
      url: `/analyze/${symbol}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${symbol} Stock Analysis — Athena AI`,
      description,
    },
    alternates: {
      canonical: `/analyze/${symbol}`,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function AnalyzePage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  const result = await fetchStockData(symbol);

  if (!result.success) {
    return <ErrorState error={result.error} symbol={symbol} />;
  }

  const { overview, quote, isMockData } = result;

  // Price & change data
  const price = quote?.["05. price"] ?? null;
  const change = quote?.["09. change"] ?? null;
  const changePctRaw = quote?.["10. change percent"]?.replace("%", "") ?? null;
  const lastDay = quote?.["07. latest trading day"] ?? null;
  const isPositive = change ? parseFloat(change) >= 0 : null;

  // 52-week range position
  const high52 = parseFloat(overview["52WeekHigh"]);
  const low52 = parseFloat(overview["52WeekLow"]);
  const currentPrice = price ? parseFloat(price) : null;
  let rangePercent = 50;
  if (currentPrice !== null && !isNaN(high52) && !isNaN(low52) && high52 > low52) {
    rangePercent = Math.min(100, Math.max(0, ((currentPrice - low52) / (high52 - low52)) * 100));
  }

  return (
    <div className="relative flex-1 bg-black flex flex-col">
      {/* Subtle top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(212,160,23,0.09) 0%, transparent 70%)",
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center gap-4 md:gap-6 px-4 md:px-8 py-4 border-b border-[#1a1a1a]">
        <Link
          href="/"
          className="shrink-0 text-gold-gradient font-bold tracking-widest hover:opacity-80 transition-opacity"
          style={{ fontFamily: "'Cinzel', serif", fontSize: "1.1rem" }}
        >
          ATHENA
        </Link>

        {/* Inline search bar */}
        <div className="flex-1 max-w-xs hidden md:block">
          <TickerInput compact />
        </div>

        {/* Language selector + Portfolio + Home — grouped on the right */}
        <div className="ml-auto flex items-center gap-3 md:gap-4">
          <LanguageSelector />
          <Link
            href="/portfolio"
            className="hidden sm:block text-[11px] text-[#666] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            Portfolio
          </Link>
          <Link
            href="/"
            className="text-[11px] text-[#666] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
          >
            ← Home
          </Link>
          <MobileNav />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 md:px-12 py-6 md:py-10">

        {/* Company identity + live price */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8 pb-8 border-b border-[#161616]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1
                className="text-white font-bold tracking-wider"
                style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(1.6rem, 5vw, 2.4rem)", lineHeight: 1 }}
              >
                {overview.Symbol}
              </h1>
              <span
                className="px-2.5 py-0.5 text-[10px] tracking-widest uppercase font-semibold rounded"
                style={{ border: "1px solid #2a1f00", background: "#110e00", color: "#d4a017" }}
              >
                {overview.Exchange}
              </span>
              {isMockData && (
                <span
                  className="px-2 py-0.5 text-[9px] tracking-widest uppercase rounded"
                  style={{ border: "1px solid rgba(212,160,23,0.22)", background: "rgba(212,160,23,0.05)", color: "#8a6820" }}
                >
                  Demo Data
                </span>
              )}
              {overview.Country && overview.Country !== "None" && (
                <span className="text-[10px] text-[#666] tracking-widest uppercase">
                  {overview.Country}
                </span>
              )}
            </div>
            <p className="text-[#e8e8e8] text-xl font-normal mb-2">{overview.Name}</p>
            <p className="text-[#888] text-[11px] tracking-widest uppercase">
              {(overview.Sector && overview.Sector !== "None") ? overview.Sector : ""}
              {(overview.Sector && overview.Sector !== "None") && (overview.Industry && overview.Industry !== "None") ? " • " : ""}
              {(overview.Industry && overview.Industry !== "None") ? overview.Industry : ""}
            </p>
          </div>

          {price && (
            <div className="md:text-right">
              <p className="text-white font-bold mb-1" style={{ fontSize: "clamp(1.9rem, 6vw, 2.6rem)", lineHeight: 1 }}>
                ${parseFloat(price).toFixed(2)}
                <span className="text-[#777] text-sm font-normal ml-1">{overview.Currency}</span>
              </p>
              {change && changePctRaw && (
                <p
                  className="text-lg font-semibold mb-1"
                  style={{ color: isPositive ? "#4ade80" : "#f87171" }}
                >
                  {isPositive ? "▲" : "▼"}&nbsp;
                  {Math.abs(parseFloat(change)).toFixed(2)}&nbsp;
                  ({Math.abs(parseFloat(changePctRaw)).toFixed(2)}%)
                </p>
              )}
              {lastDay && (
                <p className="text-[#777] text-[11px] tracking-widest">
                  As of {lastDay}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Key metrics grid ── */}
        <SectionLabel>Key Metrics</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <MetricCard label="Revenue TTM"   value={fmt(overview.RevenueTTM, "large")} />
          <MetricCard label="Profit Margin" value={fmt(overview.ProfitMargin, "percent")} />
          <MetricCard label="EPS (TTM)"     value={fmt(overview.EPS, "currency")} />
          <MetricCard label="52-Week High"  value={fmt(overview["52WeekHigh"], "currency")} primary={false} />
          <MetricCard label="52-Week Low"   value={fmt(overview["52WeekLow"], "currency")} primary={false} />
        </div>

        {/* ── Athena AI Analysis ── */}
        <AthenaAnalysis overview={overview} quote={quote} />

        {/* ── 52-week range bar ── */}
        {!isNaN(high52) && !isNaN(low52) && high52 !== low52 && (
          <div
            className="mb-16 p-6 rounded-xl"
            style={{ border: "1px solid #222", background: "#0f0f0f" }}
          >
            <SectionLabel>52-Week Range</SectionLabel>
            <div className="flex items-center gap-4 mt-4">
              <span className="text-[#888] text-sm font-mono shrink-0">${low52.toFixed(2)}</span>
              <div className="relative flex-1 h-1.5 rounded-full" style={{ background: "#1f1f1f" }}>
                {/* Filled portion */}
                <div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    width: `${rangePercent}%`,
                    background: "linear-gradient(90deg, #7a5800, #d4a017)",
                  }}
                />
                {/* Current price dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#d4a017] bg-black"
                  style={{
                    left: `clamp(8px, calc(${rangePercent}% - 8px), calc(100% - 16px))`,
                    boxShadow: "0 0 10px rgba(212,160,23,0.5)",
                  }}
                />
              </div>
              <span className="text-[#888] text-sm font-mono shrink-0">${high52.toFixed(2)}</span>
            </div>
            {currentPrice && (
              <div className="flex items-center justify-between mt-3 px-0">
                <span className="text-[11px] text-[#777] tracking-wide">
                  52W Low
                </span>
                <span className="text-[12px] font-semibold text-[#d4a017]">
                  Current: ${currentPrice.toFixed(2)}&nbsp;&nbsp;
                  <span className="text-[#777] font-normal">
                    ({rangePercent.toFixed(1)}% of range)
                  </span>
                </span>
                <span className="text-[11px] text-[#777] tracking-wide">
                  52W High
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Company profile ── */}
        {overview.Description && overview.Description !== "None" && (
          <div className="mb-16">
            <SectionLabel>Company Profile</SectionLabel>
            <p className="text-[#c0c0c0] text-sm leading-7 font-normal mt-4 max-w-4xl">
              {overview.Description}
            </p>
          </div>
        )}

        {/* ── Additional metrics ── */}
        <div className="mb-16">
          <SectionLabel>Additional Metrics</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <SecondaryMetric label="Market Cap"        value={fmt(overview.MarketCapitalization, "large")} />
            <SecondaryMetric label="P/E Ratio"         value={fmt(overview.PERatio, "number")} />
            <SecondaryMetric label="Forward P/E"       value={fmt(overview.ForwardPE, "number")} />
            <SecondaryMetric label="Beta"              value={fmt(overview.Beta, "number")} />
            <SecondaryMetric label="Return on Equity"  value={fmt(overview.ReturnOnEquityTTM, "percent")} />
            <SecondaryMetric label="Operating Margin"  value={fmt(overview.OperatingMarginTTM, "percent")} />
            <SecondaryMetric label="Analyst Target"    value={fmt(overview.AnalystTargetPrice, "currency")} />
            <SecondaryMetric label="Dividend Yield"    value={fmt(overview.DividendYield, "percent")} />
          </div>
        </div>

        {/* Moving averages */}
        <div className="mb-16">
          <SectionLabel>Moving Averages</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <SecondaryMetric label="50-Day MA"  value={fmt(overview["50DayMovingAverage"], "currency")} />
            <SecondaryMetric label="200-Day MA" value={fmt(overview["200DayMovingAverage"], "currency")} />
            <SecondaryMetric label="Shares Outstanding" value={fmt(overview.SharesOutstanding, "large").replace("$", "")} />
            <SecondaryMetric label="PEG Ratio"  value={fmt(overview.PEGRatio, "number")} />
          </div>
        </div>

        {/* Data source note */}
        <p className="text-center text-[10px] text-[#555] tracking-widest uppercase">
          Data sourced from Alpha Vantage &bull; For informational purposes only &bull; Not financial advice
        </p>
      </main>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[11px] text-[#aaa] tracking-[0.25em] uppercase font-semibold shrink-0">
        {children}
      </span>
      <span className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #2a2a2a, transparent)" }} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  primary = true,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div
      className="p-4 rounded-xl flex flex-col gap-2"
      style={{
        background: "linear-gradient(135deg, #111 0%, #0d0d0d 100%)",
        border: primary ? "1px solid #252525" : "1px solid #1c1c1c",
      }}
    >
      <p
        className="tracking-widest uppercase leading-tight"
        style={{ fontSize: 10, color: primary ? "#aaa" : "#666" }}
      >
        {label}
      </p>
      <p
        className="text-gold-gradient font-bold leading-none"
        style={{
          fontSize: primary
            ? value.length > 8 ? "1.4rem" : "1.65rem"
            : value.length > 8 ? "1.05rem" : "1.25rem",
          opacity: primary ? 1 : 0.75,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SecondaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{ background: "#0f0f0f", border: "1px solid #222" }}
    >
      <p className="text-[10px] text-[#888] tracking-widest uppercase mb-1.5">{label}</p>
      <p className="text-[#e0e0e0] text-base font-medium">{value}</p>
    </div>
  );
}

// ── Error State ───────────────────────────────────────────────────────────
type ErrorCode = "rate_limited" | "invalid_ticker" | "network_error";

const ERROR_MESSAGES: Record<ErrorCode, { title: string; message: string }> = {
  rate_limited: {
    title: "Temporarily Unavailable",
    message:
      "Market data is temporarily unavailable. Please try again in a few minutes.",
  },
  invalid_ticker: {
    title: "Ticker Not Found",
    message:
      "We couldn't find this ticker symbol. Please double-check the symbol and try again.",
  },
  network_error: {
    title: "Connection Issue",
    message:
      "We're having trouble connecting right now. Please try again in a few minutes.",
  },
};

function ErrorState({ error, symbol }: { error: string; symbol: string }) {
  const info = ERROR_MESSAGES[error as ErrorCode] ?? {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[500px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(212,160,23,0.07) 0%, transparent 70%)",
        }}
      />
      <div className="relative text-center max-w-md">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ border: "1px solid #2a1f00", background: "#0d0a00" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>

        {error === "invalid_ticker" && (
          <p className="text-[#555] text-[11px] tracking-widest uppercase mb-2">
            Ticker: {symbol}
          </p>
        )}

        <h1
          className="text-white text-2xl font-bold mb-3"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {info.title}
        </h1>
        <p className="text-[#666] text-sm leading-relaxed mb-8">{info.message}</p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-7 py-3 text-[12px] font-bold tracking-widest uppercase rounded transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
            color: "#000",
          }}
        >
          ← New Search
        </Link>
      </div>
    </div>
  );
}
