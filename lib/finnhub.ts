import type { StockOverview, GlobalQuote, FetchResult } from "./alphaVantage";
import { fetchYahooFundamentals, type YahooFundamentals, type ChartEntry } from "./yahoo";

// ── Finnhub API types ─────────────────────────────────────────────────────────
interface FinnhubQuote {
  c:  number; // current price
  d:  number; // change
  dp: number; // change percent
  h:  number; // day high
  l:  number; // day low
  o:  number; // day open
  pc: number; // previous close
  t:  number; // timestamp (unix seconds)
}

interface FinnhubProfile {
  name:                   string;
  ticker:                 string;
  exchange:               string;
  currency:               string;
  country:                string;
  finnhubIndustry:        string;
  marketCapitalization:   number; // millions of reporting currency
  shareOutstanding:       number; // millions of shares
  ipo:                    string;
  logo:                   string;
  weburl:                 string;
  phone:                  string;
}

interface FinnhubMetrics {
  // Price range
  "52WeekHigh"?:                  number;
  "52WeekLow"?:                   number;
  // Earnings
  epsAnnual?:                     number;
  epsTTM?:                        number;
  // Valuation
  peAnnual?:                      number;
  peTTM?:                         number;
  pegAnnual?:                     number;
  // Profitability (as %, e.g. 26.3 = 26.3%)
  netProfitMarginAnnual?:         number;
  netProfitMarginTTM?:            number;
  operatingMarginAnnual?:         number;
  operatingMarginTTM?:            number;
  grossMarginAnnual?:             number;
  grossMarginTTM?:                number;
  // Returns (as %)
  roeAnnual?:                     number;
  roeTTM?:                        number;
  roaAnnual?:                     number;
  roaTTM?:                        number;
  // Risk
  beta?:                          number;
  marketBeta?:                    number;
  // Dividends
  dividendYieldIndicatedAnnual?:  number; // as %
  dividendPerShareAnnual?:        number;
  // Revenue / profit (absolute, in millions — often null on free tier)
  revenueTTM?:                    number;
  revenueAnnual?:                 number;
  grossProfitAnnual?:             number;
  grossProfitTTM?:                number;
  // Revenue per share (always available on free tier)
  revenuePerShareTTM?:            number;
  revenuePerShareAnnual?:         number;
  // Analyst targets
  priceTargetAverage?:            number;
  priceTargetMedian?:             number;
  priceTargetHigh?:               number;
  priceTargetLow?:                number;
}

interface FinnhubCandle {
  c: number[];  // close prices
  h: number[];  // high prices
  l: number[];  // low prices
  o: number[];  // open prices
  s: string;    // "ok" | "no_data"
  t: number[];  // timestamps (unix seconds)
  v: number[];  // volumes
}

export interface FinnhubNewsItem {
  category:  string;
  datetime:  number;  // unix timestamp (seconds)
  headline:  string;
  id:        number;
  image:     string;
  related:   string;
  source:    string;
  summary:   string;
  url:       string;
}

// ── Generic Finnhub fetch helper ──────────────────────────────────────────────
async function finnhubFetch<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1${path}&token=${token}`,
      { next: { revalidate: 300 } }, // 5-min HTTP cache
    );
    if (!res.ok) return null;
    const data: unknown = await res.json();
    // Finnhub returns {} or null for unknown tickers; empty array = no results
    if (!data || (typeof data === "object" && Object.keys(data as object).length === 0)) return null;
    return data as T;
  } catch {
    return null;
  }
}

// ── Map Finnhub profile + metrics → StockOverview ────────────────────────────
function mapToOverview(
  ticker:  string,
  profile: FinnhubProfile,
  metrics: FinnhubMetrics,
  yahoo?:  YahooFundamentals | null,
): StockOverview {
  // Finnhub margins/returns come as percentages (26.3); AV expects decimals (0.263)
  const pct = (v: number | undefined): string =>
    v != null && !isNaN(v) ? String(v / 100) : "None";

  // Plain number → string, "None" if missing
  const num = (v: number | undefined | null): string =>
    v != null && !isNaN(v) ? String(v) : "None";

  // Finnhub market-cap and shares are in millions → convert to absolute
  const mcap   = profile.marketCapitalization
    ? String(Math.round(profile.marketCapitalization * 1_000_000))
    : "None";
  const shares = profile.shareOutstanding
    ? String(Math.round(profile.shareOutstanding * 1_000_000))
    : "None";

  // Revenue / profit: Yahoo gives absolute dollars; Finnhub gives millions (often null)
  // Fallback: derive from revenuePerShareTTM × sharesOutstanding
  const revPerShare = metrics.revenuePerShareTTM ?? metrics.revenuePerShareAnnual;
  const computedRev = revPerShare != null && profile.shareOutstanding > 0
    ? Math.round(revPerShare * profile.shareOutstanding * 1_000_000)
    : null;

  const revAbsTTM = (metrics.revenueTTM ?? metrics.revenueAnnual) != null
    ? Math.round((metrics.revenueTTM ?? metrics.revenueAnnual)! * 1_000_000)
    : null;

  const revTTM = yahoo?.revenueTTM != null
    ? String(Math.round(yahoo.revenueTTM))
    : revAbsTTM != null
      ? String(revAbsTTM)
      : computedRev != null
        ? String(computedRev)
        : "None";

  // Gross profit: Yahoo absolute → Finnhub absolute → derive from revenue × grossMargin
  const grossMargin = (metrics.grossMarginTTM ?? metrics.grossMarginAnnual);
  const gpFromMargin = computedRev != null && grossMargin != null
    ? Math.round(computedRev * (grossMargin / 100))
    : null;

  const gpAbsTTM = (metrics.grossProfitTTM ?? metrics.grossProfitAnnual) != null
    ? Math.round((metrics.grossProfitTTM ?? metrics.grossProfitAnnual)! * 1_000_000)
    : null;

  const gpTTM = yahoo?.grossProfitTTM != null
    ? String(Math.round(yahoo.grossProfitTTM))
    : gpAbsTTM != null
      ? String(gpAbsTTM)
      : gpFromMargin != null
        ? String(gpFromMargin)
        : "None";

  return {
    Symbol:               ticker.toUpperCase(),
    Name:                 profile.name || ticker,
    Description:          yahoo?.description || "None",
    Exchange:             profile.exchange || "None",
    Currency:             profile.currency || "USD",
    Country:              profile.country  || "None",
    Sector:               yahoo?.sector   || "None",
    Industry:             yahoo?.industry || profile.finnhubIndustry || "None",
    Address:              yahoo?.address  || "None",
    MarketCapitalization: yahoo?.marketCap != null ? String(Math.round(yahoo.marketCap)) : mcap,
    RevenueTTM:           revTTM,
    GrossProfitTTM:       gpTTM,
    EPS:                  num(metrics.epsTTM ?? metrics.epsAnnual),
    DilutedEPSTTM:        num(metrics.epsTTM ?? metrics.epsAnnual),
    ProfitMargin:         yahoo?.profitMarginTTM   != null ? String(yahoo.profitMarginTTM)   : pct(metrics.netProfitMarginTTM  ?? metrics.netProfitMarginAnnual),
    OperatingMarginTTM:   yahoo?.operatingMarginTTM != null ? String(yahoo.operatingMarginTTM) : pct(metrics.operatingMarginTTM  ?? metrics.operatingMarginAnnual),
    ReturnOnEquityTTM:    yahoo?.returnOnEquity    != null ? String(yahoo.returnOnEquity)    : pct(metrics.roeTTM  ?? metrics.roeAnnual),
    ReturnOnAssetsTTM:    yahoo?.returnOnAssets    != null ? String(yahoo.returnOnAssets)    : pct(metrics.roaTTM  ?? metrics.roaAnnual),
    PERatio:              yahoo?.trailingPE != null ? String(yahoo.trailingPE) : num(metrics.peTTM ?? metrics.peAnnual),
    ForwardPE:            num(yahoo?.forwardPE),
    PEGRatio:             yahoo?.pegRatio != null ? String(yahoo.pegRatio) : num(metrics.pegAnnual),
    Beta:                 yahoo?.beta != null ? String(yahoo.beta) : num(metrics.beta ?? metrics.marketBeta),
    "52WeekHigh":         yahoo?.high52 != null ? String(yahoo.high52) : num(metrics["52WeekHigh"]),
    "52WeekLow":          yahoo?.low52  != null ? String(yahoo.low52)  : num(metrics["52WeekLow"]),
    "50DayMovingAverage": num(yahoo?.ma50),
    "200DayMovingAverage":num(yahoo?.ma200),
    DividendYield:        yahoo?.dividendYield != null ? String(yahoo.dividendYield) : pct(metrics.dividendYieldIndicatedAnnual),
    DividendPerShare:     yahoo?.dividendPerShare != null ? String(yahoo.dividendPerShare) : num(metrics.dividendPerShareAnnual),
    AnalystTargetPrice:   yahoo?.analystTarget != null ? String(yahoo.analystTarget) : num(metrics.priceTargetAverage ?? metrics.priceTargetMedian),
    SharesOutstanding:    yahoo?.sharesOutstanding != null ? String(Math.round(yahoo.sharesOutstanding)) : shares,
    // D/E: Yahoo raw API returns ×100 (167 = 1.67×) — divide to get actual ratio
    DebtToEquity:         yahoo?.debtToEquity != null ? String((yahoo.debtToEquity / 100).toFixed(2)) : "None",
  };
}

// ── Map Finnhub quote → GlobalQuote ──────────────────────────────────────────
function mapToQuote(ticker: string, q: FinnhubQuote): GlobalQuote {
  const tradingDay = q.t
    ? new Date(q.t * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    "01. symbol":             ticker.toUpperCase(),
    "02. open":               String(q.o),
    "03. high":               String(q.h),
    "04. low":                String(q.l),
    "05. price":              String(q.c),
    "06. volume":             "0", // not included in Finnhub /quote
    "07. latest trading day": tradingDay,
    "08. previous close":     String(q.pc),
    "09. change":             String(q.d.toFixed(4)),
    "10. change percent":     `${q.dp.toFixed(4)}%`,
  };
}

// ── fetchFinnhubStock — quote + profile + metrics + Yahoo fundamentals ────────
// Fetches all data in parallel. Yahoo fundamentals fill in gaps (Revenue, MA, etc.)
export async function fetchFinnhubStock(ticker: string): Promise<FetchResult | null> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return null;

  const sym = ticker.toUpperCase();

  // All four calls in parallel — Finnhub + Yahoo simultaneously
  const [quote, profile, metricsData, yahoo] = await Promise.all([
    finnhubFetch<FinnhubQuote>(`/quote?symbol=${sym}`, token),
    finnhubFetch<FinnhubProfile>(`/stock/profile2?symbol=${sym}`, token),
    finnhubFetch<{ metric: FinnhubMetrics }>(`/stock/metric?symbol=${sym}&metric=all`, token),
    fetchYahooFundamentals(sym),
  ]);

  // Price must exist and be non-zero — zero means unknown ticker
  if (!quote || !quote.c || quote.c === 0) return null;

  // Use profile if available, otherwise create a minimal stub
  const safeProfile: FinnhubProfile = profile ?? {
    name:                 sym,
    ticker:               sym,
    exchange:             "None",
    currency:             "USD",
    country:              "None",
    finnhubIndustry:      "None",
    marketCapitalization: 0,
    shareOutstanding:     0,
    ipo:                  "",
    logo:                 "",
    weburl:               "",
    phone:                "",
  };

  const metrics: FinnhubMetrics = metricsData?.metric ?? {};

  return {
    success:     true,
    overview:    mapToOverview(sym, safeProfile, metrics, yahoo),
    quote:       mapToQuote(sym, quote),
    priceSource: "live",
  };
}

// ── fetchFinnhubChart — 1-year daily OHLC from Finnhub /stock/candle ─────────
export async function fetchFinnhubChart(ticker: string): Promise<ChartEntry[] | null> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return null;

  const sym = ticker.toUpperCase();
  const now = Math.floor(Date.now() / 1000);
  const oneYearAgo = now - 365 * 24 * 60 * 60;

  const candle = await finnhubFetch<FinnhubCandle>(
    `/stock/candle?symbol=${sym}&resolution=D&from=${oneYearAgo}&to=${now}`,
    token,
  );

  if (!candle || candle.s !== "ok" || !candle.t || candle.t.length === 0) return null;

  const entries: ChartEntry[] = [];
  for (let i = 0; i < candle.t.length; i++) {
    const close = candle.c?.[i];
    if (close == null || isNaN(close)) continue;
    entries.push({
      date:  new Date(candle.t[i] * 1000).toISOString().slice(0, 10),
      close: parseFloat(close.toFixed(2)),
      high:  candle.h?.[i] != null && !isNaN(candle.h[i]) ? parseFloat(candle.h[i].toFixed(2)) : close,
      low:   candle.l?.[i] != null && !isNaN(candle.l[i]) ? parseFloat(candle.l[i].toFixed(2)) : close,
    });
  }

  return entries.length > 0 ? entries.sort((a, b) => a.date.localeCompare(b.date)) : null;
}

// ── fetchFinnhubNews — recent company headlines from Finnhub /company-news ───
export type NewsArticle = { title: string; url: string; source: string; time_published: string };

export async function fetchFinnhubNews(ticker: string): Promise<NewsArticle[] | null> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return null;

  const sym  = ticker.toUpperCase();
  const to   = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Note: company-news can return an array, which finnhubFetch handles correctly
  // (non-empty arrays won't be filtered out by the empty-object check)
  let news: FinnhubNewsItem[] | null = null;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${sym}&from=${from}&to=${to}&token=${token}`,
      { next: { revalidate: 300 } },
    );
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        news = data as FinnhubNewsItem[];
      }
    }
  } catch {
    return null;
  }

  if (!news || news.length === 0) return null;

  return news
    .filter((item) => item.headline && item.url)
    .slice(0, 5)
    .map((item) => ({
      title:          item.headline,
      url:            item.url,
      source:         item.source || "Finnhub",
      time_published: new Date(item.datetime * 1000)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+$/, "")
        .slice(0, 15),
    }));
}
