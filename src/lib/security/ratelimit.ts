/**
 * Limitador em memória (janela deslizante). Protege cada instância serverless contra
 * rajadas; para limites globais use também o limite persistente por usuário no banco
 * (ver `ai_generations`) ou um serviço como Upstash Redis — veja docs/SECURITY.md.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfter: number } {
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

export function resetRateLimits() {
  buckets.clear();
}
