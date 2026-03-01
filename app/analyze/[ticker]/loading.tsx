// Skeleton shown by Next.js Suspense while the server component fetches data

// ── Skeleton bone ──────────────────────────────────────────────────────────
function Bone({
  className = "",
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`skeleton rounded ${className}`}
      style={style}
    />
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────
export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col">

      {/* ── Gold indeterminate progress bar (top) ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 overflow-hidden"
        style={{ height: 2, background: "#080600" }}
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

      {/* ── Header ── */}
      <div className="border-b border-[#1a1a1a] px-8 py-4 flex items-center gap-6">
        <Bone style={{ height: 18, width: 90 }} />
        <Bone className="hidden md:block" style={{ height: 36, width: 260, background: "#0d0d0d" }} />
        <Bone className="ml-auto" style={{ height: 14, width: 60 }} />
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-12 py-10">

        {/* ── Company header ── */}
        <div className="flex flex-col md:flex-row md:justify-between gap-6 mb-10 pb-10 border-b border-[#161616]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Bone style={{ height: 40, width: 110 }} />
              <Bone style={{ height: 22, width: 64, background: "#0d0d00" }} />
            </div>
            <Bone style={{ height: 22, width: 220, background: "#0d0d0d" }} />
            <Bone style={{ height: 11, width: 160, background: "#0a0a0a" }} />
          </div>
          <div className="space-y-2">
            <Bone className="md:ml-auto" style={{ height: 48, width: 150 }} />
            <Bone className="md:ml-auto" style={{ height: 18, width: 110, background: "#0d0d0d" }} />
            <Bone className="md:ml-auto" style={{ height: 11, width: 80, background: "#0a0a0a" }} />
          </div>
        </div>

        {/* ── Key metrics section label ── */}
        <Bone style={{ height: 10, width: 90, background: "#0d0d0d", marginBottom: 16 }} />

        {/* ── Key metrics — 5 cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton rounded-xl"
              style={{ height: 88, border: "1px solid #161616" }}
            />
          ))}
        </div>

        {/* ── Athena Analysis skeleton ── */}
        <div className="mb-12">
          {/* Section label */}
          <div className="flex items-center gap-4 mb-6">
            <Bone style={{ height: 10, width: 120 }} />
            <div className="flex-1 h-px" style={{ background: "#1a1a1a" }} />
          </div>

          {/* Card shell */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid #1e1700" }}
          >
            {/* Verdict hero placeholder */}
            <div
              className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 border-b"
              style={{ borderColor: "#1a1500", background: "#070700" }}
            >
              <div className="flex-1 space-y-3">
                <Bone style={{ height: 10, width: 130, background: "#131000" }} />
                <Bone style={{ height: 54, width: 210, background: "#161200" }} />
                <Bone style={{ height: 13, width: "80%", background: "#0e0c00" }} />
                <Bone style={{ height: 13, width: "65%", background: "#0e0c00" }} />
              </div>
              <Bone
                style={{
                  height: 108,
                  width: 148,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: "#0a0900",
                  border: "1px solid #1a1500",
                }}
              />
            </div>

            {/* Q&A grid placeholder — 6 cards */}
            <div className="p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl"
                    style={{ background: "#060606", border: "1px solid #141414" }}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <Bone style={{ height: 20, width: 20, borderRadius: 4 }} />
                      <Bone style={{ height: 10, width: 100, background: "#131000" }} />
                    </div>
                    <div className="space-y-2">
                      <Bone style={{ height: 12, width: "100%" }} />
                      <Bone style={{ height: 12, width: "85%" }} />
                      <Bone style={{ height: 12, width: "68%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 52-week range ── */}
        <div
          className="skeleton rounded-xl mb-10"
          style={{ height: 112, border: "1px solid #161616" }}
        />

        {/* ── Company profile ── */}
        <Bone style={{ height: 10, width: 120, background: "#0d0d0d", marginBottom: 16 }} />
        <div className="space-y-2.5 mb-10 max-w-4xl">
          {[100, 97, 100, 93, 88, 62].map((w, i) => (
            <Bone
              key={i}
              style={{ height: 14, width: `${w}%`, background: "#0a0a0a" }}
            />
          ))}
        </div>

        {/* ── Additional metrics ── */}
        <Bone style={{ height: 10, width: 130, background: "#0d0d0d", marginBottom: 16 }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton rounded-lg"
              style={{ height: 68, border: "1px solid #141414" }}
            />
          ))}
        </div>

        {/* ── Moving averages ── */}
        <Bone style={{ height: 10, width: 130, background: "#0d0d0d", marginBottom: 16 }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton rounded-lg"
              style={{ height: 68, border: "1px solid #141414" }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
