export default function AthenaLogo() {
  return (
    <div className="flex items-center justify-center gap-3 select-none">
      {/* Owl / Athena icon */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Body */}
        <ellipse cx="20" cy="24" rx="10" ry="12" fill="#1a1400" stroke="#d4a017" strokeWidth="1.2" />
        {/* Head */}
        <circle cx="20" cy="13" r="8" fill="#1a1400" stroke="#d4a017" strokeWidth="1.2" />
        {/* Left ear tuft */}
        <polygon points="13,7 11,2 16,6" fill="#d4a017" />
        {/* Right ear tuft */}
        <polygon points="27,7 29,2 24,6" fill="#d4a017" />
        {/* Left eye */}
        <circle cx="16.5" cy="13" r="3" fill="#000" stroke="#d4a017" strokeWidth="1" />
        <circle cx="16.5" cy="13" r="1.4" fill="#d4a017" opacity="0.9" />
        {/* Right eye */}
        <circle cx="23.5" cy="13" r="3" fill="#000" stroke="#d4a017" strokeWidth="1" />
        <circle cx="23.5" cy="13" r="1.4" fill="#d4a017" opacity="0.9" />
        {/* Beak */}
        <polygon points="20,15.5 18.5,18 21.5,18" fill="#d4a017" opacity="0.8" />
        {/* Wing left detail */}
        <path d="M11 20 Q8 26 11 32" stroke="#d4a017" strokeWidth="0.8" fill="none" opacity="0.6" />
        {/* Wing right detail */}
        <path d="M29 20 Q32 26 29 32" stroke="#d4a017" strokeWidth="0.8" fill="none" opacity="0.6" />
        {/* Chest feather lines */}
        <path d="M17 22 Q20 24 23 22" stroke="#d4a017" strokeWidth="0.6" fill="none" opacity="0.5" />
        <path d="M16 26 Q20 28 24 26" stroke="#d4a017" strokeWidth="0.6" fill="none" opacity="0.5" />
      </svg>

      {/* Wordmark */}
      <span
        className="text-gold-gradient glow-gold-text"
        style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: "2.6rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          lineHeight: 1,
        }}
      >
        ATHENA
      </span>
    </div>
  );
}
