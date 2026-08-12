"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Workflow, Building2, History, ShieldCheck, FileCheck2 } from "lucide-react";
import { cn } from "@/utils/utils";
import { AuthGate } from "@/components/shell/auth-gate";
import { FlowGuardDataProvider } from "@/components/shell/data-provider";
import { GuestBadge } from "@/components/shell/guest-badge";
import { usePendingVerificationCount } from "@/lib/use-pending-verification";

const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard, el: "nav-dashboard" },
  { href: "/pay", label: "Pay", icon: Workflow, el: "nav-pay" },
  { href: "/suppliers", label: "Payees", icon: Building2, el: "nav-suppliers" },
  { href: "/review", label: "Review", icon: ShieldCheck, el: "nav-review" },
  { href: "/cases", label: "Cases", icon: FileCheck2, el: "nav-cases" },
  { href: "/history", label: "History", icon: History, el: "nav-history" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const pendingCases = usePendingVerificationCount();

  return (
    <div
      className="relative isolate flex min-h-[100svh] flex-col overflow-x-hidden"
      style={{
        paddingTop: "var(--eazo-safe-area-top)",
        paddingBottom: "calc(var(--eazo-safe-area-bottom) + 80px)",
      }}
      data-el="app-shell"
    >
      <div className="fg-backdrop" aria-hidden />
      <div className="fg-grain" aria-hidden />

      {/* Header */}
      <header
        className="z-20 mx-auto flex w-full max-w-[760px] items-center justify-between px-4 pb-3 pt-1"
        data-el="app-header"
      >
        <Link href="/" className="flex min-w-0 items-center gap-2" data-el="app-logo">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary font-mono text-base font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)]">
            F
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-bold tracking-tight">FlowGuard</div>
            <div className="truncate text-[10px] text-muted-foreground">
              Cross-border payment risk &amp; routing
            </div>
          </div>
        </Link>
        <GuestBadge />
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pt-2">
        <AuthGate>
          <FlowGuardDataProvider>
            {/* Keyed by route so switching tabs gently fades the new screen in. */}
            <div key={pathname} className="fg-fade">
              {children}
            </div>
          </FlowGuardDataProvider>
        </AuthGate>
      </main>

      {/* Bottom nav */}
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[760px] items-stretch justify-around px-3"
        style={{ paddingBottom: "var(--eazo-safe-area-bottom)" }}
        data-el="bottom-nav"
      >
        <div className="fg-glass pointer-events-auto mx-auto mb-2 grid w-full grid-cols-6 gap-0.5 rounded-2xl p-1.5">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            const badge = item.href === "/cases" ? pendingCases : 0;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-el={item.el}
              >
                <span className="relative">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                  {badge > 0 && (
                    <span
                      className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--danger)] px-1 text-[9px] font-bold leading-none text-white"
                      aria-label={`${badge} awaiting reply`}
                      data-el="nav-cases-badge"
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
