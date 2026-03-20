"use client";

import { useEffect, useState } from "react";

type Phase = "entering" | "holding" | "leaving" | "done";

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("entering");

  useEffect(() => {
    // 50ms  → content fades/rises in  (300ms CSS transition)
    // 800ms → overlay begins fade-out (450ms CSS transition)
    // 1250ms → unmount
    const t1 = setTimeout(() => setPhase("holding"),  50);
    const t2 = setTimeout(() => setPhase("leaving"),  800);
    const t3 = setTimeout(() => setPhase("done"),    1250);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === "done") return null;

  const isLeaving  = phase === "leaving";
  const isEntering = phase === "entering";

  return (
    <div
      aria-hidden="true"
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        9999,
        background:    "#000",
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        // Overlay fade-out
        opacity:       isLeaving ? 0 : 1,
        transition:    isLeaving ? "opacity 450ms ease-out" : "none",
        pointerEvents: isLeaving ? "none" : "all",
        willChange:    isLeaving ? "opacity" : "auto",
      }}
    >
      {/* Radial gold glow — matches homepage */}
      <div
        style={{
          position:       "absolute",
          inset:          0,
          background:     "radial-gradient(ellipse 55% 45% at 50% 40%, rgba(212,160,23,0.11) 0%, transparent 70%)",
          pointerEvents:  "none",
        }}
      />

      {/* Centered brand content — fades + rises on enter */}
      <div
        style={{
          position:      "relative",
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          gap:           14,
          opacity:       isEntering ? 0 : 1,
          transform:     isEntering ? "translateY(10px)" : "translateY(0)",
          transition:    "opacity 300ms ease-out, transform 300ms ease-out",
        }}
      >
        {/* Owl */}
        <svg
          width="62"
          height="62"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="20" cy="24" rx="10" ry="12" fill="#1a1400" stroke="#d4a017" strokeWidth="1.2" />
          <circle cx="20" cy="13" r="8" fill="#1a1400" stroke="#d4a017" strokeWidth="1.2" />
          <polygon points="13,7 11,2 16,6" fill="#d4a017" />
          <polygon points="27,7 29,2 24,6" fill="#d4a017" />
          <circle cx="16.5" cy="13" r="3" fill="#000" stroke="#d4a017" strokeWidth="1" />
          <circle cx="16.5" cy="13" r="1.4" fill="#d4a017" opacity="0.9" />
          <circle cx="23.5" cy="13" r="3" fill="#000" stroke="#d4a017" strokeWidth="1" />
          <circle cx="23.5" cy="13" r="1.4" fill="#d4a017" opacity="0.9" />
          <polygon points="20,15.5 18.5,18 21.5,18" fill="#d4a017" opacity="0.8" />
          <path d="M11 20 Q8 26 11 32" stroke="#d4a017" strokeWidth="0.8" fill="none" opacity="0.6" />
          <path d="M29 20 Q32 26 29 32" stroke="#d4a017" strokeWidth="0.8" fill="none" opacity="0.6" />
          <path d="M17 22 Q20 24 23 22" stroke="#d4a017" strokeWidth="0.6" fill="none" opacity="0.5" />
          <path d="M16 26 Q20 28 24 26" stroke="#d4a017" strokeWidth="0.6" fill="none" opacity="0.5" />
        </svg>

        {/* ATHENA wordmark */}
        <span
          style={{
            fontFamily:    "'Cinzel', Georgia, serif",
            fontSize:      "2.2rem",
            fontWeight:    700,
            letterSpacing: "0.18em",
            color:         "#d4a017",
            lineHeight:    1,
          }}
        >
          ATHENA
        </span>

        {/* Thin gold divider */}
        <div
          style={{
            width:      80,
            height:     1,
            background: "linear-gradient(to right, transparent, rgba(212,160,23,0.5), transparent)",
            marginTop:  -4,
          }}
        />

        {/* Subtitle */}
        <span
          style={{
            fontFamily:    "'Cinzel', Georgia, serif",
            fontSize:      "0.6rem",
            fontWeight:    400,
            letterSpacing: "0.3em",
            color:         "#555",
            textTransform: "uppercase",
            marginTop:     -4,
          }}
        >
          AI-Powered Stock Intelligence
        </span>
      </div>
    </div>
  );
}
