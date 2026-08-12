"use client";

import { useSyncExternalStore } from "react";

// Guest mode: a purely client-side "Continue as guest" session. Eazo has no
// anonymous login and every backend API requires a real session, so guests run
// entirely in the browser — the built-in engine computes pre-check/routing, the
// seed ledger provides payees, and payment records live in localStorage.

import type { User } from "@eazo/sdk";
import type { PaymentRecord, VerificationCase, VerificationStatus } from "@/lib/engine/types";

const GUEST_FLAG_KEY = "flowguard_guest";
const GUEST_PAYMENTS_KEY = "flowguard_guest_payments";
const GUEST_VCASES_KEY = "flowguard_guest_vcases";

export const GUEST_USER: User = {
  id: "guest",
  email: null,
  name: "Guest",
  avatarUrl: null,
};

/** Broadcast so React components re-read guest state without a full reload. */
const GUEST_EVENT = "flowguard-guest-changed";

export function isGuest(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(GUEST_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function enterGuestMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_FLAG_KEY, "1");
    window.dispatchEvent(new Event(GUEST_EVENT));
  } catch {
    /* ignore */
  }
}

export function exitGuestMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_FLAG_KEY);
    window.localStorage.removeItem(GUEST_PAYMENTS_KEY);
    window.localStorage.removeItem(GUEST_VCASES_KEY);
    window.dispatchEvent(new Event(GUEST_EVENT));
  } catch {
    /* ignore */
  }
}

export function subscribeGuest(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(GUEST_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(GUEST_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** React hook: reactive guest flag (re-renders on enter/exit and localStorage). */
export function useIsGuest(): boolean {
  return useSyncExternalStore(subscribeGuest, isGuest, () => false);
}

// ---- local payment records ----

export function readGuestPayments(): PaymentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_PAYMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PaymentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addGuestPayment(record: PaymentRecord): void {
  if (typeof window === "undefined") return;
  try {
    const list = [record, ...readGuestPayments()];
    window.localStorage.setItem(GUEST_PAYMENTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(GUEST_EVENT));
  } catch {
    /* ignore */
  }
}

/** Replace a stored guest payment by id (used by the checker review action). */
export function updateGuestPayment(record: PaymentRecord): void {
  if (typeof window === "undefined") return;
  try {
    const list = readGuestPayments().map((p) => (p.id === record.id ? record : p));
    window.localStorage.setItem(GUEST_PAYMENTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(GUEST_EVENT));
  } catch {
    /* ignore */
  }
}

// ---- local verification cases ----

export function readGuestVerificationCases(): VerificationCase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_VCASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VerificationCase[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addGuestVerificationCase(record: VerificationCase): void {
  if (typeof window === "undefined") return;
  try {
    const list = [record, ...readGuestVerificationCases()];
    window.localStorage.setItem(GUEST_VCASES_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(GUEST_EVENT));
  } catch {
    /* ignore */
  }
}

export function updateGuestVerificationStatus(
  id: string,
  status: VerificationStatus,
): VerificationCase | null {
  if (typeof window === "undefined") return null;
  try {
    const now = new Date().toISOString();
    let updated: VerificationCase | null = null;
    const list = readGuestVerificationCases().map((c) => {
      if (c.id !== id) return c;
      updated = { ...c, status, updatedAt: now };
      return updated;
    });
    window.localStorage.setItem(GUEST_VCASES_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(GUEST_EVENT));
    return updated;
  } catch {
    return null;
  }
}
