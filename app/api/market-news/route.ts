import { NextResponse } from "next/server";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? "";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FinnhubArticle {
  id:       number;
  headline: string;
  summary:  string;
  source:   string;
  datetime: number; // Unix timestamp (seconds)
  url:      string;
  image?:   string;
  category: string;
}

export interface NewsArticle {
  id:       number;
  headline: string;
  summary:  string;
  source:   string;
  datetime: number;
  url:      string;
}

// ── Route ──────────────────────────────────────────────────────────────────────

export const revalidate = 1800; // 30-minute ISR cache

export async function GET() {
  if (!FINNHUB_KEY) {
    return NextResponse.json(
      { error: "News service is temporarily unavailable." },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`,
      { next: { revalidate: 1800 } },
    );

    if (!res.ok) {
      throw new Error(`Finnhub responded with ${res.status}`);
    }

    const articles: FinnhubArticle[] = await res.json();

    const filtered: NewsArticle[] = articles
      // Remove articles with missing or very short content, and filter out
      // articles where the summary is just the headline echoed back (sometimes
      // Finnhub returns summary = "Headline text  SourceName" as a fallback).
      .filter((a) => {
        if (!a.headline || a.headline.trim().length <= 15) return false;
        if (!a.summary  || a.summary.trim().length  <= 20)  return false;
        // Drop if summary starts with the headline (duplicate text bug)
        const hl  = a.headline.trim().toLowerCase();
        const sum = a.summary.trim().toLowerCase();
        if (sum.startsWith(hl)) return false;
        return true;
      })
      .slice(0, 4)
      .map((a) => ({
        id:       a.id,
        headline: a.headline.trim(),
        // Truncate long summaries to ~220 chars for clean card layout
        summary:
          a.summary.trim().length > 220
            ? a.summary.trim().slice(0, 220).trimEnd() + "…"
            : a.summary.trim(),
        source:   a.source,
        datetime: a.datetime,
        url:      a.url,
      }));

    return NextResponse.json({ articles: filtered });
  } catch (err) {
    console.error("[market-news] Finnhub fetch failed:", err);
    return NextResponse.json(
      { error: "Unable to retrieve market news at this time." },
      { status: 500 },
    );
  }
}
