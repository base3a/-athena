"use client";

import dynamic from "next/dynamic";

// Previously used { ssr: false } which caused a large layout shift:
// the server sent an empty slot, then the full input appeared on the client
// pushing all content below it downward.
//
// TickerInput uses only React hooks and static data — no browser-only APIs —
// so SSR is safe. Removing ssr:false means the component is included in the
// initial server HTML, eliminating the layout shift entirely.
const TickerInputNoSSR = dynamic(() => import("@/components/TickerInput"));

export default TickerInputNoSSR;
