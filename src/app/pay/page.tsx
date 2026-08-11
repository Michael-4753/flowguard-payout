"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
import type { ChannelClass, RiskAssessment, RoutingResult, Supplier } from "@/lib/engine/types";
import { formatUsd } from "@/lib/format";

// Preview slice: with no params, run the pre-check on a default draft.
const PREVIEW_DRAFT = { supplierId: "meridian-freight", amountUsd: 18400 };

interface Assessed {
  supplier: Supplier;
  risk: RiskAssessment;
  routing: RoutingResult;
  amountUsd: number;
  preferredChannel?: ChannelClass;
}

function PayWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { suppliers, loading, refresh } = useFlowGuardData();

  const querySupplier = params.get("supplier") ?? undefined;
  const queryAmount = params.get("amount") ? Number(params.get("amount")) : undefined;
  const hasQuery = Boolean(querySupplier);

  const [step, setStep] = useState<0 | 1 | 2>(hasQuery ? 0 : 1);
  const [assessed, setAssessed] = useState<Assessed | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const previewTried = useRef(false);

  async function runAssess(v: { supplierId: string; amountUsd: number; preferredChannel?: ChannelClass }) {
    setAssessing(true);
    try {
      const res = await assessPayment(v);
      setAssessed({ ...res, amountUsd: v.amountUsd, preferredChannel: v.preferredChannel });
      setStep(1);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAssessing(false);
    }
  }

  useEffect(() => {
    if (hasQuery || loading || previewTried.current || suppliers.length === 0) return;
    const draftId = suppliers.some((s) => s.id === PREVIEW_DRAFT.supplierId)
      ? PREVIEW_DRAFT.supplierId
      : suppliers[0].id;
    previewTried.current = true;
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (alive) await runAssess({ supplierId: draftId, amountUsd: PREVIEW_DRAFT.amountUsd });
    })();
    return () => {
      alive = false;
    };
  }, [hasQuery, loading, suppliers]);

  async function handleConfirm(routeId: string) {
    if (!assessed) return;
    try {
      await createPayment({
        supplierId: assessed.supplier.id,
        amountUsd: assessed.amountUsd,
        preferredChannel: assessed.preferredChannel,
        selectedRouteId: routeId,
      });
      setConfirmed(true);
      toast.success("Payment initiated");
      await refresh();
      setTimeout(() => router.push("/history"), 900);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <section className="pt-1" data-el="pay-wizard">
      <WizardStepper current={step} />

      {step === 0 && (
        <BuildStep
          suppliers={suppliers}
          initialSupplierId={querySupplier}
          initialAmount={queryAmount}
          onSubmit={runAssess}
        />
      )}

      {step === 1 && !assessed && (assessing || loading) && <LoadingBlock rows={4} />}

      {step === 1 && assessed && (
        <>
          <DraftBanner name={assessed.supplier.name} amount={assessed.amountUsd} />
          <PrecheckStep
            key={assessed.supplier.id + assessed.amountUsd}
            risk={assessed.risk}
            onContinue={() => setStep(2)}
          />
        </>
      )}

      {step === 2 && assessed && (
        <RouteStep
          routing={assessed.routing}
          risk={assessed.risk}
          onConfirm={handleConfirm}
          confirmed={confirmed}
        />
      )}
    </section>
  );
}

function DraftBanner({ name, amount }: { name: string; amount: number }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl border border-border px-4 py-2.5">
      <span className="truncate text-sm font-semibold">{name}</span>
      <span className="shrink-0 font-mono text-sm font-bold text-primary">{formatUsd(amount)}</span>
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
