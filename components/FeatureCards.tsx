"use client";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
      </svg>
    ),
    title: "Technical Analysis",
    description: "RSI, MACD, Bollinger Bands, moving averages, and pattern recognition across all timeframes.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M7 8h2v5H7zM11 6h2v7h-2zM15 10h2v3h-2z" />
      </svg>
    ),
    title: "Fundamental Analysis",
    description: "Deep-dive into earnings, P/E ratios, revenue growth, debt levels, and institutional holdings.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Sentiment Analysis",
    description: "Real-time news sentiment, analyst ratings aggregation, and social signal processing.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Risk Assessment",
    description: "Volatility metrics, beta analysis, drawdown history, and tail-risk probability modeling.",
  },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="group flex flex-col gap-3 p-5 rounded-xl text-left cursor-default"
          style={{
            background: "linear-gradient(135deg, #0e0e0e 0%, #090909 100%)",
            border: "1px solid #1a1a1a",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#2a1f00";
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 0 20px rgba(212,160,23,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          }}
        >
          <div className="text-[#d4a017] opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            {feature.icon}
          </div>
          <h3 className="text-white text-sm font-semibold tracking-wide">
            {feature.title}
          </h3>
          <p className="text-[#555] text-[12px] leading-relaxed font-light">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}
