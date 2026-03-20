export default function ValueProp() {
  return (
    <div className="w-full max-w-[900px] mt-10 text-center">
      {/* Headline */}
      <p
        className="text-white font-semibold mb-3 leading-snug"
        style={{ fontFamily: "'Cinzel', serif", fontSize: "1.05rem", letterSpacing: "0.03em" }}
      >
        Any stock. Full clarity. Seconds.
      </p>

      {/* Description */}
      <p className="text-sm leading-relaxed mx-auto mb-8 max-w-sm" style={{ color: "#666" }}>
        Traditional research means pulling data from multiple sources — charts, filings, news,
        and reports. Athena consolidates it all and delivers a clear, actionable verdict in seconds.
      </p>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-3 text-left">
        {/* Traditional */}
        <div
          className="p-4 rounded-lg flex flex-col gap-2"
          style={{ background: "#080808", border: "1px solid #1c1c1c" }}
        >
          <p
            className="text-[10px] tracking-widest uppercase mb-1"
            style={{ color: "#3a3a3a", fontFamily: "'Cinzel', serif" }}
          >
            Traditional
          </p>
          {[
            "Scattered data sources",
            "Charts & filings",
            "Financial reports",
            "Hours of research",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "#2a2a2a" }}>—</span>
              <span className="text-[12px]" style={{ color: "#484848" }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Athena */}
        <div
          className="p-4 rounded-lg flex flex-col gap-2"
          style={{
            background: "#080808",
            border: "1px solid rgba(212,160,23,0.45)",
          }}
        >
          <p
            className="text-[10px] tracking-widest uppercase mb-1"
            style={{ color: "#d4a017", fontFamily: "'Cinzel', serif" }}
          >
            Athena
          </p>
          {[
            "One ticker",
            "AI analysis",
            "Clear verdict",
            "Under 3 seconds",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "#d4a017" }}>✓</span>
              <span className="text-[12px]" style={{ color: "#888" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
