"use client";

export default function FeedbackButton() {
  return (
    <a
      href="https://tally.so/r/Ek0KNr"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Share feedback"
      style={{
        position:     "fixed",
        bottom:       24,
        right:        24,
        zIndex:       100,
        display:      "flex",
        alignItems:   "center",
        gap:          6,
        padding:      "8px 14px",
        borderRadius: 8,
        background:   "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
        color:        "#000",
        fontSize:     "0.68rem",
        fontWeight:   700,
        letterSpacing:"0.12em",
        textTransform:"uppercase",
        textDecoration:"none",
        boxShadow:    "0 4px 20px rgba(212,160,23,0.30), 0 1px 4px rgba(0,0,0,0.6)",
        transition:   "opacity 0.2s ease, transform 0.2s ease",
        whiteSpace:   "nowrap",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
      }}
    >
      {/* Chat bubble icon */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      Share Feedback
    </a>
  );
}
