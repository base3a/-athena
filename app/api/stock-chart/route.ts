import { NextRequest } from "next/server";

const BASE = "https://www.alphavantage.co/query";

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
