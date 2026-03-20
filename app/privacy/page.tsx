import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Athena Privacy Policy — how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="relative flex-1 bg-black flex flex-col">
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-[#1a1a1a]">
        <Link
          href="/"
          className="text-gold-gradient font-bold tracking-widest hover:opacity-80 transition-opacity"
          style={{ fontFamily: "'Cinzel', serif", fontSize: "1.1rem" }}
        >
          ATHENA
        </Link>
        <Link
          href="/"
          className="text-[11px] text-[#666] hover:text-[#d4a017] tracking-widest uppercase font-medium transition-colors duration-200"
        >
          ← Home
        </Link>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <h1
          className="text-white text-3xl font-bold mb-2 tracking-tight"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Privacy Policy
        </h1>
        <p className="text-[#555] text-sm mb-10 tracking-widest uppercase">Last updated: March 2026</p>

        <div className="space-y-8 text-[#aaa] text-sm leading-7">
          <section>
            <h2 className="text-white text-base font-semibold mb-3 tracking-wide">1. Information We Collect</h2>
            <p>Athena collects only the information you voluntarily provide, such as your email address when signing up for early access. We do not collect personal financial data, trading history, or sensitive account information.</p>
          </section>
          <section>
            <h2 className="text-white text-base font-semibold mb-3 tracking-wide">2. How We Use Your Information</h2>
            <p>Email addresses collected through the early access form are used solely to send product updates and announcements. We do not sell, rent, or share your data with third parties for marketing purposes.</p>
          </section>
          <section>
            <h2 className="text-white text-base font-semibold mb-3 tracking-wide">3. Cookies</h2>
            <p>Athena uses minimal cookies required for core functionality. We do not use advertising or tracking cookies. You may disable cookies in your browser settings without affecting core functionality.</p>
          </section>
          <section>
            <h2 className="text-white text-base font-semibold mb-3 tracking-wide">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure.</p>
          </section>
          <section>
            <h2 className="text-white text-base font-semibold mb-3 tracking-wide">5. Contact</h2>
            <p>For privacy-related questions, please contact us at privacy@athenastocks.ai.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
