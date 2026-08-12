"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { fetchSuppliers, fetchPayments, fetchVerificationCases } from "@/lib/api";
import { clarifiedBySupplier } from "@/lib/verification";
import { subscribeGuest, useIsGuest } from "@/lib/guest/guest-session";
import type { PaymentRecord, Supplier, VerificationCase } from "@/lib/engine/types";

interface DataState {
  suppliers: Supplier[];
  payments: PaymentRecord[];
  verificationCases: VerificationCase[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  /** Set of risk factorIds already clarified for a payee (verification feedback). */
  clarifiedFactors: (supplierId: string) => Set<string>;
}

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
    };
  }, [suppliers, payments, verificationCases, loading, error, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFlowGuardData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFlowGuardData must be used within FlowGuardDataProvider");
  return ctx;
}
