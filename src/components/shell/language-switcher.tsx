"use client";

import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { persistLanguage, type AppLanguage } from "@/i18n/config";
import { cn } from "@/utils/utils";

/**
 * Compact EN / 中文 language toggle. Persists the choice and switches i18next
 * live. Default is English; this only flips to 中文 when the user asks.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = (i18n.language === "zh" ? "zh" : "en") as AppLanguage;

  function set(lang: AppLanguage) {
    if (lang === current) return;
    void i18n.changeLanguage(lang);
    persistLanguage(lang);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-border bg-[color:var(--fg-soft)] p-0.5",
        className,
      )}
      data-el="language-switcher"
    >
      <Languages className="ml-1.5 mr-0.5 h-3 w-3 text-muted-foreground" aria-hidden />
      {(["en", "zh"] as AppLanguage[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => set(lang)}
          aria-pressed={current === lang}
          className={cn(
            "rounded-full px-2 py-1 text-[10px] font-bold transition-colors",
            current === lang
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          data-el={`language-${lang}`}
        >
          {lang === "en" ? "EN" : "中文"}
        </button>
      ))}
    </div>
  );
}
