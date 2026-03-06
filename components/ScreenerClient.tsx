"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────
type MarketCapFilter = "All" | "Large" | "Mid" | "Small";
type RegionFilter    = "All" | "US"    | "Global";
type SortDir         = "asc" | "desc";
type SortableKey     = "pe" | "roe" | "profitMargin" | "revenueGrowth" | "athenaScore";

interface Stock {
  ticker:        string;
  company:       string;
  sector:        string;
  pe:            number;
  roe:           number;
  profitMargin:  number;
  revenueGrowth: number;
  athenaScore:   number;
  marketCap:     "Large" | "Mid" | "Small";
  region:        "US" | "Global";
}

interface Col {
  key:      keyof Stock;
  label:    string;
  sortable: boolean;
  align:    "left" | "right";
}

interface FilterState {
  maxPE:     number;
  minMargin: number;
  minROE:    number;
  marketCap: MarketCapFilter;
  sector:    string;
  region:    RegionFilter;
  minGrowth: number; // hidden — only activated by GARP preset
}

// ── Mock data (35 stocks) ──────────────────────────────────────────────────────
// Score distribution: 9=3 (rare/elite), 8=10, 7=14, 6=7, 5=1
const STOCKS: Stock[] = [
  // Score 9 — elite tier (3 of 35)
  { ticker: "MSFT",  company: "Microsoft",           sector: "Technology",    pe: 32.8, roe:  38.2, profitMargin: 34.1, revenueGrowth:  15.7, athenaScore: 9, marketCap: "Large", region: "US" },
  { ticker: "V",     company: "Visa",                 sector: "Financials",    pe: 28.4, roe:  42.1, profitMargin: 51.2, revenueGrowth:  10.4, athenaScore: 9, marketCap: "Large", region: "US" },
  { ticker: "NVO",   company: "Novo Nordisk",         sector: "Healthcare",    pe: 38.4, roe:  81.4, profitMargin: 32.8, revenueGrowth:  22.4, athenaScore: 9, marketCap: "Large", region: "Global" },
  // Score 8 — excellent (10 of 35)
  { ticker: "META",  company: "Meta Platforms",       sector: "Technology",    pe: 26.3, roe:  32.1, profitMargin: 28.9, revenueGrowth:  22.1, athenaScore: 8, marketCap: "Large", region: "US" },
  { ticker: "NVDA",  company: "Nvidia",               sector: "Technology",    pe: 44.2, roe:  91.4, profitMargin: 53.4, revenueGrowth: 122.4, athenaScore: 8, marketCap: "Large", region: "US" },
  { ticker: "MA",    company: "Mastercard",           sector: "Financials",    pe: 33.2, roe:  56.4, profitMargin: 44.6, revenueGrowth:  12.8, athenaScore: 8, marketCap: "Large", region: "US" },
  { ticker: "ASML",  company: "ASML Holding",         sector: "Technology",    pe: 36.2, roe:  42.8, profitMargin: 26.4, revenueGrowth:  15.8, athenaScore: 8, marketCap: "Large", region: "Global" },
  { ticker: "AAPL",  company: "Apple",                sector: "Technology",    pe: 29.4, roe: 147.2, profitMargin: 26.4, revenueGrowth:   2.8, athenaScore: 8, marketCap: "Large", region: "US" },
  { ticker: "GOOGL", company: "Alphabet",             sector: "Technology",    pe: 24.1, roe:  26.4, profitMargin: 24.0, revenueGrowth:  13.4, athenaScore: 8, marketCap: "Large", region: "US" },
  { ticker: "MSCI",  company: "MSCI Inc",             sector: "Financials",    pe: 42.8, roe:  62.4, profitMargin: 38.4, revenueGrowth:  11.8, athenaScore: 8, marketCap: "Mid",   region: "US" },
  { ticker: "LLY",   company: "Eli Lilly",            sector: "Healthcare",    pe: 52.4, roe:  78.9, profitMargin: 19.8, revenueGrowth:  31.4, athenaScore: 8, marketCap: "Large", region: "US" },
  { ticker: "ADBE",  company: "Adobe",                sector: "Technology",    pe: 38.4, roe:  36.8, profitMargin: 27.8, revenueGrowth:  10.8, athenaScore: 8, marketCap: "Large", region: "US" },
  { ticker: "INTU",  company: "Intuit",               sector: "Technology",    pe: 56.2, roe:  41.8, profitMargin: 16.4, revenueGrowth:  12.9, athenaScore: 8, marketCap: "Mid",   region: "US" },
  { ticker: "TSM",   company: "TSMC",                 sector: "Technology",    pe: 22.4, roe:  26.4, profitMargin: 38.4, revenueGrowth:  29.4, athenaScore: 8, marketCap: "Large", region: "Global" },
  // Score 7 — good quality (14 of 35)
  { ticker: "JPM",   company: "JPMorgan Chase",       sector: "Financials",    pe: 13.1, roe:  17.2, profitMargin: 27.4, revenueGrowth:   9.8, athenaScore: 7, marketCap: "Large", region: "US" },
  { ticker: "UNH",   company: "UnitedHealth Group",   sector: "Healthcare",    pe: 21.3, roe:  26.4, profitMargin:  6.4, revenueGrowth:   8.9, athenaScore: 7, marketCap: "Large", region: "US" },
  { ticker: "COST",  company: "Costco",               sector: "Staples",       pe: 48.2, roe:  29.4, profitMargin:  2.9, revenueGrowth:   7.2, athenaScore: 7, marketCap: "Large", region: "US" },
  { ticker: "AMZN",  company: "Amazon",               sector: "Consumer Disc", pe: 41.8, roe:  18.9, profitMargin:  8.1, revenueGrowth:  13.2, athenaScore: 7, marketCap: "Large", region: "US" },
  { ticker: "JNJ",   company: "Johnson & Johnson",    sector: "Healthcare",    pe: 16.2, roe:  22.8, profitMargin: 21.4, revenueGrowth:   4.6, athenaScore: 7, marketCap: "Large", region: "US" },
  { ticker: "ABT",   company: "Abbott Laboratories",  sector: "Healthcare",    pe: 23.8, roe:  18.4, profitMargin: 12.8, revenueGrowth:   4.2, athenaScore: 7, marketCap: "Large", region: "US" },
  { ticker: "PG",    company: "Procter & Gamble",     sector: "Staples",       pe: 27.1, roe:  31.4, profitMargin: 18.2, revenueGrowth:   2.8, athenaScore: 7, marketCap: "Large", region: "US" },
  { ticker: "KO",    company: "Coca-Cola",            sector: "Staples",       pe: 24.6, roe:  38.8, profitMargin: 22.4, revenueGrowth:   3.2, athenaScore: 7, marketCap: "Large", region: "US" },
  { ticker: "CAT",   company: "Caterpillar",          sector: "Industrials",   pe: 18.4, roe:  52.4, profitMargin: 15.6, revenueGrowth:   2.1, athenaScore: 7, marketCap: "Large", region: "US" },
  { ticker: "HON",   company: "Honeywell",            sector: "Industrials",   pe: 22.1, roe:  28.4, profitMargin: 14.8, revenueGrowth:   3.8, athenaScore: 7, marketCap: "Large", region: "US" },
  { ticker: "ODFL",  company: "Old Dominion Freight", sector: "Industrials",   pe: 30.4, roe:  28.9, profitMargin: 18.6, revenueGrowth:   0.4, athenaScore: 7, marketCap: "Mid",   region: "US" },
  { ticker: "QLYS",  company: "Qualys",               sector: "Technology",    pe: 28.4, roe:  32.6, profitMargin: 28.9, revenueGrowth:   7.4, athenaScore: 7, marketCap: "Small", region: "US" },
  { ticker: "SAP",   company: "SAP SE",               sector: "Technology",    pe: 42.4, roe:  18.4, profitMargin: 14.2, revenueGrowth:  10.4, athenaScore: 7, marketCap: "Large", region: "Global" },
  // Score 6 — average quality (7 of 35)
  { ticker: "SSD",   company: "Simpson Manufacturing",sector: "Industrials",   pe: 18.2, roe:  21.4, profitMargin: 12.4, revenueGrowth:   4.2, athenaScore: 6, marketCap: "Small", region: "US" },
  { ticker: "LVMH",  company: "LVMH",                 sector: "Consumer Disc", pe: 21.4, roe:  20.8, profitMargin: 16.8, revenueGrowth:   2.4, athenaScore: 6, marketCap: "Large", region: "Global" },
  { ticker: "CRM",   company: "Salesforce",           sector: "Technology",    pe: 44.2, roe:  11.4, profitMargin: 15.2, revenueGrowth:  11.4, athenaScore: 6, marketCap: "Large", region: "US" },
  { ticker: "NKE",   company: "Nike",                 sector: "Consumer Disc", pe: 28.6, roe:  32.4, profitMargin: 10.2, revenueGrowth:  -0.3, athenaScore: 6, marketCap: "Large", region: "US" },
  { ticker: "XOM",   company: "ExxonMobil",           sector: "Energy",        pe: 14.8, roe:  16.4, profitMargin: 10.2, revenueGrowth:  -2.4, athenaScore: 6, marketCap: "Large", region: "US" },
  { ticker: "CVX",   company: "Chevron",              sector: "Energy",        pe: 16.2, roe:  14.8, profitMargin:  9.4, revenueGrowth:  -4.8, athenaScore: 6, marketCap: "Large", region: "US" },
  { ticker: "ROP",   company: "Roper Technologies",   sector: "Industrials",   pe: 40.2, roe:  12.4, profitMargin: 20.1, revenueGrowth:   8.4, athenaScore: 6, marketCap: "Mid",   region: "US" },
  // Score 5 — weak quality (1 of 35)
  { ticker: "BABA",  company: "Alibaba Group",        sector: "Consumer Disc", pe:  8.2, roe:  12.4, profitMargin: 10.4, revenueGrowth:   7.8, athenaScore: 5, marketCap: "Large", region: "Global" },
];

const ALL_SECTORS = [
  "All", "Technology", "Financials", "Healthcare",
  "Staples", "Consumer Disc", "Industrials", "Energy",
];

// ── Presets ────────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS: FilterState = {
  maxPE: 100, minMargin: 0, minROE: 0,
  marketCap: "All", sector: "All", region: "All", minGrowth: 0,
};

const PRESETS: { id: string; label: string; desc: string; filters: Partial<FilterState> }[] = [
  { id: "high-roe",            label: "High ROE",             desc: "Exceptional returns on equity",         filters: { minROE: 30 } },
  { id: "undervalued-quality", label: "Undervalued Quality",  desc: "Strong fundamentals below fair value",  filters: { maxPE: 25, minROE: 15, minMargin: 10 } },
  { id: "strong-fcf",          label: "Strong FCF",           desc: "Significant free cash flow generation", filters: { minMargin: 20 } },
  { id: "defensive-moats",     label: "Defensive Moats",      desc: "Durable advantages, stable businesses", filters: { minROE: 20, minMargin: 14 } },
  { id: "garp",                label: "Growth · Fair Price",  desc: "Growing companies, not overpriced",     filters: { maxPE: 40, minGrowth: 10 } },
];

const COLS: Col[] = [
  { key: "ticker",        label: "Ticker",       sortable: false, align: "left"  },
  { key: "company",       label: "Company",      sortable: false, align: "left"  },
  { key: "sector",        label: "Sector",       sortable: false, align: "left"  },
  { key: "pe",            label: "P/E",          sortable: true,  align: "right" },
  { key: "roe",           label: "ROE",          sortable: true,  align: "right" },
  { key: "profitMargin",  label: "Margin",       sortable: true,  align: "right" },
  { key: "revenueGrowth", label: "Growth",       sortable: true,  align: "right" },
  { key: "athenaScore",   label: "Athena Score", sortable: true,  align: "right" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function scoreColor(s: number): string {
  if (s >= 9) return "#4ade80";
  if (s >= 7) return "#d4a017";
  if (s >= 5) return "#888888";
  return "#f87171";
}
function growthColor(g: number): string {
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
  const [sortKey, setSortKey]           = useState<SortableKey>("athenaScore");
  const [sortDir, setSortDir]           = useState<SortDir>("desc");

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
    return STOCKS.filter((s) => {
      if (filters.maxPE < 100 && s.pe > filters.maxPE) return false;
      if (s.profitMargin  < filters.minMargin) return false;
      if (s.roe           < filters.minROE)    return false;
      if (s.revenueGrowth < filters.minGrowth) return false;
      if (filters.marketCap !== "All" && s.marketCap !== filters.marketCap) return false;
      if (filters.sector    !== "All" && s.sector    !== filters.sector)    return false;
      if (filters.region    !== "All" && s.region    !== filters.region)    return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === "desc" ? bv - av : av - bv;
    })
    .slice(0, 20);
  }, [filters, sortKey, sortDir]);

  const hasActiveFilters =
    filters.maxPE < 100 || filters.minMargin > 0 || filters.minROE > 0 ||
    filters.marketCap !== "All" || filters.sector !== "All" ||
    filters.region !== "All" || filters.minGrowth > 0;

  // ── Toggle pill style helper ─────────────────────────────────────────────────
  function pillStyle(active: boolean): React.CSSProperties {
    return {
      flex: 1, padding: "5px 0", borderRadius: 6, cursor: "pointer",
      border:      `1px solid ${active ? "rgba(212,160,23,0.4)" : "#1e1e1e"}`,
      background:  active ? "rgba(212,160,23,0.08)" : "transparent",
      color:       active ? "#d4a017" : "#555",
      fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" as const,
      fontWeight: 600, transition: "all 0.12s ease",
    };
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Preset Buttons ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              style={{
                padding:       "7px 18px",
                borderRadius:  8,
                border:        `1px solid ${isActive ? "#d4a017" : "rgba(212,160,23,0.2)"}`,
                background:    isActive ? "rgba(212,160,23,0.10)" : "transparent",
                color:         isActive ? "#d4a017" : "#777",
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
          <p style={{ fontSize: 10, color: "#444", letterSpacing: "0.06em", marginLeft: 4 }}>
            — {PRESETS.find((p) => p.id === activePreset)?.desc}
          </p>
        )}
      </div>
      <p style={{ fontSize: 9.5, color: "#555", letterSpacing: "0.06em", marginTop: -8 }}>
        Preset applies quality thresholds automatically.
      </p>

      {/* ── Filters Panel ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#080808", border: "1px solid #1a1a1a" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">

          {/* P/E Max */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <label style={{ fontSize: 8.5, color: "#4a4a4a", letterSpacing: "0.22em", textTransform: "uppercase" }}>
                P/E Max
              </label>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#888", fontWeight: 600 }}>
                {filters.maxPE >= 100 ? "Any" : `≤ ${filters.maxPE}`}
              </span>
            </div>
            <input
              type="range" className="screener-slider"
              min={5} max={100} step={5} value={filters.maxPE}
              onChange={(e) => updateFilter({ maxPE: Number(e.target.value) })}
            />
          </div>

          {/* Profit Margin Min */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <label style={{ fontSize: 8.5, color: "#4a4a4a", letterSpacing: "0.22em", textTransform: "uppercase" }}>
                Profit Margin Min
              </label>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#888", fontWeight: 600 }}>
                {filters.minMargin === 0 ? "Any" : `≥ ${filters.minMargin}%`}
              </span>
            </div>
            <input
              type="range" className="screener-slider"
              min={0} max={40} step={2} value={filters.minMargin}
              onChange={(e) => updateFilter({ minMargin: Number(e.target.value) })}
            />
          </div>

          {/* ROE Min */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <label style={{ fontSize: 8.5, color: "#4a4a4a", letterSpacing: "0.22em", textTransform: "uppercase" }}>
                ROE Min
              </label>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#888", fontWeight: 600 }}>
                {filters.minROE === 0 ? "Any" : `≥ ${filters.minROE}%`}
              </span>
            </div>
            <input
              type="range" className="screener-slider"
              min={0} max={60} step={5} value={filters.minROE}
              onChange={(e) => updateFilter({ minROE: Number(e.target.value) })}
            />
          </div>

          {/* Market Cap */}
          <div className="flex flex-col gap-2.5">
            <label style={{ fontSize: 8.5, color: "#4a4a4a", letterSpacing: "0.22em", textTransform: "uppercase" }}>
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
            <label style={{ fontSize: 8.5, color: "#4a4a4a", letterSpacing: "0.22em", textTransform: "uppercase" }}>
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
            <label style={{ fontSize: 8.5, color: "#4a4a4a", letterSpacing: "0.22em", textTransform: "uppercase" }}>
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
          {results.length} result{results.length !== 1 ? "s" : ""}
          {results.length === 20 ? " · max" : ""}
          <span style={{ color: "#333", marginLeft: 10 }}>Click any row to analyze</span>
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

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid #161616" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>

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
                      padding:       "13px 16px",
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
            {results.length === 0 ? (
              <tr>
                <td
                  colSpan={COLS.length}
                  style={{ padding: "52px 24px", textAlign: "center", color: "#2a2a2a", fontSize: 13, letterSpacing: "0.06em" }}
                >
                  No stocks match the current filters.
                </td>
              </tr>
            ) : (
              results.map((stock, i) => {
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
                      <span style={{
                        fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
                        color: "#c49a28", letterSpacing: "0.08em",
                      }}>
                        {stock.ticker}
                      </span>
                    </td>

                    {/* Company */}
                    <td style={{ padding: "14px 16px" }}>
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

                    {/* P/E */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontSize: 12, color: "#777", fontVariantNumeric: "tabular-nums" }}>
                        {fmt(stock.pe)}
                      </span>
                    </td>

                    {/* ROE */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{
                        fontSize: 12, fontVariantNumeric: "tabular-nums",
                        color: stock.roe >= 30 ? "#7abf9a" : "#777",
                      }}>
                        {fmt(stock.roe)}%
                      </span>
                    </td>

                    {/* Profit Margin */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{
                        fontSize: 12, fontVariantNumeric: "tabular-nums",
                        color: stock.profitMargin >= 20 ? "#7abf9a" : "#777",
                      }}>
                        {fmt(stock.profitMargin)}%
                      </span>
                    </td>

                    {/* Revenue Growth */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{
                        fontSize: 12, fontVariantNumeric: "tabular-nums",
                        color: growthColor(stock.revenueGrowth),
                      }}>
                        {stock.revenueGrowth >= 0 ? "+" : ""}{fmt(stock.revenueGrowth)}%
                      </span>
                    </td>

                    {/* Athena Score — visually dominant */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 34, height: 34, borderRadius: 8,
                        background: `${scoreColor(stock.athenaScore)}14`,
                        border:     `1px solid ${scoreColor(stock.athenaScore)}35`,
                        color:       scoreColor(stock.athenaScore),
                        fontFamily: "'Cinzel', serif",
                        fontSize:   15, fontWeight: 700,
                      }}>
                        {stock.athenaScore}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <p style={{ fontSize: 9, color: "#222", letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center", paddingBottom: 4 }}>
        Simulated data · Athena Screener · For educational purposes only
      </p>

    </div>
  );
}
