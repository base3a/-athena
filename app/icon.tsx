import { ImageResponse } from "next/og";

// Route segment config — Next.js App Router picks these up automatically
export const size        = { width: 32, height: 32 };
export const contentType = "image/png";

// Generate the /favicon.ico equivalent via the App Router icon convention.
// Renders a gold "A" on a black square — matches Athena's brand identity.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:           "100%",
          height:          "100%",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          background:      "#000000",
          borderRadius:    4,
        }}
      >
        {/* Gold "A" — Cinzel not available in edge runtime, fallback to serif */}
        <span
          style={{
            fontSize:    22,
            fontWeight:  700,
            color:       "#d4a017",
            fontFamily:  "serif",
            lineHeight:  1,
            marginTop:   2,
          }}
        >
          A
        </span>
      </div>
    ),
    { ...size },
  );
}
