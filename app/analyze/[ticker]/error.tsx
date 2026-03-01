"use client";

import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ border: "1px solid #2a1f00", background: "#0d0a00" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d4a017"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>

        <h1
          className="text-white text-2xl font-bold mb-3"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Analysis Failed
        </h1>
        <p className="text-[#666] text-sm leading-relaxed mb-8">
          {error.message || "An unexpected error occurred while fetching the stock data."}
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={reset}
            className="px-6 py-3 text-[12px] font-semibold tracking-widest uppercase rounded transition-colors"
            style={{ border: "1px solid #2a1f00", color: "#d4a017", background: "transparent" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "#0d0a00")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
            }
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-[12px] font-bold tracking-widest uppercase rounded transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
              color: "#000",
            }}
          >
            ← New Search
          </Link>
        </div>
      </div>
    </div>
  );
}
