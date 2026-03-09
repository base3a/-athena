// ── Shared research article data ──────────────────────────────────────────────
// Used by both /research (listing) and /research/[slug] (article pages)

export type Conviction = "High" | "Medium" | "Developing";

export interface ResearchArticle {
  slug: string;
  tag: string;
  title: string;
  summary: string;
  readTime: string;
  conviction: Conviction;
  athenaInsight: string;
  relatedStocks: string[];
  body: string[];
}

export const RESEARCH_ARTICLES: ResearchArticle[] = [
  {
    slug: "ai-infrastructure-cycle",
    tag: "Mega-Trend",
    title: "The AI Infrastructure Cycle",
    summary:
      "Why Nvidia, Microsoft, and TSMC dominate the supply chain — and why the capex cycle has years to run. Data centres are being rebuilt from the ground up for transformer workloads.",
    readTime: "6 min read",
    conviction: "High",
    athenaInsight:
      "The AI infrastructure buildout represents the largest coordinated capital expenditure cycle since the commercial internet. Nvidia's CUDA moat, TSMC's manufacturing dominance, and Microsoft's enterprise distribution create compounding advantages that will be difficult to disrupt within a 5-year horizon. Investors should treat any material pullback in NVDA or TSMC as a structural entry point — not a signal to exit. The monetisation of this infrastructure, not the buildout itself, is the variable to monitor into 2027.",
    relatedStocks: ["NVDA", "MSFT", "TSMC", "ASML", "AMD"],
    body: [
      "The artificial intelligence infrastructure build-out is the most significant capital expenditure cycle since the commercial internet. Hyperscalers — Microsoft, Google, Amazon, and Meta — are collectively committing over $300 billion annually to data centre construction, GPU procurement, and network infrastructure. This is not speculative. These are contractual commitments flowing directly to Nvidia, TSMC, and the broader semiconductor supply chain.",
      "Nvidia's competitive moat runs deeper than its hardware. The CUDA software ecosystem — built over nearly two decades — represents a switching cost that AMD and Intel cannot overcome in the near term. Enterprise ML teams are CUDA-native by default. Migrating to alternative accelerators would require retraining thousands of engineers and rewriting years of optimised code. This is the real moat, and it compounds annually.",
      "TSMC sits at the irreplaceable intersection of every major AI hardware roadmap. No competing foundry can match its leading-edge node yields at scale. Intel Foundry remains years behind on process maturity. Samsung's advanced nodes suffer from yield inconsistencies. TSMC's pricing power — and its strategic importance to US national security — make it one of the most defensible businesses in the world.",
      "The critical risk to monitor: a meaningful deceleration in hyperscaler revenue growth could trigger a rapid repricing of capex commitments. AI monetisation — the return on this infrastructure investment — remains the key variable. If Microsoft Copilot, Google Gemini, and AWS AI services do not generate sufficient incremental revenue, the capex cycle will compress. This is a 2026–2027 watch point, not an immediate concern.",
    ],
  },
  {
    slug: "healthcare-mega-trends",
    tag: "Sector Deep-Dive",
    title: "Healthcare Mega-Trends",
    summary:
      "GLP-1 obesity drugs are reshaping pharmaceutical revenue models at scale. Eli Lilly and Novo Nordisk face a decade-long tailwind while legacy cardiovascular players face structural headwinds.",
    readTime: "5 min read",
    conviction: "Medium",
    athenaInsight:
      "GLP-1 drugs represent a genuine paradigm shift in chronic disease management. The addressable market extends well beyond obesity — cardiovascular risk reduction, sleep apnea, and metabolic disorders create a multi-decade revenue runway. Manufacturing scale-up remains the primary near-term bottleneck, but both Eli Lilly and Novo Nordisk are investing aggressively to resolve it. Legacy cardiovascular device makers and bariatric surgery providers face structural displacement risk that the market has not yet fully priced.",
    relatedStocks: ["LLY", "NVO", "ABBV", "JNJ", "ISRG"],
    body: [
      "GLP-1 receptor agonists — Eli Lilly's Mounjaro and Zepbound, Novo Nordisk's Ozempic and Wegovy — represent the most commercially significant drug class since statins. The obesity epidemic affects 42% of US adults. Cardiovascular outcome data is increasingly compelling. FDA approvals are expanding into new indications. The addressable market, currently estimated at $100 billion annually by 2030, may prove conservative.",
      "The supply constraint story is transitioning. Both Lilly and Novo Nordisk have invested aggressively in manufacturing expansion. Lilly's Concord, North Carolina facility represents a $9 billion commitment to domestic production scale. Novo's capital programme spans multiple continents. By late 2026, supply-driven demand rationing should ease — shifting the debate from 'can they make enough?' to 'at what price, and for whom?'",
      "The downstream implications are underappreciated by most investors. Reduced obesity prevalence carries negative long-term revenue implications for medical device companies focused on weight-related cardiovascular interventions. Bariatric surgery volumes are already declining measurably. Hospital systems treating obesity-related comorbidities face structural headwinds. This disruption is diffuse, slow-moving, and not yet fully priced across the healthcare sector.",
      "Biosimilar risk represents the most significant medium-term threat to GLP-1 incumbents. Semaglutide patent cliffs begin in the early 2030s. However, the manufacturing complexity of large-molecule biologics creates a meaningful lead-time advantage for incumbents. First biosimilar entrants will likely capture only modest market share due to clinical trust dynamics inherent in injectable drug markets — a dynamic well-documented in insulin and adalimumab precedents.",
    ],
  },
  {
    slug: "rate-plateau-impact",
    tag: "Macro",
    title: "The Rate Plateau & What It Means",
    summary:
      "With the Fed signalling patience, equity valuations are anchored to a higher-for-longer rate environment. Which sectors benefit and which face persistent multiple compression.",
    readTime: "4 min read",
    conviction: "Developing",
    athenaInsight:
      "The Federal Reserve's higher-for-longer posture creates a bifurcated equity environment that demands careful positioning. Rate-sensitive sectors — utilities, REITs, and high-multiple growth stocks — face persistent multiple compression until a credible easing path emerges. Financials, energy, and cash-generative value technology maintain structural advantage. Duration risk remains significantly underappreciated in many growth-heavy portfolios, and conviction here is developing as the data evolves.",
    relatedStocks: ["JPM", "BRK.B", "GS", "BAC", "MS"],
    body: [
      "The Federal Reserve's shift to a data-dependent pause — rather than the easing cycle many investors anticipated entering 2026 — has profound implications for equity valuations. With the Federal Funds Rate stable at 4.25–4.5%, the risk-free rate anchors equity multiples at levels that compress the valuation premium long-duration growth stocks have historically commanded in zero-rate environments.",
      "The bifurcation is structural and likely to persist. Financials benefit directly: net interest margins expand, loan spreads widen, and deposit repricing advantages compound over time. JPMorgan, Goldman Sachs, and Bank of America have seen meaningful earnings per share upgrades as the higher-for-longer environment extends their revenue tailwind. This is not a tactical trade — it is a multi-year structural advantage tied to the rate regime.",
      "Growth equity faces the inverse dynamic. High-multiple technology companies — many trading at 30–50x forward earnings — embed an implicit assumption of future cash flows discounted at lower rates. When the discount rate remains elevated, present value calculations are punishing for terminal-value-heavy businesses. This does not mean growth is uninvestable. It means selectivity is essential: only companies with demonstrable near-term free cash flow generation deserve premium multiples in this environment.",
      "The scenario to monitor: a sudden deterioration in labour market conditions could force the Fed into emergency easing, inverting the current dynamic and benefiting long-duration assets. The probability of this scenario has declined given recent payroll resilience, but cannot be dismissed. Portfolio construction in rate-sensitive allocations should account for this tail risk through appropriate position sizing and duration hedges.",
    ],
  },
];
