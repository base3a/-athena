import { NextRequest } from "next/server";
import { getMockData } from "@/lib/mockData";

const BASE = "https://www.alphavantage.co/query";

// ── Development mock chart generator ──────────────────────────────────────────
// Produces a realistic-looking random-walk price series constrained within
// the stock's 52-week range, ending at the current price.
function generateMockChart(
  high52: number,
  low52: number,
  currentPrice: number,
  days = 365
): Array<{ date: string; close: number; high: number; low: number }> {
  const range = high52 - low52 || currentPrice * 0.3;
  // Start 30–50% into the 52W range so the walk feels natural
  const startPrice = low52 + range * (0.3 + 0.2 * ((high52 * 7 + low52 * 3) % 1 || 0.4));
  const entries: Array<{ date: string; close: number; high: number; low: number }> = [];

  let price = startPrice;
  const now = new Date();
  let seed = Math.floor(high52 * 1000 + low52 * 777); // deterministic per ticker

  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends

    const progress = 1 - i / (days - 1); // 0 at start → 1 at end
    const drift = (currentPrice - startPrice) * progress;
    const noise = (rand() - 0.48) * range * 0.022;
    price = Math.max(low52 * 0.95, Math.min(high52 * 1.05, startPrice + drift + noise));

    const dateStr = d.toISOString().slice(0, 10);
    const dailySwing = price * 0.012;
    entries.push({
      date: dateStr,
      close: parseFloat(price.toFixed(2)),
      high: parseFloat((price + dailySwing).toFixed(2)),
      low: parseFloat(Math.max(0.01, price - dailySwing).toFixed(2)),
    });
  }

  return entries;
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return new Response(JSON.stringify({ error: "missing_symbol" }), { status: 400 });
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "no_api_key" }), { status: 500 });
  }

  try {
    const res = await fetch(
      `${BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=full&apikey=${apiKey}`,
      { next: { revalidate: 1800 } } // cache 30 min
    );

    const data = await res.json();

    if (data.Note || data.Information) {
      // In development, serve synthetic chart data so the chart is always visible
      if (process.env.NODE_ENV === "development") {
        const mock = getMockData(symbol);
        if (mock) {
          const high52 = parseFloat(mock.overview["52WeekHigh"]) || 200;
          const low52  = parseFloat(mock.overview["52WeekLow"])  || 100;
          const currentPrice = parseFloat(mock.quote["05. price"]) || (high52 + low52) / 2;
          const entries = generateMockChart(high52, low52, currentPrice);
          return new Response(JSON.stringify({ data: entries }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        }
      }
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (data["Error Message"] || !data["Time Series (Daily)"]) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const timeSeries = data["Time Series (Daily)"] as Record<
      string,
      { "1. open": string; "2. high": string; "3. low": string; "4. close": string; "5. volume": string }
    >;

    const entries = Object.entries(timeSeries)
      .map(([date, values]) => ({
        date,
        close: parseFloat(values["4. close"]),
        high: parseFloat(values["2. high"]),
        low: parseFloat(values["3. low"]),
      }))
      .filter((e) => !isNaN(e.close))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-365); // last 365 trading days (~1 year)

    return new Response(JSON.stringify({ data: entries }), {
      headers: {
        "Content-Type": "application/json",
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
