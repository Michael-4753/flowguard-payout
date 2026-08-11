"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { fetchSuppliers, fetchPayments } from "@/lib/api";
import type { PaymentRecord, Supplier } from "@/lib/engine/types";

interface DataState {
  suppliers: Supplier[];
  payments: PaymentRecord[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<DataState | null>(null);

export function FlowGuardDataProvider({ children }: { children: React.ReactNode }) {
  const user = useEazo((s) => s.auth.user);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSuppliers([]);
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const [s, p] = await Promise.all([fetchSuppliers(), fetchPayments()]);
      setSuppliers(s);
      setPayments(p);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // 用户态变化时同步加载数据（外部系统同步）。
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ suppliers, payments, loading, error, refresh }),
    [suppliers, payments, loading, error, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFlowGuardData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFlowGuardData must be used within FlowGuardDataProvider");
  return ctx;
}
