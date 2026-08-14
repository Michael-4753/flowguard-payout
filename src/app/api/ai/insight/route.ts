import { NextRequest } from "next/server";
import { appAi, AppAIUnavailableError, extractMessageContent } from "@/lib/eazo-ai-billing";

/**
 * Unified AI insight endpoint (App AI, text capability) powering the four
 * FlowGuard pain-point assistants. The deterministic engine stays the source of
 * truth; DeepSeek turns a compact, PII-light snapshot into plain-language
 * insight + concrete next steps. One route, four `kind`s, each with its own
 * grounded system prompt. Open to guests — no user-private data is read.
 *
 *  - flow      : where the money is stuck on the corridor & what to do
 *  - return    : (compat) return-risk compliance briefing
 *  - corridor  : per-country/bank settlement requirements checklist
 *  - reconcile : explain a reconciliation variance / unmatched proof
 */

type Kind = "flow" | "return" | "corridor" | "reconcile";

const SHARED_TAIL = `
Output rules:
- Return STRICT JSON only, no markdown fences.
- Shape: {"summary": string, "actions": string[]}.
- "summary": 1-2 plain-English sentences.
- "actions": 2-4 short imperative steps, most important first.
- Ground every statement in the snapshot; never invent numbers or facts.
`.trim();

const PROMPTS: Record<Kind, string> = {
  flow: `
You are a cross-border payout operations analyst. Given a money-flow snapshot
(the selected route's hops with per-hop bank, elapsed time, fee, remaining
amount, and which hop the funds currently sit at), explain in plain business
English WHERE the money is right now, WHY it may be held at that hop
(intermediary/correspondent bank checks, cut-off times, FX controls), a rough
expectation of remaining time, and what the payer can do next.
${SHARED_TAIL}`.trim(),

  return: `
You are a cross-border payout compliance analyst. Ground every statement in the
snapshot. If the snapshot is a pre-check risk snapshot, explain WHY the payment
might be returned and HOW to fix it (malformed SWIFT/BIC bounce at the routing
bank; invalid IBAN causes invalid-account returns; FX-controlled currencies
INR/VND/AED need invoice + purpose + local tax ID; dormant/unverified accounts
reject inbound wires; blacklisted banks intercept the wire).
If the snapshot is a verification case (has supplierName / factorTitle /
existingTemplate), instead DRAFT a short, polite, specific follow-up message to
the supplier requesting the exact detail needed to clear that factor. In that
case put the ready-to-send message as the FIRST item of "actions".
${SHARED_TAIL}`.trim(),

  corridor: `
You are a cross-border settlement specialist. Given a beneficiary's country,
currency, and bank, produce a concise "what this corridor requires" checklist so
the payer doesn't have to re-learn each bank's rules every time. Cover: exact
beneficiary-name matching, SWIFT/BIC & IBAN/account-format expectations for this
country, any FX-control documentation (invoice, business purpose, tax/registration
ID) common for the currency, and typical settlement timing. Be specific to the
country/currency given.
${SHARED_TAIL}`.trim(),

  reconcile: `
You are a payments reconciliation analyst. Given a payout's sent amount, fees,
FX loss, expected vs received amount, the resulting variance, and proof-matching
status (invoice / bank ref / on-chain tx / payee receipt), explain the single
most likely reason the figures or proofs don't line up, and the next step to
resolve it. Common causes: intermediary lifting fees, FX rate drift between
quote and settlement, partial/hold returns, or a missing/mismatched settlement
reference.
${SHARED_TAIL}`.trim(),
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const kind = body?.kind as Kind | undefined;
  const snapshot = body?.snapshot;
  if (!kind || !(kind in PROMPTS)) {
    return Response.json({ error: "Unknown insight kind" }, { status: 400 });
  }
  if (!snapshot || typeof snapshot !== "object") {
    return Response.json({ error: "Missing snapshot" }, { status: 400 });
  }

  let result;
  try {
    result = await appAi.chat({
      messages: [
        { role: "system", content: PROMPTS[kind] },
        {
          role: "user",
          content: `Snapshot (JSON):\n${JSON.stringify(snapshot).slice(0, 4000)}\n\nProduce the insight JSON.`,
        },
      ],
      params: { temperature: 0.3, max_tokens: 800 },
    });
  } catch (error) {
    if (error instanceof AppAIUnavailableError) {
      return Response.json({ code: "app_ai_unavailable", message: error.message }, { status: 402 });
    }
    throw error;
  }

  return Response.json({ text: extractMessageContent(result) });
}
