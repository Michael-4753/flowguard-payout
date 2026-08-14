"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { readStoredLanguage } from "./config";

/**
 * Client i18n provider. Mounted inside the root layout. Default language is
 * English (set at init); after mount we apply any persisted preference so the
 * first server-rendered paint always matches the English default (no hydration
 * mismatch) and then switches if the user previously chose 中文.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored !== i18n.language) {
      void i18n.changeLanguage(stored);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
