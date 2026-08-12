// Shared helper: turn a lightweight "add payee" form input into a complete
// Supplier domain object. Used by both the backend (POST /api/suppliers) and
// the guest-mode local path so the two never diverge. Risk/history stats start
// at zero for a brand-new payee; risk tag is inferred from account status.

import type {
  AccountStatus,
  ChannelClass,
  Currency,
  Supplier,
} from "@/lib/engine/types";

export interface NewSupplierInput {
  name: string;
  country: string;
  countryCode?: string;
  currency: Currency;
  bankName: string;
  swift: string;
  iban: string;
  accountStatus: AccountStatus;
  preferredChannel: ChannelClass;
  stablecoinWallet?: string;
}

// Broad multi-chain address check: EVM (0x + 40 hex), Tron (T + 33), or a
// generic base58/alphanumeric 26–64 chars. Kept lenient — we validate shape,
// not chain-specific checksums.
export function validateWalletAddress(raw: string): string | null {
  const v = raw.trim();
  if (v === "") return "Enter a wallet address.";
  const ok =
    /^0x[a-fA-F0-9]{40}$/.test(v) ||
    /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(v) ||
    /^[1-9A-HJ-NP-Za-km-z]{26,64}$/.test(v);
  return ok ? null : "Enter a valid wallet address.";
}

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "SGD", "INR", "VND", "AED"];
const ACCOUNT_STATUSES: AccountStatus[] = ["active", "dormant", "unverified"];
const CHANNELS: ChannelClass[] = ["stablecoin-direct", "local-fiat"];

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof NewSupplierInput, string>>;
  value?: NewSupplierInput;
}

/** Validate + normalize a raw form/body payload into a NewSupplierInput. */
export function validateNewSupplier(raw: unknown): ValidationResult {
  const errors: ValidationResult["errors"] = {};
  const b = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = str(b.name);
  const country = str(b.country);
  const bankName = str(b.bankName);
  const swift = str(b.swift).toUpperCase();
  const iban = str(b.iban).toUpperCase().replace(/\s+/g, "");
  const currency = str(b.currency) as Currency;
  const accountStatus = str(b.accountStatus) as AccountStatus;
  const preferredChannel = str(b.preferredChannel) as ChannelClass;
  const countryCode = str(b.countryCode).toUpperCase().slice(0, 2);
  const stablecoinWallet = str(b.stablecoinWallet);

  if (name.length < 2) errors.name = "Enter the legal beneficiary name.";
  if (country.length < 2) errors.country = "Enter a country or region.";
  if (!CURRENCIES.includes(currency)) errors.currency = "Choose a currency.";
  if (bankName.length < 2) errors.bankName = "Enter the beneficiary bank name.";
  if (!ACCOUNT_STATUSES.includes(accountStatus)) errors.accountStatus = "Choose an account status.";
  if (!CHANNELS.includes(preferredChannel)) errors.preferredChannel = "Choose a preferred channel.";

  // Stablecoin-direct settles to a wallet address, not a bank account — so the
  // bank IBAN/SWIFT are optional there (validated only when provided) and the
  // wallet is required instead. Local-fiat still requires a valid IBAN + SWIFT.
  const isStablecoin = preferredChannel === "stablecoin-direct";
  if (swift !== "" || !isStablecoin) {
    if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(swift)) {
      errors.swift = isStablecoin
        ? "If provided, SWIFT/BIC must be 8 or 11 letters/digits."
        : "SWIFT/BIC must be 8 or 11 letters/digits.";
    }
  }
  if (iban !== "" || !isStablecoin) {
    if (!/^[A-Z0-9]{10,34}$/.test(iban)) {
      errors.iban = isStablecoin
        ? "If provided, IBAN must be 10–34 letters/digits."
        : "Enter a valid IBAN (10–34 letters/digits).";
    }
  }
  // Wallet required for stablecoin-direct; optional (but validated) otherwise.
  if (isStablecoin && stablecoinWallet === "") {
    errors.stablecoinWallet = "Stablecoin-direct needs a wallet address.";
  } else if (stablecoinWallet !== "") {
    const walletErr = validateWalletAddress(stablecoinWallet);
    if (walletErr) errors.stablecoinWallet = walletErr;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: {},
    value: {
      name,
      country,
      countryCode,
      currency,
      bankName,
      swift,
      iban,
      accountStatus,
      preferredChannel,
      stablecoinWallet: stablecoinWallet || undefined,
    },
  };
}

function makeId(): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `sup_${Date.now().toString(36)}_${rnd}`;
}

function makeCodeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")
    .slice(0, 16) || "PAYEE";
}

/** Build a full Supplier from validated input. Stats start at zero. */
export function buildSupplier(input: NewSupplierInput): Omit<Supplier, "createdAt"> {
  // A dormant/unverified account is a data-quality risk on a brand-new payee.
  const riskTag = input.accountStatus === "active" ? "low" : "medium";
  return {
    id: makeId(),
    name: input.name,
    codeName: makeCodeName(input.name),
    country: input.country,
    countryCode: input.countryCode || input.country.slice(0, 2).toUpperCase(),
    currency: input.currency,
    entityType: "overseas",
    bankName: input.bankName,
    swift: input.swift,
    iban: input.iban,
    accountStatus: input.accountStatus,
    restrictedRegion: false,
    bankBlacklisted: false,
    preferredChannel: input.preferredChannel,
    riskTag,
    paymentCount: 0,
    historicalReturnRate: 0,
    avgSettlementHours: 0,
    avgAmountUsd: 0,
    stablecoinWallet: input.stablecoinWallet,
  };
}
