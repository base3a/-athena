// Skeleton shown by Next.js Suspense while the server component fetches data.
// Design intent: thin animated gold lines and card outlines — not dark grey blocks.

// ── Thin text-line placeholder ────────────────────────────────────────────────
function Line({
  width = "100%",
  height = 2,
  delay = 0,
  style = {},
}: {
  width?: string | number;
  height?: number;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width,
        borderRadius: 2,
        animationDelay: `${delay}s`,
        ...style,
      }}
    />
  );
}

// ── Outlined card ghost — transparent body, pulsing gold border ───────────────
function CardGhost({
  height,
  className = "",
  style = {},
  children,
}: {
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`skeleton-card rounded-xl ${className}`}
      style={{ height, ...style }}
    >
      {children}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col">

      {/* Gold indeterminate progress bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 overflow-hidden"
        style={{ height: 2, background: "#060400" }}
      >
        <div
          className="absolute inset-y-0"
          style={{
            width: "45%",
            background: "linear-gradient(90deg, transparent 0%, #d4a017 50%, transparent 100%)",
            animation: "progress-sweep 1.8s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Header ── */}
      <div className="border-b border-[#1a1a1a] px-8 py-4 flex items-center gap-6">
        {/* ATHENA wordmark placeholder */}
        <Line width={88} height={3} style={{ borderRadius: 2 }} />
        {/* Search bar placeholder */}
        <CardGhost className="hidden md:block" style={{ height: 36, width: 260 }} />
        {/* Nav links */}
        <div className="ml-auto flex items-center gap-4">
          <Line width={52} height={2} />
          <Line width={44} height={2} delay={0.15} />
        </div>
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-12 py-10">

        {/* ── Company header ── */}
        <div className="flex flex-col md:flex-row md:justify-between gap-6 mb-10 pb-10 border-b border-[#161616]">

          {/* Left — ticker + name + sector */}
          <div className="flex flex-col gap-4">
            {/* Ticker + exchange badge */}
            <div className="flex items-center gap-3">
              <Line width={120} height={4} style={{ borderRadius: 2 }} />
              <CardGhost style={{ height: 22, width: 60, borderRadius: 6 }} />
            </div>
            {/* Company full name */}
            <Line width={240} height={2.5} delay={0.05} />
            {/* Sector · Industry */}
            <Line width={160} height={1.5} delay={0.1} />
          </div>

          {/* Right — price + change */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <Line width={140} height={5} style={{ borderRadius: 2 }} />
            <Line width={100} height={2.5} delay={0.08} />
            <Line width={72} height={1.5} delay={0.14} />
          </div>
        </div>

        {/* ── Key metrics section label ── */}
        <div className="flex items-center gap-4 mb-4">
          <Line width={88} height={1.5} />
          <div className="flex-1 h-px" style={{ background: "rgba(212,160,23,0.06)" }} />
        </div>

        {/* ── Key metrics — 5 card ghosts ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardGhost
              key={i}
              style={{ height: 88, borderRadius: 12, animationDelay: `${i * 0.1}s` }}
            >
              <div className="p-4 flex flex-col justify-between h-full">
                <Line width="50%" height={1.5} delay={i * 0.1} />
                <Line width="70%" height={3} delay={i * 0.1 + 0.1} />
              </div>
            </CardGhost>
          ))}
        </div>

        {/* ── Athena Intelligence section ── */}
        <div className="mb-12">

          {/* Section label */}
          <div className="flex items-center gap-4 mb-6">
            <Line width={130} height={1.5} />
            <div className="flex-1 h-px" style={{ background: "rgba(212,160,23,0.06)" }} />
          </div>

          {/* Verdict hero ghost — uses the scan line for premium feel */}
          <div
            className="rounded-2xl overflow-hidden relative mb-4"
            style={{
              border: "1px solid rgba(212,160,23,0.12)",
              background: "linear-gradient(160deg, #090806 0%, #0c0a00 60%, #090806 100%)",
              minHeight: 220,
              padding: "2.5rem",
              animation: "gold-pulse 2.4s ease-in-out infinite",
            }}
          >
            {/* Scanning line */}
            <div
              className="absolute inset-x-0 h-px pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(212,160,23,0.45) 50%, transparent 100%)",
                animation: "scan-line 3.5s ease-in-out infinite",
              }}
            />
            <div className="flex flex-col gap-5 max-w-sm">
              {/* "Instant Decision" label line */}
              <Line width={96} height={1.5} />
              {/* Giant verdict word placeholder */}
              <Line width={200} height={6} delay={0.1} style={{ borderRadius: 3 }} />
              {/* Summary sentence */}
              <div className="flex flex-col gap-2.5">
                <Line width="90%" height={1.5} delay={0.18} />
                <Line width="72%" height={1.5} delay={0.24} />
              </div>
              {/* Confidence bar area */}
              <div className="flex flex-col gap-2 max-w-xs">
                <div className="flex justify-between">
                  <Line width={70} height={1.5} delay={0.28} />
                  <Line width={28} height={1.5} delay={0.28} />
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1a1300" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "55%",
                      background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2.2s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
              {/* 3 takeaway lines */}
              <div className="flex flex-col gap-3">
                {[92, 80, 68].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="shrink-0 w-1.5 h-1.5 rounded-full"
                      style={{ background: "rgba(212,160,23,0.2)" }}
                    />
                    <Line width={`${w}%`} height={1.5} delay={0.3 + i * 0.08} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deep Dive ghost — collapsible section rows */}
          <CardGhost style={{ borderRadius: 16 }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(212,160,23,0.06)" }}>
              <div className="flex items-center justify-between">
                <Line width={160} height={1.5} />
                <Line width={68} height={1.5} />
              </div>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3.5 flex items-center gap-3"
                  style={{ border: "1px solid rgba(212,160,23,0.05)" }}
                >
                  <div
                    className="shrink-0 w-5 h-5 rounded"
                    style={{ border: "1px solid rgba(212,160,23,0.08)", background: "transparent" }}
                  />
                  <Line width={80 + i * 12} height={1.5} delay={i * 0.07} />
                </div>
              ))}
            </div>
          </CardGhost>
        </div>

        {/* ── 52-week range ── */}
        <div className="flex items-center gap-4 mb-4">
          <Line width={100} height={1.5} />
          <div className="flex-1 h-px" style={{ background: "rgba(212,160,23,0.06)" }} />
        </div>
        <CardGhost style={{ height: 100, borderRadius: 12, marginBottom: 40 }}>
          <div className="p-5 flex flex-col gap-3 h-full justify-center">
            <div className="flex items-center gap-3">
              <Line width={44} height={1.5} />
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(212,160,23,0.05)" }} />
              <Line width={44} height={1.5} />
            </div>
          </div>
        </CardGhost>

        {/* ── Company profile ── */}
        <div className="flex items-center gap-4 mb-4">
          <Line width={110} height={1.5} />
          <div className="flex-1 h-px" style={{ background: "rgba(212,160,23,0.06)" }} />
        </div>
        <div className="flex flex-col gap-2.5 mb-10 max-w-4xl">
          {[100, 96, 100, 91, 86, 60].map((w, i) => (
            <Line key={i} width={`${w}%`} height={1.5} delay={i * 0.05} />
          ))}
        </div>

        {/* ── Additional metrics ── */}
        <div className="flex items-center gap-4 mb-4">
          <Line width={130} height={1.5} />
          <div className="flex-1 h-px" style={{ background: "rgba(212,160,23,0.06)" }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardGhost
              key={i}
              style={{ height: 68, borderRadius: 10, animationDelay: `${i * 0.08}s` }}
            >
              <div className="p-4 flex flex-col justify-between h-full">
                <Line width="55%" height={1.5} delay={i * 0.08} />
                <Line width="65%" height={2} delay={i * 0.08 + 0.1} />
              </div>
            </CardGhost>
          ))}
        </div>

        {/* ── Moving averages ── */}
        <div className="flex items-center gap-4 mb-4">
          <Line width={120} height={1.5} />
          <div className="flex-1 h-px" style={{ background: "rgba(212,160,23,0.06)" }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardGhost
              key={i}
              style={{ height: 68, borderRadius: 10, animationDelay: `${i * 0.1}s` }}
            >
              <div className="p-4 flex flex-col justify-between h-full">
                <Line width="55%" height={1.5} delay={i * 0.1} />
                <Line width="65%" height={2} delay={i * 0.1 + 0.1} />
              </div>
            </CardGhost>
          ))}
        </div>

      </main>
    </div>
  );
}
