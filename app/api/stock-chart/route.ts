import { NextRequest } from "next/server";
import { InMemoryCache } from "@/lib/cache";
import { fetchFinnhubChart } from "@/lib/finnhub";
import { fetchStooqChart, fetchYahooChart, type ChartEntry } from "@/lib/yahoo";

// Module-level cache — keyed by uppercase ticker, TTL = 30 min
const chartCache = new InMemoryCache<ChartEntry[]>();

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return new Response(JSON.stringify({ error: "missing_symbol" }), { status: 400 });
  }

  const key = symbol.toUpperCase();

  // 1. In-memory cache hit → return immediately, no network call
  const hit = chartCache.get(key);
  if (hit) {
    return new Response(JSON.stringify({ data: hit }), {
      headers: {
        "Content-Type":  "application/json",
        "Cache-Control": "public, max-age=1800",
      },
    });
  }

  try {
    // 2. Stooq (primary) — free, no key, reliable daily OHLC, no rate limits
    let entries = await fetchStooqChart(key);

    // 3. Finnhub /stock/candle (secondary) — requires premium subscription
    if (!entries) entries = await fetchFinnhubChart(key);

    // 4. Yahoo Finance chart (last resort) — may be rate-limited from server
    if (!entries) entries = await fetchYahooChart(key);

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    chartCache.set(key, entries);

    return new Response(JSON.stringify({ data: entries }), {
      headers: {
        "Content-Type":  "application/json",
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "network_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
