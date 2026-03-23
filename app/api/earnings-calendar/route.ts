/**
 * GET /api/earnings-calendar
 * Fetches upcoming earnings dates from Finnhub for major tech/growth stocks.
 * Returns array of { ticker, company, date } sorted by date ascending.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Watchlist with company names for display
const WATCHLIST: Record<string, string> = {
  NVDA: "Nvidia",
  MSFT: "Microsoft",
  AAPL: "Apple",
  AMZN: "Amazon",
  META: "Meta",
  GOOGL: "Alphabet",
  TSLA: "Tesla",
  NFLX: "Netflix",
  AMD: "AMD",
  ORCL: "Oracle",
};

interface FinnhubEarningsItem {
  symbol:    string;
  date:      string; // YYYY-MM-DD
  hour:      string; // "bmo" | "amc" | "dmh"
  year:      number;
  quarter:   number;
}

export async function GET() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return NextResponse.json({ earnings: [] });

  const today = new Date();
  const from  = today.toISOString().slice(0, 10);
  const to    = new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${token}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return NextResponse.json({ earnings: [] });

    const data = await res.json();
    const items: FinnhubEarningsItem[] = data?.earningsCalendar ?? [];

    const filtered = items
      .filter((e) => WATCHLIST[e.symbol])
      .map((e) => ({
        ticker:  e.symbol,
        company: WATCHLIST[e.symbol],
        date:    e.date,
        hour:    e.hour === "bmo" ? "Pre-market" : e.hour === "amc" ? "After hours" : "",
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);

    return NextResponse.json(
      { earnings: filtered },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } },
    );
  } catch {
    return NextResponse.json({ earnings: [] });
  }
}
