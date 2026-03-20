"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/markets",   label: "Markets"   },
  { href: "/screener",  label: "Screener"  },
  { href: "/research",  label: "Research"  },
  { href: "/portfolio", label: "Portfolio" },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tappedHref, setTappedHref] = useState<string | null>(null);
  const pathname = usePathname();

  // Hydration guard — portal requires document.body
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  // Rendered via portal → escapes overflow:hidden parents and all stacking contexts
  const overlay = (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={close}
        aria-hidden="true"
        style={{
          position:       "fixed",
          inset:          0,
          zIndex:         9998,
          background:     isOpen ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)",
          backdropFilter: isOpen ? "blur(3px)" : "none",
          WebkitBackdropFilter: isOpen ? "blur(3px)" : "none",
          transition:     "background 0.3s ease, backdrop-filter 0.3s ease",
          pointerEvents:  isOpen ? "auto" : "none",
        }}
      />

      {/* ── Right-side drawer panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        style={{
          position:   "fixed",
          top:        0,
          right:      0,
          bottom:     0,
          width:      "min(300px, 85vw)",
          zIndex:     9999,
          background: "#060606",
          borderLeft: "1px solid #1c1c1c",
          boxShadow:  isOpen ? "-24px 0 64px rgba(0,0,0,0.9)" : "none",
          transform:  isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
          display:    "flex",
          flexDirection: "column",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {/* ── Drawer header ── */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          height:         57,
          paddingLeft:    24,
          paddingRight:   16,
          borderBottom:   "1px solid #1a1a1a",
          flexShrink:     0,
        }}>
          <span style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      13,
            fontWeight:    700,
            letterSpacing: "0.22em",
            color:         "#d4a017",
          }}>
            ATHENA
          </span>
          <button
            onClick={close}
            aria-label="Close menu"
            style={{
              width:    44,
              height:   44,
              display:  "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border:   "1px solid #1e1e1e",
              borderRadius: 8,
              cursor:   "pointer",
              outline:  "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Nav links ── */}
        <nav role="navigation" aria-label="Mobile navigation" style={{ flex: 1 }}>
          {NAV_LINKS.map((link, i) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                style={{
                  position:       "relative",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  height:         58,
                  paddingLeft:    24,
                  paddingRight:   20,
                  fontSize:       12,
                  fontFamily:     "'Cinzel', serif",
                  fontWeight:     600,
                  letterSpacing:  "0.2em",
                  textTransform:  "uppercase",
                  color:          isActive ? "#d4a017" : "#888",
                  borderBottom:   i < NAV_LINKS.length - 1 ? "1px solid #111" : "none",
                  textDecoration: "none",
                  WebkitTapHighlightColor: "transparent",
                  transition:     "color 0.15s ease, background 0.15s ease",
                  overflow:       "hidden",
                }}
                onTouchStart={(e) => {
                  setTappedHref(link.href);
                  (e.currentTarget as HTMLAnchorElement).style.color = "#d4a017";
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(212,160,23,0.04)";
                }}
                onTouchEnd={(e) => {
                  setTimeout(() => setTappedHref(null), 350);
                  (e.currentTarget as HTMLAnchorElement).style.color = isActive ? "#d4a017" : "#888";
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >
                {/* Label — with gold dot when active */}
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      style={{
                        width:        4,
                        height:       4,
                        borderRadius: "50%",
                        background:   "#d4a017",
                        flexShrink:   0,
                      }}
                    />
                  )}
                  {link.label}
                </span>

                <svg
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ opacity: 0.25 }}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>

                {/* Gold underline — slides in from left on tap */}
                <span
                  aria-hidden="true"
                  style={{
                    position:   "absolute",
                    bottom:     0,
                    left:       0,
                    height:     1,
                    background: "linear-gradient(to right, rgba(212,160,23,0.3), #d4a017, rgba(212,160,23,0.3))",
                    width:      tappedHref === link.href ? "100%" : "0%",
                    transition: "width 0.25s ease",
                  }}
                />
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom safe area ── */}
        <div style={{ height: "max(env(safe-area-inset-bottom), 24px)", flexShrink: 0 }} />
      </div>
    </>
  );

  return (
    <>
      {/* ── Hamburger button — mobile only ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        className="md:hidden flex flex-col justify-center items-center shrink-0"
        style={{
          width:        44,
          height:       44,
          borderRadius: 8,
          border:       "1px solid #222",
          background:   "transparent",
          gap:          5,
          cursor:       "pointer",
          outline:      "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{
          display:         "block",
          width:           18,
          height:          1.5,
          background:      isOpen ? "#d4a017" : "#777",
          borderRadius:    2,
          transformOrigin: "center",
          transform:       isOpen ? "rotate(45deg) translate(0px, 4.75px)" : "none",
          transition:      "transform 0.22s ease, background 0.22s ease",
        }} />
        <span style={{
          display:      "block",
          width:        18,
          height:       1.5,
          background:   "#777",
          borderRadius: 2,
          opacity:      isOpen ? 0 : 1,
          transition:   "opacity 0.15s ease",
        }} />
        <span style={{
          display:         "block",
          width:           18,
          height:          1.5,
          background:      isOpen ? "#d4a017" : "#777",
          borderRadius:    2,
          transformOrigin: "center",
          transform:       isOpen ? "rotate(-45deg) translate(0px, -4.75px)" : "none",
          transition:      "transform 0.22s ease, background 0.22s ease",
        }} />
      </button>

      {/* Portal renders directly into document.body — escapes all overflow:hidden + stacking contexts */}
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
