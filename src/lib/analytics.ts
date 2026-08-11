// Aggregation helpers for the multi-country supplier view and country-exposure
// overview. Pure functions — reused by the Payees page, Home, and Reconcile.

import type { Currency, PaymentRecord, Supplier } from "@/lib/engine/types";

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
