import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Athena Terms of Service — the rules and conditions for using Athena.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-[#555] text-sm mb-10 tracking-widest uppercase">Last updated: March 2026</p>

        <div className="space-y-8 text-[#aaa] text-sm leading-7">
          <section>
            <h2 className="text-white text-base font-semibold mb-3 tracking-wide">1. Acceptance of Terms</h2>
            <p>By accessing or using Athena, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
          </section>
          <section>
            <h2 className="text-white text-base font-semibold mb-3 tracking-wide">2. Use of the Service</h2>
            <p>Athena is provided for informational and educational purposes only. You may use the service for personal, non-commercial research. You may not scrape, reproduce, or redistribute Athena content without written permission.</p>
          </section>
          <section>
            <h2 className="text-white text-base font-semibold mb-3 tracking-wide">3. No Financial Advice</h2>
            <p>All content on Athena is for informational purposes only and does not constitute financial, investment, legal, or tax advice. Always consult a qualified financial professional before making investment decisions.</p>
          </section>
          <section>
            <h2 className="text-white text-base font-semibold mb-3 tracking-wide">4. Limitation of Liability</h2>
            <p>Athena is provided "as is" without warranties of any kind. We are not liable for any losses or damages arising from your use of, or reliance on, information provided by Athena.</p>
          </section>
          <section>
            <h2 className="text-white text-base font-semibold mb-3 tracking-wide">5. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of Athena after changes constitutes acceptance of the updated terms.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
