"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Workflow, Building2, History, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCallback, useSyncExternalStore } from "react";
import { cn } from "@/utils/utils";
import { AuthGate } from "@/components/shell/auth-gate";
import { FlowGuardDataProvider } from "@/components/shell/data-provider";
import {
  changeLocale,
  getLocalePreference,
  normalizeLocale,
  type LocaleCode,
  type LocalePreference,
} from "@/i18n";

const NAV = [
  { href: "/", key: "dashboard", icon: LayoutDashboard, el: "nav-dashboard" },
  { href: "/pay", key: "pay", icon: Workflow, el: "nav-pay" },
  { href: "/suppliers", key: "suppliers", icon: Building2, el: "nav-suppliers" },
  { href: "/history", key: "history", icon: History, el: "nav-history" },
] as const;

function LocaleToggle() {
  const { t, i18n } = useTranslation();
  const subscribe = useCallback(
    (sync: () => void) => {
      i18n.on("languageChanged", sync);
      window.addEventListener("eazo-locale-preference-changed", sync);
      window.addEventListener("storage", sync);
      return () => {
        i18n.off("languageChanged", sync);
        window.removeEventListener("eazo-locale-preference-changed", sync);
        window.removeEventListener("storage", sync);
      };
    },
    [i18n],
  );
  useSyncExternalStore(subscribe, getLocalePreference, () => "system" as LocalePreference);
  const active = normalizeLocale(i18n.resolvedLanguage || i18n.language) ?? "en-US";
  const nextLocale: LocaleCode = active === "zh-CN" ? "en-US" : "zh-CN";

  return (
    <button
      type="button"
      onClick={() => void changeLocale(nextLocale)}
      className="fg-glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
      aria-label={t("language.label")}
      data-el="locale-toggle"
    >
      <Languages className="h-3.5 w-3.5 text-primary" aria-hidden />
      {active === "zh-CN" ? "中文" : "EN"}
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className="relative isolate flex min-h-[100svh] flex-col overflow-x-hidden"
      style={{
        paddingTop: "var(--eazo-safe-area-top)",
        paddingBottom: "calc(var(--eazo-safe-area-bottom) + 76px)",
      }}
      data-el="app-shell"
    >
      <div className="fg-backdrop" aria-hidden />
      <div className="fg-grain" aria-hidden />

      {/* Header */}
      <header
        className="sticky z-20 mx-auto flex w-full max-w-[760px] items-center justify-between px-4 pb-3 pt-1"
        style={{ top: "var(--eazo-safe-area-top)" }}
        data-el="app-header"
      >
        <Link href="/" className="flex items-center gap-2" data-el="app-logo">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)]">
            F
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">{t("app.name")}</div>
            <div className="text-[10px] text-muted-foreground">{t("app.tagline")}</div>
          </div>
        </Link>
        <LocaleToggle />
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4">
        <AuthGate>
          <FlowGuardDataProvider>{children}</FlowGuardDataProvider>
        </AuthGate>
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[760px] items-stretch justify-around px-3"
        style={{ paddingBottom: "var(--eazo-safe-area-bottom)" }}
        data-el="bottom-nav"
      >
        <div className="fg-glass mx-auto mb-2 grid w-full grid-cols-4 gap-1 rounded-full p-1.5">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-el={item.el}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t(`nav.${item.key}`)}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
