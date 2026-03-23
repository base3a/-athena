import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import type { StockOverview, GlobalQuote } from "@/lib/alphaVantage";
import { computeScore, formatScoreForPrompt } from "@/lib/scoring";

// ── Language instructions ──────────────────────────────────────────────────────
// All machine-parsed markers (VERDICT:, TAKEAWAY_1:, etc.) must remain in
// English so the client parser never breaks. Only human-readable text is
// written in the chosen language.
const LANG_INSTRUCTIONS: Record<string, string> = {
  en: "", // default — no extra instruction needed
  sv: `LANGUAGE REQUIREMENT: Write ALL human-readable text — every explanation, sentence, justification, and description — in professional Swedish (Svenska). Use a restrained, institutional tone: kortfattade meningar, ingen hype, saklig och precis analys. Same analytical depth as English.
CRITICAL PARSER RULE: Keep every structured marker EXACTLY in English as specified below. This includes all ### section headers, and all uppercase labels such as VERDICT:, TAKEAWAY_1:, TAKEAWAY_2:, TAKEAWAY_3:, WHO_FOR:, WHO_AVOID:, TIMEFRAME:, CONFIDENCE:, BUSINESS_QUALITY_SCORE:, VALUATION_SCORE:, FINANCIAL_STRENGTH_SCORE:, RISK_SCORE:, Competitors:, Risk 1:, Risk 2:, Risk 3:. Do NOT translate these markers — they are parsed by a machine. Only the text content that follows each marker should be in Swedish.

`,
};

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(overview: StockOverview, quote: GlobalQuote | null, lang = "en"): string {
  const langBlock = LANG_INSTRUCTIONS[lang] ?? LANG_INSTRUCTIONS.en;
  const price = quote?.["05. price"] ?? "N/A";
  const changePct = quote?.["10. change percent"] ?? "N/A";
  const prevClose = quote?.["08. previous close"] ?? "N/A";

  const v = (val: string | undefined) =>
    !val || val === "None" || val === "-" ? "N/A" : val;

  const pct = (val: string | undefined): string => {
    if (!val || val === "None") return "N/A";
    const n = parseFloat(val);
    if (isNaN(n)) return "N/A";
    return `${(n * 100).toFixed(2)}%`;
  };

  const large = (val: string | undefined): string => {
    if (!val || val === "None") return "N/A";
    const n = parseFloat(val);
    if (isNaN(n)) return "N/A";
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toFixed(2)}`;
  };

  const audienceClause =
    lang === "sv"
      ? "Skriv på ett tydligt och lättförståeligt sätt — förklara alla finansiella termer du använder. Var direkt, specifik och datadriven."
      : "Write in plain English that a beginner can understand — explain any financial terms you use. Be direct, specific, and data-driven.";

  // ── Deterministic Athena Score (formula-locked) ───────────────────────────
  // This score and verdict are computed from first-principles metrics.
  // The AI MUST use them exactly — no deviation allowed.
  const peRaw  = parseFloat(overview.PERatio ?? "0") || 0;
  const roeRaw = parseFloat(overview.ReturnOnEquityTTM ?? "0");
  const roe    = Math.abs(roeRaw) > 1 ? roeRaw : roeRaw * 100; // decimal → percent
  const margin = (() => {
    const m = parseFloat(overview.ProfitMargin ?? "0");
    return Math.abs(m) > 1 ? m : m * 100;
  })();
  const betaRaw = parseFloat(overview.Beta ?? "1") || 1.0;
  // Revenue growth is not in the overview endpoint; use 0 (neutral) as default.
  const formulaResult = computeScore({ pe: peRaw, roe, profitMargin: margin, revenueGrowth: 0, beta: betaRaw });
  const formulaScore  = formatScoreForPrompt({ pe: peRaw, roe, profitMargin: margin, revenueGrowth: 0, beta: betaRaw });

  return `${langBlock}You are Athena, an elite AI investment analyst. Apply rigorous investment thinking to analyze the following stock. ${audienceClause}

STOCK DATA FOR ${overview.Symbol} (${overview.Name}):
Exchange: ${overview.Exchange} | Sector: ${v(overview.Sector)} | Industry: ${v(overview.Industry)}
Country: ${v(overview.Country)} | Currency: ${overview.Currency}

PRICE DATA:
Current Price: $${price}
Change Today: ${changePct}
Previous Close: $${prevClose}
52-Week High: $${v(overview["52WeekHigh"])}
52-Week Low: $${v(overview["52WeekLow"])}
50-Day MA: $${v(overview["50DayMovingAverage"])}
200-Day MA: $${v(overview["200DayMovingAverage"])}

FINANCIAL DATA:
Market Cap: ${large(overview.MarketCapitalization)}
Revenue TTM: ${large(overview.RevenueTTM)}
Gross Profit TTM: ${large(overview.GrossProfitTTM)}
EPS (TTM): $${v(overview.EPS)}
Diluted EPS: $${v(overview.DilutedEPSTTM)}
Profit Margin: ${pct(overview.ProfitMargin)}
Operating Margin: ${pct(overview.OperatingMarginTTM)}
Return on Equity: ${pct(overview.ReturnOnEquityTTM)}
Return on Assets: ${pct(overview.ReturnOnAssetsTTM)}
P/E Ratio: ${v(overview.PERatio)}
Forward P/E: ${v(overview.ForwardPE)}
PEG Ratio: ${v(overview.PEGRatio)}
Beta: ${v(overview.Beta)}
Analyst Target Price: $${v(overview.AnalystTargetPrice)}
Dividend Yield: ${pct(overview.DividendYield)}
Dividend Per Share: $${v(overview.DividendPerShare)}
Shares Outstanding: ${v(overview.SharesOutstanding)}

COMPANY DESCRIPTION:
${(overview.Description ?? "").substring(0, 600)}

ATHENA SCORE (formula-computed — deterministic, not AI judgment):
${formulaScore}
CRITICAL RULES — these override everything else:
1. VERDICT must be EXACTLY: ${formulaResult.verdict}  (do not deviate)
2. CONFIDENCE must be an integer from 3 to 10 reflecting how CERTAIN you are of the verdict — NOT how good the stock is:
   • 8–10: Very clear signal with strong data support — limited room for debate
   • 5–7: Mixed signals but verdict is clear enough to stand
   • 3–4: Speculative, uncertain, or conflicting data — verdict is a best guess
   Never go below 3. Even the most uncertain verdict carries at least 3/10 confidence.
   Example: a stock with an AVOID verdict due to extreme valuation but meaningful bull-case optionality should score 6–7, not 2.
These values come from Athena's shared scoring formula so they are consistent across all pages of the platform.

Answer the following 15 investment framework questions. Keep each answer to 2-4 sentences. Reference specific numbers wherever relevant.

IMPORTANT: Output Section 12 (Final Verdict) FIRST, then Section 11 (Confidence Score), then Sections 1–10 in order, then Sections 13, 14, 15. This allows the verdict to appear immediately. Do not change the section numbers — only the output order.

RESPOND EXACTLY IN THIS FORMAT — do not add extra text before or after:

### 12. Final Verdict
VERDICT: [Write exactly one of: BUY or HOLD or WATCH or AVOID]
SUMMARY: [One sharp, complete sentence explaining the verdict. Begin with the company name. Write whole numbers only — never use decimal notation like "33.2x" or "$3.5B". For example: "Apple is a cash-generating machine trading at a fair price for long-term investors."]
TAKEAWAY_1: [The single most important reason for this verdict — max 8 plain-English words, no jargon]
TAKEAWAY_2: [Key valuation or growth insight — max 8 plain-English words, no jargon]
TAKEAWAY_3: [Most critical risk or opportunity to watch — max 8 plain-English words, no jargon]
WHO_FOR: [One plain sentence. Who is this stock right for? No jargon. E.g. "Patient investors who want slow, reliable growth over many years."]
WHO_AVOID: [One plain sentence. Who should stay away? No jargon. E.g. "Anyone who needs stable income or can't handle sharp price drops."]
TIMEFRAME: [One plain sentence. Is this better for long-term buy-and-hold investors or short-term traders? Why?]
[1-2 additional sentences of supporting reasoning. Be specific and data-driven.]

### 11. Confidence Score
CONFIDENCE: [write a single integer from 3 to 10, reflecting certainty of verdict — not stock quality]
[One sentence explaining what drives this confidence level — what makes this analysis more or less certain?]

### 1. Business Quality
[Is this a real, high-quality business? Describe what it does, whether it actually earns meaningful revenue, and whether profits are real. Use the revenue and margin numbers.]
BUSINESS_QUALITY_SCORE: [integer 1-10, where 10 = exceptional business quality]

### 2. Cash Safety
[Is the company in a safe financial position? Look at profitability, return on equity, operating margins, and any debt signals. Would this company survive a rough year?]

### 3. Valuation
[Is the stock cheap or expensive right now? Reference P/E, Forward P/E, PEG ratio, and price vs. analyst target price. Is it priced for perfection or for pessimism?]
VALUATION_SCORE: [integer 1-10, where 10 = extremely undervalued / very cheap, 1 = extremely overvalued]

### 4. Growth Trajectory
[Is the company growing or shrinking? Use margins, EPS, and revenue to assess whether momentum is accelerating, stable, or decelerating.]

### 5. Competitive Position
[Who are the 3 main competitors? How does this company compare — does it have a real competitive advantage (a "moat"), or is it easily replaceable?]
Competitors: [Name exactly 3 real, well-known competitors separated by commas]

### 6. Fundamental Health
[Assess the three core pillars: operating margins (what percentage of revenue becomes profit?), debt-to-equity (how much the company owes vs. owns), and return on equity (how efficiently it uses investor money). Is this a fortress or fragile?]
FINANCIAL_STRENGTH_SCORE: [integer 1-10, where 10 = financially bulletproof fortress]

### 7. Future Outlook
[What does the next 2-3 years look like? Based on current trends in the data, is the trajectory improving, stable, or deteriorating? Be concrete.]

### 8. Risk Assessment
[What are the 3 most specific risks that could seriously destroy investor value? Be precise — no generic statements like "market risk".]
Risk 1: [specific named risk]
Risk 2: [specific named risk]
Risk 3: [specific named risk]
RISK_SCORE: [integer 1-10, where 10 = very low risk / safe, 1 = extremely high risk]

### 9. Type 1 or Type 2?
[A Type 1 opportunity = good business at a bad/expensive price. A Type 2 = a broken or declining business regardless of price. Which is this — and why? Use the data to support your classification.]

### 10. Catalyst
[What is the single most important event in the next 12 months that could move this stock significantly? Be as specific as possible — name the event, earnings cycle, product launch, or regulatory milestone to watch.]

### 13. What Would Change This Verdict?
[Give exactly 2-3 concrete, measurable financial triggers that would cause you to change the verdict. For example: "If revenue growth exceeds 20% for two consecutive quarters" or "If operating margin falls below 10%." Be specific — no vague statements.]

### 14. Institutional Conviction
[Are major institutions buying or selling this stock? Describe what institutional ownership typically means for this type of company (large-cap vs small-cap, sector). If the stock is well-covered by Wall Street, mention what institutional conviction signals. Be specific about what institutional activity would validate or invalidate the investment case. Reference any ownership concentration risks.]

### 15. The Right Price
[At what specific price would this stock become compelling to buy regardless of current verdict? Calculate a target entry price using: (1) EPS × fair sector P/E multiple, and (2) a 20-30% discount to analyst consensus target. State the exact dollar figure. What single catalyst would most likely cause Athena to upgrade the verdict? Be concrete — name the specific metric, event, or threshold that would change the analysis.]`;
}

// ── DeepSeek SSE parser ───────────────────────────────────────────────────────
// Yields text content chunks extracted from a DeepSeek/OpenAI-compatible SSE stream.
async function* sseContentStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
): AsyncGenerator<string> {
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep any incomplete trailing line
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const text: string | undefined = parsed.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch { /* skip malformed SSE lines */ }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
}

// ── Primary: DeepSeek streaming ───────────────────────────────────────────────
// Returns a ReadableStream of text chunks, or null if DeepSeek is unavailable.
// Pre-validates by consuming the first chunk before returning — mirrors the same
// Anthropic pre-validation pattern to catch auth/quota errors before we commit
// to a streaming HTTP response.
async function tryDeepSeekStream(
  prompt: string,
  encoder: TextEncoder,
  symbol: string,
): Promise<ReadableStream | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;

  let res: Response;
  try {
    res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 3000,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (e) {
    console.error(`[athena-analysis] DeepSeek fetch failed for ${symbol}:`, e);
    return null;
  }

  if (!res.ok || !res.body) {
    const errBody = res.body ? await res.text().catch(() => "") : "";
    console.error(
      `[athena-analysis] DeepSeek HTTP ${res.status} for ${symbol}:`,
      errBody.slice(0, 200),
    );
    return null;
  }

  const gen = sseContentStream(res.body.getReader(), new TextDecoder());

  // Pre-validate: confirm at least one text chunk arrives before returning stream
  let first: IteratorResult<string>;
  try {
    first = await gen.next();
  } catch (e) {
    console.error(`[athena-analysis] DeepSeek pre-validation error for ${symbol}:`, e);
    return null;
  }

  if (first.done || !first.value) {
    console.error(`[athena-analysis] DeepSeek returned empty stream for ${symbol}`);
    return null;
  }

  const preBuf = encoder.encode(first.value);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(preBuf); // flush pre-validated first chunk
        for await (const text of gen) {
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        // ERR_INVALID_STATE = client disconnected; silently discard
        const code = (err as NodeJS.ErrnoException).code;
        if (code !== "ERR_INVALID_STATE") {
          console.error(`[athena-analysis] DeepSeek mid-stream error for ${symbol}:`, err);
          try { controller.error(err); } catch { /* already closed */ }
        }
      }
    },
  });
}

// ── Fallback: Anthropic streaming ─────────────────────────────────────────────
// Returns a ReadableStream of text chunks, or null if Anthropic is unavailable.
async function tryAnthropicStream(
  prompt: string,
  encoder: TextEncoder,
  symbol: string,
): Promise<ReadableStream | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const msgStream = client.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iter = (msgStream as any)[Symbol.asyncIterator]() as AsyncIterator<{
      type: string;
      delta?: { type: string; text?: string };
    }>;
    const preBuf: Uint8Array[] = [];

    // Pre-validate: consume until first text chunk so Anthropic 4xx errors throw
    // here (insufficient credits, etc.) instead of mid-stream
    try {
      for (;;) {
        const { value: ev, done } = await iter.next();
        if (done) break;
        if (
          ev.type === "content_block_delta" &&
          ev.delta?.type === "text_delta" &&
          ev.delta.text
        ) {
          preBuf.push(encoder.encode(ev.delta.text));
          break;
        }
      }
    } catch (preErr) {
      const msg = preErr instanceof Error ? preErr.message : "Upstream error";
      console.error(`[athena-analysis] Anthropic rejected stream for ${symbol}:`, msg);
      return null;
    }

    if (preBuf.length === 0) return null;

    return new ReadableStream({
      async start(controller) {
        try {
          for (const chunk of preBuf) controller.enqueue(chunk);
          for (;;) {
            const { value: ev, done } = await iter.next();
            if (done) break;
            if (
              ev.type === "content_block_delta" &&
              ev.delta?.type === "text_delta" &&
              ev.delta.text
            ) {
              controller.enqueue(encoder.encode(ev.delta.text));
            }
          }
          controller.close();
        } catch (streamErr) {
          // ERR_INVALID_STATE = client disconnected; silently discard
          const code = (streamErr as NodeJS.ErrnoException).code;
          if (code !== "ERR_INVALID_STATE") {
            const msg = streamErr instanceof Error ? streamErr.message : "Stream error";
            console.error(`[athena-analysis] Anthropic mid-stream error for ${symbol}:`, msg);
            try { controller.error(streamErr); } catch { /* already closed */ }
          }
        }
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[athena-analysis] Anthropic setup error for ${symbol}:`, msg);
    return null;
  }
}

// ── Shared response headers ───────────────────────────────────────────────────
const STREAM_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "X-Accel-Buffering": "no",
};

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── 1. Parse and validate request body ──────────────────────────────────────
  let overview: StockOverview;
  let quote: GlobalQuote | null;
  let safeLang: string;

  try {
    const body = await req.json() as {
      overview?: StockOverview;
      quote?: GlobalQuote | null;
      lang?: string;
    };

    if (!body?.overview?.Symbol) {
      console.error("[athena-analysis] Invalid request: missing overview.Symbol");
      return Response.json(
        { status: "error", message: "Missing required stock data", fallback: true },
        { status: 400 },
      );
    }

    overview = body.overview;
    quote    = body.quote ?? null;
    safeLang = body.lang === "sv" ? "sv" : "en";
  } catch {
    console.error("[athena-analysis] Failed to parse request body");
    return Response.json(
      { status: "error", message: "Invalid request format", fallback: true },
      { status: 400 },
    );
  }

  const prompt  = buildPrompt(overview, quote, safeLang);
  const encoder = new TextEncoder();

  // ── 2. Try DeepSeek (primary) ────────────────────────────────────────────────
  const deepSeekStream = await tryDeepSeekStream(prompt, encoder, overview.Symbol);
  if (deepSeekStream) {
    console.log(`[athena-analysis] Using DeepSeek for ${overview.Symbol}`);
    return new Response(deepSeekStream, { headers: STREAM_HEADERS });
  }

  // ── 3. Fall back to Anthropic ────────────────────────────────────────────────
  console.warn(
    `[athena-analysis] DeepSeek unavailable — falling back to Anthropic for ${overview.Symbol}`,
  );
  const anthropicStream = await tryAnthropicStream(prompt, encoder, overview.Symbol);
  if (anthropicStream) {
    console.log(`[athena-analysis] Using Anthropic fallback for ${overview.Symbol}`);
    return new Response(anthropicStream, { headers: STREAM_HEADERS });
  }

  // ── 4. Both providers failed ─────────────────────────────────────────────────
  console.error(
    `[athena-analysis] Both DeepSeek and Anthropic failed for ${overview.Symbol}`,
  );
  return Response.json(
    { status: "error", message: "Analysis temporarily unavailable", fallback: true },
    { status: 503 },
  );
}
