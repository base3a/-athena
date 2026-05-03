"use client";

import { useState, useEffect, useRef } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function FeedbackButton() {
  const [open,    setOpen]    = useState(false);
  const [message, setMessage] = useState("");
  const [status,  setStatus]  = useState<Status>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      // Reset state when closed
      setTimeout(() => {
        setMessage("");
        setStatus("idle");
      }, 300);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  async function submit() {
    if (!message.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message, page: window.location.pathname }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Share feedback"
        style={{
          position:      "fixed",
          bottom:        24,
          right:         24,
          zIndex:        100,
          display:       "flex",
          alignItems:    "center",
          gap:           6,
          padding:       "8px 14px",
          borderRadius:  8,
          background:    "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
          color:         "#000",
          fontSize:      "0.68rem",
          fontWeight:    700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          border:        "none",
          cursor:        "pointer",
          boxShadow:     "0 4px 20px rgba(212,160,23,0.30), 0 1px 4px rgba(0,0,0,0.6)",
          transition:    "opacity 0.2s ease, transform 0.2s ease",
          whiteSpace:    "nowrap",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.opacity   = "0.88";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.opacity   = "1";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Share Feedback
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position:   "fixed",
            inset:      0,
            zIndex:     200,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share feedback"
          style={{
            position:     "fixed",
            bottom:       80,
            right:        24,
            zIndex:       201,
            width:        "min(360px, calc(100vw - 48px))",
            background:   "#0b0b0b",
            border:       "1px solid rgba(212,175,55,0.18)",
            borderRadius: 16,
            boxShadow:    "0 24px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)",
            padding:      "24px 20px 20px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#7A7A7A", fontWeight: 600 }}>
              Share Feedback
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 2, lineHeight: 1 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {status === "sent" ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ margin: "0 0 6px", fontSize: "1.4rem" }}>✓</p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#4ade80", fontWeight: 600 }}>Thanks — received.</p>
              <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#555" }}>We read every message.</p>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind? A bug, a feature, a thought..."
                rows={5}
                style={{
                  width:        "100%",
                  boxSizing:    "border-box",
                  background:   "#111",
                  border:       "1px solid #222",
                  borderRadius: 10,
                  padding:      "12px 14px",
                  fontSize:     "0.82rem",
                  lineHeight:   1.6,
                  color:        "#e5e5e5",
                  resize:       "none",
                  outline:      "none",
                  fontFamily:   "inherit",
                  transition:   "border-color 0.2s",
                }}
                onFocus={e  => { e.currentTarget.style.borderColor = "rgba(212,160,23,0.4)"; }}
                onBlur={e   => { e.currentTarget.style.borderColor = "#222"; }}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
              />

              {status === "error" && (
                <p style={{ margin: "8px 0 0", fontSize: "0.72rem", color: "#f87171" }}>
                  Something went wrong — please try again.
                </p>
              )}

              <button
                onClick={submit}
                disabled={!message.trim() || status === "sending"}
                style={{
                  marginTop:     12,
                  width:         "100%",
                  padding:       "11px 0",
                  borderRadius:  8,
                  border:        "none",
                  background:    message.trim() ? "linear-gradient(135deg, #d4a017 0%, #a07810 100%)" : "#1a1a1a",
                  color:         message.trim() ? "#000" : "#444",
                  fontSize:      "0.72rem",
                  fontWeight:    700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor:        message.trim() ? "pointer" : "not-allowed",
                  transition:    "background 0.2s, color 0.2s",
                }}
              >
                {status === "sending" ? "Sending…" : "Send Feedback"}
              </button>

              <p style={{ margin: "10px 0 0", fontSize: "0.65rem", color: "#383838", textAlign: "center" }}>
                ⌘ + Enter to send
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
