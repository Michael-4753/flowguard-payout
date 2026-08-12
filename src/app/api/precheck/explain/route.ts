import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { appAi, AppAIUnavailableError } from "@/lib/eazo-ai-billing";

/**
 * LLM-powered recipient-info pre-check explanation (App AI, text capability).
 * The deterministic rule engine stays the source of truth for the score and hit
 * factors; DeepSeek turns that snapshot into a plain-language compliance
 * briefing + concrete remediation. The system prompt embeds a compact
 * country / compliance rule knowledge base so guidance is corridor-aware.
 */

const KNOWLEDGE_BASE = `
You are a cross-border payout compliance analyst for a payments console.
Ground every statement in the deterministic pre-check snapshot you are given;
do NOT invent scores or new hit factors. Explain WHY the payment might be
returned and HOW to fix it, in plain business English.

Corridor / compliance rules of thumb:
- SWIFT/BIC must be 8 or 11 chars; malformed codes bounce at the routing bank.
- IBAN corridors (EUR/GBP) require valid country + check digits; invalid IBAN
  causes invalid-account returns.
- FX-controlled currencies (INR, VND, AED) need an invoice + business purpose
  and often a local tax/registration ID, or funds are held.
- Sanctioned / high-risk regions require enhanced due diligence and a
  compliance sign-off before sending; do not advise resending without it.
- Dormant / unverified beneficiary accounts frequently reject inbound wires.
- Blacklisted beneficiary banks are intercepted; suggest an alternate bank or a
  licensed local-fiat PSP corridor.
- Two payout paths exist: "Stablecoin Direct" (USDC, overseas entities only,
  on-chain traceable) and "Local Fiat Payout" (PSP + correspondent bank rail).

Output rules:
- Return STRICT JSON only, no markdown fences.
- Shape: {"summary": string, "actions": string[]}.
- "summary": 1-2 sentences on the overall return risk and the single biggest
  driver.
- "actions": 2-4 short imperative remediation steps, most important first.
`.trim();

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const snapshot = body?.snapshot;
  if (!snapshot || typeof snapshot !== "object") {
    return Response.json({ error: "Missing pre-check snapshot" }, { status: 400 });
  }

  let result;
  try {
    result = await appAi.chat({
      messages: [
        { role: "system", content: KNOWLEDGE_BASE },
        {
          role: "user",
          content: `Deterministic pre-check snapshot (JSON):\n${JSON.stringify(
            snapshot,
          ).slice(0, 4000)}\n\nProduce the compliance briefing JSON.`,
        },
      ],
      params: { temperature: 0.3, max_tokens: 500 },
    });
  } catch (error) {
    if (error instanceof AppAIUnavailableError) {
      return Response.json(
        { code: "app_ai_unavailable", message: error.message },
        { status: 402 },
      );
    }
    throw error;
  }

  const raw = result?.choices?.[0]?.message?.content ?? "";
  return Response.json({ text: raw });
}
