// 模拟数据：供应商档案与历史付款记录。
// 后端接入后此文件会被删除，改由数据库驱动。

import type { PaymentRecord, Supplier } from "../engine/types";
import { assessRisk, routePayment } from "../engine";

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "lumen-viet",
    name: "Lumen Viet Manufacturing",
    codeName: "LUMEN VIET",
    region: "越南 · 胡志明市",
    countryCode: "VN",
    restrictedRegion: false,
    preferredChain: "base",
    preferredCoin: "USDC",
    payoutAddress: "0x7a3f…c19d",
    travelRuleCompleteness: 0.72,
    addressNetworkMatch: true,
    paymentCount: 24,
    historicalReturnRate: 0.021,
    avgSettlementHours: 2.4,
    avgAmountUsd: 12800,
    createdAt: "2025-11-02T08:00:00.000Z",
  },
  {
    id: "nordwind-dev",
    name: "Nordwind Dev Studio",
    codeName: "NORDWIND",
    region: "爱沙尼亚 · 塔林",
    countryCode: "EE",
    restrictedRegion: false,
    preferredChain: "arbitrum",
    preferredCoin: "USDC",
    payoutAddress: "0x91b2…4fa7",
    travelRuleCompleteness: 0.98,
    addressNetworkMatch: true,
    paymentCount: 41,
    historicalReturnRate: 0.006,
    avgSettlementHours: 1.6,
    avgAmountUsd: 9400,
    createdAt: "2025-09-14T08:00:00.000Z",
  },
  {
    id: "sahana-design",
    name: "Sahana Design House",
    codeName: "SAHANA",
    region: "印度 · 班加罗尔",
    countryCode: "IN",
    restrictedRegion: false,
    preferredChain: "polygon",
    preferredCoin: "USDC",
    payoutAddress: "0x3d8e…a012",
    travelRuleCompleteness: 0.88,
    addressNetworkMatch: false,
    paymentCount: 12,
    historicalReturnRate: 0.058,
    avgSettlementHours: 4.1,
    avgAmountUsd: 5600,
    createdAt: "2026-01-20T08:00:00.000Z",
  },
  {
    id: "meridian-freight",
    name: "Meridian Freight OU",
    codeName: "MERIDIAN",
    region: "受限地区 · 待复核",
    countryCode: "XX",
    restrictedRegion: true,
    preferredChain: "tron",
    preferredCoin: "USDT",
    payoutAddress: "TQ9f…8m2k",
    travelRuleCompleteness: 0.61,
    addressNetworkMatch: true,
    paymentCount: 5,
    historicalReturnRate: 0.11,
    avgSettlementHours: 6.2,
    avgAmountUsd: 7200,
    createdAt: "2026-04-08T08:00:00.000Z",
  },
];

function buildRecord(
  id: string,
  supplierId: string,
  amountUsd: number,
  status: PaymentRecord["status"],
  createdAt: string,
  routeId?: string,
): PaymentRecord {
  const supplier = MOCK_SUPPLIERS.find((s) => s.id === supplierId)!;
  const input = { supplierId, amountUsd, targetCoin: supplier.preferredCoin };
  const risk = assessRisk(supplier, input);
  const routing = routePayment(supplier, input, risk);
  const route =
    routing.options.find((o) => o.id === routeId) ??
    routing.options.find((o) => o.id === routing.recommendedId)!;
  return {
    id,
    supplierId,
    supplierName: supplier.name,
    supplierCodeName: supplier.codeName,
    amountUsd,
    targetCoin: supplier.preferredCoin,
    riskScore: risk.score,
    riskLevel: risk.level,
    riskFactors: risk.factors,
    selectedRouteId: route.id,
    route,
    status,
    createdAt,
  };
}

export const MOCK_PAYMENTS: PaymentRecord[] = [
  buildRecord("pmt-2041", "nordwind-dev", 9800, "arrived", "2026-08-08T09:12:00.000Z", "arbitrum-usdc"),
  buildRecord("pmt-2040", "lumen-viet", 18400, "settling", "2026-08-09T14:30:00.000Z", "base-usdc"),
  buildRecord("pmt-2039", "sahana-design", 12600, "initiated", "2026-08-10T11:05:00.000Z", "polygon-usdc"),
  buildRecord("pmt-2038", "meridian-freight", 7200, "draft", "2026-08-11T07:40:00.000Z", "tron-usdt"),
  buildRecord("pmt-2037", "nordwind-dev", 8200, "arrived", "2026-08-04T16:20:00.000Z", "arbitrum-usdc"),
];
