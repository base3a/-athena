import { redirect } from "next/navigation";

// Valid ticker: letters only, 1–5 characters
const TICKER_RE = /^[a-zA-Z]{1,5}$/;

interface Props {
  params: Promise<{ ticker: string }>;
}

export default async function TickerShortcutPage({ params }: Props) {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();

  if (TICKER_RE.test(ticker)) {
    redirect(`/analyze/${upper}`);
  }

  redirect("/");
}
