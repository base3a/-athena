/**
 * GET /api/screener-data?symbols=NVDA,AAPL,...
 *
 * Fetches live fundamental metrics for a list of tickers using yahoo-finance2,
 * which handles Yahoo Finance crumb / cookie authentication automatically.
 *
 * Returns a Record<ticker, ScreenerMetrics> — any field may be null if unavailable.
 * Cache: 30-min Cache-Control on the response (warm requests are instant).
 */

import { NextResponse } from "next/server";
import YahooFinanceLib from "yahoo-finance2";

// v3 requires instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = new (YahooFinanceLib as unknown as new () => typeof YahooFinanceLib)();

export const runtime = "nodejs";

// ── Public metrics shape (also imported by ScreenerClient) ─────────────────────
export interface ScreenerMetrics {
  pe:            number | null;  // P/E trailing
  roe:           number | null;  // Return on equity, %
  profitMargin:  number | null;  // Net profit margin, %
  revenueGrowth: number | null;  // Revenue growth YoY, %
  dividendYield: number | null;  // Dividend yield, %
  debtToEquity:  number | null;  // D/E ratio (e.g. 1.7 = 1.7×)
  pb:            number | null;  // Price-to-book ratio
  epsGrowth:     number | null;  // Earnings growth YoY, %
  marketCapCat:  "Large" | "Mid" | "Small" | null;
  price:         number | null;  // Current market price
  high52w:       number | null;  // 52-week high
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Round to 1 decimal place. */
function r1(v: number | null | undefined): number | null {
  if (v == null || !isFinite(v)) return null;
  return Math.round(v * 10) / 10;
}

/** Decimal → percentage, rounded to 1 decimal (0.534 → 53.4). */
function pct(v: number | null | undefined): number | null {
  if (v == null || !isFinite(v)) return null;
  return Math.round(v * 100 * 10) / 10;
}

function marketCapCategory(cap: number | null | undefined): "Large" | "Mid" | "Small" | null {
  if (cap == null) return null;
  if (cap > 10_000_000_000) return "Large";
  if (cap >  2_000_000_000) return "Mid";
  return "Small";
}

// ── Per-ticker fetch ────────────────────────────────────────────────────────────

const EMPTY: ScreenerMetrics = {
  pe: null, roe: null, profitMargin: null, revenueGrowth: null,
  dividendYield: null, debtToEquity: null, pb: null, epsGrowth: null,
  marketCapCat: null, price: null, high52w: null,
};

async function fetchMetrics(ticker: string): Promise<ScreenerMetrics> {
  try {
    // yahoo-finance2 quoteSummary with the modules we need.
    // yahooFinance is cast as `typeof YahooFinanceLib` (the class, not an instance),
    // so its conditional return type resolves to `never` for instance methods.
    // We cast the result to `any` here; all downstream accesses use optional
    // chaining so runtime safety is preserved.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = await yahooFinance.quoteSummary(ticker, {
      modules: ["financialData", "defaultKeyStatistics", "summaryDetail"] as const,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fd: any = q?.financialData;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ks: any = q?.defaultKeyStatistics;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sd: any = q?.summaryDetail;

    // P/E — cap nonsensical values
    const peRaw = sd?.trailingPE ?? ks?.trailingPE ?? null;
    const pe = peRaw != null && peRaw > 0 && peRaw < 999 ? r1(peRaw) : null;

    // ROE / margins / growth are returned as decimals (0.534 = 53.4%)
    const roe           = pct(fd?.returnOnEquity);
    const profitMargin  = pct(fd?.profitMargins);
    const revenueGrowth = pct(fd?.revenueGrowth);
    const epsGrowth     = pct(fd?.earningsGrowth);

    // Dividend yield is a decimal in summaryDetail
    const dividendYield = pct(sd?.dividendYield ?? ks?.trailingAnnualDividendYield);

    // D/E: yahoo-finance2 returns it as a ratio directly (not ×100 like raw API)
    const debtToEquity = fd?.debtToEquity != null ? r1(fd.debtToEquity) : null;

    // P/B: already a ratio
    const pb = ks?.priceToBook != null && ks.priceToBook > 0 ? r1(ks.priceToBook) : null;

    // Market cap categorisation
    const marketCapCat = marketCapCategory(sd?.marketCap);

    // Current price — try financialData.currentPrice first, then summaryDetail fallbacks
    const priceRaw = fd?.currentPrice ?? sd?.regularMarketPrice ?? sd?.previousClose ?? null;
    const price    = priceRaw != null ? r1(priceRaw) : null;
    const high52w  = sd?.fiftyTwoWeekHigh != null ? r1(sd.fiftyTwoWeekHigh) : null;

    return { pe, roe, profitMargin, revenueGrowth, dividendYield, debtToEquity, pb, epsGrowth, marketCapCat, price, high52w };
  } catch {
    return EMPTY;
  }
}

// ── Bounded parallel fetch (6 concurrent, 200 ms pause between rounds) ─────────

async function fetchAll(tickers: string[]): Promise<Record<string, ScreenerMetrics>> {
  const CHUNK = 6;
  const result: Record<string, ScreenerMetrics> = {};

  for (let i = 0; i < tickers.length; i += CHUNK) {
    const batch = tickers.slice(i, i + CHUNK);
    const settled = await Promise.allSettled(
      batch.map((t) => fetchMetrics(t).then((m) => ({ t, m }))),
    );
    for (const item of settled) {
      if (item.status === "fulfilled") result[item.value.t] = item.value.m;
    }
    if (i + CHUNK < tickers.length) {
      await new Promise<void>((r) => setTimeout(r, 200));
    }
  }

  return result;
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw     = searchParams.get("symbols") ?? "";
  const tickers = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 100);

  if (tickers.length === 0) return NextResponse.json({});

  const data = await fetchAll(tickers);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
