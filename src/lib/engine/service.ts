import "server-only";
import { assessRisk, routePayment } from "@/lib/engine";
import type {
  PaymentInput,
  RiskAssessment,
  RoutingResult,
  Supplier,
} from "@/lib/engine/types";

export interface AssessResult {
  supplier: Supplier;
  risk: RiskAssessment;
  routing: RoutingResult;
}

/** 服务端确定性预检 + 路由计算。 */
export function assessAndRoute(supplier: Supplier, input: PaymentInput): AssessResult {
  const risk = assessRisk(supplier);
  const routing = routePayment(supplier, input, risk);
  return { supplier, risk, routing };
}
