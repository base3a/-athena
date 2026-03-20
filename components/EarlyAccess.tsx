"use client";

import { useState } from "react";

export default function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section id="early-access" suppressHydrationWarning className="w-full max-w-[900px] mt-16 mb-4">
      {/* Divider */}
      <div className="flex items-center gap-4 mb-12">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-[#2a2a2a]" />
        <span className="text-[10px] text-[#555] tracking-widest uppercase">Early Access</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#2a2a2a] to-[#2a2a2a]" />
      </div>

      <div
        className="relative w-full rounded-2xl px-6 py-10 md:px-12 md:py-14 text-center overflow-hidden"
        style={{
          background: "rgba(212,160,23,0.04)",
          border: "1px solid rgba(212,160,23,0.12)",
        }}
      >
        {/* Subtle glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[200px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% -20%, rgba(212,160,23,0.08) 0%, transparent 70%)",
          }}
        />

        {status === "success" ? (
          <div className="relative flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
              style={{ background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 9.5L7 13.5L15 5"
                  stroke="#d4a017"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-white font-semibold text-base tracking-wide">
              Thanks! We&apos;ll keep you updated.
            </p>
            <p className="text-[#666] text-sm">You&apos;re on the list. We&apos;ll be in touch soon.</p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-[10px] font-semibold tracking-widest uppercase"
              style={{
                border: "1px solid rgba(212,160,23,0.2)",
                background: "rgba(212,160,23,0.06)",
                color: "#d4a017",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#d4a017" }}
              />
              Limited Access
            </div>

            <h2
              className="text-2xl md:text-3xl font-bold mb-3 tracking-tight"
              style={{ fontFamily: "'Cinzel', serif", color: "#fff" }}
            >
              Get Early Access to Athena
            </h2>

            <p className="text-[#888] text-sm md:text-base max-w-sm mb-8 leading-relaxed">
              Join the waitlist for early access and product updates.
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={status === "loading"}
                className="flex-1 px-4 py-3 rounded-lg text-sm text-white placeholder-[#555] outline-none transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid #2a2a2a",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(212,160,23,0.4)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid #2a2a2a";
                }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-3 rounded-lg text-[12px] font-semibold tracking-widest uppercase transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, #d4a017 0%, #a07810 100%)",
                  color: "#000",
                }}
              >
                {status === "loading" ? "Joining..." : "Join Early Access"}
              </button>
            </form>

            {status === "error" && (
              <p className="mt-3 text-[12px] text-red-400">{errorMsg}</p>
            )}

            <p className="mt-5 text-[11px] text-[#444] tracking-wide">
              No spam. Unsubscribe at any time.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
