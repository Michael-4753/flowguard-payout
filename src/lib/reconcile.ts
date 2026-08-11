"use client";

// Reconciliation center helpers: turn payment records into reconciliation rows
// (expected vs received, fees, FX loss), summarize by status/currency, persist a
// "reconciled" flag per payment in localStorage, and export a CSV statement.

import type { Currency, PaymentRecord } from "@/lib/engine/types";

const RECONCILED_KEY = "flowguard_reconciled";
const RECONCILE_EVENT = "flowguard-reconcile-changed";

export interface ReconcileRow {
  id: string;
  createdAt: string;
  supplierName: string;
  currency: Currency;
  channel: string;
  status: PaymentRecord["status"];
  /** Amount sent (USD). */
  amountUsd: number;
  /** Total fees along the route (USD). */
  feeUsd: number;
  /** FX conversion loss (USD). */
  fxLossUsd: number;
  /** Amount the beneficiary should receive (USD). */
  expectedUsd: number;
  /** Amount actually received — 0 until arrived, equals expected once arrived. */
  receivedUsd: number;
  /** Variance = received − expected (USD). */
  varianceUsd: number;
  /** Off-chain proof: bank wire reference. */
  offchainRef: string;
  /** Off-chain invoice number. */
  invoiceNo: string;
  /** On-chain / PSP proof (empty if none for this channel/status). */
  onchainRef: string;
  /**
   * Proof match: "matched" when off-chain + on-chain proofs both exist,
   * "unmatched" when an on-chain proof is expected but missing, "n/a" for
   * pure bank rails (SWIFT) that have no on-chain leg.
   */
  matchStatus: "matched" | "unmatched" | "n/a";
  reconciled: boolean;
}

export interface ReconcileSummary {
  totalSent: number;
  totalFees: number;
  totalFxLoss: number;
  totalExpected: number;
  totalReceived: number;
  outstanding: number; // expected but not yet received
  reconciledCount: number;
  pendingCount: number;
}

// ---- reconciled flags (localStorage) ----

function readFlags(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(RECONCILED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function isReconciled(id: string): boolean {
  return readFlags()[id] === true;
}

export function toggleReconciled(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const flags = readFlags();
    flags[id] = !flags[id];
    window.localStorage.setItem(RECONCILED_KEY, JSON.stringify(flags));
    window.dispatchEvent(new Event(RECONCILE_EVENT));
  } catch {
    /* ignore */
  }
}

export function subscribeReconcile(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(RECONCILE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(RECONCILE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

// ---- rows + summary ----

export function toReconcileRows(payments: PaymentRecord[]): ReconcileRow[] {
  const flags = readFlags();
  return payments.map((p) => {
    const feeUsd = p.route.totalFeeUsd;
    const fxLossUsd = Math.round(p.amountUsd * p.route.fxLoss * 100) / 100;
    const expectedUsd = p.route.receiveUsd;
    const arrived = p.status === "arrived";
    const receivedUsd = arrived ? expectedUsd : 0;
    return {
      id: p.id,
      createdAt: p.createdAt,
      supplierName: p.supplierName,
      currency: p.currency,
      channel: p.route.name,
      status: p.status,
      amountUsd: p.amountUsd,
      feeUsd,
      fxLossUsd,
      expectedUsd,
      receivedUsd,
      varianceUsd: Math.round((receivedUsd - expectedUsd) * 100) / 100,
      reconciled: flags[p.id] === true,
    };
  });
}

export function summarize(rows: ReconcileRow[]): ReconcileSummary {
  const s: ReconcileSummary = {
    totalSent: 0,
    totalFees: 0,
    totalFxLoss: 0,
    totalExpected: 0,
    totalReceived: 0,
    outstanding: 0,
    reconciledCount: 0,
    pendingCount: 0,
  };
  for (const r of rows) {
    s.totalSent += r.amountUsd;
    s.totalFees += r.feeUsd;
    s.totalFxLoss += r.fxLossUsd;
    s.totalExpected += r.expectedUsd;
    s.totalReceived += r.receivedUsd;
    if (r.status !== "arrived" && r.status !== "returned") s.outstanding += r.expectedUsd;
    if (r.reconciled) s.reconciledCount += 1;
    else s.pendingCount += 1;
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    totalSent: round(s.totalSent),
    totalFees: round(s.totalFees),
    totalFxLoss: round(s.totalFxLoss),
    totalExpected: round(s.totalExpected),
    totalReceived: round(s.totalReceived),
    outstanding: round(s.outstanding),
    reconciledCount: s.reconciledCount,
    pendingCount: s.pendingCount,
  };
}

// ---- CSV export ----

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(rows: ReconcileRow[]): string {
  const header = [
    "Payment ID",
    "Date",
    "Payee",
    "Currency",
    "Channel",
    "Status",
    "Sent (USD)",
    "Fees (USD)",
    "FX loss (USD)",
    "Expected (USD)",
    "Received (USD)",
    "Variance (USD)",
    "Reconciled",
  ];
  const lines = rows.map((r) =>
    [
      r.id,
      new Date(r.createdAt).toISOString(),
      r.supplierName,
      r.currency,
      r.channel,
      r.status,
      r.amountUsd.toFixed(2),
      r.feeUsd.toFixed(2),
      r.fxLossUsd.toFixed(2),
      r.expectedUsd.toFixed(2),
      r.receivedUsd.toFixed(2),
      r.varianceUsd.toFixed(2),
      r.reconciled ? "yes" : "no",
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function downloadCsv(rows: ReconcileRow[]): void {
  if (typeof window === "undefined") return;
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flowguard-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
