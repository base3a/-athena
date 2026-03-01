import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Athena AI — AI-Powered Stock Analysis Tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
        {/* Top gold radial glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 500,
            background:
              "radial-gradient(ellipse, rgba(212,160,23,0.18) 0%, transparent 65%)",
          }}
        />

        {/* Bottom accent glow */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 300,
            background:
              "radial-gradient(ellipse, rgba(212,160,23,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Top border line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent 0%, #d4a017 40%, #d4a017 60%, transparent 100%)",
            opacity: 0.6,
          }}
        />

        {/* ATHENA wordmark */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: "0.35em",
            color: "#d4a017",
            marginBottom: 16,
            display: "flex",
          }}
        >
          ATHENA
        </div>

        {/* Divider */}
        <div
          style={{
            width: 60,
            height: 1,
            background: "#2a2a2a",
            marginBottom: 20,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 300,
            letterSpacing: "0.5em",
            color: "#888888",
            textTransform: "uppercase",
            marginBottom: 48,
            display: "flex",
          }}
        >
          AI Stock Analysis Tool
        </div>

        {/* Feature pills row */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 48,
          }}
        >
          {["Fundamental Analysis", "AI Verdicts", "Risk Assessment"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 22px",
                border: "1px solid rgba(212,160,23,0.25)",
                borderRadius: 6,
                color: "#888",
                fontSize: 15,
                letterSpacing: "0.15em",
                background: "rgba(212,160,23,0.05)",
                display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 18,
            color: "#444",
            letterSpacing: "0.25em",
            display: "flex",
          }}
        >
          INSTITUTIONAL-GRADE INTELLIGENCE FOR EVERY INVESTOR
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
          <span style={{ fontSize: 14, color: "#333", letterSpacing: "0.3em" }}>
            athenastocks.ai
          </span>
          <div style={{ width: 50, height: 1, background: "#1a1a1a" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
