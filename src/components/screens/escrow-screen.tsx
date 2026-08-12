"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { Lock, Plus, Trash2, CheckCircle2, Circle, Coins, Unlock } from "lucide-react";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { formatUsdCents, formatDate } from "@/lib/format";
import {
  createEscrow,
  deleteEscrow,
  escrowTotals,
  ESCROW_STATUS_LABEL,
  listEscrows,
  releaseMilestone,
  subscribeEscrow,
  type EscrowContract,
} from "@/lib/escrow";
import { cn } from "@/utils/utils";

export function EscrowScreen() {
  const { suppliers, loading } = useFlowGuardData();
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [creating, setCreating] = useState(false);

  useEffect(() => subscribeEscrow(bump), []);
  const escrows = useMemo(() => listEscrows(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    let locked = 0;
    let released = 0;
    for (const e of escrows) {
      const t = escrowTotals(e);
      locked += t.lockedUsd;
      released += t.releasedUsd;
    }
    return { locked, released };
  }, [escrows]);

  return (
    <section className="pt-1" data-el="escrow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Milestone escrow</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lock funds in a contract and release each milestone as it is delivered.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)]"
          data-el="escrow-new"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> New
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Summary label="Locked" value={formatUsdCents(totals.locked)} icon={<Lock className="h-4 w-4" />} />
        <Summary
          label="Released"
          value={formatUsdCents(totals.released)}
          icon={<Unlock className="h-4 w-4" />}
          highlight
        />
      </div>

      {creating && (
        <CreateEscrowForm
          suppliers={suppliers}
          onDone={() => {
            setCreating(false);
            bump();
          }}
        />
      )}

      {loading ? (
        <div className="mt-4">
          <LoadingBlock rows={3} />
        </div>
      ) : escrows.length === 0 ? (
        <p className="fg-glass mt-4 rounded-2xl p-6 text-center text-sm text-muted-foreground">
          No escrow contracts yet. Create one to lock milestone funds.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {escrows.map((e) => (
            <EscrowCard key={e.id} contract={e} onChange={bump} />
          ))}
        </div>
      )}
    </section>
  );
}

function CreateEscrowForm({
  suppliers,
  onDone,
}: {
  suppliers: { id: string; name: string; currency: string }[];
  onDone: () => void;
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [rows, setRows] = useState([
    { title: "Kickoff", amount: "" },
    { title: "Delivery", amount: "" },
  ]);

  const supplier = suppliers.find((s) => s.id === supplierId);
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const valid = supplier && total > 0 && rows.every((r) => r.title.trim() && Number(r.amount) > 0);

  function submit() {
    if (!supplier || !valid) return;
    createEscrow({
      supplierId: supplier.id,
      supplierName: supplier.name,
      currency: supplier.currency as EscrowContract["currency"],
      milestones: rows.map((r) => ({ title: r.title.trim(), amountUsd: Number(r.amount) })),
    });
    onDone();
  }

  return (
    <div className="fg-glass mt-4 rounded-2xl p-4" data-el="escrow-form">
      <label className="text-[11px] font-medium text-muted-foreground">Payee</label>
      <select
        value={supplierId}
        onChange={(e) => setSupplierId(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-[color:var(--fg-soft)] px-3 py-2 text-sm"
        data-el="escrow-supplier"
      >
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.currency})
          </option>
        ))}
      </select>

      <div className="mt-3 space-y-2">
        <span className="text-[11px] font-medium text-muted-foreground">Milestones</span>
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={r.title}
              onChange={(e) =>
                setRows((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
              }
              placeholder="Milestone"
              className="min-w-0 flex-1 rounded-xl border border-border bg-[color:var(--fg-soft)] px-3 py-2 text-sm"
            />
            <input
              value={r.amount}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, amount: e.target.value.replace(/[^0-9.]/g, "") } : x,
                  ),
                )
              }
              inputMode="decimal"
              placeholder="USD"
              className="w-24 rounded-xl border border-border bg-[color:var(--fg-soft)] px-3 py-2 text-right text-sm font-mono"
            />
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                className="grid w-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground"
                aria-label="Remove milestone"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { title: "", amount: "" }])}
          className="flex items-center gap-1 text-[11px] font-medium text-primary"
        >
          <Plus className="h-3 w-3" /> Add milestone
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">Total {formatUsdCents(total)}</span>
        <button
          type="button"
          disabled={!valid}
          onClick={submit}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-transform active:scale-[0.98]",
            valid
              ? "bg-primary text-primary-foreground shadow-[var(--fg-shadow-sm)]"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
          data-el="escrow-create"
        >
          <Lock className="h-3.5 w-3.5" /> Lock funds
        </button>
      </div>
    </div>
  );
}

function EscrowCard({ contract, onChange }: { contract: EscrowContract; onChange: () => void }) {
  const t = escrowTotals(contract);
  const pct = contract.totalUsd > 0 ? Math.round((t.releasedUsd / contract.totalUsd) * 100) : 0;

  return (
    <article className="fg-glass rounded-2xl p-4" data-el="escrow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{contract.supplierName}</span>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{contract.currency}</span>
          </div>
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
            {contract.contractAddress}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            deleteEscrow(contract.id);
            onChange();
          }}
          className="shrink-0 text-muted-foreground"
          aria-label="Delete escrow"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
            contract.status === "completed"
              ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
              : contract.status === "active"
                ? "bg-primary/15 text-primary"
                : "bg-[color:var(--fg-soft)] text-muted-foreground",
          )}
        >
          {ESCROW_STATUS_LABEL[contract.status]}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {t.releasedCount}/{contract.milestones.length} released
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--fg-soft)]">
        <div className="h-full rounded-full bg-[color:var(--success)]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>Locked {formatUsdCents(t.lockedUsd)}</span>
        <span className="text-[color:var(--success)]">Released {formatUsdCents(t.releasedUsd)}</span>
      </div>

      {/* Milestone timeline */}
      <ol className="mt-3 space-y-2" data-el="escrow-milestones">
        {contract.milestones.map((m) => (
          <li key={m.id} className="flex items-center gap-2.5" data-el="escrow-milestone">
            {m.status === "released" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--success)]" aria-hidden />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium">{m.title}</span>
                <span className="shrink-0 font-mono text-[11px]">{formatUsdCents(m.amountUsd)}</span>
              </div>
              {m.status === "released" && m.releasedAt && (
                <span className="font-mono text-[9px] text-muted-foreground">
                  released {formatDate(m.releasedAt)}
                </span>
              )}
            </div>
            {m.status === "locked" && (
              <button
                type="button"
                onClick={() => {
                  releaseMilestone(contract.id, m.id);
                  onChange();
                }}
                className="shrink-0 rounded-full border border-primary/50 px-2.5 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
                data-el="escrow-release"
              >
                Mark reached
              </button>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}

function Summary({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={cn("fg-glass min-w-0 rounded-2xl p-4", highlight && "border border-[color:var(--success)]/40")}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className={cn("shrink-0", highlight ? "text-[color:var(--success)]" : "text-primary")}>
          {icon}
        </span>
        <span className="min-w-0 truncate text-[11px]">{label}</span>
      </div>
      <div
        className={cn(
          "mt-2 truncate font-mono text-xl font-bold tabular-nums",
          highlight && "text-[color:var(--success)]",
        )}
      >
        {value}
      </div>
    </div>
  );
}
