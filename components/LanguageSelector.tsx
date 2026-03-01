"use client";

import { useState, useEffect } from "react";

export type Lang = "en" | "sv";
export const LANG_STORAGE_KEY = "athena_lang";

// ── Read helper (safe for SSR) ─────────────────────────────────────────────────
export function getStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  return stored === "sv" ? "sv" : "en";
}

// ── Selector component ─────────────────────────────────────────────────────────
const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "sv", label: "SV" },
];

export default function LanguageSelector() {
  const [lang, setLang] = useState<Lang>("en");

  // Hydrate from localStorage after mount
  useEffect(() => {
    setLang(getStoredLang());
  }, []);

  const select = (l: Lang) => {
    setLang(l);
    window.localStorage.setItem(LANG_STORAGE_KEY, l);
  };

  return (
    <div className="flex items-center gap-1" aria-label="Language selector">
      {LANGS.map(({ code, label }) => {
        const active = lang === code;
        return (
          <button
            key={code}
            onClick={() => select(code)}
            aria-pressed={active}
            style={{
              padding: "3px 10px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              border: active
                ? "1px solid rgba(212,160,23,0.5)"
                : "1px solid #1f1f1f",
              background: active ? "rgba(212,160,23,0.1)" : "transparent",
              color: active ? "#d4a017" : "#3a3a3a",
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
