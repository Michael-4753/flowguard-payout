"use client";

import type { DeckSlide } from "./deck-content";

const ACCENT = "text-[color:var(--primary)]";

function Eyebrow({ text }: { text: string }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />
      {text}
    </div>
  );
}

function BulletGrid({ bullets }: { bullets: NonNullable<DeckSlide["bullets"]> }) {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
      {bullets.map((b, i) => (
        <div
          key={b.head}
          className="fg-enter rounded-2xl border border-border bg-[color:var(--fg-glass)] p-4 text-left backdrop-blur"
          style={{ "--i": i } as React.CSSProperties}
        >
          <div className="flex items-center gap-2">
            <span className={`font-mono text-xs font-bold ${ACCENT}`}>{String(i + 1).padStart(2, "0")}</span>
            <h3 className="text-sm font-bold leading-tight">{b.head}</h3>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{b.body}</p>
        </div>
      ))}
    </div>
  );
}

export function Slide({ slide }: { slide: DeckSlide }) {
  const centered = slide.kind === "cover" || slide.kind === "cta";

  return (
    <div
      className={`flex h-full w-full flex-col ${centered ? "items-center justify-center text-center" : "items-center justify-center"} px-6 py-10`}
      data-el={`slide-${slide.id}`}
    >
      {slide.eyebrow && <Eyebrow text={slide.eyebrow} />}

      {slide.kind === "cover" ? (
        <>
          <h1 className="text-6xl font-black tracking-tight sm:text-7xl">
            Flow<span className={ACCENT}>Guard</span>
          </h1>
          {slide.subtitle && (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">{slide.subtitle}</p>
          )}
        </>
      ) : slide.kind === "cta" ? (
        <>
          <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">{slide.title}</h1>
          {slide.subtitle && (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">{slide.subtitle}</p>
          )}
        </>
      ) : (
        <>
          <h2 className="mb-2 max-w-2xl text-center text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="mb-6 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
              {slide.subtitle}
            </p>
          )}
          {slide.bullets && <div className="mt-4 flex w-full justify-center">{<BulletGrid bullets={slide.bullets} />}</div>}
        </>
      )}

      {slide.footnote && (
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">{slide.footnote}</p>
      )}
    </div>
  );
}
