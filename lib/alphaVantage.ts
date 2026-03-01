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

export type FetchResult =
  | { success: true; overview: StockOverview; quote: GlobalQuote | null }
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
      // AV sends decimals like 0.2631 → 26.31%
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

// ── Fetcher ───────────────────────────────────────────────────────────────
const BASE = "https://www.alphavantage.co/query";

export async function fetchStockData(ticker: string): Promise<FetchResult> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  try {
    const [overviewRes, quoteRes] = await Promise.all([
      fetch(
        `${BASE}?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`,
        { next: { revalidate: 1800 } } // cache 30 min
      ),
      fetch(
        `${BASE}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`,
        { next: { revalidate: 1800 } } // cache 30 min
      ),
    ]);

    const [overview, quoteData] = await Promise.all([
      overviewRes.json(),
      quoteRes.json(),
    ]);

    // Rate limit / premium feature notice
    if (overview.Note || overview.Information) {
      return { success: false, error: "rate_limited" };
    }

    // Invalid ticker or no data
    if (overview["Error Message"] || !overview.Symbol) {
      return { success: false, error: "invalid_ticker" };
    }

    const quote: GlobalQuote | null =
      quoteData["Global Quote"] &&
      Object.keys(quoteData["Global Quote"]).length > 0
        ? (quoteData["Global Quote"] as GlobalQuote)
        : null;

    return { success: true, overview, quote };
  } catch {
    return { success: false, error: "network_error" };
  }
}
