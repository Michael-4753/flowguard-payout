"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/app-shell";
import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { BuildStep } from "@/components/wizard/build-step";
import { PrecheckStep } from "@/components/wizard/precheck-step";
import { RouteStep } from "@/components/wizard/route-step";
import { LoadingBlock } from "@/components/shared/loading-block";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { assessPayment, createPayment } from "@/lib/api";
import type {
  RiskAssessment,
  RoutingResult,
  StableCoin,
  Supplier,
} from "@/lib/engine/types";

// 预览切片：无参数时对默认草稿（Lumen Viet, $18,400）跑预检并进入预检态。
const PREVIEW_DRAFT = { supplierId: "lumen-viet", amountUsd: 18400 };

interface Assessed {
  supplier: Supplier;
  risk: RiskAssessment;
  routing: RoutingResult;
  amountUsd: number;
  targetCoin?: StableCoin;
}

function PayWizard() {
  const { t } = useTranslation();
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

  async function runAssess(v: { supplierId: string; amountUsd: number; targetCoin?: StableCoin }) {
    setAssessing(true);
    try {
      const res = await assessPayment(v);
      setAssessed({ ...res, amountUsd: v.amountUsd, targetCoin: v.targetCoin });
      setStep(1);
    } catch {
      toast.error(t("errors.generic.title"));
    } finally {
      setAssessing(false);
    }
  }

  // 预览切片：无参数、供应商已加载且包含默认草稿时，自动跑预检。
  useEffect(() => {
    if (hasQuery || loading || previewTried.current || suppliers.length === 0) return;
    if (!suppliers.some((s) => s.id === PREVIEW_DRAFT.supplierId)) return;
    previewTried.current = true;
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (alive) await runAssess(PREVIEW_DRAFT);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasQuery, loading, suppliers]);

  async function handleConfirm(routeId: string) {
    if (!assessed) return;
    try {
      await createPayment({
        supplierId: assessed.supplier.id,
        amountUsd: assessed.amountUsd,
        targetCoin: assessed.targetCoin,
        selectedRouteId: routeId,
      });
      setConfirmed(true);
      toast.success(t("wizard.route.confirmed"));
      await refresh();
      setTimeout(() => router.push("/history"), 900);
    } catch {
      toast.error(t("errors.generic.title"));
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
      <span className="shrink-0 font-mono text-sm font-bold text-primary">
        ${amount.toLocaleString("en-US")}
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
