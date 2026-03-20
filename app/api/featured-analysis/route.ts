import { getFeaturedData } from "@/lib/featuredAnalysis";

export type { Verdict, FeaturedData } from "@/lib/featuredAnalysis";

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const data = await getFeaturedData();
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[featured-analysis] GET error:", msg);
    return Response.json(
      { error: "Analysis temporarily unavailable" },
      { status: 503 },
    );
  }
}
