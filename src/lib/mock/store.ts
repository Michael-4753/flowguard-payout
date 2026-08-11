"use client";

// 前端阶段的客户端数据源：从模拟数据播种，允许新建付款记录写入。
// 后端接入后此模块会被 src/lib/api 的类型化 helper 取代。

import { useSyncExternalStore } from "react";
import type { PaymentRecord, Supplier } from "@/lib/engine/types";
import { MOCK_PAYMENTS, MOCK_SUPPLIERS } from "@/lib/mock/data";

let payments: PaymentRecord[] = [...MOCK_PAYMENTS];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function addPayment(record: PaymentRecord) {
  payments = [record, ...payments];
  emit();
}

export function useSuppliers(): Supplier[] {
  return MOCK_SUPPLIERS;
}

export function getSupplier(id: string): Supplier | undefined {
  return MOCK_SUPPLIERS.find((s) => s.id === id);
}

export function usePayments(): PaymentRecord[] {
  return useSyncExternalStore(
    subscribe,
    () => payments,
    () => payments,
  );
}

export function getPayments(): PaymentRecord[] {
  return payments;
}
