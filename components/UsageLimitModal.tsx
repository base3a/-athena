"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

const TALLY_URL       = "https://tally.so/r/2ErjBb";
const UNLOCK_KEY      = "athena_unlocked";
const UNLOCK_DATE_KEY = "athena_unlock_date";

interface Props {
  onUnlock: () => void;
}

export default function UsageLimitModal({ onUnlock }: Props) {
  const [email, setEmail] = useState("");

  function handleGetAccess() {
    // 1. Persist unlock (30 days) in localStorage
    try {
      localStorage.setItem(UNLOCK_KEY,      "true");
      localStorage.setItem(UNLOCK_DATE_KEY, String(Date.now()));
    } catch { /* ignore — storage may be unavailable */ }

    // 2. Open Tally form in a new tab (pre-fill email if provided)
    const url = email.trim()
      ? `${TALLY_URL}?email=${encodeURIComponent(email.trim())}`
      : TALLY_URL;
    window.open(url, "_blank", "noopener,noreferrer");

    // 3. Grant immediate full access
    onUnlock();
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: 200, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl px-8 py-10 text-center"
        style={{
          background:  "#000",
          border:      "1px solid rgba(212,160,23,0.35)",
          boxShadow:   "0 0 80px rgba(212,160,23,0.10), 0 32px 64px rgba(0,0,0,0.9)",
        }}
      >
        {/* Top glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[200px] rounded-t-2xl"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,160,23,0.13) 0%, transparent 70%)",
          }}
        />

        {/* Lock icon */}
        <div
          className="relative inline-flex items-center justify-center w-12 h-12 rounded-full mb-6"
          style={{ border: "1px solid rgba(212,160,23,0.3)", background: "rgba(212,160,23,0.06)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
          </svg>
        </div>

        <div className="relative">
          <h2
            className="text-xl font-bold mb-2 text-white"
            style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.02em" }}
          >
            Unlock Full Access
          </h2>

          <p className="text-[#888] text-sm mb-7 leading-relaxed">
            Register free to unlock 30 days of unlimited AI analysis.
          </p>

          <div className="flex flex-col gap-3">
            {/* Email input */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-[#555] outline-none transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2a" }}
              onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(212,160,23,0.5)"; }}
              onBlur={(e)  => { e.currentTarget.style.border = "1px solid #2a2a2a"; }}
              onKeyDown={(e) => { if (e.key === "Enter") handleGetAccess(); }}
            />

            {/* CTA button */}
            <button
              onClick={handleGetAccess}
              className="w-full py-3 rounded-lg text-[12px] font-semibold tracking-widest uppercase transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #d4a017 0%, #a07810 100%)", color: "#000" }}
            >
              Get Free Access
            </button>
          </div>

          <p className="mt-5 text-[11px] text-[#444] tracking-wide">
            No credit card required &middot; 30 days of full access
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
