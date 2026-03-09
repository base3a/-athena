import { NextRequest, NextResponse } from "next/server";
import { fetchStockData, type StockOverview } from "@/lib/alphaVantage";
import Anthropic from "@anthropic-ai/sdk";

// ── Mini verdict + confidence + summary via Claude ─────────────────────────────
async function getMiniVerdict(
  symbol: string,
  overview: StockOverview
): Promise<{ verdict: string | null; confidence: number | null; summary: string | null }> {
  // Guard: if key is missing return empty rather than crashing the route
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { verdict: null, confidence: null, summary: null };

  const client = new Anthropic({ apiKey });

  try {
    const prompt = `You are Athena, a precise AI investment analyst.
Given these fundamentals for ${symbol} (${overview.Name}, ${overview.Exchange}):
- Sector: ${overview.Sector}
- P/E: ${overview.PERatio} | Forward P/E: ${overview.ForwardPE} | PEG: ${overview.PEGRatio}
- EPS (TTM): ${overview.EPS} | Profit Margin: ${overview.ProfitMargin}
- Revenue TTM: ${overview.RevenueTTM} | Market Cap: ${overview.MarketCapitalization}
- ROE: ${overview.ReturnOnEquityTTM} | Beta: ${overview.Beta}
- Analyst Target: ${overview.AnalystTargetPrice}
- 52W Range: ${overview["52WeekLow"]}–${overview["52WeekHigh"]}

Reply with ONLY this exact format (three lines, nothing else):
VERDICT: BUY
CONFIDENCE: 8
SUMMARY: One direct sentence under 14 words capturing the single key risk or opportunity.`;

    const msg = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 80,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";

    const verdictMatch    = text.match(/VERDICT:\s*(BUY|HOLD|WATCH|AVOID)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
    const summaryMatch    = text.match(/SUMMARY:\s*(.+)/i);

    const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : null;
    const rawConf = confidenceMatch ? parseInt(confidenceMatch[1], 10) : null;
    const confidence =
      rawConf !== null && rawConf >= 1 && rawConf <= 10 ? rawConf : null;
    const summary = summaryMatch ? summaryMatch[1].trim() : null;

    return { verdict, confidence, summary };
  } catch {
    return { verdict: null, confidence: null, summary: null };
  }
}

// ── GET /api/portfolio-stock?symbol=AAPL[&verdict=true] ───────────────────────
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbol") ?? "";
  const symbol = raw.toUpperCase().trim();
  const includeVerdict = req.nextUrl.searchParams.get("verdict") === "true";

  if (!symbol || symbol.length > 10) {
    return NextResponse.json({ error: "invalid_ticker" }, { status: 400 });
  }

  // fetchStockData uses Next.js 30-min fetch cache — safe to call often
  const result = await fetchStockData(symbol);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { overview, quote } = result;

  const rawPrice     = quote?.["05. price"] ?? null;
  const rawChange    = quote?.["09. change"] ?? null;
  const rawChangePct = quote?.["10. change percent"]?.replace("%", "") ?? null;
  const isPositive   = rawChange ? parseFloat(rawChange) >= 0 : null;

  const price = rawPrice ? parseFloat(rawPrice).toFixed(2) : null;
  const change = rawChange
    ? (parseFloat(rawChange) >= 0 ? "+" : "") + parseFloat(rawChange).toFixed(2)
    : null;
  const changePct = rawChangePct
    ? (parseFloat(rawChangePct) >= 0 ? "+" : "") +
      parseFloat(rawChangePct).toFixed(2)
    : null;

  // Verdict + confidence + summary are only fetched on stock add
  let verdict: string | null    = null;
  let confidence: number | null = null;
  let summary: string | null    = null;
  if (includeVerdict) {
    ({ verdict, confidence, summary } = await getMiniVerdict(symbol, overview));
  }

  return NextResponse.json({
    symbol:    overview.Symbol,
    name:      overview.Name,
    exchange:  overview.Exchange !== "None" ? overview.Exchange : null,
    sector:    overview.Sector   !== "None" ? overview.Sector   : null,
    price,
    change,
    changePct,
    isPositive,
    verdict,
    confidence,
    summary,
  });
}
