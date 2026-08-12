"use client";

import { useCallback, useEffect, useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { fetchVerificationCases } from "@/lib/api";
import { subscribeGuest, useIsGuest } from "@/lib/guest/guest-session";

/**
 * Count of verification cases still awaiting a reply (status === "open").
 * Used for the Cases nav badge. Independent of FlowGuardDataProvider because
 * the bottom nav lives outside that provider's scope. Works for both signed-in
 * users (API) and guests (localStorage), and refreshes on guest changes.
 */
export function usePendingVerificationCount(): number {
  const user = useEazo((s) => s.auth.user);
  const guest = useIsGuest();
  const hasIdentity = Boolean(user) || guest;
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!hasIdentity) {
      setCount(0);
      return;
    }
    try {
      const cases = await fetchVerificationCases();
      setCount(cases.filter((c) => c.status === "open").length);
    } catch {
      setCount(0);
    }
  }, [hasIdentity]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (alive) await load();
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  useEffect(() => {
    // Guests: refresh when local cases change (create / resolve).
    if (!guest) return;
    return subscribeGuest(() => void load());
  }, [guest, load]);

  return count;
}
