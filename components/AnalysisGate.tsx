"use client";

import { useState, useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import UsageLimitModal from "@/components/UsageLimitModal";

// ── Storage keys ────────────────────────────────────────────────────────────
const COUNT_KEY       = "athena_analysis_count";
const DATE_KEY        = "athena_analysis_date";
const UNLOCK_KEY      = "athena_unlocked";
const UNLOCK_DATE_KEY = "athena_unlock_date";
const FREE_LIMIT      = 1;   // free full analyses per day
const UNLOCK_DAYS     = 30;  // days unlock lasts

// ── Helpers ─────────────────────────────────────────────────────────────────

function checkUnlocked(): boolean {
  try {
    if (localStorage.getItem(UNLOCK_KEY) !== "true") return false;
    const raw = localStorage.getItem(UNLOCK_DATE_KEY);
    if (!raw) return false;
    const diffDays = (Date.now() - parseInt(raw, 10)) / 86_400_000;
    if (diffDays > UNLOCK_DAYS) {
      // Expired — clear and re-gate
      localStorage.removeItem(UNLOCK_KEY);
      localStorage.removeItem(UNLOCK_DATE_KEY);
      return false;
    }
    return true;
  } catch { return false; }
}

/** Consume one free slot. Returns true if the slot was available, false if gated. */
function consumeFreeSlot(): boolean {
  try {
    const today = new Date().toDateString();
    const count = localStorage.getItem(DATE_KEY) === today
      ? (parseInt(localStorage.getItem(COUNT_KEY) ?? "0", 10) || 0)
      : 0;
    if (count < FREE_LIMIT) {
      localStorage.setItem(DATE_KEY,  today);
      localStorage.setItem(COUNT_KEY, String(count + 1));
      return true;
    }
    return false;
  } catch { return true; } // graceful: never gate on error
}

// ── Component ────────────────────────────────────────────────────────────────

type Status = "full" | "gated";

export default function AnalysisGate({ children }: { children: ReactNode }) {
  // Start "full" so SSR HTML and first hydration match — no content flash.
  // useLayoutEffect fires before paint and applies the gate if needed.
  const [status,    setStatus]    = useState<Status>("full");
  const [showModal, setShowModal] = useState(false);

  useLayoutEffect(() => {
    if (checkUnlocked()) return;           // already unlocked — stay "full"
    if (!consumeFreeSlot()) setStatus("gated"); // no free slot left
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {children}

      {/* ── Blur overlay — appears when gated ──────────────────────────────── */}
      {status === "gated" && (
        <>
          {/* Layer 1: frosted blur starting below the verdict card */}
          <div
            style={{
              position:              "absolute",
              top:                   700,   // below verdict + confidence + 2 takeaways
              left:                  0,
              right:                 0,
              bottom:                0,
              backdropFilter:        "blur(5px)",
              WebkitBackdropFilter:  "blur(5px)",
              background:            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.75) 12%, rgba(0,0,0,0.97) 30%)",
              zIndex:                10,
            }}
          />

          {/* Layer 2: CTA card — sticky so it stays visible while scrolling */}
          <div
            style={{
              position: "absolute",
              top:       760,
              left:      0,
              right:     0,
              zIndex:    11,
              display:   "flex",
              flexDirection: "column",
              alignItems:    "center",
              gap:           16,
            }}
          >
            {/* Lock icon */}
            <div
              style={{
                width:          48,
                height:         48,
                borderRadius:   "50%",
                border:         "1px solid rgba(212,160,23,0.3)",
                background:     "rgba(212,160,23,0.06)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
              </svg>
            </div>

            <p
              style={{
                color:       "#fff",
                fontSize:    "0.9rem",
                fontWeight:  600,
                letterSpacing: "0.01em",
                textAlign:   "center",
                margin:      0,
              }}
            >
              You&apos;re viewing a preview.
            </p>

            <p
              style={{
                color:       "#888",
                fontSize:    "0.8rem",
                letterSpacing: "0.01em",
                textAlign:   "center",
                maxWidth:    340,
                margin:      0,
                lineHeight:  1.6,
              }}
            >
              Create your free account to unlock the complete analysis — including deep insights, risk assessment, and AI verdict reasoning.
            </p>

            <button
              onClick={() => setShowModal(true)}
              style={{
                padding:       "12px 32px",
                borderRadius:  8,
                background:    "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
                color:         "#000",
                fontSize:      "0.72rem",
                fontWeight:    700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                border:        "none",
                cursor:        "pointer",
                boxShadow:     "0 4px 20px rgba(212,160,23,0.35)",
              }}
            >
              Unlock Free Access Now
            </button>
          </div>

          {/* Modal — rendered at document.body level */}
          {showModal && createPortal(
            <UsageLimitModal
              onUnlock={() => {
                setShowModal(false);
                setStatus("full");
              }}
            />,
            document.body,
          )}
        </>
      )}
    </div>
  );
}
