"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface AnalysisCardParams {
  symbol:      string;
  companyName: string;
  sector:      string;
  verdict:     string;
  score:       number;
  insight:     string;
}

export interface MarketCardParams {
  score:          number;
  label:          string;
  interpretation: string;
  positioning:    string;
}

// ── Verdict accent colors ──────────────────────────────────────────────────────
const VERDICT_ACCENT: Record<string, string> = {
  BUY:   "#4ade80",
  HOLD:  "#60a5fa",
  WATCH: "#d4a017",
  AVOID: "#f87171",
};

// ── Owl SVG factory (raw SVG string → data URL) ───────────────────────────────
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
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = owlSvgUrl(size);
  });
}

// ── Canvas helpers ─────────────────────────────────────────────────────────────

/** Rounded rectangle path (cross-browser, no ctx.roundRect dependency) */
function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Wraps text on canvas. Returns the y of the last line drawn.
 * Respects current ctx.textAlign — caller sets it before invoking.
 */
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
  let cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, cy);
      line = words[i] + " ";
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, cy);
  return cy;
}

// ── Shared canvas setup ────────────────────────────────────────────────────────
function drawBackground(ctx: CanvasRenderingContext2D, S: number): void {
  // Solid dark background
  ctx.fillStyle = "#080808";
  ctx.fillRect(0, 0, S, S);

  // Subtle dot grid
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
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, S - 2, S - 2);
}

/** Draws the centered owl + ATHENA wordmark header. centerY is the vertical center. */
async function drawBrand(
  ctx: CanvasRenderingContext2D,
  S: number,
  owlPx: number,
  centerY: number,
): Promise<void> {
  const owl = await loadOwl(owlPx);
  const gap = 14;

  ctx.font = `700 ${Math.round(owlPx * 0.68)}px 'Cinzel', serif`;
  const textW = ctx.measureText("ATHENA").width;
  const totalW = owlPx + gap + textW;
  const startX = (S - totalW) / 2;

  // Owl
  ctx.drawImage(owl, startX, centerY - owlPx / 2, owlPx, owlPx);

  // ATHENA wordmark
  ctx.fillStyle = "#d4a017";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("ATHENA", startX + owlPx + gap, centerY);
}

function drawDivider(
  ctx: CanvasRenderingContext2D,
  y: number,
  PAD: number,
  S: number,
): void {
  ctx.strokeStyle = "rgba(212,160,23,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(S - PAD, y);
  ctx.stroke();
}

// ── Analysis card generator ────────────────────────────────────────────────────
async function generateAnalysisCard(p: AnalysisCardParams): Promise<string> {
  const S = 1080;
  const PAD = 90;

  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  // Pre-load fonts
  await Promise.all([
    document.fonts.load("700 80px 'Cinzel'"),
    document.fonts.load("400 28px 'Cinzel'"),
  ]).catch(() => { /* best-effort */ });

  drawBackground(ctx, S);
  await drawBrand(ctx, S, 78, 122);
  drawDivider(ctx, 192, PAD, S);

  // ── Ticker ──────────────────────────────────────────────────────────────────
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#d4a017";
  ctx.font = "700 130px 'Cinzel', serif";
  ctx.fillText(p.symbol, PAD, 368);

  // ── Company name ─────────────────────────────────────────────────────────────
  ctx.fillStyle = "#555";
  ctx.font = "400 28px 'Cinzel', serif";
  const company = p.companyName.length > 32 ? p.companyName.slice(0, 30) + "…" : p.companyName;
  ctx.fillText(company, PAD, 416);

  // ── Sector ───────────────────────────────────────────────────────────────────
  if (p.sector && p.sector !== "None") {
    ctx.fillStyle = "#2e2e2e";
    ctx.font = "400 22px 'Cinzel', serif";
    ctx.fillText(p.sector.toUpperCase(), PAD, 455);
  }

  // ── Verdict badge ────────────────────────────────────────────────────────────
  const accent = VERDICT_ACCENT[p.verdict] ?? "#d4a017";
  ctx.font = "700 34px 'Cinzel', serif";
  const verdictTextW = ctx.measureText(p.verdict).width;
  const bPadH = 26;
  const bW = verdictTextW + bPadH * 2;
  const bH = 62;
  const bX = PAD;
  const bY = 494;

  // Fill
  ctx.fillStyle = accent.replace("#", "rgba(") + ",0.10)"; // approximate tint
  // Better approach: manually set the RGBA
  const accentRgba = accentToRgba(accent, 0.1);
  const accentBorder = accentToRgba(accent, 0.35);

  ctx.fillStyle = accentRgba;
  rrect(ctx, bX, bY, bW, bH, 10);
  ctx.fill();

  ctx.strokeStyle = accentBorder;
  ctx.lineWidth = 1.5;
  rrect(ctx, bX, bY, bW, bH, 10);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(p.verdict, bX + bW / 2, bY + bH / 2);

  // ── Confidence ───────────────────────────────────────────────────────────────
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#303030";
  ctx.font = "400 20px 'Cinzel', serif";
  ctx.fillText("ATHENA CONFIDENCE", PAD, 606);

  // Score number
  ctx.font = "700 80px 'Cinzel', serif";
  ctx.fillStyle = "#d8d8d8";
  ctx.fillText(`${p.score}`, PAD, 702);
  const scoreW = ctx.measureText(`${p.score}`).width;

  // /10 suffix
  ctx.font = "400 32px 'Cinzel', serif";
  ctx.fillStyle = "#383838";
  ctx.fillText("/10", PAD + scoreW + 8, 702);

  // Confidence bar background
  const barY = 722;
  const barW = S - PAD * 2;
  const barH = 8;
  ctx.fillStyle = "#1a1300";
  rrect(ctx, PAD, barY, barW, barH, 4);
  ctx.fill();

  // Confidence bar fill (gradient towards verdict color)
  const fillW = (barW * p.score) / 10;
  const barGrad = ctx.createLinearGradient(PAD, 0, PAD + fillW, 0);
  barGrad.addColorStop(0, accent);
  barGrad.addColorStop(1, "#a07810");
  ctx.fillStyle = barGrad;
  rrect(ctx, PAD, barY, fillW, barH, 4);
  ctx.fill();

  // ── Insight quote ─────────────────────────────────────────────────────────────
  ctx.fillStyle = "#484848";
  ctx.font = "italic 400 27px Georgia, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  wrapText(ctx, `"${p.insight}"`, PAD, 790, S - PAD * 2, 44);

  // ── Footer ───────────────────────────────────────────────────────────────────
  drawDivider(ctx, 942, PAD, S);

  ctx.fillStyle = "#2c2c2c";
  ctx.font = "400 20px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("ATHENA INTELLIGENCE  ·  athena.ai", S / 2, 1006);

  return canvas.toDataURL("image/png");
}

// ── Market card generator ──────────────────────────────────────────────────────
async function generateMarketCard(p: MarketCardParams): Promise<string> {
  const S = 1080;
  const PAD = 90;

  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  await document.fonts.load("700 80px 'Cinzel'").catch(() => { /* best-effort */ });

  drawBackground(ctx, S);
  await drawBrand(ctx, S, 78, 122);
  drawDivider(ctx, 192, PAD, S);

  // ── "MARKET REGIME" label ─────────────────────────────────────────────────────
  ctx.fillStyle = "#444";
  ctx.font = "400 24px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("MARKET REGIME", S / 2, 256);

  // ── Big score ────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#e0b82a";
  ctx.font = "700 230px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${p.score}`, S / 2, 548);

  // ── Regime label ─────────────────────────────────────────────────────────────
  ctx.fillStyle = "#d4a017";
  ctx.font = "700 48px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(p.label, S / 2, 626);

  // ── Gradient bar ─────────────────────────────────────────────────────────────
  const barLeft = PAD + 30;
  const barRight = S - PAD - 30;
  const barW = barRight - barLeft;
  const barY = 666;
  const barH = 10;

  ctx.fillStyle = "#111";
  rrect(ctx, barLeft, barY, barW, barH, 5);
  ctx.fill();

  const barGrad = ctx.createLinearGradient(barLeft, 0, barRight, 0);
  barGrad.addColorStop(0,   "#f87171");
  barGrad.addColorStop(0.2, "#fb923c");
  barGrad.addColorStop(0.4, "#60a5fa");
  barGrad.addColorStop(0.6, "#60a5fa");
  barGrad.addColorStop(0.7, "#d4a017");
  barGrad.addColorStop(1,   "#4ade80");
  ctx.fillStyle = barGrad;
  ctx.globalAlpha = 0.78;
  rrect(ctx, barLeft, barY, barW, barH, 5);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Score marker dot
  const markerX = barLeft + (barW * p.score) / 100;
  ctx.fillStyle = "#d4a017";
  ctx.beginPath();
  ctx.arc(markerX, barY + barH / 2, 9, 0, Math.PI * 2);
  ctx.fill();

  // ── Interpretation ────────────────────────────────────────────────────────────
  ctx.fillStyle = "#606060";
  ctx.font = "400 28px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  wrapText(ctx, p.interpretation, S / 2, 742, S - PAD * 2 - 40, 46);

  // ── Positioning bias ──────────────────────────────────────────────────────────
  ctx.fillStyle = "#353535";
  ctx.font = "400 22px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(p.positioning, S / 2, 862);

  // ── Footer ───────────────────────────────────────────────────────────────────
  drawDivider(ctx, 942, PAD, S);

  ctx.fillStyle = "#2c2c2c";
  ctx.font = "400 20px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("ATHENA MARKETS  ·  athena.ai", S / 2, 1006);

  return canvas.toDataURL("image/png");
}

// ── Color helper ───────────────────────────────────────────────────────────────
/** Converts a hex color to rgba string with given alpha */
function accentToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Shared preview modal ───────────────────────────────────────────────────────
function PreviewModal({
  dataUrl,
  filename,
  onClose,
}: {
  dataUrl: string;
  filename: string;
  onClose: () => void;
}) {
  const canNativeShare =
    typeof navigator !== "undefined" &&
    "share" in navigator;

  async function handleShare() {
    // 1. Try Web Share API with file (mobile Safari, Chrome Android)
    try {
      const res  = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: "Athena Analysis" });
        return;
      }
    } catch {
      /* share was cancelled or unsupported — fall through */
    }

    // 2. Mobile without share API → open fullscreen (long-press to save)
    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    if (isTouch) {
      window.open(dataUrl, "_blank");
      return;
    }

    // 3. Desktop fallback → trigger PNG download
    const a = document.createElement("a");
    a.href     = dataUrl;
    a.download = filename;
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
        {/* Scaled preview */}
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

        {/* Action row */}
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

// ── Share button base styles ───────────────────────────────────────────────────
function shareButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    display:       "inline-flex",
    alignItems:    "center",
    gap:           6,
    padding:       "9px 16px",
    minHeight:     44,
    borderRadius:  7,
    border:        "1px solid rgba(212,160,23,0.28)",
    background:    "transparent",
    color:         disabled ? "#444" : "#d4a017",
    fontSize:      10,
    fontWeight:    600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor:        disabled ? "default" : "pointer",
    transition:    "opacity 0.15s",
    fontFamily:    "'Cinzel', serif",
    userSelect:    "none",
  };
}

// ── Share Analysis Card (for /analyze/[ticker]) ────────────────────────────────
export default function ShareButton(props: AnalysisCardParams) {
  const [state, setState]   = useState<"idle" | "generating" | "preview">("idle");
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  async function handleGenerate() {
    if (state !== "idle") return;
    setState("generating");
    try {
      const url = await generateAnalysisCard(props);
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

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={state === "generating"}
        style={shareButtonStyle(state === "generating")}
        onMouseEnter={(e) => { if (state === "idle") (e.currentTarget as HTMLButtonElement).style.opacity = "0.65"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      >
        {state === "generating" ? (
          <span style={{ opacity: 0.6 }}>Generating…</span>
        ) : (
          <>
            <span style={{ fontSize: 13, lineHeight: 1 }}>↑</span>
            Share Card
          </>
        )}
      </button>

      {state === "preview" && dataUrl && (
        <PreviewModal
          dataUrl={dataUrl}
          filename={`${props.symbol}-athena.png`}
          onClose={handleClose}
        />
      )}
    </>
  );
}

// ── Share Market Card (for /markets) ──────────────────────────────────────────
export function ShareMarketCardButton(props: MarketCardParams) {
  const [state, setState]     = useState<"idle" | "generating" | "preview">("idle");
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  async function handleGenerate() {
    if (state !== "idle") return;
    setState("generating");
    try {
      const url = await generateMarketCard(props);
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

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={state === "generating"}
        style={shareButtonStyle(state === "generating")}
        onMouseEnter={(e) => { if (state === "idle") (e.currentTarget as HTMLButtonElement).style.opacity = "0.65"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      >
        {state === "generating" ? (
          <span style={{ opacity: 0.6 }}>Generating…</span>
        ) : (
          <>
            <span style={{ fontSize: 13, lineHeight: 1 }}>↑</span>
            Share
          </>
        )}
      </button>

      {state === "preview" && dataUrl && (
        <PreviewModal
          dataUrl={dataUrl}
          filename="athena-market-regime.png"
          onClose={handleClose}
        />
      )}
    </>
  );
}
