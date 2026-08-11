"use client";

import { useRouter } from "next/navigation";
import { UserRound, LogOut } from "lucide-react";
import { exitGuestMode, useIsGuest } from "@/lib/guest/guest-session";

/** Header badge shown only in guest mode: identifies the guest + exit control. */
export function GuestBadge() {
  const guest = useIsGuest();
  const router = useRouter();

  if (!guest) return null;

  return (
    <div className="flex shrink-0 items-center gap-2" data-el="guest-badge">
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-[color:var(--fg-soft)] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
        <UserRound className="h-3 w-3" aria-hidden />
        Guest
      </span>
      <button
        type="button"
        onClick={() => {
          exitGuestMode();
          router.push("/");
        }}
        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-[color:var(--fg-soft)]"
        data-el="guest-exit"
      >
        <LogOut className="h-3 w-3" aria-hidden />
        Exit
      </button>
    </div>
  );
}
