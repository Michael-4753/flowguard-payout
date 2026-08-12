import { assessRisk } from "@/lib/engine";
import { SEED_SUPPLIERS } from "@/lib/db/seed-suppliers";

for (const s of SEED_SUPPLIERS) {
  const supplier = { ...s, createdAt: new Date().toISOString() };
  const r = assessRisk(supplier);
  const hits = r.factors.filter((f) => f.hit).map((f) => `${f.id}(+${f.points})`);
  console.log(
    `${s.name.padEnd(34)} | ${s.countryCode.padEnd(3)} ${s.currency.padEnd(4)} | score=${String(
      r.score,
    ).padStart(3)} ${r.level.padEnd(6)} | return=${(r.returnProbability * 100).toFixed(0)}% | hits: ${hits.join(", ") || "none"}`,
  );
}
