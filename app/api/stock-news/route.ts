import { NextRequest } from "next/server";
import { InMemoryCache } from "@/lib/cache";
import { fetchFinnhubNews, type NewsArticle } from "@/lib/finnhub";

// Module-level cache — keyed by uppercase ticker, TTL = 5 min
const newsCache = new InMemoryCache<NewsArticle[]>();

// ── Dev fallback: generic market headlines when all sources are exhausted ──────
const MOCK_ARTICLES: NewsArticle[] = [
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

// ── Helpers ───────────────────────────────────────────────────────────────────

// Convert ISO 8601 timestamp to compact format "YYYYMMDDTHHMMSS"
function isoToPublished(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/Z$/, "").slice(0, 15);
}

// ── Source 1: NewsAPI ─────────────────────────────────────────────────────────
async function fetchNewsAPI(symbol: string): Promise<NewsArticle[] | null> {
  const key = process.env.NEWS_API_KEY;
  if (!key) return null;

  try {
    const url =
      `https://newsapi.org/v2/everything` +
      `?q=${encodeURIComponent(symbol)}+stock` +
      `&sortBy=publishedAt` +
      `&pageSize=5` +
      `&language=en` +
      `&apiKey=${key}`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "ok" || !Array.isArray(data.articles)) return null;

    const articles: NewsArticle[] = (data.articles as Record<string, unknown>[])
      .filter((a) => a.title && a.url && a.title !== "[Removed]")
      .slice(0, 3)
      .map((a) => ({
        title:          String(a.title),
        url:            String(a.url),
        source:         String((a.source as Record<string, unknown>)?.name ?? "NewsAPI"),
        time_published: isoToPublished(String(a.publishedAt ?? "")),
      }));

    return articles.length > 0 ? articles : null;
  } catch {
    return null;
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  if (!symbol) {
    return new Response(JSON.stringify({ error: "symbol required" }), { status: 400 });
  }

  const cacheKey = symbol.toUpperCase();

  // 1. In-memory cache hit
  const hit = newsCache.get(cacheKey);
  if (hit) {
    return new Response(JSON.stringify({ articles: hit }), {
      headers: {
        "Content-Type":  "application/json",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
      },
    });
  }

  // 2. NewsAPI (primary — requires NEWS_API_KEY)
  let articles = await fetchNewsAPI(symbol);

  // 3. Finnhub /company-news (fallback — uses FINNHUB_API_KEY, last 7 days)
  if (!articles) {
    articles = await fetchFinnhubNews(symbol);
  }

  // 4. Dev mock when both sources are unavailable
  if (!articles) {
    if (process.env.NODE_ENV === "development") {
      articles = MOCK_ARTICLES;
    } else {
      articles = [];
    }
  }

  // Cache real results (not the static mock list)
  if (articles.length > 0 && articles !== MOCK_ARTICLES) {
    newsCache.set(cacheKey, articles);
  }

  return new Response(JSON.stringify({ articles }), {
    headers: {
      "Content-Type":  "application/json",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
    },
  });
}
