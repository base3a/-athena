/**
 * GET /api/valuation-history?symbol=AAPL
 * Fetches historical P/E, P/S, EV/EBITDA averages from Finnhub basic financials.
 * Returns current + 3Y avg + 5Y avg for each metric.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase()?.trim();
  if (!symbol) return NextResponse.json({});

  const token = process.env.FINNHUB_API_KEY;
  if (!token) return NextResponse.json({});

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${token}`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return NextResponse.json({});

    const data = await res.json();
    const m = data?.metric ?? {};

    const n = (v: unknown): number | null =>
      v != null && typeof v === "number" && !isNaN(v) ? v : null;

    return NextResponse.json(
      {
        peCurrent:       n(m.peTTM)          ?? n(m.peAnnual),
        pe3Y:            n(m.pe3YAverage),
        pe5Y:            n(m.pe5YAverage),
        psCurrent:       n(m.psTTM)          ?? n(m.psAnnual),
        ps3Y:            n(m.ps3YAverage),
        ps5Y:            n(m.ps5YAverage),
        evEbitdaCurrent: n(m["ev/ebitdaTTM"])          ?? n(m["ev/ebitdaAnnual"]),
        evEbitda3Y:      n(m["ev/ebitda3YAverage"]),
        evEbitda5Y:      n(m["ev/ebitda5YAverage"]),
      },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
    );
  } catch {
    return NextResponse.json({});
  }
}
