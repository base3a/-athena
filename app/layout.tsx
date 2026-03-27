import type { Metadata, Viewport } from "next";
import "./globals.css";

// ── Site constants ─────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_SITE_URL in .env.local when deploying (e.g. https://athenastock.net)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://athenastock.net";
const SITE_NAME = "Athena AI";
const SITE_DESCRIPTION =
  "Athena is an AI-powered stock analysis tool delivering institutional-grade investment research. Enter any ticker for deep fundamental analysis, risk assessment, and an AI investment verdict — powered by Claude AI.";

// ── Viewport ───────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: "#d4a017",
  width: "device-width",
  initialScale: 1,
};

// ── Root metadata ──────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Athena — AI-Powered Stock Analysis Tool",
    template: "%s | Athena AI",
  },

  description: SITE_DESCRIPTION,

  keywords: [
    "AI stock analysis",
    "stock analysis tool",
    "investment analysis AI",
    "AI investment research",
    "stock market AI",
    "fundamental analysis tool",
    "investment research tool",
    "stock valuation AI",
    "AI trading analysis",
    "institutional stock analysis",
    "Claude AI stock analysis",
    "stock screener AI",
  ],

  authors: [{ name: "Athena AI" }],
  creator: "Athena AI",
  publisher: "Athena AI",
  applicationName: "Athena",

  // ── Open Graph ─────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Athena — AI-Powered Stock Analysis Tool",
    description:
      "Get institutional-grade AI stock analysis in seconds. Enter any ticker for deep fundamental insights, risk assessment, and an AI investment verdict powered by Claude.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Athena AI — AI-Powered Stock Analysis Tool",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X ────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Athena — AI-Powered Stock Analysis Tool",
    description:
      "Institutional-grade AI stock analysis in seconds. Fundamental metrics, risk assessment, and AI investment verdicts for any ticker.",
    images: ["/opengraph-image"],
  },

  // ── Robots ─────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Canonical ──────────────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },
};

// ── JSON-LD structured data ────────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Athena AI",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Athena AI",
      description: SITE_DESCRIPTION,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/analyze/{ticker}`,
        },
        "query-input": "required name=ticker",
      },
    },
  ],
};

// ── Root layout ────────────────────────────────────────────────────────────
import SiteFooter from "@/components/SiteFooter";
import FeedbackButton from "@/components/FeedbackButton";
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-black text-white">
        <div className="min-h-screen flex flex-col">
          {children}
          <SiteFooter />
        </div>
        <FeedbackButton />
        <Analytics />
      </body>
    </html>
  );
}
