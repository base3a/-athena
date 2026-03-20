/**
 * lib/marketRegime.ts — Single source of truth for:
 *   1. Market Regime score (VIX + SPY formula) — shared by homepage and Markets page
 *   2. Robust market quote fetching — purpose-built per-source:
 *        Finnhub  → ETFs (SPY, QQQ, DIA, GLD, UUP, XL*)
 *        CBOE CDN → ^VIX  (no rate limits, no API key)
 *        FRED CSV → ^TNX  (Federal Reserve, always available)
 *        CoinGecko→ BTC-USD (free tier, 24h change included)
 *        Yahoo    → everything else (fallback)
 *
 * Both pages call getRegimeData() to guarantee they always show the same score.
 * Module-level per-symbol cache (5 min TTL) prevents duplicate API calls.
 */

import type { SimpleQuote } from "@/lib/yahoo";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface RegimeData {
  score:          number;
  label:          string;   // e.g. "CONSTRUCTIVE"
  color:          string;   // primary hex color
  bg:             string;
  border:         string;
  glow:           string;
  interpretation: string;
  positioning:    string;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Per-symbol quote cache ─────────────────────────────────────────────────────
// Keyed by symbol string — allows any combination of symbols to share cache entries.

const _symCache    = new Map<string, { q: SimpleQuote | null; at: number }>();
const _symInflight = new Map<string, Promise<SimpleQuote | null>>();

// ── Regime cache ───────────────────────────────────────────────────────────────

let _regimeCache:    { data: RegimeData; at: number } | null = null;
let _regimeInflight: Promise<RegimeData> | null = null;

// ── ETF symbols Finnhub free tier can quote reliably ──────────────────────────
// Indices (^VIX, ^TNX) and crypto (BTC-USD) use dedicated free sources instead.

const FINNHUB_SYMS = new Set([
  "SPY", "QQQ", "DIA", "GLD", "UUP",
  "XLK", "XLC", "XLY", "XLF", "XLI", "XLB", "XLV", "XLP", "XLRE", "XLU", "XLE",
]);

// ── Finnhub quote ──────────────────────────────────────────────────────────────

async function fetchFinnhubQuote(symbol: string): Promise<SimpleQuote | null> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const d = (await res.json()) as { c?: number; d?: number; dp?: number; pc?: number };
    if (!d.c || d.c === 0) return null;
    return {
      price:     d.c,
      change:    d.d   ?? 0,
      changePct: d.dp  ?? 0,
      prevClose: d.pc  ?? d.c,
    };
  } catch {
    return null;
  }
}

// ── Yahoo Finance with query2 → query1 fallback, no-store avoids stale nulls ──

async function fetchYahooQuote(symbol: string): Promise<SimpleQuote | null> {
  const encoded = encodeURIComponent(symbol);
  const path    = `/v8/finance/chart/${encoded}?interval=1d&range=1d`;

  for (const host of ["query2.finance.yahoo.com", "query1.finance.yahoo.com"]) {
    try {
      const res = await fetch(`https://${host}${path}`, {
        headers: {
          // Mimic a browser to avoid bot-blocking
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "application/json, */*",
        },
        // no-store: skip Next.js fetch cache so a previously-null result
        // doesn't poison subsequent requests for 5 minutes
        cache: "no-store",
      });
      if (!res.ok) continue;

      type YahooChart = { chart?: { result?: { meta?: Record<string, unknown> }[] } };
      const data = (await res.json()) as YahooChart;
      const meta = data?.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice as number | undefined;
      if (!price || price === 0) continue;

      const prevClose =
        ((meta?.previousClose ?? meta?.chartPreviousClose) as number | undefined) ?? price;
      const change    = price - prevClose;
      const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
      return { price, change, changePct, prevClose };
    } catch {
      continue;
    }
  }
  return null;
}

// ── CBOE CDN — VIX historical close (no API key, no rate limits) ──────────────
// CBOE publishes daily VIX closes; we take the last two rows to get price + prevClose.

async function fetchCboeVix(): Promise<SimpleQuote | null> {
  try {
    const res = await fetch(
      "https://cdn.cboe.com/api/global/delayed_quotes/charts/historical/_VIX.json",
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    type CboeRow = { date: string; close: string };
    const data = (await res.json()) as { data?: CboeRow[] };
    const arr = data?.data;
    if (!arr || arr.length < 2) return null;
    const last     = arr[arr.length - 1];
    const prev     = arr[arr.length - 2];
    const price    = parseFloat(last.close);
    const prevClose= parseFloat(prev.close);
    if (!price || price === 0) return null;
    const change    = price - prevClose;
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    return { price, change, changePct, prevClose };
  } catch {
    return null;
  }
}

// ── FRED CSV — US 10Y Treasury yield (^TNX proxy, Federal Reserve) ─────────────
// Returns the yield as a price (e.g. 4.27 = 4.27%). Filters out "." missing-data rows.

async function fetchFredTnx(): Promise<SimpleQuote | null> {
  try {
    const res = await fetch(
      "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10",
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const text = await res.text();
    // Each line: "2026-03-12,4.27" — filter header + missing-data "." rows
    const valid = text
      .trim()
      .split("\n")
      .filter((l) => !l.startsWith("DATE") && !l.endsWith(",.") && l.includes(","));
    if (valid.length < 2) return null;
    const [, lastVal]  = valid[valid.length - 1].split(",");
    const [, prevVal]  = valid[valid.length - 2].split(",");
    const price    = parseFloat(lastVal);
    const prevClose= parseFloat(prevVal);
    if (isNaN(price) || price === 0) return null;
    const change    = price - prevClose;
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    return { price, change, changePct, prevClose };
  } catch {
    return null;
  }
}

// ── CoinGecko — Bitcoin spot price + 24h change (free tier, no API key) ────────

async function fetchCoinGeckoBtc(): Promise<SimpleQuote | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" },
    );
    if (!res.ok) return null;
    type CgResp = { bitcoin?: { usd?: number; usd_24h_change?: number } };
    const data      = (await res.json()) as CgResp;
    const price     = data?.bitcoin?.usd;
    const changePct = data?.bitcoin?.usd_24h_change ?? 0;
    if (!price || price === 0) return null;
    const change    = price * (changePct / 100);
    const prevClose = price - change;
    return { price, change, changePct, prevClose };
  } catch {
    return null;
  }
}

// ── Route to best source per symbol ───────────────────────────────────────────

async function fetchLive(symbol: string): Promise<SimpleQuote | null> {
  // ETF symbols → Finnhub (reliable, no rate limits on free tier)
  if (FINNHUB_SYMS.has(symbol)) {
    const q = await fetchFinnhubQuote(symbol);
    if (q) return q;
    // Fall through to Yahoo if Finnhub fails or key is missing
  }
  // Dedicated free sources for Yahoo-rate-limited symbols
  if (symbol === "^VIX")   return fetchCboeVix();
  if (symbol === "^TNX")   return fetchFredTnx();
  if (symbol === "BTC-USD") return fetchCoinGeckoBtc();
  // Everything else → Yahoo Finance (indices, misc)
  return fetchYahooQuote(symbol);
}

// ── Cached single-symbol fetch (deduplicates concurrent callers) ───────────────

async function getCachedQuote(symbol: string): Promise<SimpleQuote | null> {
  const cached = _symCache.get(symbol);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.q;

  const inflight = _symInflight.get(symbol);
  if (inflight) return inflight;

  const promise = fetchLive(symbol).then(
    (q)  => { _symCache.set(symbol, { q, at: Date.now() }); _symInflight.delete(symbol); return q; },
    (_err) => { _symInflight.delete(symbol); return null; },
  );
  _symInflight.set(symbol, promise);
  return promise;
}

// ── Public: fetch multiple market symbols in parallel ─────────────────────────

export async function fetchRobustQuotes(
  symbols: string[],
): Promise<Record<string, SimpleQuote | null>> {
  const entries = await Promise.all(
    symbols.map(async (sym) => [sym, await getCachedQuote(sym)] as const),
  );
  return Object.fromEntries(entries);
}

// ── Score computation — pure function, shared formula ─────────────────────────

export function computeRegimeScore(vixPrice: number, spyChangePct: number): number {
  // VIX component: 0–55 pts (lower VIX = higher score)
  let vixPts: number;
  if      (vixPrice < 12) vixPts = 55;
  else if (vixPrice < 15) vixPts = 46;
  else if (vixPrice < 18) vixPts = 36;
  else if (vixPrice < 22) vixPts = 24;
  else if (vixPrice < 27) vixPts = 12;
  else if (vixPrice < 35) vixPts = 4;
  else                    vixPts = 0;

  // SPY daily-change component: 0–45 pts
  let spyPts: number;
  if      (spyChangePct >  2.0) spyPts = 45;
  else if (spyChangePct >  1.0) spyPts = 36;
  else if (spyChangePct >  0.3) spyPts = 26;
  else if (spyChangePct > -0.3) spyPts = 18;
  else if (spyChangePct > -1.0) spyPts = 10;
  else if (spyChangePct > -2.0) spyPts = 4;
  else                          spyPts = 0;

  return Math.min(100, Math.max(0, vixPts + spyPts));
}

// ── Score → full regime object ─────────────────────────────────────────────────

export function scoreToRegime(score: number): RegimeData {
  if (score >= 80) return {
    score, label: "RISK-ON", color: "#4ade80",
    bg: "rgba(74,222,128,0.05)", border: "rgba(74,222,128,0.18)", glow: "rgba(74,222,128,0.10)",
    interpretation: "Strong risk appetite — equities favored, volatility suppressed.",
    positioning:    "Positioning bias: Aggressive risk exposure.",
  };
  if (score >= 60) return {
    score, label: "CONSTRUCTIVE", color: "#d4a017",
    bg: "rgba(212,160,23,0.05)", border: "rgba(212,160,23,0.18)", glow: "rgba(212,160,23,0.10)",
    interpretation: "Risk appetite healthy — equities lead as volatility stays suppressed.",
    positioning:    "Positioning bias: Moderate risk exposure.",
  };
  if (score >= 40) return {
    score, label: "NEUTRAL", color: "#60a5fa",
    bg: "rgba(96,165,250,0.05)", border: "rgba(96,165,250,0.18)", glow: "rgba(96,165,250,0.10)",
    interpretation: "Mixed signals — balanced allocation appropriate.",
    positioning:    "Positioning bias: Balanced exposure.",
  };
  if (score >= 20) return {
    score, label: "DEFENSIVE", color: "#fb923c",
    bg: "rgba(251,146,60,0.05)", border: "rgba(251,146,60,0.18)", glow: "rgba(251,146,60,0.10)",
    interpretation: "Risk appetite fading — defensive positioning warranted.",
    positioning:    "Positioning bias: Reduce risk, favor defensives.",
  };
  return {
    score, label: "RISK-OFF", color: "#f87171",
    bg: "rgba(248,113,113,0.05)", border: "rgba(248,113,113,0.18)", glow: "rgba(248,113,113,0.10)",
    interpretation: "Risk-off environment — capital preservation is priority.",
    positioning:    "Positioning bias: Defensive, minimize equity exposure.",
  };
}

// ── Compute live regime (fetches only VIX + SPY) ──────────────────────────────

async function computeRegime(): Promise<RegimeData> {
  const [vixQ, spyQ] = await Promise.all([
    getCachedQuote("^VIX"),
    getCachedQuote("SPY"),
  ]);
  const vixPrice     = vixQ?.price     ?? 20; // neutral default if data unavailable
  const spyChangePct = spyQ?.changePct ?? 0;  // flat default if data unavailable
  const score = computeRegimeScore(vixPrice, spyChangePct);
  console.log(
    `[market-regime] VIX=${vixPrice.toFixed(1)} SPY_Δ=${spyChangePct.toFixed(2)}% → score=${score} (${scoreToRegime(score).label})`,
  );
  return scoreToRegime(score);
}

// ── Public: get regime — single source of truth, cached 5 min ─────────────────
// Both the homepage MarketBrief and the Markets page call this.

export async function getRegimeData(): Promise<RegimeData> {
  if (_regimeCache && Date.now() - _regimeCache.at < CACHE_TTL_MS) {
    return _regimeCache.data;
  }
  if (_regimeInflight) return _regimeInflight;

  _regimeInflight = computeRegime().then(
    (data) => { _regimeCache = { data, at: Date.now() }; _regimeInflight = null; return data; },
    (err)  => { _regimeInflight = null; throw err; },
  );
  return _regimeInflight;
}
