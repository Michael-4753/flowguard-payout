"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { fetchSuppliers, fetchPayments, fetchVerificationCases } from "@/lib/api";
import { clarifiedBySupplier, recomputePaymentRisk, type EffectiveRisk } from "@/lib/verification";
import { subscribeGuest, useIsGuest } from "@/lib/guest/guest-session";
import type { PaymentRecord, Supplier, VerificationCase } from "@/lib/engine/types";

export type ActiveRole = "maker" | "checker";

interface DataState {
  suppliers: Supplier[];
  payments: PaymentRecord[];
  verificationCases: VerificationCase[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  /** Set of risk factorIds already clarified for a payee (verification feedback). */
  clarifiedFactors: (supplierId: string) => Set<string>;
  /** Clarified-adjusted risk (score/level/blocker recomputed after resolved cases). */
  effectiveRisk: (record: PaymentRecord) => EffectiveRisk;
  /** Identity of the signed-in user (or "guest"), matched against a payment's makerId. */
  currentUserId: string;
  /** Which duty the user is currently acting as (maker=cashier, checker=reviewer). */
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
}

const ROLE_KEY = "flowguard.activeRole";

const Ctx = createContext<DataState | null>(null);

export function FlowGuardDataProvider({ children }: { children: React.ReactNode }) {
  const user = useEazo((s) => s.auth.user);
  const guest = useIsGuest();
  const hasIdentity = Boolean(user) || guest;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [verificationCases, setVerificationCases] = useState<VerificationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeRole, setActiveRoleState] = useState<ActiveRole>("maker");

  const setActiveRole = useCallback((role: ActiveRole) => {
    setActiveRoleState(role);
    try {
      window.localStorage.setItem(ROLE_KEY, role);
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (!alive) return;
      try {
        const saved = window.localStorage.getItem(ROLE_KEY);
        if (saved === "maker" || saved === "checker") setActiveRoleState(saved);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!hasIdentity) {
      setSuppliers([]);
      setPayments([]);
      setVerificationCases([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const [s, p, v] = await Promise.all([
        fetchSuppliers(),
        fetchPayments(),
        fetchVerificationCases(),
      ]);
      setSuppliers(s);
      setPayments(p);
      setVerificationCases(v);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [hasIdentity]);

  useEffect(() => {
    // Load data when identity changes. First statement awaits to avoid a
    // synchronous setState inside the effect body.
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (alive) await refresh();
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  useEffect(() => {
    // In guest mode, refresh when local payments change (e.g. after a payment).
    if (!guest) return;
    return subscribeGuest(() => {
      void refresh();
    });
  }, [guest, refresh]);

  const currentUserId = user?.id ?? (guest ? "guest" : "");

  const value = useMemo(() => {
    const map = clarifiedBySupplier(verificationCases);
    const empty = new Set<string>();
    return {
      suppliers,
      payments,
      verificationCases,
      loading,
      error,
      refresh,
      clarifiedFactors: (supplierId: string) => map[supplierId] ?? empty,
      effectiveRisk: (record: PaymentRecord) =>
        recomputePaymentRisk(record, map[record.supplierId] ?? empty),
      currentUserId,
      activeRole,
      setActiveRole,
    };
  }, [suppliers, payments, verificationCases, loading, error, refresh, currentUserId, activeRole, setActiveRole]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFlowGuardData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFlowGuardData must be used within FlowGuardDataProvider");
  return ctx;
}
