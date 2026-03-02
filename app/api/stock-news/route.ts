import { NextRequest } from "next/server";

const AV_KEY = process.env.ALPHA_VANTAGE_API_KEY ?? "";

// ── Dev fallback: generic market headlines when rate-limited ───────────────────
const MOCK_ARTICLES = [
  {
    title: "Markets steady as investors weigh macro data and earnings guidance",
    url: "https://finance.yahoo.com",
    source: "Yahoo Finance",
    time_published: "20260302T120000",
  },
  {
    title: "Fed holds rates; officials signal patience before next move",
    url: "https://www.bloomberg.com",
    source: "Bloomberg",
    time_published: "20260302T090000",
  },
  {
    title: "Tech and energy lead sector rotation amid renewed growth optimism",
    url: "https://www.reuters.com",
    source: "Reuters",
    time_published: "20260301T160000",
  },
];

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  if (!symbol) {
    return new Response(JSON.stringify({ error: "symbol required" }), { status: 400 });
  }

  try {
    const url =
      `https://www.alphavantage.co/query` +
      `?function=NEWS_SENTIMENT` +
      `&tickers=${encodeURIComponent(symbol)}` +
      `&limit=3` +
      `&apikey=${AV_KEY}`;

    const res = await fetch(url, {
      next: { revalidate: 300 }, // cache for 5 minutes
    });
    const data = await res.json();

    // Rate-limit guard
    if (data.Note || data.Information) {
      if (process.env.NODE_ENV === "development") {
        return new Response(JSON.stringify({ articles: MOCK_ARTICLES }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ articles: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const feed: Record<string, unknown>[] = Array.isArray(data.feed) ? data.feed : [];
    const articles = feed.slice(0, 3).map((item) => ({
      title:          item.title          as string,
      url:            item.url            as string,
      source:         item.source         as string,
      time_published: item.time_published as string,
    }));

    return new Response(JSON.stringify({ articles }), {
      headers: {
        "Content-Type":  "application/json",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch {
    return new Response(JSON.stringify({ articles: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
