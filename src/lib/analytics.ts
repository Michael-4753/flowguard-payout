// Aggregation helpers for the multi-country supplier view and country-exposure
// overview. Pure functions — reused by the Payees page, Home, and Reconcile.

import type { Currency, FlowHop, PaymentRecord, Supplier } from "@/lib/engine/types";

/** Per-country rollup of payees + payment exposure. */
export interface CountryGroup {
  country: string;
  countryCode: string;
  suppliers: Supplier[];
  /** Distinct currencies used by payees in this country. */
  currencies: Currency[];
  /** Total routed volume (USD) to this country. */
  volumeUsd: number;
  /** Number of payments to this country. */
  paymentCount: number;
  /** Weighted historical return rate 0-1 across this country's payees. */
  returnRate: number;
  /** Whether any payee here is sanctioned / high-risk. */
  restricted: boolean;
}

/** Group payees by country and fold in payment volume/return exposure. */
export function groupByCountry(
  suppliers: Supplier[],
  payments: PaymentRecord[],
): CountryGroup[] {
  const bySupplier = new Map<string, PaymentRecord[]>();
  for (const p of payments) {
    const list = bySupplier.get(p.supplierId) ?? [];
    list.push(p);
    bySupplier.set(p.supplierId, list);
  }

  const map = new Map<string, CountryGroup>();
  for (const s of suppliers) {
    const key = s.countryCode || s.country;
    const g =
      map.get(key) ??
      ({
        country: s.country,
        countryCode: s.countryCode,
        suppliers: [],
        currencies: [],
        volumeUsd: 0,
        paymentCount: 0,
        returnRate: 0,
        restricted: false,
      } satisfies CountryGroup);

    g.suppliers.push(s);
    if (!g.currencies.includes(s.currency)) g.currencies.push(s.currency);
    if (s.restrictedRegion) g.restricted = true;

    const pays = bySupplier.get(s.id) ?? [];
    g.volumeUsd += pays.reduce((sum, p) => sum + p.amountUsd, 0);
    g.paymentCount += pays.length;

    map.set(key, g);
  }

  // Weighted return rate = avg of payee historical rates in the country.
  const groups = [...map.values()].map((g) => {
    const rate =
      g.suppliers.reduce((sum, s) => sum + s.historicalReturnRate, 0) /
      Math.max(1, g.suppliers.length);
    return { ...g, returnRate: rate };
  });

  // Highest exposure first (volume, then payee count).
  return groups.sort(
    (a, b) => b.volumeUsd - a.volumeUsd || b.suppliers.length - a.suppliers.length,
  );
}

/** Distinct currencies present across all payees, sorted. */
export function distinctCurrencies(suppliers: Supplier[]): Currency[] {
  return [...new Set(suppliers.map((s) => s.currency))].sort();
}

/** Where the money currently sits on the route (in-transit position). */
export interface FlowProgress {
  hops: FlowHop[];
  /** Index of the hop the money is currently at / stuck on. */
  currentIndex: number;
  /** Whether the payment is done (arrived) or dead (returned). */
  done: boolean;
  returned: boolean;
  /** Short status caption. */
  caption: string;
}

/**
 * Derive the in-transit position (pain point 1: "you can't see where the money
 * is or which intermediary it's stuck at, you just wait"). Maps the payment
 * status onto the selected route's hops so the UI can highlight the current
 * layer instead of leaving the payer in the dark.
 */
export function deriveFlowProgress(record: PaymentRecord): FlowProgress {
  const hops = record.route.hops;
  const last = hops.length - 1;
  const chokeIdx = hops.findIndex((h) => h.chokepoint);

  switch (record.status) {
    case "draft":
    case "initiated":
      return { hops, currentIndex: 0, done: false, returned: false, caption: "Initiated at origin" };
    case "settling": {
      const idx = chokeIdx >= 0 ? chokeIdx : Math.max(1, Math.floor(last / 2));
      return {
        hops,
        currentIndex: idx,
        done: false,
        returned: false,
        caption: hops[idx]?.chokepoint
          ? `Held at ${hops[idx].bankName}`
          : `In transit via ${hops[idx]?.bankName ?? "intermediary"}`,
      };
    }
    case "arrived":
      return { hops, currentIndex: last, done: true, returned: false, caption: "Arrived at beneficiary" };
    case "returned": {
      const idx = chokeIdx >= 0 ? chokeIdx : Math.max(1, Math.floor(last / 2));
      return {
        hops,
        currentIndex: idx,
        done: false,
        returned: true,
        caption: `Returned from ${hops[idx]?.bankName ?? "intermediary"}`,
      };
    }
    default:
      return { hops, currentIndex: 0, done: false, returned: false, caption: "" };
  }
}
