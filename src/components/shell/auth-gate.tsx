"use client";

import { useTranslation } from "react-i18next";
import { LogIn, ShieldCheck } from "lucide-react";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";

/** 登录门：未登录时展示登录 CTA，登录后渲染子内容。 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);
  const loading = useEazo((s) => s.auth.loading);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center" data-el="auth-loading">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-[50vh] place-items-center px-4" data-el="auth-gate">
        <div className="fg-glass w-full max-w-sm rounded-[24px] p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("auth.required")}</p>
          <button
            type="button"
            onClick={() => auth.login().catch(() => undefined)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)]"
            data-el="auth-login"
          >
            <LogIn className="h-4 w-4" /> {t("auth.signInCta")}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
