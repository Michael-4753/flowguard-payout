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
 *  - route     : explain WHY the rule-engine's recommended route wins
 *  - risk-signals : AI-only supplementary risk detection (semantic/context)
 */

type Kind = "flow" | "return" | "corridor" | "reconcile" | "route" | "risk-signals";

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

  route: `
You are a cross-border payout routing analyst. A DETERMINISTIC rule engine has
ALREADY chosen the recommended route (marked recommended:true) by scoring each
option on fee, ETA, return risk, traceability and availability. Do NOT re-decide
or override the recommendation. Your job is ONLY to explain, in plain business
English, WHY the recommended route wins versus the alternatives — reference the
concrete numbers in the snapshot (lower fee, faster ETA, lower return risk, more
received, on-chain traceability, or an unavailable/gated alternative). If a
cheaper-looking option was NOT recommended, briefly say why (higher return risk,
unavailable for this payee, or an opaque intermediary). Keep it decision-support,
not a decision.
${SHARED_TAIL}`.trim(),

  "risk-signals": `
You are a cross-border payout risk analyst working ALONGSIDE a deterministic
rule engine. The engine has already scored fixed factors (SWIFT/IBAN format,
account status, sanctions, blacklist, currency control, amount tier). Your job is
to catch what a format/list check CANNOT: semantic and contextual risk. You are
given the beneficiary fields, the engine's hit factors, the amount, and a small
library of past return cases.

Produce THREE kinds of supplementary signals:
1. contradictions: internal inconsistencies across beneficiary name / country /
   bank / currency / SWIFT / IBAN (e.g. SWIFT country code != stated country,
   IBAN country != country, a personal-looking name filed as a company, currency
   that doesn't match the country). Only report genuine conflicts.
2. similarCases: from the provided pastCases, the 1-2 whose reason is most
   analogous to THIS payment's situation, with a one-line "why similar".
3. missingDocs: documents/fields that, if absent, commonly cause a return for
   this country/currency/amount (e.g. invoice + business purpose + local tax ID
   for FX-controlled currencies; active-account confirmation; exact legal name).

CRITICAL RULES:
- You may ONLY raise or flag risk. NEVER tell the user the payment is safe or
  suggest lowering the engine's risk. If you find nothing, return empty arrays.
- Ground every item in the snapshot; never invent SWIFT codes, cases, or facts.
- Return STRICT JSON only, no markdown fences, shape:
  {"contradictions": string[], "similarCases": [{"case": string, "why": string}], "missingDocs": string[]}
- Keep each string to one short sentence.`.trim(),
};

/** Kinds that need a larger token budget for structured multi-section output. */
const WIDE_KINDS = new Set<Kind>(["risk-signals"]);

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
      params: { temperature: 0.3, max_tokens: WIDE_KINDS.has(kind) ? 1100 : 800 },
    });
  } catch (error) {
    if (error instanceof AppAIUnavailableError) {
      return Response.json({ code: "app_ai_unavailable", message: error.message }, { status: 402 });
    }
    throw error;
  }

  return Response.json({ text: extractMessageContent(result) });
}
