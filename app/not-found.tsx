import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex-1 bg-black flex flex-col items-center justify-center px-6 py-24">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[500px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(212,160,23,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative text-center max-w-md">
        {/* Icon */}
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 mx-auto"
          style={{ border: "1px solid #2a1f00", background: "#0d0a00" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d4a017"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>

        {/* 404 number */}
        <p
          className="mb-2"
          style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      "0.65rem",
            fontWeight:    600,
            color:         "#d4a017",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
          }}
        >
          404
        </p>

        {/* Headline */}
        <h1
          className="text-white text-2xl font-bold mb-3"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Page Not Found
        </h1>

        {/* Body */}
        <p className="text-[#555] text-sm leading-relaxed mb-10 max-w-xs mx-auto">
          The page you are looking for doesn&apos;t exist or has been moved.
          Try searching for a stock instead.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3 text-[12px] font-bold tracking-widest uppercase rounded transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
              color:      "#000",
            }}
          >
            ← Back to Athena
          </Link>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 px-7 py-3 text-[12px] font-semibold tracking-widest uppercase rounded transition-colors duration-200"
            style={{
              border:  "1px solid #2a1f00",
              color:   "#d4a017",
              background: "transparent",
            }}
            onMouseEnter={undefined}
          >
            View Markets
          </Link>
        </div>
      </div>
    </div>
  );
}
