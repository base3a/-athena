/**
 * lib/yahoo.ts — Yahoo Finance data utilities (no API key required)
 * Used as the fallback layer when Finnhub is unavailable or has gaps.
 *
 * Yahoo Finance requires a crumb (CSRF token) + session cookie for the
 * v10/quoteSummary endpoint. We obtain them once per process and cache
 * them for 1 hour so individual ticker fetches remain fast.
 */
import type { StockOverview, GlobalQuote } from "./alphaVantage";

// ── Shared types ──────────────────────────────────────────────────────────────

export interface YahooFundamentals {
  description:        string;
  sector:             string;
  industry:           string;
  address:            string;
  revenueTTM:         number | null; // absolute dollars
  grossProfitTTM:     number | null; // absolute dollars
  operatingMarginTTM: number | null; // decimal, e.g. 0.65
  profitMarginTTM:    number | null; // decimal
  returnOnEquity:     number | null; // decimal
  returnOnAssets:     number | null; // decimal
  forwardPE:          number | null;
  pegRatio:           number | null;
  trailingPE:         number | null;
  trailingEPS:        number | null;
  beta:               number | null;
  ma50:               number | null;
  ma200:              number | null;
  high52:             number | null;
  low52:              number | null;
  analystTarget:      number | null;
  dividendYield:      number | null; // decimal, e.g. 0.003
  dividendPerShare:   number | null;
  sharesOutstanding:  number | null; // absolute
  marketCap:          number | null; // absolute
  // ── Screener extras ────────────────────────────────────────────────────────
  revenueGrowth:      number | null; // decimal, e.g. 0.12 = 12% YoY
  earningsGrowth:     number | null; // decimal, e.g. 0.08 = 8% YoY
  debtToEquity:       number | null; // Yahoo returns ×100 (167 = actual 1.67)
  priceToBook:        number | null; // already a ratio
}

export type ChartEntry = { date: string; close: number; high: number; low: number };

// ── Crumb authentication (required by Yahoo Finance quoteSummary since 2023) ───
// Flow: visit finance.yahoo.com → get session cookie → fetch crumb token →
// append &crumb=TOKEN to every quoteSummary call + pass the session cookie.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface CrumbCache { crumb: string; cookie: string; expiresAt: number }
let _crumbCache: CrumbCache | null = null;

async function getYahooCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  const now = Date.now();
  if (_crumbCache && _crumbCache.expiresAt > now) {
    return { crumb: _crumbCache.crumb, cookie: _crumbCache.cookie };
  }

  try {
    // Step 1 — establish a Yahoo Finance session to receive cookies
    const pageRes = await fetch("https://finance.yahoo.com/", {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*" },
      redirect: "follow",
      cache: "no-store",
    });

    // Extract cookies. Node 18 exposes getSetCookie(); older runtimes merge them.
    const hdr = pageRes.headers as unknown as { getSetCookie?: () => string[] };
    const rawCookies: string[] = typeof hdr.getSetCookie === "function"
      ? hdr.getSetCookie()
      : (pageRes.headers.get("set-cookie") ?? "").split(/,(?=\s*[\w-]+=)/).filter(Boolean);
    const cookie = rawCookies.map((c) => c.split(";")[0].trim()).filter(Boolean).join("; ");

    // Step 2 — fetch the crumb using the session cookie
    const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": UA, Accept: "*/*", Cookie: cookie },
      cache: "no-store",
    });
    if (!crumbRes.ok) return null;
    const crumb = (await crumbRes.text()).trim();
    // Reject if empty or looks like an error JSON blob
    if (!crumb || crumb.startsWith("{")) return null;

    _crumbCache = { crumb, cookie, expiresAt: now + 60 * 60 * 1000 }; // 1-hour cache
    return { crumb, cookie };
  } catch {
    return null;
  }
}

// ── Shared fetch wrapper ──────────────────────────────────────────────────────

async function yahooFetch(
  url: string,
  revalidate = 300,
  auth?: { crumb: string; cookie: string },
): Promise<unknown | null> {
  try {
    const finalUrl = auth ? `${url}&crumb=${encodeURIComponent(auth.crumb)}` : url;
    const res = await fetch(finalUrl, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        ...(auth ? { Cookie: auth.cookie } : {}),
      },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── 1. Real-time price quote ──────────────────────────────────────────────────

export async function fetchYahooPrice(ticker: string): Promise<GlobalQuote | null> {
  // v8 chart endpoint does not require a crumb
  const data = await yahooFetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
    300,
  );
  const meta = (data as Record<string, unknown> | null)?.chart as Record<string, unknown> | undefined;
  const result = (meta?.result as unknown[])?.[0] as Record<string, unknown> | undefined;
  const m = result?.meta as Record<string, unknown> | undefined;
  if (!m) return null;

  const price = m.regularMarketPrice as number | undefined;
  if (!price) return null;

  const prevClose = (m.previousClose ?? m.chartPreviousClose ?? price) as number;
  const change    = price - prevClose;
  const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
  const tradingDay = m.regularMarketTime
    ? new Date((m.regularMarketTime as number) * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    "01. symbol":             ticker.toUpperCase(),
    "02. open":               String(m.regularMarketOpen ?? price),
    "03. high":               String(m.regularMarketDayHigh ?? price),
    "04. low":                String(m.regularMarketDayLow ?? price),
    "05. price":              String(price),
    "06. volume":             String(m.regularMarketVolume ?? 0),
    "07. latest trading day": tradingDay,
    "08. previous close":     String(prevClose),
    "09. change":             change.toFixed(4),
    "10. change percent":     `${changePct.toFixed(4)}%`,
  };
}

// ── 2. Company fundamentals ───────────────────────────────────────────────────

export async function fetchYahooFundamentals(
  ticker: string,
): Promise<YahooFundamentals | null> {
  // quoteSummary requires crumb authentication
  const auth = await getYahooCrumb();

  const modules = "financialData,defaultKeyStatistics,summaryDetail,assetProfile";
  const data = await yahooFetch(
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`,
    1800, // 30-min Next.js cache per ticker (URL includes crumb as cache key)
    auth ?? undefined,
  );

  const r = (data as Record<string, unknown> | null);
  const qs = r?.quoteSummary as Record<string, unknown> | undefined;
  const result = (qs?.result as unknown[])?.[0] as Record<string, unknown> | undefined;
  if (!result) return null;

  const fin   = (result.financialData        ?? {}) as Record<string, Record<string, number>>;
  const stats = (result.defaultKeyStatistics ?? {}) as Record<string, Record<string, number>>;
  const sum   = (result.summaryDetail        ?? {}) as Record<string, Record<string, number>>;
  const prof  = (result.assetProfile         ?? {}) as Record<string, unknown>;

  const raw = (obj: Record<string, Record<string, number>>, key: string): number | null =>
    obj[key]?.raw ?? null;

  const address = [prof.address1, prof.city, prof.state, prof.country]
    .filter(Boolean)
    .join(", ");

  return {
    description:        String(prof.longBusinessSummary ?? ""),
    sector:             String(prof.sector   ?? ""),
    industry:           String(prof.industry ?? ""),
    address,
    revenueTTM:         raw(fin,   "totalRevenue"),
    grossProfitTTM:     raw(fin,   "grossProfits"),
    operatingMarginTTM: raw(fin,   "operatingMargins"),
    profitMarginTTM:    raw(fin,   "profitMargins"),
    returnOnEquity:     raw(fin,   "returnOnEquity"),
    returnOnAssets:     raw(fin,   "returnOnAssets"),
    analystTarget:      raw(fin,   "targetMeanPrice"),
    forwardPE:          raw(stats, "forwardPE"),
    pegRatio:           raw(stats, "pegRatio"),
    trailingEPS:        raw(stats, "trailingEps"),
    beta:               raw(stats, "beta"),
    sharesOutstanding:  raw(stats, "sharesOutstanding"),
    trailingPE:         raw(sum,   "trailingPE"),
    ma50:               raw(sum,   "fiftyDayAverage"),
    ma200:              raw(sum,   "twoHundredDayAverage"),
    high52:             raw(sum,   "fiftyTwoWeekHigh"),
    low52:              raw(sum,   "fiftyTwoWeekLow"),
    dividendYield:      raw(sum,   "dividendYield"),
    dividendPerShare:   raw(sum,   "dividendRate"),
    marketCap:          raw(sum,   "marketCap"),
    revenueGrowth:      raw(fin,   "revenueGrowth"),
    earningsGrowth:     raw(fin,   "earningsGrowth"),
    debtToEquity:       raw(fin,   "debtToEquity"),
    priceToBook:        raw(stats, "priceToBook"),
  };
}

// ── 2b. Simple quote — price + change only (for indices, ETFs, crypto) ────────
// Works with any Yahoo Finance symbol: SPY, ^VIX, ^TNX, GLD, BTC-USD, DX-Y.NYB …

export interface SimpleQuote {
  price:     number;
  change:    number;    // absolute price change today
  changePct: number;    // signed %, e.g. 1.24 means +1.24 %
  prevClose: number;
}

export async function fetchSimpleQuote(symbol: string): Promise<SimpleQuote | null> {
  // v8 chart endpoint does not require a crumb
  const data = await yahooFetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    300,
  );
  const m      = (data as Record<string, unknown> | null)?.chart as Record<string, unknown> | undefined;
  const result = (m?.result as unknown[])?.[0] as Record<string, unknown> | undefined;
  const meta   = result?.meta as Record<string, unknown> | undefined;
  if (!meta) return null;

  const price = meta.regularMarketPrice as number | undefined;
  if (!price) return null;

  const prevClose = (meta.previousClose ?? meta.chartPreviousClose ?? price) as number;
  const change    = price - prevClose;
  const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
  return { price, change, changePct, prevClose };
}

export async function fetchSimpleQuotes(
  symbols: string[],
): Promise<Record<string, SimpleQuote | null>> {
  const results = await Promise.all(
    symbols.map(async (sym) => [sym, await fetchSimpleQuote(sym)] as const),
  );
  return Object.fromEntries(results);
}

// ── 3a. Historical chart via Stooq (primary, no key, no auth issues) ──────────
// Stooq provides free daily OHLC CSV for US stocks without rate-limiting.
// Ticker format: "NVDA" → "nvda.us"

export async function fetchStooqChart(ticker: string): Promise<ChartEntry[] | null> {
  try {
    const sym = ticker.toLowerCase();
    const today = new Date();
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

    const url = `https://stooq.com/q/d/l/?s=${sym}.us&i=d&d1=${fmt(yearAgo)}&d2=${fmt(today)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;

    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return null; // header only

    const entries: ChartEntry[] = [];
    for (let i = 1; i < lines.length; i++) {
      const [date, , high, low, close] = lines[i].split(",");
      const c = parseFloat(close);
      const h = parseFloat(high);
      const l = parseFloat(low);
      if (!date || isNaN(c)) continue;
      entries.push({
        date,
        close: parseFloat(c.toFixed(2)),
        high:  !isNaN(h) ? parseFloat(h.toFixed(2)) : parseFloat(c.toFixed(2)),
        low:   !isNaN(l) ? parseFloat(l.toFixed(2)) : parseFloat(c.toFixed(2)),
      });
    }

    return entries.length > 0 ? entries.sort((a, b) => a.date.localeCompare(b.date)) : null;
  } catch {
    return null;
  }
}

// ── 3b. Historical chart via Yahoo Finance (fallback) ─────────────────────────

export async function fetchYahooChart(ticker: string): Promise<ChartEntry[] | null> {
  // v8 chart endpoint does not require a crumb
  const data = await yahooFetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`,
    1800,
  );

  const r     = data as Record<string, unknown> | null;
  const chart = r?.chart as Record<string, unknown> | undefined;
  const result = (chart?.result as unknown[])?.[0] as Record<string, unknown> | undefined;
  if (!result) return null;

  const timestamps = result.timestamp as number[] | undefined;
  const indicators = result.indicators as Record<string, unknown[]> | undefined;
  const quotes     = indicators?.quote?.[0] as Record<string, (number | null)[]> | undefined;
  if (!timestamps || !quotes) return null;

  const entries: ChartEntry[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = quotes.close?.[i];
    const high  = quotes.high?.[i];
    const low   = quotes.low?.[i];
    if (close == null || isNaN(close)) continue;
    entries.push({
      date:  new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      close: parseFloat(close.toFixed(2)),
      high:  high != null && !isNaN(high)  ? parseFloat(high.toFixed(2))  : parseFloat(close.toFixed(2)),
      low:   low  != null && !isNaN(low)   ? parseFloat(low.toFixed(2))   : parseFloat(close.toFixed(2)),
    });
  }

  return entries.length > 0 ? entries.sort((a, b) => a.date.localeCompare(b.date)) : null;
}

// ── 4. Build StockOverview from Yahoo fundamentals + quote ────────────────────

export function buildYahooOverview(
  ticker: string,
  fundamentals: YahooFundamentals,
  quote: GlobalQuote | null,
): StockOverview {
  const str = (v: number | null): string => (v != null && !isNaN(v) ? String(v) : "None");
  const abs = (v: number | null): string =>
    v != null && !isNaN(v) ? String(Math.round(v)) : "None";

  return {
    Symbol:               ticker.toUpperCase(),
    Name:                 ticker.toUpperCase(), // Yahoo quoteSummary doesn't easily give name here
    Description:          fundamentals.description || "None",
    Exchange:             "None",
    Currency:             "USD",
    Country:              "None",
    Sector:               fundamentals.sector   || "None",
    Industry:             fundamentals.industry || "None",
    Address:              fundamentals.address  || "None",
    MarketCapitalization: abs(fundamentals.marketCap),
    RevenueTTM:           abs(fundamentals.revenueTTM),
    GrossProfitTTM:       abs(fundamentals.grossProfitTTM),
    EPS:                  str(fundamentals.trailingEPS),
    DilutedEPSTTM:        str(fundamentals.trailingEPS),
    ProfitMargin:         str(fundamentals.profitMarginTTM),
    OperatingMarginTTM:   str(fundamentals.operatingMarginTTM),
    ReturnOnEquityTTM:    str(fundamentals.returnOnEquity),
    ReturnOnAssetsTTM:    str(fundamentals.returnOnAssets),
    PERatio:              str(fundamentals.trailingPE),
    ForwardPE:            str(fundamentals.forwardPE),
    PEGRatio:             str(fundamentals.pegRatio),
    Beta:                 str(fundamentals.beta),
    "52WeekHigh":         str(fundamentals.high52 ?? (quote ? parseFloat(quote["03. high"]) : null)),
    "52WeekLow":          str(fundamentals.low52  ?? (quote ? parseFloat(quote["04. low"])  : null)),
    "50DayMovingAverage": str(fundamentals.ma50),
    "200DayMovingAverage":str(fundamentals.ma200),
    DividendYield:        str(fundamentals.dividendYield),
    DividendPerShare:     str(fundamentals.dividendPerShare),
    AnalystTargetPrice:   str(fundamentals.analystTarget),
    SharesOutstanding:    abs(fundamentals.sharesOutstanding),
  };
}
