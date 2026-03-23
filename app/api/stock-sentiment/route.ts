/**
 * GET /api/stock-sentiment?symbol=NVDA
 *
 * Fetches analyst recommendation trends from Finnhub.
 * Returns buy/hold/sell counts from the most recent period.
 * Cache: 1-hour Cache-Control (ratings update monthly).
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface SentimentData {
  analystBuy:   number | null;
  analystHold:  number | null;
  analystSell:  number | null;
  analystTotal: number | null;
}

const EMPTY: SentimentData = {
  analystBuy: null, analystHold: null, analystSell: null, analystTotal: null,
};

interface FinnhubRecommendation {
  buy:       number;
  hold:      number;
  period:    string;
  sell:      number;
  strongBuy: number;
  strongSell:number;
  symbol:    string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase()?.trim();

  if (!symbol) return NextResponse.json(EMPTY);

  const token = process.env.FINNHUB_API_KEY;
  if (!token) return NextResponse.json(EMPTY);

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${token}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) return NextResponse.json(EMPTY);

    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return NextResponse.json(EMPTY);

    const latest = data[0] as FinnhubRecommendation;
    const buy   = (latest.buy   ?? 0) + (latest.strongBuy   ?? 0);
    const hold  =  latest.hold  ?? 0;
    const sell  = (latest.sell  ?? 0) + (latest.strongSell  ?? 0);
    const total = buy + hold + sell;

    return NextResponse.json(
      { analystBuy: buy, analystHold: hold, analystSell: sell, analystTotal: total > 0 ? total : null },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } },
    );
  } catch {
    return NextResponse.json(EMPTY);
  }
}
