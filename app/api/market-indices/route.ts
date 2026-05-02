import { NextResponse } from "next/server";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? "";

const INDICES = [
  { symbol: "SPY", label: "S&P 500" },
  { symbol: "DIA", label: "Dow Jones" },
  { symbol: "QQQ", label: "Nasdaq" },
] as const;

async function fetchQuote(symbol: string) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`,
    { next: { revalidate: 0 } }
  );
  if (!res.ok) throw new Error(`Finnhub ${symbol}: ${res.status}`);
  return res.json() as Promise<{ c: number; d: number; dp: number; pc: number }>;
}

export async function GET() {
  if (!FINNHUB_KEY) {
    return NextResponse.json({ error: "Missing FINNHUB_API_KEY" }, { status: 500 });
  }

  try {
    const results = await Promise.all(
      INDICES.map(async ({ symbol, label }) => {
        const q = await fetchQuote(symbol);
        return {
          symbol,
          label,
          price: q.c,
          change: q.d,
          changePct: q.dp,
        };
      })
    );
    return NextResponse.json(results, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
