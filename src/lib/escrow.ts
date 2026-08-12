"use client";

// Milestone escrow (smart-contract simulation). Fully client-side, deterministic
// state machine persisted in localStorage — works in guest and logged-in modes.
// Create escrow -> split into milestones -> mark each "reached" to release ->
// contract state timeline with locked / released totals. No real chain.

import type { Currency } from "@/lib/engine/types";

const ESCROW_KEY = "flowguard_escrows";
const ESCROW_EVENT = "flowguard-escrow-changed";

export type MilestoneStatus = "locked" | "released";
export type EscrowStatus = "funded" | "active" | "completed";

export interface Milestone {
  id: string;
  title: string;
  /** Portion of the escrow locked for this milestone (USD). */
  amountUsd: number;
  status: MilestoneStatus;
  /** ISO timestamp when it was released (empty while locked). */
  releasedAt: string;
}

export interface EscrowContract {
  id: string;
  supplierId: string;
  supplierName: string;
  currency: Currency;
  /** Total escrow amount (USD) = sum of milestone amounts. */
  totalUsd: number;
  milestones: Milestone[];
  status: EscrowStatus;
  /** Simulated on-chain contract address. */
  contractAddress: string;
  createdAt: string;
}

// ---- persistence ----

function read(): EscrowContract[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ESCROW_KEY);
    return raw ? (JSON.parse(raw) as EscrowContract[]) : [];
  } catch {
    return [];
  }
}

function write(list: EscrowContract[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ESCROW_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(ESCROW_EVENT));
  } catch {
    /* ignore */
  }
}

export function listEscrows(): EscrowContract[] {
  return read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function subscribeEscrow(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(ESCROW_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(ESCROW_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

// ---- deterministic helpers ----

function pseudoHex(seed: string, len: number): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = "";
  let x = h >>> 0;
  while (out.length < len) {
    x = Math.imul(x, 16777619) >>> 0;
    out += x.toString(16).padStart(8, "0");
  }
  return out.slice(0, len);
}

function computeStatus(milestones: Milestone[]): EscrowStatus {
  const released = milestones.filter((m) => m.status === "released").length;
  if (released === 0) return "funded";
  if (released === milestones.length) return "completed";
  return "active";
}

// ---- mutations ----

export function createEscrow(input: {
  supplierId: string;
  supplierName: string;
  currency: Currency;
  milestones: { title: string; amountUsd: number }[];
}): EscrowContract {
  const id = `esc-${Date.now().toString(36)}`;
  const milestones: Milestone[] = input.milestones.map((m, i) => ({
    id: `${id}-m${i}`,
    title: m.title,
    amountUsd: Math.round(m.amountUsd * 100) / 100,
    status: "locked",
    releasedAt: "",
  }));
  const totalUsd = Math.round(milestones.reduce((s, m) => s + m.amountUsd, 0) * 100) / 100;
  const contract: EscrowContract = {
    id,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    currency: input.currency,
    totalUsd,
    milestones,
    status: "funded",
    contractAddress: `0x${pseudoHex(id, 40)}`,
    createdAt: new Date().toISOString(),
  };
  write([contract, ...read()]);
  return contract;
}

/** Mark a milestone reached → release its locked funds. Idempotent. */
export function releaseMilestone(escrowId: string, milestoneId: string): void {
  const list = read();
  const contract = list.find((e) => e.id === escrowId);
  if (!contract) return;
  const m = contract.milestones.find((x) => x.id === milestoneId);
  if (!m || m.status === "released") return;
  m.status = "released";
  m.releasedAt = new Date().toISOString();
  contract.status = computeStatus(contract.milestones);
  write(list);
}

export function deleteEscrow(escrowId: string): void {
  write(read().filter((e) => e.id !== escrowId));
}

// ---- selectors ----

export function escrowTotals(contract: EscrowContract): {
  lockedUsd: number;
  releasedUsd: number;
  releasedCount: number;
} {
  let lockedUsd = 0;
  let releasedUsd = 0;
  let releasedCount = 0;
  for (const m of contract.milestones) {
    if (m.status === "released") {
      releasedUsd += m.amountUsd;
      releasedCount += 1;
    } else {
      lockedUsd += m.amountUsd;
    }
  }
  return {
    lockedUsd: Math.round(lockedUsd * 100) / 100,
    releasedUsd: Math.round(releasedUsd * 100) / 100,
    releasedCount,
  };
}

export const ESCROW_STATUS_LABEL: Record<EscrowStatus, string> = {
  funded: "Funded — all locked",
  active: "Active — releasing",
  completed: "Completed",
};
