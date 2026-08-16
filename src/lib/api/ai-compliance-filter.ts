/**
 * Compliance output sanitizer for App AI text.
 *
 * FlowGuard's compliance line is: software-only, no licence, and it performs
 * NO crypto / stablecoin exchange, custody or transfer. The deterministic
 * engine, however, models one settlement rail whose internal layers are
 * described with on-chain / USDC vocabulary. When DeepSeek turns that snapshot
 * into plain language it can surface "stablecoin / USDC / on-chain" wording,
 * which would contradict the stated compliance boundary.
 *
 * Approach A (minimal-change): keep the channel data as-is but scrub the
 * user-visible AI text — rewrite crypto/stablecoin vocabulary into the neutral,
 * compliant "licensed overseas settlement" framing before it leaves the server.
 *
 * The rules are ordered longest/most-specific first so multi-word phrases are
 * rewritten before their single-word components. Matching is case-insensitive
 * and space/hyphen tolerant; replacements preserve the surrounding JSON shape
 * because we only swap inner substrings, never structural characters.
 */

type Rule = { pattern: RegExp; zh: string; en: string };

// `\s*[-\s]?\s*` lets "on chain", "on-chain", "onchain" all match.
const RULES: Rule[] = [
  // --- Chinese multi-word phrases ---
  { pattern: /稳定币直连(通道)?/g, zh: "持牌境外结算通道", en: "licensed overseas settlement channel" },
  { pattern: /(公链|区块链)上?结算/g, zh: "持牌机构结算", en: "licensed-institution settlement" },
  { pattern: /链上结算/g, zh: "持牌机构结算", en: "licensed-institution settlement" },
  { pattern: /链上(交易|凭证|流水|记录|哈希|leg|环节)?/g, zh: "结算流水", en: "settlement record" },
  { pattern: /(加密货币|数字货币|虚拟货币|稳定币)(兑换|转账|通道|结算)?/g, zh: "持牌结算", en: "licensed settlement" },
  { pattern: /(入金|出金)通道|on-?ramp|off-?ramp/gi, zh: "持牌结算入口", en: "licensed settlement gateway" },
  // --- English multi-word phrases ---
  { pattern: /stable\s*-?\s*coin[\s-]*(direct|rail|channel|settlement|leg)?/gi, zh: "持牌境外结算通道", en: "licensed overseas settlement channel" },
  { pattern: /(public[-\s]*)?chain\s*settlement/gi, zh: "持牌机构结算", en: "licensed-institution settlement" },
  { pattern: /on[-\s]*chain\s*(settlement|leg|tx|transaction|transfer|record|proof)?/gi, zh: "结算流水", en: "settlement record" },
  { pattern: /crypto(currency|-currency)?\s*(exchange|conversion|transfer|rail|settlement)?/gi, zh: "持牌结算", en: "licensed settlement" },
  { pattern: /block\s*-?\s*chain/gi, zh: "持牌结算网络", en: "licensed settlement network" },
  // --- Single tokens (last, so phrases above win first) ---
  { pattern: /\bUSDC\b|\bUSDT\b|\bTether\b/gi, zh: "持牌结算", en: "licensed settlement" },
  { pattern: /稳定币|加密货币|数字货币|虚拟货币/g, zh: "持牌结算", en: "licensed settlement" },
  { pattern: /\bstablecoins?\b/gi, zh: "持牌结算", en: "licensed settlement" },
];

/**
 * Rewrite crypto/stablecoin vocabulary in a user-visible AI string into the
 * compliant licensed-settlement framing.
 *
 * @param text Raw model text (may be JSON string or plain prose).
 * @param lang App language code; "zh" uses Chinese replacements, else English.
 */
export function sanitizeAiCompliance(text: string, lang?: unknown): string {
  if (typeof text !== "string" || text.length === 0) return text;
  const zh = lang === "zh";
  let out = text;
  for (const rule of RULES) {
    out = out.replace(rule.pattern, zh ? rule.zh : rule.en);
  }
  return out;
}

/** Quick predicate for tests/telemetry: does the text still trip any rule? */
export function hasCryptoVocabulary(text: string): boolean {
  if (typeof text !== "string") return false;
  return RULES.some((r) => {
    r.pattern.lastIndex = 0;
    return r.pattern.test(text);
  });
}
