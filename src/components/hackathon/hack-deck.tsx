"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { HACK_DECK } from "./hack-content";
import { HackSlideView } from "./hack-slide";

export function HackDeck() {
  const [i, setI] = useState(0);
  const total = HACK_DECK.length;

  const go = useCallback(
    (dir: number) => setI((prev) => Math.min(total - 1, Math.max(0, prev + dir))),
    [total],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(total - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  const slide = HACK_DECK[i];

  return (
    <main className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground" data-el="hack-deck">
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-[color:var(--fg-soft)]">
        <div className="h-full bg-[color:var(--primary)] transition-[width] duration-300" style={{ width: `${((i + 1) / total) * 100}%` }} />
      </div>

      <a
        href="/FlowGuard-Hackathon-Pitch.pptx"
        download
        className="absolute right-4 top-4 z-30 inline-flex items-center gap-1.5 rounded-full border border-border bg-[color:var(--fg-glass)] px-3 py-1.5 text-[11px] font-semibold text-foreground backdrop-blur transition hover:bg-[color:var(--fg-soft)] sm:right-6"
        data-el="hack-download-pptx"
      >
        <Download className="h-3.5 w-3.5" /> 下载 PPTX
      </a>

      <div key={slide.id} className="fg-fade relative z-10 flex-1">
        <HackSlideView slide={slide} />
      </div>

      <button
        type="button"
        aria-label="上一页"
        onClick={() => go(-1)}
        disabled={i === 0}
        className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-[color:var(--fg-glass)] p-2 backdrop-blur transition disabled:opacity-30 sm:left-6"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="下一页"
        onClick={() => go(1)}
        disabled={i === total - 1}
        className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-[color:var(--fg-glass)] p-2 backdrop-blur transition disabled:opacity-30 sm:right-6"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-1.5">
          {HACK_DECK.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              aria-label={`跳到第 ${idx + 1} 页`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-[color:var(--primary)]" : "w-1.5 bg-[color:var(--fg-line)]"}`}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
    </main>
  );
}
