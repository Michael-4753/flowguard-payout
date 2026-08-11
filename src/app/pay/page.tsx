"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/app-shell";
import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { BuildStep } from "@/components/wizard/build-step";
import { PrecheckStep } from "@/components/wizard/precheck-step";
import { RouteStep } from "@/components/wizard/route-step";
import { useSuppliers, getSupplier, addPayment } from "@/lib/mock/store";
import { assessRisk, routePayment } from "@/lib/engine";
import type { PaymentInput, PaymentRecord, StableCoin } from "@/lib/engine/types";

// 预览切片：无参数时直接进入「风险预检」态，加载一笔草稿（Lumen Viet, $18,400）。
const PREVIEW_DRAFT: PaymentInput = { supplierId: "lumen-viet", amountUsd: 18400 };

function PayWizard() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const suppliers = useSuppliers();

  const querySupplier = params.get("supplier") ?? undefined;
  const queryAmount = params.get("amount") ? Number(params.get("amount")) : undefined;
  // 携带参数：从建单开始并预填；无参数：预览切片直接进入预检。
  const hasQuery = Boolean(querySupplier);

  const [step, setStep] = useState<0 | 1 | 2>(hasQuery ? 0 : 1);
  const [input, setInput] = useState<PaymentInput>(hasQuery ? { supplierId: "", amountUsd: 0 } : PREVIEW_DRAFT);
  const [confirmed, setConfirmed] = useState(false);

  const supplier = getSupplier(input.supplierId);
  const risk = useMemo(
    () => (supplier ? assessRisk(supplier, input) : null),
    [supplier, input],
  );
  const routing = useMemo(
    () => (supplier && risk ? routePayment(supplier, input, risk) : null),
    [supplier, risk, input],
  );

  function handleBuild(v: { supplierId: string; amountUsd: number; targetCoin?: StableCoin }) {
    setInput(v);
    setStep(1);
  }

  function handleConfirm(routeId: string) {
    if (!supplier || !risk || !routing) return;
    const route = routing.options.find((o) => o.id === routeId) ?? routing.options[0];
    const record: PaymentRecord = {
      id: `pmt-${Date.now().toString().slice(-6)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCodeName: supplier.codeName,
      amountUsd: input.amountUsd,
      targetCoin: input.targetCoin ?? supplier.preferredCoin,
      riskScore: risk.score,
      riskLevel: risk.level,
      riskFactors: risk.factors,
      selectedRouteId: route.id,
      route,
      status: "initiated",
      createdAt: new Date().toISOString(),
    };
    addPayment(record);
    setConfirmed(true);
    toast.success(t("wizard.route.confirmed"));
    setTimeout(() => router.push("/history"), 900);
  }

  return (
    <AppShell>
      <section className="pt-1" data-el="pay-wizard">
        <WizardStepper current={step} />

        {step === 0 && (
          <BuildStep
            suppliers={suppliers}
            initialSupplierId={querySupplier}
            initialAmount={queryAmount}
            onSubmit={handleBuild}
          />
        )}

        {step === 1 && risk && supplier && (
          <>
            <DraftBanner name={supplier.name} amount={input.amountUsd} />
            <PrecheckStep risk={risk} onContinue={() => setStep(2)} />
          </>
        )}

        {step === 2 && routing && risk && (
          <RouteStep routing={routing} risk={risk} onConfirm={handleConfirm} confirmed={confirmed} />
        )}
      </section>
    </AppShell>
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
    <Suspense fallback={null}>
      <PayWizard />
    </Suspense>
  );
}
