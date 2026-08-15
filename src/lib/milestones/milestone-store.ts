"use client";

// Milestone condition-settlement workbench — a compliant, software-only store.
// It manages PROJECTS → MILESTONES with release CONDITIONS and status flow, and
// emits a RELEASE REMINDER once a milestone is verified. It NEVER holds funds,
// never auto-releases, and is NOT escrow: the actual payout is generated through
// the normal /pay instruction flow and settled by a licensed institution.
//
// Storage is localStorage-backed (works for guest + signed-in demo alike),
// mirroring the guest-session pattern, with seed demo data on first load.

import { useSyncExternalStore } from "react";
import type { Currency } from "@/lib/engine/types";

export type MilestoneStatus =
  | "pending" // 待开始
  | "in_progress" // 进行中
  | "awaiting_check" // 待校验
  | "verified" // 已校验（放款提醒已就绪）
  | "instructed"; // 已生成付款指令（跳转 /pay 后手动标记）

export interface Milestone {
  id: string;
  title: string;
  /** Release condition, e.g. 交付物 / 验收 / 日期. */
  condition: string;
  amountUsd: number;
  status: MilestoneStatus;
  /** Optional evidence note captured at verification. */
  evidence?: string;
  updatedAt: string;
}

export interface MilestoneProgram {
  id: string;
  project: string;
  /** Payee for the whole program; matches a Supplier id so /pay can prefill. */
  supplierId: string;
  supplierName: string;
  supplierCountry: string;
  currency: Currency;
  milestones: Milestone[];
  createdAt: string;
}

const KEY = "flowguard_milestone_programs";
const EVENT = "flowguard-milestones-changed";

function now(): string {
  return new Date().toISOString();
}

/* ---------- seed demo data (matches seed payees by id) ---------- */
function seed(): MilestoneProgram[] {
  return [
    {
      id: "mp-seed-1",
      project: "越南工厂 · 模具外包项目",
      supplierId: "lumen-viet",
      supplierName: "Lumen Viet Manufacturing Co",
      supplierCountry: "Vietnam · Ho Chi Minh City",
      currency: "VND",
      createdAt: "2026-02-01T00:00:00.000Z",
      milestones: [
        { id: "ms-1a", title: "设计定稿", condition: "3D 图纸经双方签字确认", amountUsd: 4200, status: "verified", updatedAt: "2026-02-10T00:00:00.000Z", evidence: "图纸 v3 已签署" },
        { id: "ms-1b", title: "首件试模", condition: "首件样品验收通过并上传验收单", amountUsd: 9800, status: "awaiting_check", updatedAt: "2026-02-20T00:00:00.000Z" },
        { id: "ms-1c", title: "批量交付", condition: "全批到货 + 质检报告", amountUsd: 18400, status: "pending", updatedAt: "2026-02-01T00:00:00.000Z" },
      ],
    },
    {
      id: "mp-seed-2",
      project: "印度 · 设计外包项目",
      supplierId: "sahana-design",
      supplierName: "Sahana Design House",
      supplierCountry: "India · Bengaluru",
      currency: "INR",
      createdAt: "2026-03-05T00:00:00.000Z",
      milestones: [
        { id: "ms-2a", title: "策略与素材", condition: "品牌手册 + 首批素材交付", amountUsd: 3600, status: "in_progress", updatedAt: "2026-03-08T00:00:00.000Z" },
        { id: "ms-2b", title: "终稿与复盘", condition: "终稿交付 + 复盘会议纪要", amountUsd: 5400, status: "pending", updatedAt: "2026-03-05T00:00:00.000Z" },
      ],
    },
  ];
}

export function readPrograms(): MilestoneProgram[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as MilestoneProgram[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePrograms(list: MilestoneProgram[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function resetMilestones(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

/** Advance a milestone's status; capture evidence when verifying. */
export function setMilestoneStatus(
  programId: string,
  milestoneId: string,
  status: MilestoneStatus,
  evidence?: string,
): void {
  const list = readPrograms().map((p) => {
    if (p.id !== programId) return p;
    return {
      ...p,
      milestones: p.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, status, evidence: evidence ?? m.evidence, updatedAt: now() }
          : m,
      ),
    };
  });
  writePrograms(list);
}

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Reactive hook: re-renders on any milestone change. */
export function useMilestonePrograms(): MilestoneProgram[] {
  return useSyncExternalStore(subscribe, readPrograms, () => []);
}

/* ---------- derived helpers ---------- */
export function programProgress(p: MilestoneProgram): { done: number; total: number; releasedUsd: number; totalUsd: number } {
  const total = p.milestones.length;
  const done = p.milestones.filter((m) => m.status === "verified" || m.status === "instructed").length;
  const totalUsd = p.milestones.reduce((s, m) => s + m.amountUsd, 0);
  const releasedUsd = p.milestones
    .filter((m) => m.status === "instructed")
    .reduce((s, m) => s + m.amountUsd, 0);
  return { done, total, releasedUsd, totalUsd };
}
