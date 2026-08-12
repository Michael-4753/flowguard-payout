"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/app-shell";
import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { BuildStep } from "@/components/wizard/build-step";
import { PrecheckStep } from "@/components/wizard/precheck-step";
import { RouteStep } from "@/components/wizard/route-step";
import { LoadingBlock } from "@/components/shared/loading-block";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { assessPayment, createPayment } from "@/lib/api";
import type { ChannelClass, Currency, RiskAssessment, RoutingResult, Supplier } from "@/lib/engine/types";

interface Assessed {
  supplier: Supplier;
  risk: RiskAssessment;
  routing: RoutingResult;
  amountUsd: number;
  settleCurrency: Currency;
  preferredChannel?: ChannelClass;
}

function PayWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { suppliers, loading, refresh } = useFlowGuardData();

  const querySupplier = params.get("supplier") ?? undefined;
  const queryAmount = params.get("amount") ? Number(params.get("amount")) : undefined;

  // Always start on the Draft step so the user picks a payee + amount. A
  // ?supplier=/?amount= query only pre-fills the form; it never skips it.
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [assessed, setAssessed] = useState<Assessed | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function runAssess(v: { supplierId: string; amountUsd: number; preferredChannel?: ChannelClass; settleCurrency: Currency }) {
    setAssessing(true);
    try {
      const res = await assessPayment(v);
      setAssessed({ ...res, amountUsd: v.amountUsd, settleCurrency: v.settleCurrency, preferredChannel: v.preferredChannel });
      setStep(1);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAssessing(false);
    }
  }

  async function handleConfirm(routeId: string) {
    if (!assessed) return;
    try {
      await createPayment({
        supplierId: assessed.supplier.id,
        amountUsd: assessed.amountUsd,
        preferredChannel: assessed.preferredChannel,
        selectedRouteId: routeId,
        settleCurrency: assessed.settleCurrency,
      });
      setConfirmed(true);
      toast.success("Submitted for review — awaiting checker approval");
      await refresh();
      setTimeout(() => router.push("/review"), 900);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <section className="pt-1" data-el="pay-wizard">
      <WizardStepper current={step} />

      {step === 0 &&
        (loading && suppliers.length === 0 ? (
          <LoadingBlock rows={4} />
        ) : (
          <BuildStep
            suppliers={suppliers}
            initialSupplierId={querySupplier}
            initialAmount={queryAmount}
            onSubmit={runAssess}
          />
        ))}

      {step === 1 && !assessed && assessing && <LoadingBlock rows={4} />}

      {step === 1 && assessed && (
        <>
          <DraftBanner
            name={assessed.supplier.name}
            amount={assessed.amountUsd}
            settleCurrency={assessed.settleCurrency}
            payeeCurrency={assessed.supplier.currency}
          />
          <PrecheckStep
            key={assessed.supplier.id + assessed.amountUsd}
            supplier={assessed.supplier}
            risk={assessed.risk}
            onContinue={() => setStep(2)}
          />
        </>
      )}

      {step === 2 && assessed && (
        <RouteStep
          routing={assessed.routing}
          risk={assessed.risk}
          supplier={assessed.supplier}
          onConfirm={handleConfirm}
          confirmed={confirmed}
        />
      )}
    </section>
  );
}

function DraftBanner({
  name,
  amount,
  settleCurrency,
  payeeCurrency,
}: {
  name: string;
  amount: number;
  settleCurrency: Currency;
  payeeCurrency: Currency;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-border px-4 py-2.5">
      <span className="truncate text-sm font-semibold">{name}</span>
      <span className="flex shrink-0 items-center gap-1.5 font-mono text-sm font-bold">
        <span className="text-primary">
          {amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {settleCurrency}
        </span>
        {payeeCurrency !== settleCurrency && (
          <span className="text-[10px] font-medium text-muted-foreground">→ 到账 {payeeCurrency}</span>
        )}
      </span>
    </div>
  );
}

export default function PayPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingBlock rows={4} />}>
        <PayWizard />
      </Suspense>
    </AppShell>
  );
}
