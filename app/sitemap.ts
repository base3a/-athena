import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://athenastocks.ai";

// High-traffic tickers that benefit from pre-indexed pages
const FEATURED_TICKERS = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN",
  "TSLA", "META", "NFLX", "JPM", "V",
  "WMT", "JNJ", "UNH", "XOM", "BRK.B",
  "AMD", "INTC", "DIS", "BA", "SPOT",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // ── Home ──────────────────────────────────────────────────────────────
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },

    // ── Featured stock analysis pages ─────────────────────────────────────
    ...FEATURED_TICKERS.map((ticker) => ({
      url: `${SITE_URL}/analyze/${ticker}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}
