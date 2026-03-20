"use client";

import { useState, useEffect } from "react";
import type { NewsArticle } from "@/app/api/market-news/route";

// ── Types ─────────────────────────────────────────────────────────────────────

// Re-export for internal use — the canvas card only needs headline + summary
interface NewsItem {
  id:       number;
  headline: string;
  summary:  string;
  source:   string;
  datetime: number;
  url:      string;
}

// ── Timestamp helper ─────────────────────────────────────────────────────────

function timeAgo(unix: number): string {
  const diffMs   = Date.now() - unix * 1000;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1)    return "Just now";
  if (diffMins < 60)   return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)    return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

// ── Owl SVG factory — identical to ShareButton ────────────────────────────────
function owlSvgUrl(size: number): string {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="20" cy="24" rx="10" ry="12" fill="#1a1400" stroke="#d4a017" stroke-width="1.2"/>
  <circle cx="20" cy="13" r="8" fill="#1a1400" stroke="#d4a017" stroke-width="1.2"/>
  <polygon points="13,7 11,2 16,6" fill="#d4a017"/>
  <polygon points="27,7 29,2 24,6" fill="#d4a017"/>
  <circle cx="16.5" cy="13" r="3" fill="#000" stroke="#d4a017" stroke-width="1"/>
  <circle cx="16.5" cy="13" r="1.4" fill="#d4a017" opacity="0.9"/>
  <circle cx="23.5" cy="13" r="3" fill="#000" stroke="#d4a017" stroke-width="1"/>
  <circle cx="23.5" cy="13" r="1.4" fill="#d4a017" opacity="0.9"/>
  <polygon points="20,15.5 18.5,18 21.5,18" fill="#d4a017" opacity="0.8"/>
  <path d="M11 20 Q8 26 11 32" stroke="#d4a017" stroke-width="0.8" fill="none" opacity="0.6"/>
  <path d="M29 20 Q32 26 29 32" stroke="#d4a017" stroke-width="0.8" fill="none" opacity="0.6"/>
  <path d="M17 22 Q20 24 23 22" stroke="#d4a017" stroke-width="0.6" fill="none" opacity="0.5"/>
  <path d="M16 26 Q20 28 24 26" stroke="#d4a017" stroke-width="0.6" fill="none" opacity="0.5"/>
</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function loadOwl(size: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src     = owlSvgUrl(size);
  });
}

// ── Text wrap helper — identical to ShareButton ───────────────────────────────
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let cy   = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, cy);
      line = words[i] + " ";
      cy  += lineHeight;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, cy);
  return cy;
}

// ── Canvas card generator ─────────────────────────────────────────────────────
async function generateInsightCard(item: NewsItem): Promise<string> {
  const S   = 1080;
  const PAD = 90;

  const canvas  = document.createElement("canvas");
  canvas.width  = S;
  canvas.height = S;
  const ctx     = canvas.getContext("2d")!;

  // Pre-load fonts (best-effort)
  await Promise.all([
    document.fonts.load("700 56px 'Cinzel'"),
    document.fonts.load("400 26px 'Cinzel'"),
  ]).catch(() => {});

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = "#080808";
  ctx.fillRect(0, 0, S, S);

  // Dot grid
  ctx.fillStyle = "rgba(212,160,23,0.05)";
  for (let gy = 22; gy < S; gy += 44) {
    for (let gx = 22; gx < S; gx += 44) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Radial top glow
  const glow = ctx.createRadialGradient(S / 2, 0, 0, S / 2, 0, S * 0.62);
  glow.addColorStop(0, "rgba(212,160,23,0.13)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  // Outer border
  ctx.strokeStyle = "#1e1e1e";
  ctx.lineWidth   = 2;
  ctx.strokeRect(1, 1, S - 2, S - 2);

  // ── Brand: owl + ATHENA ──────────────────────────────────────────────────────
  const owlPx = 78;
  const owl   = await loadOwl(owlPx);
  const gap   = 14;

  ctx.font      = `700 ${Math.round(owlPx * 0.68)}px 'Cinzel', serif`;
  const textW   = ctx.measureText("ATHENA").width;
  const totalW  = owlPx + gap + textW;
  const startX  = (S - totalW) / 2;
  const brandCY = 122;

  ctx.drawImage(owl, startX, brandCY - owlPx / 2, owlPx, owlPx);
  ctx.fillStyle    = "#d4a017";
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("ATHENA", startX + owlPx + gap, brandCY);

  // ── Top divider ──────────────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(212,160,23,0.18)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 192);
  ctx.lineTo(S - PAD, 192);
  ctx.stroke();

  // ── "MARKET INSIGHT" label ───────────────────────────────────────────────────
  ctx.fillStyle    = "#555";
  ctx.font         = "400 22px 'Cinzel', serif";
  ctx.textAlign    = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("MARKET INSIGHT", S / 2, 248);

  // ── Headline ─────────────────────────────────────────────────────────────────
  ctx.fillStyle    = "#d4a017";
  ctx.font         = "700 56px 'Cinzel', serif";
  ctx.textAlign    = "center";
  ctx.textBaseline = "alphabetic";
  const headlineBottom = wrapText(ctx, item.headline, S / 2, 340, S - PAD * 2 - 40, 72);

  // ── Divider below headline ────────────────────────────────────────────────────
  const midDivY = headlineBottom + 38;
  ctx.strokeStyle = "rgba(212,160,23,0.12)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD + 80, midDivY);
  ctx.lineTo(S - PAD - 80, midDivY);
  ctx.stroke();

  // ── Summary ──────────────────────────────────────────────────────────────────
  ctx.fillStyle    = "#CFCFCF";
  ctx.font         = "400 26px 'Cinzel', serif";
  ctx.textAlign    = "center";
  ctx.textBaseline = "alphabetic";
  wrapText(ctx, item.summary, S / 2, midDivY + 54, S - PAD * 2 - 40, 44);

  // ── Bottom divider ────────────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(212,160,23,0.18)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 942);
  ctx.lineTo(S - PAD, 942);
  ctx.stroke();

  // ── Footer: handle · URL ──────────────────────────────────────────────────────
  ctx.fillStyle    = "#555";
  ctx.font         = "400 20px 'Cinzel', serif";
  ctx.textAlign    = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("@athena.stock  ·  athena.ai", S / 2, 1006);

  return canvas.toDataURL("image/png");
}

// ── Preview modal — mirrors ShareButton ───────────────────────────────────────
function PreviewModal({
  dataUrl,
  onClose,
}: {
  dataUrl: string;
  onClose: () => void;
}) {
  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  async function handleShare() {
    try {
      const res  = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "athena-insight.png", { type: "image/png" });
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: "Athena Market Insight" });
        return;
      }
    } catch { /* fall through */ }

    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    if (isTouch) { window.open(dataUrl, "_blank"); return; }

    const a      = document.createElement("a");
    a.href       = dataUrl;
    a.download   = "athena-insight.png";
    a.click();
  }

  return (
    <div
      style={{
        position:       "fixed",
        inset:          0,
        background:     "rgba(0,0,0,0.88)",
        zIndex:         9999,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            20,
        padding:        24,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt="Share card preview"
          style={{
            width:        "min(460px, 88vw)",
            height:       "min(460px, 88vw)",
            borderRadius: 12,
            boxShadow:    "0 0 100px rgba(212,160,23,0.14), 0 0 40px rgba(0,0,0,0.8)",
            display:      "block",
            objectFit:    "cover",
          }}
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={handleShare}
            style={{
              padding:       "13px 32px",
              minHeight:     48,
              borderRadius:  8,
              border:        "none",
              background:    "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
              color:         "#000",
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor:        "pointer",
              fontFamily:    "'Cinzel', serif",
            }}
          >
            {canNativeShare ? "↑ Share Image" : "↓ Download PNG"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding:       "13px 24px",
              minHeight:     48,
              borderRadius:  8,
              border:        "1px solid #2a2a2a",
              background:    "transparent",
              color:         "#555",
              fontSize:      11,
              fontWeight:    600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor:        "pointer",
              fontFamily:    "'Cinzel', serif",
            }}
          >
            Close
          </button>
        </div>
        <p style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: "0.14em" }}>
          1080 × 1080 · Click outside to dismiss
        </p>
      </div>
    </div>
  );
}

// ── Individual news card ───────────────────────────────────────────────────────
function NewsCard({ item }: { item: NewsItem }) {
  const [state,   setState]   = useState<"idle" | "generating" | "preview">("idle");
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  async function handleShare() {
    if (state !== "idle") return;
    setState("generating");
    try {
      const url = await generateInsightCard(item);
      setDataUrl(url);
      setState("preview");
    } catch {
      setState("idle");
    }
  }

  function handleClose() {
    setState("idle");
    setDataUrl(null);
  }

  const timestamp = `${item.source} · ${timeAgo(item.datetime)}`;

  return (
    <>
      <div
        className="relative rounded-2xl overflow-hidden text-left flex flex-col"
        style={{
          background: "#0b0b0b",
          border:     "1px solid rgba(212,175,55,0.12)",
          borderLeft: "3px solid rgba(212,160,23,0.35)",
          boxShadow:  "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Inner glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 10% 50%, rgba(212,160,23,0.03) 0%, transparent 65%)",
          }}
        />

        <div className="relative p-4 flex flex-col gap-2 flex-1">
          {/* Headline — links to original article */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-semibold leading-snug"
            style={{
              color:          "#d4a017",
              fontFamily:     "'Cinzel', serif",
              textDecoration: "none",
              display:        "inline-flex",
              alignItems:     "flex-start",
              gap:            5,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
            }}
          >
            <span>{item.headline}</span>
            <span style={{ fontSize: 10, flexShrink: 0, opacity: 0.5, marginTop: 2 }}>↗</span>
          </a>

          {/* Gold fade divider */}
          <div
            className="h-px"
            style={{
              background: "linear-gradient(to right, rgba(212,160,23,0.18), transparent)",
            }}
          />

          {/* Summary */}
          <p className="text-[12px] leading-relaxed flex-1" style={{ color: "#CFCFCF" }}>
            {item.summary}
          </p>

          {/* Footer row: source + timestamp + share button */}
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] tracking-wide" style={{ color: "#444" }}>
              {timestamp}
            </p>

            <button
              onClick={handleShare}
              disabled={state === "generating"}
              style={{
                display:       "inline-flex",
                alignItems:    "center",
                gap:           5,
                padding:       "5px 11px",
                borderRadius:  6,
                border:        "1px solid rgba(212,160,23,0.28)",
                background:    "transparent",
                color:         state === "generating" ? "#444" : "#d4a017",
                fontSize:      9,
                fontWeight:    600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor:        state === "generating" ? "default" : "pointer",
                fontFamily:    "'Cinzel', serif",
                transition:    "opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                if (state === "idle")
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.65";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              {state === "generating" ? (
                <span style={{ opacity: 0.5 }}>Generating…</span>
              ) : (
                <>
                  <span style={{ fontSize: 11, lineHeight: 1 }}>↑</span>
                  Share Insight
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {state === "preview" && dataUrl && (
        <PreviewModal dataUrl={dataUrl} onClose={handleClose} />
      )}
    </>
  );
}

// ── Skeleton card (loading state) ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: "#0b0b0b",
        border:     "1px solid rgba(212,175,55,0.08)",
        borderLeft: "3px solid rgba(212,160,23,0.15)",
      }}
    >
      <div className="h-4 rounded" style={{ background: "#161616", width: "75%" }} />
      <div className="h-px"      style={{ background: "rgba(212,160,23,0.07)" }} />
      <div className="flex flex-col gap-1.5">
        <div className="h-3 rounded" style={{ background: "#111", width: "100%" }} />
        <div className="h-3 rounded" style={{ background: "#111", width: "90%" }}  />
        <div className="h-3 rounded" style={{ background: "#111", width: "70%" }}  />
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="h-2 rounded" style={{ background: "#111", width: "28%" }} />
        <div className="h-5 rounded" style={{ background: "#111", width: "20%" }} />
      </div>
    </div>
  );
}

// ── Section component ─────────────────────────────────────────────────────────
export default function MarketNews() {
  const [articles, setArticles] = useState<NewsItem[] | null>(null);
  const [error,    setError]    = useState(false);

  async function fetchNews() {
    try {
      const res = await fetch("/api/market-news", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const data: { articles: NewsArticle[] } = await res.json();
      if (!data.articles?.length) throw new Error("empty");
      setArticles(data.articles);
      setError(false);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    fetchNews();

    // Auto-refresh every 30 minutes
    const timer = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-[900px] mt-10">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse-slow"
          style={{ background: "#d4a017" }}
        />
        <span
          className="text-[10px] tracking-widest uppercase font-medium"
          style={{ color: "#7A7A7A", fontFamily: "'Cinzel', serif" }}
        >
          Market News
        </span>
        {articles && (
          <span style={{ fontSize: 9, color: "#2a2a2a", marginLeft: 4 }}>
            · Live via Finnhub
          </span>
        )}
      </div>

      {/* 1-col mobile, 2-col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Loading state */}
        {!articles && !error && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* Error / empty state */}
        {error && (
          <div
            className="col-span-full rounded-2xl p-6 text-center"
            style={{
              background: "#0b0b0b",
              border:     "1px solid rgba(212,175,55,0.08)",
            }}
          >
            <p
              className="text-[13px]"
              style={{ color: "#555", fontFamily: "'Cinzel', serif" }}
            >
              Market news updating soon.
            </p>
            <p className="text-[11px] mt-1" style={{ color: "#333" }}>
              Check back in a few minutes.
            </p>
          </div>
        )}

        {/* Live articles */}
        {articles?.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
