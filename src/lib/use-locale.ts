"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLocale } from "@/i18n";

/** 当前解析出的 BCP-47 locale，用于 Intl 格式化。 */
export function useCurrentLocale(): string {
  const { i18n } = useTranslation();
  const subscribe = useCallback(
    (sync: () => void) => {
      i18n.on("languageChanged", sync);
      return () => i18n.off("languageChanged", sync);
    },
    [i18n],
  );
  const getSnapshot = () => normalizeLocale(i18n.resolvedLanguage || i18n.language) ?? "en-US";
  return useSyncExternalStore(subscribe, getSnapshot, () => "en-US");
}
