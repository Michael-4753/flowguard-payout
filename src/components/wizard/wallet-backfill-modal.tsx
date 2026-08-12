"use client";

import { useState } from "react";
import { Wallet, Loader2, X } from "lucide-react";
import { setSupplierWallet } from "@/lib/api";
import { validateWalletAddress } from "@/lib/supplier-input";
import { cn } from "@/utils/utils";

/**
 * Hard-stop backfill: shown when a cashier tries to send via Stablecoin Direct
 * but the payee has no stablecoin wallet on file. The payout cannot proceed
 * until a valid address is captured (and written back to the payee record),
 * preventing a guaranteed return.
 */
export function WalletBackfillModal({
  supplierId,
  supplierName,
  onClose,
  onSaved,
}: {
  supplierId: string;
  supplierName: string;
  onClose: () => void;
  onSaved: (wallet: string) => void;
}) {
  const [wallet, setWallet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const err = validateWalletAddress(wallet);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setSupplierWallet(supplierId, wallet.trim());
      onSaved(wallet.trim());
    } catch {
      setError("Couldn't save the wallet address. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" data-el="wallet-backfill">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-border bg-[color:var(--card)] p-5 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--warning)]/15 text-[color:var(--warning)]">
              <Wallet className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold tracking-tight">Stablecoin wallet required</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full border border-border p-1.5 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[13px] leading-relaxed text-muted-foreground">
          <b className="text-foreground">{supplierName}</b> has no stablecoin wallet on file. A
          Stablecoin Direct payout to a payee without a compatible wallet cannot be claimed and will
          be returned. Add the address to continue — it is saved to the payee record.
        </p>

        <label className="mt-4 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Wallet address (USDC-compatible)
        </label>
        <input
          type="text"
          value={wallet}
          onChange={(e) => {
            setWallet(e.target.value);
            if (error) setError(null);
          }}
          placeholder="0x… / T…"
          className={cn(
            "mt-1 w-full rounded-xl border bg-transparent px-3 py-2 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[color:var(--primary)]",
            error ? "border-[color:var(--danger)]" : "border-border",
          )}
          data-el="wallet-backfill-input"
        />
        {error && <p className="mt-1 text-[11px] text-[color:var(--danger)]">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--primary)] py-2.5 text-sm font-bold text-[color:var(--primary-foreground)] transition-transform active:scale-[0.99] disabled:opacity-60"
            data-el="wallet-backfill-save"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save &amp; continue
          </button>
        </div>
      </div>
    </div>
  );
}
