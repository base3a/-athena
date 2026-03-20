import { InMemoryCache } from "./cache";
import { fetchFinnhubStock } from "./finnhub";
import { fetchYahooFundamentals, fetchYahooPrice, buildYahooOverview } from "./yahoo";

// ── Types ──────────────────────────────────────────────────────────────────
export interface StockOverview {
  Symbol: string;
  Name: string;
  Description: string;
  Exchange: string;
  Currency: string;
  Country: string;
  Sector: string;
  Industry: string;
  Address: string;
  MarketCapitalization: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  EPS: string;
  DilutedEPSTTM: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  ReturnOnEquityTTM: string;
  ReturnOnAssetsTTM: string;
  PERatio: string;
  ForwardPE: string;
  PEGRatio: string;
  Beta: string;
  "52WeekHigh": string;
  "52WeekLow": string;
  "50DayMovingAverage": string;
  "200DayMovingAverage": string;
  DividendYield: string;
  DividendPerShare: string;
  AnalystTargetPrice: string;
  SharesOutstanding: string;
  // API status fields
  Note?: string;
  Information?: string;
  "Error Message"?: string;
}

export interface GlobalQuote {
  "01. symbol": string;
  "02. open": string;
  "03. high": string;
  "04. low": string;
  "05. price": string;
  "06. volume": string;
  "07. latest trading day": string;
  "08. previous close": string;
  "09. change": string;
  "10. change percent": string;
}

export type PriceSource = "live" | "yahoo" | "delayed";

export type FetchResult =
  | {
      success: true;
      overview: StockOverview;
      quote: GlobalQuote | null;
      isMockData?: boolean;
      /**
       * "live"    — Finnhub returned real-time data
       * "yahoo"   — Finnhub unavailable; data rescued from Yahoo Finance
       * "delayed" — Both sources failed; price unavailable
       */
      priceSource?: PriceSource;
    }
  | { success: false; error: "rate_limited" | "invalid_ticker" | "network_error" };

// ── Formatters ────────────────────────────────────────────────────────────
type FmtType = "currency" | "percent" | "large" | "number" | "raw";

export function fmt(
  value: string | undefined | null,
  type: FmtType = "raw"
): string {
  if (!value || value === "None" || value === "-" || value.trim() === "") {
    return "N/A";
  }
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  switch (type) {
    case "currency":
      return `$${num.toFixed(2)}`;
    case "percent":
      // Values stored as decimals (0.2631 → 26.31%)
      return `${(num * 100).toFixed(2)}%`;
    case "large":
      if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
      if (Math.abs(num) >= 1e9)  return `$${(num / 1e9).toFixed(2)}B`;
      if (Math.abs(num) >= 1e6)  return `$${(num / 1e6).toFixed(2)}M`;
      if (Math.abs(num) >= 1e3)  return `$${(num / 1e3).toFixed(2)}K`;
      return `$${num.toFixed(2)}`;
    case "number":
      return num.toFixed(2);
    default:
      return value;
  }
}

// ── Cache + dedup ──────────────────────────────────────────────────────────
// Module-level cache — keyed by uppercase ticker, TTL = 5 min
const stockCache = new InMemoryCache<FetchResult>();

// Pending requests map — deduplicates concurrent calls for the same ticker.
// If two callers ask for AAPL simultaneously, only one network call runs.
const pendingRequests = new Map<string, Promise<FetchResult>>();

// ── Private: performs the actual fetch (no cache or dedup logic) ───────────
// Priority: Finnhub (real-time) → Yahoo Finance (full fundamentals + price)
async function _doFetch(ticker: string, key: string): Promise<FetchResult> {
  try {
    // ── 1. Finnhub (primary, real-time) ──────────────────────────────────
    const finnhubResult = await fetchFinnhubStock(ticker);
    if (finnhubResult) {
      stockCache.set(key, finnhubResult);
      return finnhubResult;
    }

    // ── 2. Yahoo Finance (full fallback — fundamentals + price) ──────────
    const [fundamentals, quote] = await Promise.all([
      fetchYahooFundamentals(ticker),
      fetchYahooPrice(ticker),
    ]);

    if (fundamentals) {
      const overview = buildYahooOverview(ticker, fundamentals, quote);
      const result: FetchResult = {
        success: true,
        overview,
        quote,
        priceSource: "yahoo",
      };
      stockCache.set(key, result);
      return result;
    }

    // Both sources returned no data without throwing — most likely an unknown ticker
    return { success: false, error: "invalid_ticker" };
  } catch {
    // True network / exception error
    return { success: false, error: "network_error" };
  }
}

export async function fetchStockData(ticker: string): Promise<FetchResult> {
  const key = ticker.toUpperCase();

  // 1. In-memory cache hit → return immediately, no network call
  const hit = stockCache.get(key);
  if (hit) return hit;

  // 2. Finnhub must be configured (Yahoo Finance requires no key)
  if (!process.env.FINNHUB_API_KEY) {
    console.error("[stock] FINNHUB_API_KEY is not configured — Yahoo-only fallback active");
  }

  // 3. Dedup: if a fetch is already in-flight for this ticker, share its Promise
  const inflight = pendingRequests.get(key);
  if (inflight) return inflight;

  // 4. Start the fetch, register it so concurrent callers can share it
  const promise = _doFetch(ticker, key);
  pendingRequests.set(key, promise);

  try {
    return await promise;
  } finally {
    // Always clean up — whether the fetch succeeded, failed, or threw
    pendingRequests.delete(key);
  }
}
