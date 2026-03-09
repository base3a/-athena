import { NextRequest, NextResponse } from "next/server";
import { fetchStockData, type StockOverview } from "@/lib/alphaVantage";
import Anthropic from "@anthropic-ai/sdk";

// ── Deterministic score fallback (mirrors AthenaAnalysis generateFallbackAnalysis) ──
function computeScore(overview: StockOverview): number {
  const pm   = parseFloat(overview.ProfitMargin      || "0") * 100;
  const roe  = parseFloat(overview.ReturnOnEquityTTM || "0") * 100;
  const roa  = parseFloat(overview.ReturnOnAssetsTTM || "0") * 100;
  const pe   = parseFloat(overview.PERatio           || "0");
  const beta = parseFloat(overview.Beta              || "1");
  const analyst = parseFloat(overview.AnalystTargetPrice || "0");

  let bq = 5;
  if (pm > 30) bq += 2; else if (pm > 15) bq += 1;
  if (roe > 25) bq += 2; else if (roe > 12) bq += 1;
  bq = Math.max(1, Math.min(10, bq));

  let vs = 5;
  if (pe > 0) {
    if (pe < 15) vs += 2; else if (pe < 22) vs += 1;
    if (pe > 40) vs -= 2; else if (pe > 28) vs -= 1;
  }
  if (analyst > 0) vs += 1;
  vs = Math.max(1, Math.min(10, vs));

  let fs = 5;
  if (pm > 20) fs += 1;
  if (roe > 15) fs += 1;
  if (roa > 8)  fs += 1;
  if (beta < 0.9) fs += 1;
  if (beta > 2)   fs -= 2;
  fs = Math.max(1, Math.min(10, fs));

  const rs = Math.max(1, Math.min(10, Math.round(11 - (bq + fs) / 2) + (beta > 1.5 ? 1 : 0)));

  const composite = (bq * 0.35) + (vs * 0.30) + (fs * 0.25) + ((10 - rs) * 0.10);
  return Math.max(1, Math.min(10, Math.round(composite)));
}

function buildFallbackInsight(score: number, overview: StockOverview): string {
  const sector = overview.Sector || "";
  const pm   = parseFloat(overview.ProfitMargin      || "0") * 100;
  const roe  = parseFloat(overview.ReturnOnEquityTTM || "0") * 100;
  const beta = parseFloat(overview.Beta              || "1");

  if (score >= 9) return "Strong earnings power and margin profile support continued outperformance.";
  if (score >= 8) return "Solid fundamentals with momentum favoring quality business ownership.";
  if (score >= 7) {
    if (sector.toLowerCase().includes("tech")) return "Growth trajectory intact as digital demand supports premium valuation.";
    return "Business quality remains resilient with stable return on equity.";
  }
  if (score >= 6) {
    if (pm > 15) return "Profitability holds but valuation demands continued execution.";
    return "Fundamentals adequate; watch margin trends for directional signal.";
  }
  if (score >= 5) return "Mixed signals across quality and valuation metrics; monitor closely.";
  if (score >= 4) {
    if (beta > 1.5) return "Elevated volatility compounds fundamental concerns at current levels.";
    return "Margin or valuation pressure building; await clearer catalyst.";
  }
  if (score >= 3) return "Multiple risk factors warrant caution; deteriorating fundamentals.";
  if (roe < 0) return "Negative equity returns signal structural challenges requiring resolution.";
  return "Risk profile elevated across key dimensions; position sizing critical.";
}

// ── Claude intelligence call with deterministic fallback ──────────────────────
async function getStockIntelligence(
  symbol: string,
): Promise<{ symbol: string; score: number | null; insight: string | null }> {
  const result = await fetchStockData(symbol);
  if (!result.success) return { symbol, score: null, insight: null };

  const { overview } = result;

  // Try Claude first — fall through to deterministic if key is missing or call fails
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
    const client = new Anthropic({ apiKey });

    const prompt = `You are Athena, an AI investment analyst.
Given these fundamentals for ${symbol} (${overview.Name}, ${overview.Sector}):
- P/E: ${overview.PERatio} | Forward P/E: ${overview.ForwardPE} | PEG: ${overview.PEGRatio}
- Profit Margin: ${(parseFloat(overview.ProfitMargin || "0") * 100).toFixed(1)}%
- ROE: ${(parseFloat(overview.ReturnOnEquityTTM || "0") * 100).toFixed(1)}%
- Beta: ${overview.Beta} | Analyst Target: ${overview.AnalystTargetPrice}
- EPS: ${overview.EPS}

Reply with ONLY this exact format (two lines, no extra text):
SCORE: 8
INSIGHT: One direct sentence under 15 words on the single most important current dynamic.`;

    const msg = await client.messages.create({
      model:      "claude-sonnet-4-5-20250929",
      max_tokens: 60,
      messages:   [{ role: "user", content: prompt }],
    });

    const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";

    const scoreMatch   = text.match(/SCORE:\s*(\d+)/i);
    const insightMatch = text.match(/INSIGHT:\s*(.+)/i);

    const rawScore = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
    const score    = rawScore !== null && rawScore >= 1 && rawScore <= 10 ? rawScore : null;
    const insight  = insightMatch ? insightMatch[1].trim() : null;

    // If Claude returned valid data, use it; else fall through to deterministic
    if (score !== null && insight) {
      return { symbol, score, insight };
    }
  } catch {
    // Fall through to deterministic
  }

  // Deterministic fallback — always returns meaningful data
  const score   = computeScore(overview);
  const insight = buildFallbackInsight(score, overview);
  return { symbol, score, insight };
}

// ── GET /api/watchlist-intelligence?symbols=NVDA,MSFT,TSLA ───────────────────
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";

  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0 && s.length <= 10)
    .slice(0, 5); // hard cap — never more than 5

  if (symbols.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Run all in parallel — server-side concurrency, single HTTP round-trip
  const items = await Promise.all(symbols.map(getStockIntelligence));

  return NextResponse.json({ items });
}
