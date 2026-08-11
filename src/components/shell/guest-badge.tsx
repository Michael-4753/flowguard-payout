"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound, LogOut, AlertTriangle } from "lucide-react";
import { exitGuestMode, useIsGuest } from "@/lib/guest/guest-session";

/** Header badge shown only in guest mode: identifies the guest + exit control. */
export function GuestBadge() {
  const guest = useIsGuest();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  if (!guest) return null;

  function confirmExit() {
    exitGuestMode();
    setConfirming(false);
    router.push("/");
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2" data-el="guest-badge">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-[color:var(--fg-soft)] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <UserRound className="h-3 w-3" aria-hidden />
          Guest
        </span>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-[color:var(--fg-soft)]"
          data-el="guest-exit"
        >
          <LogOut className="h-3 w-3" aria-hidden />
          Exit
        </button>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 grid place-items-center px-6"
          role="dialog"
          aria-modal="true"
          data-el="guest-exit-dialog"
        >
          {/* backdrop */}
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setConfirming(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          {/* card */}
          <div className="fg-glass relative z-10 w-full max-w-xs rounded-[24px] p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[color:var(--danger)]/15 text-[color:var(--danger)]">
              <AlertTriangle className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="mt-4 text-base font-bold">Leave guest mode?</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Payment records saved on this device will be permanently cleared and
              cannot be recovered.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmExit}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--danger)] px-4 py-3 text-sm font-bold text-white transition-transform active:scale-[0.99]"
                data-el="guest-exit-confirm"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Exit guest mode
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex w-full items-center justify-center rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-[color:var(--fg-soft)]"
                data-el="guest-exit-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
