import type { HackSlide } from "./hack-content";

const KIND_STYLE: Record<string, { grad: string; accent: string }> = {
  cover: { grad: "from-[#0f766e] via-[#0e7490] to-[#155e75]", accent: "text-white" },
  compliance: { grad: "from-[#7f1d1d] via-[#991b1b] to-[#b91c1c]", accent: "text-white" },
  summary: { grad: "from-[#0f766e] via-[#115e59] to-[#134e4a]", accent: "text-white" },
};

export function HackSlideView({ slide }: { slide: HackSlide }) {
  const dark = KIND_STYLE[slide.kind];

  if (slide.kind === "cover" || slide.kind === "summary") {
    return (
      <section className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${dark.grad} px-8 text-center text-white`}>
        {slide.eyebrow && <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 sm:text-sm">{slide.eyebrow}</p>}
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{slide.title}</h1>
        {slide.subtitle && <p className="mt-5 max-w-2xl text-base text-white/85 sm:text-xl">{slide.subtitle}</p>}
        {slide.bullets && (
          <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {slide.bullets.map((b) => (
              <div key={b.head} className="rounded-2xl bg-white/10 p-4 text-left backdrop-blur">
                <p className="text-sm font-bold">{b.head}</p>
                <p className="mt-1 text-xs text-white/80">{b.body}</p>
              </div>
            ))}
          </div>
        )}
        {slide.footnote && <p className="mt-8 text-xs text-white/60">{slide.footnote}</p>}
      </section>
    );
  }

  if (slide.kind === "compliance") {
    return (
      <section className={`flex h-full w-full flex-col justify-center bg-gradient-to-br ${dark.grad} px-8 py-10 text-white sm:px-16`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{slide.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black sm:text-5xl">{slide.title}</h2>
        {slide.subtitle && <p className="mt-3 max-w-3xl text-sm text-white/85 sm:text-lg">{slide.subtitle}</p>}
        <div className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-2">
          {slide.bullets?.map((b) => (
            <div key={b.head} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-base font-bold">✕ {b.head}</p>
              <p className="mt-1 text-sm text-white/85">{b.body}</p>
            </div>
          ))}
        </div>
        {slide.footnote && <p className="mt-6 text-xs text-white/70">{slide.footnote}</p>}
      </section>
    );
  }

  if (slide.kind === "toc") {
    return (
      <section className="flex h-full w-full flex-col justify-center bg-background px-8 py-10 sm:px-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{slide.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">{slide.title}</h2>
        <ol className="mt-6 grid max-w-4xl gap-2.5 sm:grid-cols-3">
          {slide.toc?.map((item, idx) => (
            <li key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)] text-xs font-bold text-[color:var(--primary-foreground)]">{idx + 1}</span>
              <span className="text-sm font-medium text-foreground">{item}</span>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (slide.kind === "aitable") {
    return (
      <section className="flex h-full w-full flex-col justify-center bg-background px-6 py-8 sm:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{slide.eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black text-foreground sm:text-4xl">{slide.title}</h2>
        {slide.subtitle && <p className="mt-2 max-w-4xl text-sm text-muted-foreground">{slide.subtitle}</p>}
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[1.1fr_1.4fr_3.2fr] bg-[color:var(--fg-soft)] text-[11px] font-bold text-foreground sm:text-xs">
            <div className="px-3 py-2">痛点</div>
            <div className="px-3 py-2">入口</div>
            <div className="px-3 py-2">AI 做什么</div>
          </div>
          {slide.aiRows?.map((r, idx) => (
            <div key={r.call} className={`grid grid-cols-[1.1fr_1.4fr_3.2fr] border-t border-border text-[11px] sm:text-xs ${idx % 2 ? "bg-card" : "bg-background"}`}>
              <div className="px-3 py-2.5 font-semibold text-foreground">{r.pain}</div>
              <div className="px-3 py-2.5 text-muted-foreground">{r.entry}</div>
              <div className="px-3 py-2.5 text-foreground">
                <span className="font-bold text-[color:var(--primary)]">「{r.call}」</span>
                <span className="text-muted-foreground"> — {r.does}</span>
              </div>
            </div>
          ))}
        </div>
        {slide.footnote && <p className="mt-3 text-xs text-muted-foreground">{slide.footnote}</p>}
      </section>
    );
  }

  if (slide.kind === "demo") {
    return (
      <section className="flex h-full w-full flex-col justify-center bg-background px-6 py-8 sm:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{slide.eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black text-foreground sm:text-4xl">{slide.title}</h2>
        {slide.subtitle && <p className="mt-2 max-w-4xl text-sm text-muted-foreground sm:text-base">{slide.subtitle}</p>}
        {slide.shot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.shot} alt={slide.title} className="mt-4 max-h-[58vh] w-full rounded-2xl border border-border object-contain shadow-lg" />
        )}
        {slide.footnote && <p className="mt-3 text-xs text-muted-foreground">{slide.footnote}</p>}
      </section>
    );
  }

  // problem / product / feature / architecture
  return (
    <section className="flex h-full w-full flex-col justify-center bg-background px-8 py-10 sm:px-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{slide.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black text-foreground sm:text-5xl">{slide.title}</h2>
      {slide.subtitle && <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-lg">{slide.subtitle}</p>}
      <div className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-2">
        {slide.bullets?.map((b) => (
          <div key={b.head} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-base font-bold text-foreground">{b.head}</p>
            <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </div>
      {slide.footnote && <p className="mt-6 text-xs text-muted-foreground">{slide.footnote}</p>}
    </section>
  );
}
