import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Stock Analysis — Athena";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Radial glow behind ticker */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            width: 700,
            height: 500,
            background:
              "radial-gradient(ellipse, rgba(212,160,23,0.14) 0%, transparent 65%)",
          }}
        />

        {/* Top gold border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent 0%, #d4a017 40%, #d4a017 60%, transparent 100%)",
            opacity: 0.5,
          }}
        />

        {/* ATHENA label */}
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.6em",
            color: "#555555",
            textTransform: "uppercase",
            marginBottom: 32,
            display: "flex",
          }}
        >
          ATHENA AI ANALYSIS
        </div>

        {/* Big ticker symbol */}
        <div
          style={{
            fontSize: symbol.length > 4 ? 110 : 140,
            fontWeight: 700,
            color: "#d4a017",
            letterSpacing: "0.06em",
            lineHeight: 1,
            display: "flex",
          }}
        >
          {symbol}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 300,
            color: "#666666",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            marginTop: 24,
            marginBottom: 48,
            display: "flex",
          }}
        >
          AI-Powered Investment Analysis
        </div>

        {/* Metric preview pills */}
        <div style={{ display: "flex", gap: 20 }}>
          {["Fundamentals", "Valuation", "Risk", "AI Verdict"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 20px",
                border: "1px solid #1f1f1f",
                borderRadius: 4,
                color: "#444",
                fontSize: 13,
                letterSpacing: "0.2em",
                display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ width: 50, height: 1, background: "#1a1a1a" }} />
          <span
            style={{ fontSize: 14, color: "#2a2a2a", letterSpacing: "0.3em" }}
          >
            athenastocks.ai
          </span>
          <div style={{ width: 50, height: 1, background: "#1a1a1a" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
