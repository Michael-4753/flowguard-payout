// Post-approval payout INSTRUCTION builder. Turns an approved payment + its
// beneficiary profile into the concrete material a finance operator SUBMITS to a
// licensed institution (Local Fiat → MT103 remittance advice for the bank/PSP;
// Digital-asset settlement → settlement instruction handed to the overseas
// licensed institution that performs the settlement). This platform is a
// software decision-support tool only: it does NOT move funds, hold funds, or
// perform any crypto/stablecoin exchange, custody or transfer. Pure &
// deterministic: no network, no state.

import type { PaymentRecord, Supplier } from "@/lib/engine/types";

export interface InstructionField {
  label: string;
  value: string;
  /** Mono/reference styling hint for the UI. */
  mono?: boolean;
}

export type PayoutInstruction =
  | {
      channel: "local-fiat";
      title: string;
      /** Ordered fields for an MT103 remittance advice. */
      fields: InstructionField[];
      /** Plain-text block for one-click copy. */
      copyText: string;
    }
  | {
      channel: "stablecoin-direct";
      title: string;
      fields: InstructionField[];
      /** Destination wallet — encoded into the QR. */
      walletAddress: string;
      /** Human amount label, e.g. "1,250.00 USDC". */
      amountLabel: string;
      copyText: string;
    };

function fmtAmount(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toCopyText(title: string, fields: InstructionField[]): string {
  return [title, "", ...fields.map((f) => `${f.label}: ${f.value}`)].join("\n");
}

/**
 * Build the channel-aware payout instruction. Funds leave in the payment's
 * settlement currency; the payee is credited in their local currency (converted
 * at payout for Local Fiat).
 */
export function buildPayoutInstruction(
  payment: PaymentRecord,
  supplier: Supplier,
): PayoutInstruction {
  const amount = fmtAmount(payment.amountUsd);
  const settle = payment.settleCurrency;

  if (payment.route.channelClass === "stablecoin-direct") {
    const amountLabel = `${amount} ${settle}`;
    const fields: InstructionField[] = [
      { label: "Beneficiary", value: supplier.name },
      { label: "Beneficiary country", value: supplier.country },
      { label: "Settlement type", value: "Digital-asset settlement via overseas licensed institution" },
      { label: "Amount", value: amountLabel, mono: true },
      { label: "Settlement currency", value: settle },
      { label: "Reference", value: payment.onchainRef || payment.invoiceNo, mono: true },
      { label: "Invoice", value: payment.invoiceNo, mono: true },
    ];
    const title = "Settlement instruction — submit to the licensed institution";
    return {
      channel: "stablecoin-direct",
      title,
      fields,
      walletAddress: "",
      amountLabel,
      copyText: toCopyText(title, fields),
    };
  }

  // Local Fiat → MT103 remittance advice.
  const fields: InstructionField[] = [
    { label: "Beneficiary name (59)", value: supplier.name },
    { label: "Beneficiary bank (57)", value: supplier.bankName },
    { label: "SWIFT / BIC (57A)", value: supplier.swift, mono: true },
    { label: "Account / IBAN (59)", value: supplier.iban, mono: true },
    { label: "Beneficiary country", value: supplier.country },
    { label: "Amount & currency (32A)", value: `${settle} ${amount}`, mono: true },
    { label: "Payout currency", value: `${supplier.currency} (converted at payout)` },
    { label: "Remittance ref (70)", value: payment.invoiceNo, mono: true },
    { label: "Bank ref / UETR (20)", value: payment.offchainRef, mono: true },
  ];
  const title = "MT103 remittance advice — submit to bank / PSP";
  return {
    channel: "local-fiat",
    title,
    fields,
    copyText: toCopyText(title, fields),
  };
}
