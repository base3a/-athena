"use client";
// v2 — 122 tickers, pagination, globe icons
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ScreenerMetrics } from "@/app/api/screener-data/route";

// ── Types ──────────────────────────────────────────────────────────────────────
type MarketCapFilter = "All" | "Large" | "Mid" | "Small";
type RegionFilter    = "All" | "US"    | "Global";
type SortDir         = "asc" | "desc";
type SortableKey     = "pe" | "roe" | "profitMargin" | "revenueGrowth" | "dividendYield" | "epsGrowth" | "drawdownPct" | "price";

// Static identity — what we know without an API call
interface StockIdentity {
  ticker:  string;
  company: string;
  sector:  string;
  region:  "US" | "Global";
}

// Merged display type — identity + live metrics (all metrics nullable)
interface Stock extends StockIdentity {
  pe:            number | null;
  roe:           number | null;
  profitMargin:  number | null;
  revenueGrowth: number | null;
  dividendYield: number | null;
  debtToEquity:  number | null;
  pb:            number | null;
  epsGrowth:     number | null;
  marketCap:     "Large" | "Mid" | "Small" | null;
  insight:       string;
  price:         number | null;
  drawdownPct:   number | null;  // % below 52-week high (negative value)
}

interface Col {
  key:      keyof Stock | "insight";
  label:    string;
  sortable: boolean;
  align:    "left" | "right";
}

interface FilterState {
  maxPE:            number;
  minMargin:        number;
  minROE:           number;
  marketCap:        MarketCapFilter;
  sector:           string;
  region:           RegionFilter;
  minRevenueGrowth: number;
  minDividendYield: number;
  maxDebtToEquity:  number; // 10 = any
  maxPB:            number; // 50 = any
  minEpsGrowth:     number;
}

// ── Insight generator ──────────────────────────────────────────────────────────
function generateInsight(m: ScreenerMetrics): string {
  const roe = m.roe           ?? 0;
  const pm  = m.profitMargin  ?? 0;
  const dy  = m.dividendYield ?? 0;
  const pb  = m.pb            ?? 99;
  const pe  = m.pe            ?? 99;
  const de  = m.debtToEquity  ?? 99;
  const rg  = m.revenueGrowth ?? 0;
  const eg  = m.epsGrowth     ?? 0;

  if (roe >= 80  && pm  >= 30)           return "Elite ROE with exceptional profit margins";
  if (roe >= 50  && rg  >= 20)           return "High-velocity compounder at scale";
  if (dy  >= 5.5)                        return "High yield anchored by defensive earnings";
  if (pb  > 0 && pb <= 1.2 && roe >= 10) return "Trading near book value with improving returns";
  if (pe  <= 12  && dy  >= 2.5)          return "Deep value with reliable dividend income";
  if (pm  >= 35)                         return "Extraordinary margins signal durable pricing power";
  if (roe >= 30  && de  <= 0.2)          return "High ROE with a fortress balance sheet";
  if (rg  >= 35  && pm  >= 15)           return "Hypergrowth compounder with expanding margins";
  if (dy  >= 3   && eg  >= 8)            return "Growing dividend backed by strong EPS gains";
  if (pe  <= 15  && roe >= 20)           return "Undervalued quality with high capital efficiency";
  if (pm  >= 25  && roe >= 25)           return "Wide moat reflected in margins and returns";
  if (eg  >= 50)                         return "EPS acceleration signals a business inflection";
  if (de  === 0)                         return "Debt-free, self-funding quality business";
  if (rg  >= 15  && pe  <= 45)           return "Consistent growth at a reasonable valuation";
  if (roe >= 20  && pm  >= 15)           return "Consistent quality across key metrics";
  if (dy  >= 3)                          return "Reliable income with stable fundamental backing";
  if (rg  >= 8   && roe >= 12)           return "Steady compounder with improving efficiency";
  return "Solid fundamentals across key quality metrics";
}

// ── Stock universe — identity only (metrics are fetched live) ──────────────────
const STOCKS_BASE: StockIdentity[] = [
  // ── US Mega-cap Technology ────────────────────────────────────────────────────
  { ticker: "MSFT",  company: "Microsoft",               sector: "Technology",    region: "US"     },
  { ticker: "AAPL",  company: "Apple",                   sector: "Technology",    region: "US"     },
  { ticker: "GOOGL", company: "Alphabet",                sector: "Technology",    region: "US"     },
  { ticker: "META",  company: "Meta Platforms",          sector: "Technology",    region: "US"     },
  { ticker: "NVDA",  company: "Nvidia",                  sector: "Technology",    region: "US"     },
  { ticker: "TSLA",  company: "Tesla",                   sector: "Consumer Disc", region: "US"     },
  { ticker: "AVGO",  company: "Broadcom",                sector: "Technology",    region: "US"     },
  { ticker: "ADBE",  company: "Adobe",                   sector: "Technology",    region: "US"     },
  { ticker: "INTU",  company: "Intuit",                  sector: "Technology",    region: "US"     },
  { ticker: "CRM",   company: "Salesforce",              sector: "Technology",    region: "US"     },
  { ticker: "NOW",   company: "ServiceNow",              sector: "Technology",    region: "US"     },
  { ticker: "PANW",  company: "Palo Alto Networks",      sector: "Technology",    region: "US"     },
  { ticker: "VEEV",  company: "Veeva Systems",           sector: "Technology",    region: "US"     },
  { ticker: "QLYS",  company: "Qualys",                  sector: "Technology",    region: "US"     },
  { ticker: "TTD",   company: "The Trade Desk",          sector: "Technology",    region: "US"     },
  { ticker: "CRWD",  company: "CrowdStrike",             sector: "Technology",    region: "US"     },
  { ticker: "DDOG",  company: "Datadog",                 sector: "Technology",    region: "US"     },
  { ticker: "DUOL",  company: "Duolingo",                sector: "Technology",    region: "US"     },
  { ticker: "TYL",   company: "Tyler Technologies",      sector: "Technology",    region: "US"     },
  { ticker: "AXON",  company: "Axon Enterprise",         sector: "Technology",    region: "US"     },
  { ticker: "FICO",  company: "Fair Isaac Corporation",  sector: "Technology",    region: "US"     },
  { ticker: "CDNS",  company: "Cadence Design Systems",  sector: "Technology",    region: "US"     },
  { ticker: "SNPS",  company: "Synopsys",                sector: "Technology",    region: "US"     },
  { ticker: "CSGP",  company: "CoStar Group",            sector: "Technology",    region: "US"     },
  { ticker: "ADSK",  company: "Autodesk",                sector: "Technology",    region: "US"     },
  { ticker: "MPWR",  company: "Monolithic Power Systems",sector: "Technology",    region: "US"     },
  { ticker: "ENTG",  company: "Entegris",                sector: "Technology",    region: "US"     },
  { ticker: "MANH",  company: "Manhattan Associates",    sector: "Technology",    region: "US"     },
  { ticker: "FI",    company: "Fiserv",                  sector: "Technology",    region: "US"     },
  { ticker: "BR",    company: "Broadridge Financial",    sector: "Technology",    region: "US"     },
  // ── US Semiconductors ─────────────────────────────────────────────────────────
  { ticker: "AMAT",  company: "Applied Materials",       sector: "Technology",    region: "US"     },
  { ticker: "LRCX",  company: "Lam Research",            sector: "Technology",    region: "US"     },
  { ticker: "KLAC",  company: "KLA Corporation",         sector: "Technology",    region: "US"     },
  { ticker: "QCOM",  company: "Qualcomm",                sector: "Technology",    region: "US"     },
  { ticker: "TXN",   company: "Texas Instruments",       sector: "Technology",    region: "US"     },
  // ── US Financials ─────────────────────────────────────────────────────────────
  { ticker: "V",     company: "Visa",                    sector: "Financials",    region: "US"     },
  { ticker: "MA",    company: "Mastercard",              sector: "Financials",    region: "US"     },
  { ticker: "MSCI",  company: "MSCI Inc",                sector: "Financials",    region: "US"     },
  { ticker: "SPGI",  company: "S&P Global",              sector: "Financials",    region: "US"     },
  { ticker: "MCO",   company: "Moody's Corporation",     sector: "Financials",    region: "US"     },
  { ticker: "JPM",   company: "JPMorgan Chase",          sector: "Financials",    region: "US"     },
  { ticker: "AXP",   company: "American Express",        sector: "Financials",    region: "US"     },
  { ticker: "BLK",   company: "BlackRock",               sector: "Financials",    region: "US"     },
  { ticker: "GS",    company: "Goldman Sachs",           sector: "Financials",    region: "US"     },
  { ticker: "SCHW",  company: "Charles Schwab",          sector: "Financials",    region: "US"     },
  { ticker: "BRK-B", company: "Berkshire Hathaway B",    sector: "Financials",    region: "US"     },
  { ticker: "MKTX",  company: "MarketAxess Holdings",    sector: "Financials",    region: "US"     },
  { ticker: "NDAQ",  company: "Nasdaq Inc",              sector: "Financials",    region: "US"     },
  { ticker: "CME",   company: "CME Group",               sector: "Financials",    region: "US"     },
  { ticker: "ICE",   company: "Intercontinental Exchange",sector:"Financials",   region: "US"     },
  { ticker: "CBOE",  company: "Cboe Global Markets",     sector: "Financials",    region: "US"     },
  { ticker: "AJG",   company: "Arthur J. Gallagher",     sector: "Financials",    region: "US"     },
  // ── US Healthcare ─────────────────────────────────────────────────────────────
  { ticker: "LLY",   company: "Eli Lilly",               sector: "Healthcare",    region: "US"     },
  { ticker: "UNH",   company: "UnitedHealth Group",      sector: "Healthcare",    region: "US"     },
  { ticker: "JNJ",   company: "Johnson & Johnson",       sector: "Healthcare",    region: "US"     },
  { ticker: "ABT",   company: "Abbott Laboratories",     sector: "Healthcare",    region: "US"     },
  { ticker: "TMO",   company: "Thermo Fisher Scientific",sector: "Healthcare",    region: "US"     },
  { ticker: "ISRG",  company: "Intuitive Surgical",      sector: "Healthcare",    region: "US"     },
  { ticker: "ABBV",  company: "AbbVie",                  sector: "Healthcare",    region: "US"     },
  { ticker: "VRTX",  company: "Vertex Pharmaceuticals",  sector: "Healthcare",    region: "US"     },
  { ticker: "IDXX",  company: "IDEXX Laboratories",      sector: "Healthcare",    region: "US"     },
  { ticker: "HIMS",  company: "Hims & Hers Health",      sector: "Healthcare",    region: "US"     },
  { ticker: "DHR",   company: "Danaher",                 sector: "Healthcare",    region: "US"     },
  { ticker: "MTD",   company: "Mettler-Toledo",          sector: "Healthcare",    region: "US"     },
  { ticker: "WST",   company: "West Pharmaceutical Services",sector:"Healthcare", region: "US"     },
  { ticker: "DOCS",  company: "Doximity",                sector: "Healthcare",    region: "US"     },
  // ── US Consumer ───────────────────────────────────────────────────────────────
  { ticker: "AMZN",  company: "Amazon",                  sector: "Consumer Disc", region: "US"     },
  { ticker: "NFLX",  company: "Netflix",                 sector: "Consumer Disc", region: "US"     },
  { ticker: "NKE",   company: "Nike",                    sector: "Consumer Disc", region: "US"     },
  { ticker: "HD",    company: "Home Depot",              sector: "Consumer Disc", region: "US"     },
  { ticker: "LOW",   company: "Lowe's Companies",        sector: "Consumer Disc", region: "US"     },
  { ticker: "COST",  company: "Costco",                  sector: "Staples",       region: "US"     },
  { ticker: "WMT",   company: "Walmart",                 sector: "Staples",       region: "US"     },
  { ticker: "PG",    company: "Procter & Gamble",        sector: "Staples",       region: "US"     },
  { ticker: "KO",    company: "Coca-Cola",               sector: "Staples",       region: "US"     },
  { ticker: "PEP",   company: "PepsiCo",                 sector: "Staples",       region: "US"     },
  // ── US Industrials ────────────────────────────────────────────────────────────
  { ticker: "CAT",   company: "Caterpillar",             sector: "Industrials",   region: "US"     },
  { ticker: "HON",   company: "Honeywell",               sector: "Industrials",   region: "US"     },
  { ticker: "ODFL",  company: "Old Dominion Freight",    sector: "Industrials",   region: "US"     },
  { ticker: "FAST",  company: "Fastenal",                sector: "Industrials",   region: "US"     },
  { ticker: "SSD",   company: "Simpson Manufacturing",   sector: "Industrials",   region: "US"     },
  { ticker: "ROP",   company: "Roper Technologies",      sector: "Industrials",   region: "US"     },
  { ticker: "CTAS",  company: "Cintas Corporation",      sector: "Industrials",   region: "US"     },
  { ticker: "ECL",   company: "Ecolab",                  sector: "Industrials",   region: "US"     },
  { ticker: "SHW",   company: "Sherwin-Williams",        sector: "Industrials",   region: "US"     },
  { ticker: "CPRT",  company: "Copart",                  sector: "Industrials",   region: "US"     },
  { ticker: "ITW",   company: "Illinois Tool Works",     sector: "Industrials",   region: "US"     },
  { ticker: "WM",    company: "Waste Management",        sector: "Industrials",   region: "US"     },
  { ticker: "ROL",   company: "Rollins",                 sector: "Industrials",   region: "US"     },
  { ticker: "WSO",   company: "Watsco",                  sector: "Industrials",   region: "US"     },
  { ticker: "ADP",   company: "Automatic Data Processing",sector:"Technology",   region: "US"     },
  // ── US Energy ─────────────────────────────────────────────────────────────────
  { ticker: "XOM",   company: "ExxonMobil",              sector: "Energy",        region: "US"     },
  { ticker: "CVX",   company: "Chevron",                 sector: "Energy",        region: "US"     },
  // ── US Telecom ────────────────────────────────────────────────────────────────
  { ticker: "VZ",    company: "Verizon",                 sector: "Telecom",       region: "US"     },
  { ticker: "T",     company: "AT&T",                    sector: "Telecom",       region: "US"     },
  // ── US Real Estate ────────────────────────────────────────────────────────────
  { ticker: "O",     company: "Realty Income",           sector: "Real Estate",   region: "US"     },
  { ticker: "PLD",   company: "Prologis",                sector: "Real Estate",   region: "US"     },
  { ticker: "AMT",   company: "American Tower",          sector: "Real Estate",   region: "US"     },
  // ── European Stocks ───────────────────────────────────────────────────────────
  { ticker: "ASML",  company: "ASML Holding",            sector: "Technology",    region: "Global" },
  { ticker: "SAP",   company: "SAP SE",                  sector: "Technology",    region: "Global" },
  { ticker: "NVO",   company: "Novo Nordisk",            sector: "Healthcare",    region: "Global" },
  { ticker: "LVMH",  company: "LVMH",                    sector: "Consumer Disc", region: "Global" },
  { ticker: "NSRGY", company: "Nestlé",                  sector: "Staples",       region: "Global" },
  { ticker: "HESAY", company: "Hermès International",    sector: "Consumer Disc", region: "Global" },
  { ticker: "RELX",  company: "RELX PLC",                sector: "Technology",    region: "Global" },
  // ── Swedish Stocks ────────────────────────────────────────────────────────────
  { ticker: "ERIC",  company: "Ericsson",                sector: "Technology",    region: "Global" },
  { ticker: "SPOT",  company: "Spotify Technology",      sector: "Technology",    region: "Global" },
  { ticker: "ATLCY", company: "Atlas Copco",             sector: "Industrials",   region: "Global" },
  { ticker: "HXGBY", company: "Hexagon AB",              sector: "Technology",    region: "Global" },
  // ── Asian Stocks ──────────────────────────────────────────────────────────────
  { ticker: "TSM",   company: "TSMC",                    sector: "Technology",    region: "Global" },
  { ticker: "SSNLF", company: "Samsung Electronics",     sector: "Technology",    region: "Global" },
  { ticker: "TM",    company: "Toyota Motor",            sector: "Consumer Disc", region: "Global" },
  { ticker: "SONY",  company: "Sony Group",              sector: "Consumer Disc", region: "Global" },
  { ticker: "KYCCF", company: "Keyence Corporation",     sector: "Technology",    region: "Global" },
  { ticker: "MELI",  company: "MercadoLibre",            sector: "Consumer Disc", region: "Global" },
  { ticker: "BABA",  company: "Alibaba Group",           sector: "Consumer Disc", region: "Global" },
  { ticker: "INFY",  company: "Infosys",                 sector: "Technology",    region: "Global" },
  // ── Americas / Emerging ───────────────────────────────────────────────────────
  { ticker: "SHOP",  company: "Shopify",                 sector: "Technology",    region: "Global" },
  { ticker: "NU",    company: "Nu Holdings",             sector: "Financials",    region: "Global" },
  { ticker: "SE",    company: "Sea Limited",             sector: "Technology",    region: "Global" },
  { ticker: "ADYEY", company: "Adyen NV",                sector: "Financials",    region: "Global" },
];

const ALL_TICKERS = STOCKS_BASE.map((s) => s.ticker);

const ALL_SECTORS = [
  "All", "Technology", "Financials", "Healthcare",
  "Staples", "Consumer Disc", "Industrials", "Energy",
  "Telecom", "Real Estate",
];

// ── Filters & Presets ──────────────────────────────────────────────────────────
const DEFAULT_FILTERS: FilterState = {
  maxPE: 100, minMargin: 0, minROE: 0,
  marketCap: "All", sector: "All", region: "All",
  minRevenueGrowth: 0, minDividendYield: 0,
  maxDebtToEquity: 10, maxPB: 50, minEpsGrowth: 0,
};

const PRESETS: { id: string; label: string; desc: string; filters: Partial<FilterState> }[] = [
  { id: "lifetime-opportunity", label: "⚡ Lifetime Opportunity", desc: "Quality stocks ≥25% below their 52-week high — historically strong entry points", filters: {} },
  { id: "high-roe",            label: "High ROE",             desc: "Exceptional returns on equity",               filters: { minROE: 30 } },
  { id: "undervalued-quality", label: "Undervalued Quality",  desc: "Strong fundamentals below fair value",        filters: { maxPE: 25, minROE: 15, minMargin: 10 } },
  { id: "strong-fcf",          label: "Strong FCF",           desc: "Significant free cash flow generation",       filters: { minMargin: 20 } },
  { id: "defensive-moats",     label: "Defensive Moats",      desc: "Durable advantages, stable businesses",       filters: { minROE: 20, minMargin: 14 } },
  { id: "garp",                label: "Growth · Fair Price",  desc: "Growing companies, not overpriced",           filters: { maxPE: 40, minRevenueGrowth: 10 } },
  { id: "deep-value",          label: "Deep Value",           desc: "Low valuation, high dividend, real assets",   filters: { maxPE: 15, maxPB: 2.5, minDividendYield: 2 } },
  { id: "quality-compounder",  label: "Quality Compounder",   desc: "High ROE, clean balance sheet, steady growth",filters: { minROE: 25, maxDebtToEquity: 0.5, minRevenueGrowth: 7 } },
  { id: "turnaround-play",     label: "Turnaround Play",      desc: "Beaten-down price, improving earnings",       filters: { maxPE: 20, minEpsGrowth: 8, minRevenueGrowth: 5 } },
  { id: "dividend-income",     label: "Dividend Income",      desc: "High yield with stable earnings",             filters: { minDividendYield: 3.0, minMargin: 8 } },
];

const COLS: Col[] = [
  { key: "ticker",        label: "Ticker",         sortable: false, align: "left"  },
  { key: "company",       label: "Company",        sortable: false, align: "left"  },
  { key: "sector",        label: "Sector",         sortable: false, align: "left"  },
  { key: "price",         label: "Price",          sortable: true,  align: "right" },
  { key: "drawdownPct",   label: "From High",      sortable: true,  align: "right" },
  { key: "pe",            label: "P/E",            sortable: true,  align: "right" },
  { key: "roe",           label: "ROE",            sortable: true,  align: "right" },
  { key: "profitMargin",  label: "Margin",         sortable: true,  align: "right" },
  { key: "revenueGrowth", label: "Rev Growth",     sortable: true,  align: "right" },
  { key: "dividendYield", label: "Div Yield",      sortable: true,  align: "right" },
  { key: "epsGrowth",     label: "EPS Growth",     sortable: true,  align: "right" },
  { key: "insight",       label: "Athena's Take",  sortable: false, align: "left"  },
];

// ── Lifetime Opportunity qualifier ─────────────────────────────────────────────
function isLifetimeOpportunity(s: Stock): boolean {
  return (
    s.drawdownPct   !== null && s.drawdownPct   <= -25 &&
    s.revenueGrowth !== null && s.revenueGrowth >   0  &&
    s.profitMargin  !== null && s.profitMargin  >   8  &&
    s.roe           !== null && s.roe           >  15
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function signColor(g: number | null): string {
  if (g === null) return "#444";
  return g >= 0 ? "#7abf9a" : "#c47878";
}
function fmt(n: number, dec = 1): string {
  return n.toFixed(dec);
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ScreenerClient() {
  const router = useRouter();

  const [activePreset, setActivePreset] = useState<string | null>("high-roe");
  const [filters, setFilters]           = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...PRESETS.find((p) => p.id === "high-roe")!.filters,
  });
  const [sortKey, setSortKey] = useState<SortableKey>("roe");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page,    setPage]    = useState(0);

  // ── Live data state ──────────────────────────────────────────────────────────
  const [liveData,  setLiveData]  = useState<Record<string, ScreenerMetrics>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const symbols = ALL_TICKERS.join(",");
    fetch(`/api/screener-data?symbols=${symbols}`)
      .then((r) => r.json())
      .then((data: Record<string, ScreenerMetrics>) => {
        setLiveData(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // ── Merge identity + live metrics ────────────────────────────────────────────
  const stocks: Stock[] = useMemo(
    () =>
      STOCKS_BASE.map((base) => {
        const live = liveData[base.ticker] ?? null;
        return {
          ...base,
          pe:            live?.pe            ?? null,
          roe:           live?.roe           ?? null,
          profitMargin:  live?.profitMargin  ?? null,
          revenueGrowth: live?.revenueGrowth ?? null,
          dividendYield: live?.dividendYield ?? null,
          debtToEquity:  live?.debtToEquity  ?? null,
          pb:            live?.pb            ?? null,
          epsGrowth:     live?.epsGrowth     ?? null,
          marketCap:     live?.marketCapCat  ?? null,
          insight:       live ? generateInsight(live) : "",
          price:         live?.price         ?? null,
          drawdownPct:   (live?.price != null && live?.high52w != null && live.high52w > 0)
                           ? Math.round(((live.price - live.high52w) / live.high52w) * 1000) / 10
                           : null,
        };
      }),
    [liveData],
  );

  function applyPreset(id: string) {
    if (activePreset === id) {
      setActivePreset(null);
      setFilters(DEFAULT_FILTERS);
      return;
    }
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setActivePreset(id);
    setFilters({ ...DEFAULT_FILTERS, ...preset.filters });
  }

  function updateFilter(updates: Partial<FilterState>) {
    setActivePreset(null);
    setFilters((prev) => ({ ...prev, ...updates }));
  }

  function resetFilters() {
    setActivePreset(null);
    setFilters(DEFAULT_FILTERS);
  }

  function handleSort(key: SortableKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const results = useMemo(() => {
    const isLO = activePreset === "lifetime-opportunity";
    return stocks
      .filter((s) => {
        // Lifetime Opportunity preset: custom filter
        if (isLO) return isLifetimeOpportunity(s);
        // Numeric filters: null metric value → exclude when filter is active (honest: can't verify)
        if (filters.maxPE < 100 && (s.pe === null || s.pe > filters.maxPE))                                 return false;
        if (filters.minMargin > 0 && (s.profitMargin === null || s.profitMargin < filters.minMargin))       return false;
        if (filters.minROE    > 0 && (s.roe          === null || s.roe         < filters.minROE))           return false;
        if (filters.minRevenueGrowth > 0 && (s.revenueGrowth === null || s.revenueGrowth < filters.minRevenueGrowth)) return false;
        if (filters.minDividendYield > 0 && (s.dividendYield === null || s.dividendYield < filters.minDividendYield)) return false;
        if (filters.maxDebtToEquity  < 10 && (s.debtToEquity === null || s.debtToEquity  > filters.maxDebtToEquity))  return false;
        if (filters.maxPB < 50 && s.pb !== null && s.pb > 0 && s.pb > filters.maxPB)                       return false;
        if (filters.minEpsGrowth > 0 && (s.epsGrowth === null || s.epsGrowth < filters.minEpsGrowth))      return false;
        // Category filters
        if (filters.marketCap !== "All" && s.marketCap !== filters.marketCap) return false;
        if (filters.sector    !== "All" && s.sector    !== filters.sector)    return false;
        if (filters.region    !== "All" && s.region    !== filters.region)    return false;
        return true;
      })
      .sort((a, b) => {
        // Lifetime Opportunity: sort by most beaten-down first (most negative drawdown)
        if (isLO) {
          const av = a.drawdownPct;
          const bv = b.drawdownPct;
          if (av === null && bv === null) return 0;
          if (av === null) return 1;
          if (bv === null) return -1;
          return av - bv; // ascending → most negative first
        }
        const av = a[sortKey] as number | null;
        const bv = b[sortKey] as number | null;
        // Null values always sink to the bottom
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return sortDir === "desc" ? bv - av : av - bv;
      })
      .slice(0, 100);
  }, [stocks, filters, sortKey, sortDir, activePreset]);

  // Reset to page 0 whenever filters, sort, or preset change
  useEffect(() => { setPage(0); }, [filters, activePreset, sortKey, sortDir]);

  const PAGE_SIZE = 50;
  const totalResults = results.length;
  const pageStart    = page * PAGE_SIZE;
  const pageEnd      = Math.min(pageStart + PAGE_SIZE, totalResults);
  const displayedResults = results.slice(pageStart, pageEnd);
  const totalPages   = Math.ceil(totalResults / PAGE_SIZE);

  const hasActiveFilters =
    filters.maxPE < 100 || filters.minMargin > 0 || filters.minROE > 0 ||
    filters.marketCap !== "All" || filters.sector !== "All" || filters.region !== "All" ||
    filters.minRevenueGrowth > 0 || filters.minDividendYield > 0 ||
    filters.maxDebtToEquity < 10 || filters.maxPB < 50 || filters.minEpsGrowth > 0;

  function pillStyle(active: boolean): React.CSSProperties {
    return {
      flex: 1, padding: "11px 0", minHeight: 44, borderRadius: 6, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      border:     `1px solid ${active ? "rgba(212,160,23,0.4)" : "#1e1e1e"}`,
      background:  active ? "rgba(212,160,23,0.08)" : "transparent",
      color:       active ? "#d4a017" : "#9A9A9A",
      fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" as const,
      fontWeight: 600, transition: "all 0.12s ease",
    };
  }

  // ── Slider helpers ───────────────────────────────────────────────────────────
  function SliderRow({
    label, value, display, min, max, step, onChange,
  }: {
    label: string; value: number; display: string;
    min: number; max: number; step: number;
    onChange: (v: number) => void;
  }) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <label style={{ fontSize: 8.5, color: "#CFCFCF", letterSpacing: "0.22em", textTransform: "uppercase" }}>
            {label}
          </label>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#888", fontWeight: 600 }}>
            {display}
          </span>
        </div>
        <input
          type="range" className="screener-slider"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Preset Buttons ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          const isLOPreset = preset.id === "lifetime-opportunity";
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              style={isLOPreset ? {
                padding:       "11px 18px",
                minHeight:     44,
                borderRadius:  8,
                border:        `1px solid ${isActive ? "#f0c040" : "rgba(212,160,23,0.5)"}`,
                background:    isActive ? "rgba(212,160,23,0.18)" : "rgba(212,160,23,0.06)",
                color:         isActive ? "#f0c040" : "#d4a017",
                fontSize:      10,
                letterSpacing: "0.14em",
                fontFamily:    "'Cinzel', serif",
                fontWeight:    700,
                textTransform: "uppercase",
                cursor:        "pointer",
                transition:    "all 0.15s ease",
                whiteSpace:    "nowrap",
                boxShadow:     isActive ? "0 0 16px rgba(212,160,23,0.22)" : "none",
              } : {
                padding:       "11px 18px",
                minHeight:     44,
                borderRadius:  8,
                border:        `1px solid ${isActive ? "#d4a017" : "rgba(212,160,23,0.2)"}`,
                background:    isActive ? "rgba(212,160,23,0.10)" : "transparent",
                color:         isActive ? "#d4a017" : "#9A9A9A",
                fontSize:      10,
                letterSpacing: "0.14em",
                fontFamily:    "'Cinzel', serif",
                fontWeight:    600,
                textTransform: "uppercase",
                cursor:        "pointer",
                transition:    "all 0.15s ease",
                whiteSpace:    "nowrap",
              }}
            >
              {preset.label}
            </button>
          );
        })}
        {activePreset && (
          <p style={{ fontSize: 10, color: "#7A7A7A", letterSpacing: "0.06em", marginLeft: 4 }}>
            — {PRESETS.find((p) => p.id === activePreset)?.desc}
          </p>
        )}
      </div>
      <p style={{ fontSize: 9.5, color: "#7A7A7A", letterSpacing: "0.06em", marginTop: -8 }}>
        Preset applies quality thresholds automatically. Click again to deactivate.
      </p>

      {/* ── Filters Panel ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#080808", border: "1px solid #1a1a1a" }}
      >
        {/* Row 1 — Valuation */}
        <p style={{ fontSize: 8, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14 }}>
          Valuation
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 mb-6">
          <SliderRow
            label="P/E Max" value={filters.maxPE}
            display={filters.maxPE >= 100 ? "Any" : `≤ ${filters.maxPE}`}
            min={5} max={100} step={5}
            onChange={(v) => updateFilter({ maxPE: v })}
          />
          <SliderRow
            label="Price to Book Max" value={filters.maxPB}
            display={filters.maxPB >= 50 ? "Any" : `≤ ${fmt(filters.maxPB, 0)}x`}
            min={1} max={50} step={1}
            onChange={(v) => updateFilter({ maxPB: v })}
          />
          <SliderRow
            label="Dividend Yield Min" value={filters.minDividendYield}
            display={filters.minDividendYield === 0 ? "Any" : `≥ ${fmt(filters.minDividendYield, 1)}%`}
            min={0} max={8} step={0.5}
            onChange={(v) => updateFilter({ minDividendYield: v })}
          />
        </div>

        {/* Row 2 — Quality */}
        <p style={{ fontSize: 8, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14 }}>
          Quality
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 mb-6">
          <SliderRow
            label="Profit Margin Min" value={filters.minMargin}
            display={filters.minMargin === 0 ? "Any" : `≥ ${filters.minMargin}%`}
            min={0} max={40} step={2}
            onChange={(v) => updateFilter({ minMargin: v })}
          />
          <SliderRow
            label="ROE Min" value={filters.minROE}
            display={filters.minROE === 0 ? "Any" : `≥ ${filters.minROE}%`}
            min={0} max={60} step={5}
            onChange={(v) => updateFilter({ minROE: v })}
          />
          <SliderRow
            label="Debt / Equity Max" value={filters.maxDebtToEquity}
            display={filters.maxDebtToEquity >= 10 ? "Any" : `≤ ${fmt(filters.maxDebtToEquity, 1)}x`}
            min={0} max={10} step={0.5}
            onChange={(v) => updateFilter({ maxDebtToEquity: v })}
          />
        </div>

        {/* Row 3 — Growth */}
        <p style={{ fontSize: 8, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14 }}>
          Growth
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 mb-6">
          <SliderRow
            label="Revenue Growth Min" value={filters.minRevenueGrowth}
            display={filters.minRevenueGrowth === 0 ? "Any" : `≥ ${filters.minRevenueGrowth}%`}
            min={0} max={40} step={2}
            onChange={(v) => updateFilter({ minRevenueGrowth: v })}
          />
          <SliderRow
            label="EPS Growth Min" value={filters.minEpsGrowth}
            display={filters.minEpsGrowth === 0 ? "Any" : `≥ ${filters.minEpsGrowth}%`}
            min={0} max={60} step={5}
            onChange={(v) => updateFilter({ minEpsGrowth: v })}
          />
        </div>

        {/* Row 4 — Universe */}
        <p style={{ fontSize: 8, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14 }}>
          Universe
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
          {/* Market Cap */}
          <div className="flex flex-col gap-2.5">
            <label style={{ fontSize: 8.5, color: "#CFCFCF", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Market Cap
            </label>
            <div className="flex gap-1.5">
              {(["All", "Large", "Mid", "Small"] as MarketCapFilter[]).map((cap) => (
                <button key={cap} onClick={() => updateFilter({ marketCap: cap })} style={pillStyle(filters.marketCap === cap)}>
                  {cap}
                </button>
              ))}
            </div>
          </div>

          {/* Sector */}
          <div className="flex flex-col gap-2.5">
            <label style={{ fontSize: 8.5, color: "#CFCFCF", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Sector
            </label>
            <select
              value={filters.sector}
              onChange={(e) => updateFilter({ sector: e.target.value })}
              style={{
                background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 6,
                color: "#888", fontSize: 11, padding: "6px 10px",
                outline: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.03em",
              }}
            >
              {ALL_SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div className="flex flex-col gap-2.5">
            <label style={{ fontSize: 8.5, color: "#CFCFCF", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Region
            </label>
            <div className="flex gap-1.5">
              {(["All", "US", "Global"] as RegionFilter[]).map((r) => (
                <button key={r} onClick={() => updateFilter({ region: r })} style={pillStyle(filters.region === r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 9.5, color: "#444", letterSpacing: "0.16em", textTransform: "uppercase" }}>
          {isLoading ? (
            <span style={{ color: "#333" }}>Loading live market data…</span>
          ) : (
            <>
              {totalResults > PAGE_SIZE
                ? `Showing ${pageStart + 1}–${pageEnd} of ${totalResults} matching stocks`
                : `${totalResults} matching stock${totalResults !== 1 ? "s" : ""}`}
              {totalResults === 100 && <span style={{ color: "#555" }}> · max 100</span>}
              <span style={{ color: "#333", marginLeft: 10 }}>Click any row to analyze</span>
            </>
          )}
        </p>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            style={{ fontSize: 9, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", background: "transparent", border: "none", padding: 0, transition: "color 0.15s" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#d4a017")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#444")}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* ── Lifetime Opportunity Banner ────────────────────────────────────── */}
      {activePreset === "lifetime-opportunity" && (
        <div
          style={{
            borderRadius: 10,
            border:       "1px solid rgba(212,160,23,0.25)",
            background:   "rgba(212,160,23,0.05)",
            padding:      "14px 18px",
            display:      "flex",
            flexDirection: "column",
            gap:          6,
          }}
        >
          <p style={{ fontSize: 11, color: "#d4a017", fontWeight: 600, letterSpacing: "0.06em" }}>
            ⚡ These stocks are ≥25% below their 52-week high while maintaining positive revenue growth, profit margins above 8%, and ROE above 15%. Sorted by largest drawdown first.
          </p>
          <p style={{ fontSize: 9.5, color: "#555", letterSpacing: "0.04em" }}>
            Disclaimer: A lower price does not guarantee future returns. Past drawdowns may deepen further. This is a research tool for educational purposes — not financial advice. Always do your own due diligence before investing.
          </p>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid #161616" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>

          {/* Header */}
          <thead>
            <tr style={{ background: "#080808", borderBottom: "1px solid #161616" }}>
              {COLS.map((col) => {
                const isSort = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => handleSort(col.key as SortableKey) : undefined}
                    style={{
                      padding:       col.key === "insight" ? "13px 20px" : "13px 16px",
                      textAlign:     col.align,
                      fontSize:      8.5,
                      color:         isSort ? "#d4a017" : "#3a3a3a",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      fontWeight:    600,
                      cursor:        col.sortable ? "pointer" : "default",
                      whiteSpace:    "nowrap",
                      userSelect:    "none",
                      transition:    "color 0.12s",
                    }}
                  >
                    {col.label}
                    {col.sortable && isSort && (
                      <span style={{ marginLeft: 4, opacity: 0.7 }}>
                        {sortDir === "desc" ? "↓" : "↑"}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={COLS.length}
                  style={{ padding: "52px 24px", textAlign: "center", color: "#2a2a2a", fontSize: 13, letterSpacing: "0.06em" }}
                >
                  Loading live market data…
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td
                  colSpan={COLS.length}
                  style={{ padding: "52px 24px", textAlign: "center", color: "#2a2a2a", fontSize: 13, letterSpacing: "0.06em" }}
                >
                  No stocks match the current filters.
                </td>
              </tr>
            ) : (
              displayedResults.map((stock, i) => {
                const evenBg = "#0a0a0a";
                const oddBg  = "#080808";
                return (
                  <tr
                    key={stock.ticker}
                    onClick={() => router.push(`/analyze/${stock.ticker}`)}
                    style={{
                      borderBottom: i < results.length - 1 ? "1px solid #111" : "none",
                      background:   i % 2 === 0 ? evenBg : oddBg,
                      cursor:       "pointer",
                      transition:   "background 0.1s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(212,160,23,0.055)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? evenBg : oddBg)}
                  >
                    {/* Ticker */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: "#c49a28", letterSpacing: "0.08em" }}>
                        {stock.ticker}
                      </span>
                      {stock.region === "Global" && (
                        <span
                          title="International stock"
                          style={{ marginLeft: 4, fontSize: 10, verticalAlign: "middle", opacity: 0.65 }}
                        >
                          🌍
                        </span>
                      )}
                      {isLifetimeOpportunity(stock) && (
                        <span
                          title="Lifetime Opportunity — quality stock ≥25% below 52-week high"
                          style={{ marginLeft: 4, fontSize: 10, verticalAlign: "middle", opacity: 0.9 }}
                        >
                          ⚡
                        </span>
                      )}
                    </td>

                    {/* Company */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 12, color: "#999", letterSpacing: "0.02em" }}>
                        {stock.company}
                      </span>
                    </td>

                    {/* Sector */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 9.5, color: "#4a4a4a", letterSpacing: "0.07em" }}>
                        {stock.sector}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontSize: 12, color: "#888", fontVariantNumeric: "tabular-nums" }}>
                        {stock.price !== null ? `$${stock.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </td>

                    {/* From High (drawdown) */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      {stock.drawdownPct === null ? (
                        <span style={{ fontSize: 12, color: "#333", fontVariantNumeric: "tabular-nums" }}>—</span>
                      ) : stock.drawdownPct >= -5 ? (
                        <span style={{ fontSize: 12, color: "#7abf9a", fontVariantNumeric: "tabular-nums" }}>Near High</span>
                      ) : (
                        <span style={{
                          fontSize: 12,
                          fontVariantNumeric: "tabular-nums",
                          color: stock.drawdownPct <= -25 ? "#c47878" : "#777",
                        }}>
                          {stock.drawdownPct.toFixed(1)}%
                        </span>
                      )}
                    </td>

                    {/* P/E */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontSize: 12, color: "#777", fontVariantNumeric: "tabular-nums" }}>
                        {stock.pe !== null ? fmt(stock.pe) : "—"}
                      </span>
                    </td>

                    {/* ROE */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: stock.roe !== null ? (stock.roe >= 30 ? "#7abf9a" : "#777") : "#333" }}>
                        {stock.roe !== null ? `${fmt(stock.roe)}%` : "—"}
                      </span>
                    </td>

                    {/* Profit Margin */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: stock.profitMargin !== null ? (stock.profitMargin >= 20 ? "#7abf9a" : "#777") : "#333" }}>
                        {stock.profitMargin !== null ? `${fmt(stock.profitMargin)}%` : "—"}
                      </span>
                    </td>

                    {/* Revenue Growth */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: signColor(stock.revenueGrowth) }}>
                        {stock.revenueGrowth !== null
                          ? `${stock.revenueGrowth >= 0 ? "+" : ""}${fmt(stock.revenueGrowth)}%`
                          : "—"}
                      </span>
                    </td>

                    {/* Dividend Yield */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: stock.dividendYield !== null && stock.dividendYield >= 3 ? "#7abf9a" : "#777" }}>
                        {stock.dividendYield !== null && stock.dividendYield > 0
                          ? `${fmt(stock.dividendYield)}%`
                          : "—"}
                      </span>
                    </td>

                    {/* EPS Growth */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: signColor(stock.epsGrowth) }}>
                        {stock.epsGrowth !== null
                          ? `${stock.epsGrowth >= 0 ? "+" : ""}${fmt(stock.epsGrowth)}%`
                          : "—"}
                      </span>
                    </td>

                    {/* Athena's Take — insight */}
                    <td style={{ padding: "14px 20px", minWidth: 220 }}>
                      <span style={{
                        fontSize: 10.5,
                        color: "#5a5030",
                        fontStyle: "italic",
                        letterSpacing: "0.01em",
                        lineHeight: 1.4,
                      }}>
                        {stock.insight}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between" style={{ paddingTop: 4 }}>
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            style={{
              padding:       "9px 18px",
              borderRadius:  8,
              border:        `1px solid ${page === 0 ? "#1a1a1a" : "rgba(212,160,23,0.3)"}`,
              background:    "transparent",
              color:         page === 0 ? "#333" : "#d4a017",
              fontSize:      10,
              letterSpacing: "0.12em",
              cursor:        page === 0 ? "default" : "pointer",
              transition:    "all 0.15s ease",
            }}
          >
            ← Previous
          </button>
          <p style={{ fontSize: 9.5, color: "#444", letterSpacing: "0.1em" }}>
            Page {page + 1} of {totalPages} &nbsp;·&nbsp; {totalResults} total
          </p>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages}
            style={{
              padding:       "9px 18px",
              borderRadius:  8,
              border:        `1px solid ${page + 1 >= totalPages ? "#1a1a1a" : "rgba(212,160,23,0.3)"}`,
              background:    "transparent",
              color:         page + 1 >= totalPages ? "#333" : "#d4a017",
              fontSize:      10,
              letterSpacing: "0.12em",
              cursor:        page + 1 >= totalPages ? "default" : "pointer",
              transition:    "all 0.15s ease",
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Footer note */}
      <p style={{ fontSize: 9, color: "#222", letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center", paddingBottom: 4 }}>
        Live data via Yahoo Finance · Click any stock to get the full AI analysis · For educational purposes only
      </p>

    </div>
  );
}
