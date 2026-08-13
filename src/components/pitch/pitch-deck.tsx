"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DECKS, type DeckLang } from "./deck-content";
import { Slide } from "./slide";

export function PitchDeck() {
  const [lang, setLang] = useState<DeckLang>("zh");
  const [i, setI] = useState(0);
  const deck = DECKS[lang];
  const total = deck.length;

  const go = useCallback(
    (dir: number) => setI((prev) => Math.min(total - 1, Math.max(0, prev + dir))),
    [total],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(total - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  const safeIndex = Math.min(i, total - 1);
  const slide = deck[safeIndex];

  return (
    <main
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground"
      data-el="pitch-deck"
    >
      {/* progress bar */}
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-[color:var(--fg-soft)]">
        <div
          className="h-full bg-[color:var(--primary)] transition-[width] duration-300"
          style={{ width: `${((safeIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* language switch */}
      <div
        className="absolute right-4 top-4 z-30 inline-flex rounded-full border border-border bg-[color:var(--fg-glass)] p-0.5 backdrop-blur sm:right-6"
        data-el="pitch-lang-switch"
      >
        {(["zh", "en"] as DeckLang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              lang === l ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]" : "text-muted-foreground"
            }`}
          >
            {l === "zh" ? "中文" : "EN"}
          </button>
        ))}
      </div>

      {/* slide stage */}
      <div key={`${lang}-${slide.id}`} className="fg-fade relative z-10 flex-1">
        <Slide slide={slide} />
      </div>

      {/* click zones for prev / next */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        disabled={i === 0}
        className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-[color:var(--fg-glass)] p-2 backdrop-blur transition disabled:opacity-30 sm:left-6"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        disabled={safeIndex === total - 1}
        className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-[color:var(--fg-glass)] p-2 backdrop-blur transition disabled:opacity-30 sm:right-6"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* footer: dots + counter */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-1.5">
          {deck.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === safeIndex ? "w-6 bg-[color:var(--primary)]" : "w-1.5 bg-[color:var(--fg-line)]"
              }`}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {String(safeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
    </main>
  );
}
