"use client";

import Link from "next/link";
import { useState } from "react";

interface NavLinkProps {
  href:    string;
  label:   string;
  tooltip: string;
  /** When true, renders in active/gold state (current page). No hover effects. */
  active?: boolean;
  /** Font size variant: "md" = 13 px (homepage), "sm" = 11 px (inner pages). */
  size?:   "sm" | "md";
}

export default function NavLink({
  href,
  label,
  tooltip,
  active = false,
  size   = "sm",
}: NavLinkProps) {
  const [hovered, setHovered] = useState(false);

  const fontSize     = size === "md" ? 13 : 11;
  const color        = active ? "#d4a017" : hovered ? "#d4a017" : "#666";
  const fontWeight   = active ? 600 : 500;
  const showUnderline = hovered && !active;
  const showTooltip   = hovered && !active;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position:      "relative",
          display:       "inline-block",
          fontSize,
          color,
          fontWeight,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          textDecoration: "none",
          transition:    "color 0.2s ease",
          paddingBottom: 3, // room for the underline
          fontFamily:    "inherit",
        }}
      >
        {label}

        {/* ── Animated gold underline ─────────────────────────────────────── */}
        <span
          style={{
            position:       "absolute",
            bottom:         0,
            left:           0,
            height:         1,
            width:          showUnderline ? "100%" : "0%",
            background:     "#d4a017",
            transition:     "width 0.22s ease",
            borderRadius:   1,
          }}
        />
      </Link>

      {/* ── Tooltip tagline ───────────────────────────────────────────────── */}
      {showTooltip && (
        <div
          style={{
            position:       "absolute",
            top:            "calc(100% + 7px)",
            left:           "50%",
            transform:      "translateX(-50%)",
            zIndex:         50,
            pointerEvents:  "none",
            animation:      "fadeIn 0.12s ease",
          }}
        >
          <span
            style={{
              display:       "block",
              fontSize:      9,
              color:         "#666",
              letterSpacing: "0.06em",
              whiteSpace:    "nowrap",
              padding:       "3px 9px",
              borderRadius:  4,
              background:    "#060606",
              border:        "1px solid #1e1e1e",
              boxShadow:     "0 4px 12px rgba(0,0,0,0.6)",
            }}
          >
            {tooltip}
          </span>
        </div>
      )}
    </div>
  );
}
