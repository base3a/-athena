import { fetchStockData } from "@/lib/alphaVantage";
import type { StockOverview, GlobalQuote } from "@/lib/alphaVantage";

// ── Types ──────────────────────────────────────────────────────────────────────
export type Verdict = "BUY" | "HOLD" | "WATCH" | "AVOID";

export interface FeaturedData {
  verdict: Verdict;
  confidence: number;
  summary: string;
  ticker: string;
  cachedAt: number;
}

// ── Config ─────────────────────────────────────────────────────────────────────
const TICKER = "NVDA";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── Module-level cache + in-flight dedup ──────────────────────────────────────
let _cache: FeaturedData | null = null;
let _inflight: Promise<FeaturedData> | null = null;

// ── Lightweight snapshot prompt ───────────────────────────────────────────────
function buildSnapshotPrompt(overview: StockOverview, quote: GlobalQuote | null): string {
  const price     = quote?.["05. price"]          ?? "N/A";
  const changePct = quote?.["10. change percent"] ?? "N/A";

  const v = (val: string | undefined) => (!val || val === "None" || val === "-" ? "N/A" : val);
  const pct = (val: string | undefined): string => {
    if (!val || val === "None") return "N/A";
    const n = parseFloat(val);
    return isNaN(n) ? "N/A" : `${(n * 100).toFixed(1)}%`;
  };

  return `You are Athena, an elite AI investment analyst. Analyze the stock below and return a quick verdict.

STOCK: ${overview.Symbol} (${overview.Name})
Sector: ${v(overview.Sector)} | Industry: ${v(overview.Industry)}
Price: $${price} (${changePct} today)
P/E: ${v(overview.PERatio)} | Forward P/E: ${v(overview.ForwardPE)} | PEG: ${v(overview.PEGRatio)}
Profit Margin: ${pct(overview.ProfitMargin)} | Operating Margin: ${pct(overview.OperatingMarginTTM)}
ROE: ${pct(overview.ReturnOnEquityTTM)} | Beta: ${v(overview.Beta)}
52W High: $${v(overview["52WeekHigh"])} | 52W Low: $${v(overview["52WeekLow"])}
50-Day MA: $${v(overview["50DayMovingAverage"])} | 200-Day MA: $${v(overview["200DayMovingAverage"])}
Analyst Target: $${v(overview.AnalystTargetPrice)} | EPS: $${v(overview.EPS)}

Respond ONLY in this exact format with no extra text before or after:
VERDICT: [write exactly one of: BUY or HOLD or WATCH or AVOID]
CONFIDENCE: [write a single integer from 1 to 10]
SUMMARY: [One sharp sentence explaining the verdict. Begin with the company name. No decimal notation.]`;
}

// ── AI providers (non-streaming) ──────────────────────────────────────────────
async function askDeepSeek(prompt: string): Promise<string | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 200,
        stream: false,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error(`[featured-analysis] DeepSeek HTTP ${res.status}`);
      return null;
    }
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[featured-analysis] DeepSeek fetch error:", err);
    return null;
  }
}

async function askAnthropic(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-20240307",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error(`[featured-analysis] Anthropic HTTP ${res.status}`);
      return null;
    }
    const data = await res.json() as { content?: { type: string; text?: string }[] };
    return data.content?.[0]?.text ?? null;
  } catch (err) {
    console.error("[featured-analysis] Anthropic fetch error:", err);
    return null;
  }
}

// ── Response parser ────────────────────────────────────────────────────────────
function parseAIResponse(text: string): Omit<FeaturedData, "ticker" | "cachedAt"> | null {
  const verdictMatch    = text.match(/VERDICT:\s*(BUY|HOLD|WATCH|AVOID)/i);
  const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
  const summaryMatch    = text.match(/SUMMARY:\s*(.+)/i);

  if (!verdictMatch || !confidenceMatch) {
    console.error("[featured-analysis] Failed to parse AI response:", text.slice(0, 300));
    return null;
  }

  const verdict    = verdictMatch[1].toUpperCase() as Verdict;
  const confidence = Math.max(1, Math.min(10, parseInt(confidenceMatch[1], 10)));
  const summary    = summaryMatch?.[1]?.trim() ?? "";

  return { verdict, confidence, summary };
}

// ── Core computation ──────────────────────────────────────────────────────────
async function computeFeaturedData(): Promise<FeaturedData> {
  const stockResult = await fetchStockData(TICKER);
  if (!stockResult.success) {
    throw new Error(`Stock data unavailable for ${TICKER}: ${stockResult.error}`);
  }
  const { overview, quote } = stockResult;

  const prompt = buildSnapshotPrompt(overview, quote);

  const rawText = (await askDeepSeek(prompt)) ?? (await askAnthropic(prompt));
  if (!rawText) {
    throw new Error("Both AI providers are unavailable");
  }

  const parsed = parseAIResponse(rawText);
  if (!parsed) {
    throw new Error("AI returned unparseable response");
  }

  const result: FeaturedData = { ...parsed, ticker: TICKER, cachedAt: Date.now() };
  console.log(`[featured-analysis] Computed: ${result.verdict} ${result.confidence}/10`);
  return result;
}

// ── Cache + dedup wrapper ─────────────────────────────────────────────────────
export async function getFeaturedData(): Promise<FeaturedData> {
  // Cache hit
  if (_cache && Date.now() - _cache.cachedAt < CACHE_TTL_MS) {
    return _cache;
  }

  // Deduplicate concurrent callers
  if (_inflight) return _inflight;

  _inflight = computeFeaturedData().then(
    (data) => { _cache = data; _inflight = null; return data; },
    (err)  => { _inflight = null; throw err; },
  );

  return _inflight;
}
