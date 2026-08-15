import type { HackSlide } from "./hack-content";

/* Shared decorative background for light content slides */
function Blobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--primary)]/10 blur-3xl" />
      <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-[#0e7490]/10 blur-3xl" />
    </div>
  );
}

function SlideHeader({ eyebrow, title, subtitle, dark = false, big = false }: {
  eyebrow?: string; title: string; subtitle?: string; dark?: boolean; big?: boolean;
}) {
  return (
    <div className="relative">
      {eyebrow && (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${
          dark ? "bg-white/15 text-white" : "bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-white" : "bg-[color:var(--primary)]"}`} />
          {eyebrow}
        </span>
      )}
      <div className="mt-3 flex items-start gap-3">
        <span className={`mt-1.5 hidden h-8 w-1.5 shrink-0 rounded-full sm:block ${dark ? "bg-white/70" : "bg-[color:var(--primary)]"}`} />
        <h2 className={`font-black tracking-tight ${dark ? "text-white" : "text-foreground"} ${big ? "text-3xl sm:text-5xl" : "text-2xl sm:text-4xl"}`}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className={`mt-3 max-w-3xl text-sm leading-relaxed sm:text-lg ${dark ? "text-white/85" : "text-muted-foreground"} sm:pl-4`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function HackSlideView({ slide }: { slide: HackSlide }) {
  /* ---------- cover / summary : full-bleed gradient hero ---------- */
  if (slide.kind === "cover" || slide.kind === "summary") {
    const grad = slide.kind === "cover"
      ? "from-[#0f766e] via-[#0e7490] to-[#155e75]"
      : "from-[#0f766e] via-[#115e59] to-[#134e4a]";
    return (
      <section className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${grad} px-8 text-center text-white`}>
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          {slide.eyebrow && (
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-white/75 sm:text-sm">{slide.eyebrow}</p>
          )}
          <h1 className="text-5xl font-black tracking-tight drop-shadow-sm sm:text-7xl">{slide.title}</h1>
          {slide.subtitle && <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/90 sm:text-xl">{slide.subtitle}</p>}
          {slide.bullets && (
            <div className="mx-auto mt-9 grid max-w-3xl gap-3 sm:grid-cols-3">
              {slide.bullets.map((b) => (
                <div key={b.head} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left shadow-lg backdrop-blur">
                  <p className="text-sm font-bold">{b.head}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/80">{b.body}</p>
                </div>
              ))}
            </div>
          )}
          {slide.footnote && (
            <p className="mx-auto mt-9 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/80">{slide.footnote}</p>
          )}
        </div>
      </section>
    );
  }

  /* ---------- compliance : red guardrail slide ---------- */
  if (slide.kind === "compliance") {
    return (
      <section className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#b91c1c] px-8 py-10 text-white sm:px-16">
        <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} dark big />
        <div className="relative mt-7 grid max-w-4xl gap-3.5 sm:grid-cols-2 sm:pl-4">
          {slide.bullets?.map((b) => (
            <div key={b.head} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur transition hover:bg-white/15">
              <p className="flex items-center gap-2 text-base font-bold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm">✕</span>
                {b.head}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/90">{b.body}</p>
            </div>
          ))}
        </div>
        {slide.footnote && <p className="relative mt-7 text-xs text-white/75 sm:pl-4">{slide.footnote}</p>}
      </section>
    );
  }

  /* ---------- toc ---------- */
  if (slide.kind === "toc") {
    return (
      <section className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-background px-8 py-10 sm:px-16">
        <Blobs />
        <div className="relative">
          <SlideHeader eyebrow={slide.eyebrow} title={slide.title} big />
          <ol className="mt-7 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:pl-4">
            {slide.toc?.map((item, idx) => (
              <li key={item} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--primary)]/40 hover:shadow-md">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#0e7490] text-xs font-bold text-white shadow">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium leading-snug text-foreground">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  /* ---------- aitable ---------- */
  if (slide.kind === "aitable") {
    return (
      <section className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-background px-6 py-8 sm:px-12">
        <Blobs />
        <div className="relative">
          <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} />
          <div className="mt-5 overflow-hidden rounded-2xl border border-border shadow-sm sm:ml-4">
            <div className="grid grid-cols-[1.1fr_1.5fr_3.4fr] bg-gradient-to-r from-[#0f766e] to-[#0e7490] text-[11px] font-bold text-white sm:text-xs">
              <div className="px-3.5 py-2.5">痛点</div>
              <div className="px-3.5 py-2.5">入口</div>
              <div className="px-3.5 py-2.5">AI 做什么</div>
            </div>
            {slide.aiRows?.map((r, idx) => (
              <div key={r.call} className={`grid grid-cols-[1.1fr_1.5fr_3.4fr] border-t border-border text-[11px] sm:text-xs ${idx % 2 ? "bg-[color:var(--fg-soft)]/40" : "bg-card"}`}>
                <div className="px-3.5 py-3 font-bold text-foreground">{r.pain}</div>
                <div className="px-3.5 py-3 text-muted-foreground">{r.entry}</div>
                <div className="px-3.5 py-3 text-foreground">
                  <span className="rounded-md bg-[color:var(--primary)]/10 px-1.5 py-0.5 font-mono font-bold text-[color:var(--primary)]">{r.call}</span>
                  <span className="text-muted-foreground"> — {r.does}</span>
                </div>
              </div>
            ))}
          </div>
          {slide.footnote && <p className="mt-4 text-xs text-muted-foreground sm:pl-4">{slide.footnote}</p>}
        </div>
      </section>
    );
  }

  /* ---------- demo ---------- */
  if (slide.kind === "demo") {
    return (
      <section className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-background px-6 py-8 sm:px-12">
        <Blobs />
        <div className="relative">
          <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} />
          {slide.shot && (
            // Screenshot removed — keep an equally-sized empty placeholder box so
            // the layout stays intact and a screenshot can be pasted in manually.
            <div className="mx-auto mt-5 flex aspect-[16/9] w-full max-w-5xl max-h-[56vh] items-center justify-center rounded-2xl border border-dashed border-border bg-[color:var(--fg-soft)] text-sm text-muted-foreground shadow-xl">
              在此处粘贴截图
            </div>
          )}
          {slide.footnote && (
            <p className="mt-4 inline-block rounded-full bg-[color:var(--fg-soft)] px-4 py-1.5 text-xs text-muted-foreground sm:ml-4">{slide.footnote}</p>
          )}
        </div>
      </section>
    );
  }

  /* ---------- problem / product / feature / architecture ---------- */
  const withShot = slide.kind === "feature" && !!slide.shot;
  return (
    <section className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-background px-8 py-10 sm:px-16">
      <Blobs />
      <div className="relative">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} big />
        <div className={withShot ? "mt-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center" : ""}>
          <div className={`mt-7 grid gap-3.5 sm:grid-cols-2 sm:pl-4 ${withShot ? "lg:mt-0 lg:max-w-2xl" : "max-w-4xl"}`}>
            {slide.bullets?.map((b, idx) => (
              <div key={b.head} className="group flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--primary)]/40 hover:shadow-md">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0f766e] to-[#0e7490] text-xs font-bold text-white shadow">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-base font-bold text-foreground">{b.head}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
          {withShot && (
            <div className="flex shrink-0 flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.shot} alt={slide.title} className="max-h-[62vh] w-auto rounded-2xl border border-border object-contain shadow-xl" />
              <span className="text-xs text-muted-foreground">产品界面（现场可实测）</span>
            </div>
          )}
        </div>
        {slide.footnote && (
          <p className="mt-6 inline-block rounded-full bg-[color:var(--fg-soft)] px-4 py-1.5 text-xs text-muted-foreground sm:ml-4">{slide.footnote}</p>
        )}
      </div>
    </section>
  );
}
