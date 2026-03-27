import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://athenastock.net";

const POPULAR_TICKERS = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN",
  "META", "TSLA", "LLY", "AVGO", "JPM",
  "UNH", "V", "XOM", "MA", "ASML",
  "PG", "JNJ", "HD", "MRK", "COST",
  "ABBV", "NFLX", "BAC", "AMD", "WMT",
  "INTC", "DIS", "BA", "SPOT", "BRK.B",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                      lastModified: now, changeFrequency: "daily",  priority: 1.0 },
    { url: `${SITE_URL}/markets`,         lastModified: now, changeFrequency: "daily",  priority: 0.8 },
    { url: `${SITE_URL}/screener`,        lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/research`,        lastModified: now, changeFrequency: "daily",  priority: 0.7 },
    { url: `${SITE_URL}/portfolio`,       lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  const stockPages: MetadataRoute.Sitemap = POPULAR_TICKERS.map((ticker) => ({
    url: `${SITE_URL}/analyze/${ticker}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...stockPages];
}
