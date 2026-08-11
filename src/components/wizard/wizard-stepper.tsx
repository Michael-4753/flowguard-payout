"use client";

import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/utils/utils";

const STEPS = ["step1", "step2", "step3"] as const;

export function WizardStepper({ current }: { current: 0 | 1 | 2 }) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex items-center gap-1.5" data-el="wizard-stepper">
      {STEPS.map((key, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={key} className="flex flex-1 items-center gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full font-mono text-[11px] font-bold transition-colors",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-[color:var(--success)] text-black",
                  !active && !done && "border border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t(`wizard.${key}`)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px flex-1 bg-border" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
