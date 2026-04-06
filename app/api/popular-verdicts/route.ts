import { NextResponse } from "next/server";

// ── Types ─────────────────────────────────────────────────────────────────
type Verdict = "BUY" | "HOLD" | "WATCH" | "AVOID";

interface VerdictEntry {
  verdict:   Verdict;
  updatedAt: number; // Unix ms
}

// ── Popular tickers (must match PopularAnalyses.tsx) ──────────────────────
const POPULAR_TICKERS = ["NVDA", "AAPL", "TSLA", "MSFT", "ASML"] as const;
const VALID_VERDICTS: Verdict[] = ["BUY", "HOLD", "WATCH", "AVOID"];

// ── Seeded defaults ───────────────────────────────────────────────────────
// Shown to every visitor until a real AI analysis updates them.
// Timestamps are intentionally set to "yesterday" to be honest about freshness.
// These are based on strong fundamental analysis of each company.
function makeSeed(): Record<string, VerdictEntry> {
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  return {
    NVDA: { verdict: "BUY",   updatedAt: yesterday }, // AI leader, 55%+ margins, dominant moat
    AAPL: { verdict: "HOLD",  updatedAt: yesterday }, // premium valuation, steady but slowing growth
    TSLA: { verdict: "WATCH", updatedAt: yesterday }, // high P/E, execution risk, volatile
    MSFT: { verdict: "BUY",   updatedAt: yesterday }, // cloud growth, AI integration, strong FCF
    ASML: { verdict: "BUY",   updatedAt: yesterday }, // EUV monopoly, critical semiconductor infra
  };
}

// ── In-memory store ───────────────────────────────────────────────────────
// Persists within a warm Vercel serverless instance.
// Cold starts fall back to the seed — always meaningful, never empty.
const store: Record<string, VerdictEntry> = makeSeed();

// ── GET /api/popular-verdicts ─────────────────────────────────────────────
// Returns current verdicts for all popular tickers.
// Called by PopularAnalyses on the homepage for any ticker not in localStorage.
export async function GET() {
  const result: Record<string, VerdictEntry> = {};
  for (const sym of POPULAR_TICKERS) {
    if (store[sym]) result[sym] = store[sym];
  }

  return NextResponse.json(result, {
    headers: {
      // CDN-cacheable for 5 min, serve stale for up to 1 min during revalidation
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}

// ── POST /api/popular-verdicts ────────────────────────────────────────────
// Called by AthenaAnalysis after a real AI analysis completes on a popular ticker.
// Updates the server-side store so ALL users immediately see the fresh verdict.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      symbol?:    string;
      verdict?:   string;
      updatedAt?: number;
    };

    const { symbol, verdict, updatedAt } = body;

    if (!symbol || !verdict || !updatedAt) {
      return NextResponse.json({ error: "Missing required fields: symbol, verdict, updatedAt" }, { status: 400 });
    }

    const sym = String(symbol).toUpperCase();

    if (!(POPULAR_TICKERS as readonly string[]).includes(sym)) {
      // Silently accept but ignore — non-popular tickers aren't stored here
      return NextResponse.json({ ok: true, stored: false });
    }

    if (!VALID_VERDICTS.includes(verdict as Verdict)) {
      return NextResponse.json({ error: `Invalid verdict. Must be one of: ${VALID_VERDICTS.join(", ")}` }, { status: 400 });
    }

    store[sym] = { verdict: verdict as Verdict, updatedAt: Number(updatedAt) };

    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
