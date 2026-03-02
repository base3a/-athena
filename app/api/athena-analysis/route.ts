import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import type { StockOverview, GlobalQuote } from "@/lib/alphaVantage";

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

Answer the following 13 investment framework questions. Keep each answer to 2-4 sentences. Reference specific numbers wherever relevant.

RESPOND EXACTLY IN THIS FORMAT — do not add extra text before or after:

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

### 11. Confidence Score
CONFIDENCE: [write a single integer from 1 to 10]
[One sentence explaining what drives this confidence level — what makes this analysis more or less certain?]

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

### 13. What Would Change This Verdict?
[Give exactly 2-3 concrete, measurable financial triggers that would cause you to change the verdict. For example: "If revenue growth exceeds 20% for two consecutive quarters" or "If operating margin falls below 10%." Be specific — no vague statements.]`;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { overview, quote, lang } = body as {
      overview: StockOverview;
      quote: GlobalQuote | null;
      lang?: string;
    };
    // Validate — only "en" and "sv" are supported; default to "en"
    const safeLang = lang === "sv" ? "sv" : "en";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response("ANTHROPIC_API_KEY is not configured", { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const stream = client.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      messages: [{ role: "user", content: buildPrompt(overview, quote, safeLang) }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // SDK v0.78 exposes raw SSE events via Symbol.asyncIterator
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[athena-analysis]", err);
    return new Response(
      err instanceof Error ? err.message : "Analysis failed",
      { status: 500 }
    );
  }
}
