"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STEPS = [
  "Reading financial statements",
  "Evaluating profitability metrics",
  "Scanning market sentiment",
  "Analyzing valuation multiples",
  "Building investment thesis",
] as const;

// Each step reveals 1.5 s after the previous one
const STEP_DELAY_MS = 1500;

export default function Loading() {
  const pathname  = usePathname();
  const ticker    = pathname?.split("/analyze/")[1]?.toUpperCase() ?? "…";
  const [count, setCount] = useState(1); // how many steps are "active or done"

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setCount(i + 2), 400 + i * STEP_DELAY_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex-1 bg-black flex flex-col items-center justify-center py-24">

      {/* Indeterminate gold progress bar — fixed to top */}
      <div
        className="fixed top-0 left-0 right-0 z-50 overflow-hidden"
        style={{ height: 2, background: "#060400" }}
      >
        <div
          className="absolute inset-y-0"
          style={{
            width: "45%",
            background:
              "linear-gradient(90deg, transparent 0%, #d4a017 50%, transparent 100%)",
            animation: "progress-sweep 1.8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Centre panel */}
      <div className="text-center w-full max-w-sm px-6">

        {/* Orbit rings */}
        <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-8">
          <div
            className="absolute w-16 h-16 rounded-full"
            style={{
              border: "1px dashed rgba(212,160,23,0.15)",
              animation: "spin-slow 12s linear infinite",
            }}
          />
          <div
            className="absolute w-11 h-11 rounded-full"
            style={{
              border: "1px solid rgba(212,160,23,0.22)",
              animation: "spin-slow 8s linear infinite reverse",
            }}
          />
          {/* Athena icon */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#0c0900", border: "1px solid #3d2d00" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3C9 3 6.5 5 6.5 8C6.5 10.5 7.5 12 9 13L9 15L15 15L15 13C16.5 12 17.5 10.5 17.5 8C17.5 5 15 3 12 3Z"
                stroke="#d4a017" strokeWidth="1.3" fill="none" strokeLinejoin="round"
              />
              <circle cx="9.8"  cy="8" r="1.3" fill="#d4a017" />
              <circle cx="14.2" cy="8" r="1.3" fill="#d4a017" />
              <path
                d="M9 15L9 17C9 18.5 10.2 19.5 12 19.5C13.8 19.5 15 18.5 15 17L15 15"
                stroke="#d4a017" strokeWidth="1.3" fill="none" strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Eyebrow */}
        <p
          className="mb-2"
          style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      "0.6rem",
            fontWeight:    600,
            color:         "#d4a017",
            letterSpacing: "0.38em",
            textTransform: "uppercase",
          }}
        >
          Athena Intelligence
        </p>

        {/* Ticker headline */}
        <p
          className="mb-10"
          style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      "1.55rem",
            fontWeight:    700,
            color:         "#e8e8e8",
            letterSpacing: "0.05em",
            lineHeight:    1.2,
          }}
        >
          Analyzing{" "}
          <span style={{ color: "#d4a017" }}>{ticker}</span>
        </p>

        {/* Progressive step list */}
        <div className="flex flex-col gap-4 text-left">
          {STEPS.map((step, i) => {
            const active  = i === count - 1;
            const done    = i < count - 1;
            const pending = i >= count;

            return (
              <div
                key={step}
                className="flex items-center gap-3"
                style={{
                  opacity:    pending ? 0.15 : 1,
                  transform:  pending ? "translateY(4px)" : "translateY(0)",
                  transition: "opacity 0.6s ease, transform 0.6s ease",
                }}
              >
                {/* Status dot */}
                <div
                  className="shrink-0 rounded-full"
                  style={{
                    width:      6,
                    height:     6,
                    background: done || active ? "#d4a017" : "#252525",
                    boxShadow:  active
                      ? "0 0 8px rgba(212,160,23,0.7), 0 0 16px rgba(212,160,23,0.3)"
                      : "none",
                    transition: "background 0.4s ease, box-shadow 0.4s ease",
                  }}
                />

                {/* Step label */}
                <span
                  className="flex-1"
                  style={{
                    fontSize:      "0.85rem",
                    color:         done ? "#666" : active ? "#d4d4d4" : "#2a2a2a",
                    letterSpacing: "0.01em",
                    lineHeight:    1,
                    transition:    "color 0.4s ease",
                  }}
                >
                  {step}
                </span>

                {/* Active pulse */}
                {active && (
                  <span
                    style={{
                      fontSize:  7,
                      color:     "#d4a017",
                      animation: "pulse 1.4s ease-in-out infinite",
                    }}
                  >
                    ●
                  </span>
                )}

                {/* Done check */}
                {done && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color:    "#4a3a12",
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Sweeping progress line */}
        <div
          className="mt-10 w-full relative overflow-hidden rounded-full"
          style={{ height: 1, background: "#111000" }}
        >
          <div
            className="absolute inset-y-0"
            style={{
              width:      "40%",
              background: "linear-gradient(90deg, transparent, #d4a017, transparent)",
              animation:  "progress-sweep 1.8s ease-in-out infinite",
            }}
          />
        </div>

        {/* Subtle footnote */}
        <p
          className="mt-6"
          style={{
            fontSize:      "0.65rem",
            color:         "#222",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          AI research engine · 13-point framework
        </p>

      </div>
    </div>
  );
}
