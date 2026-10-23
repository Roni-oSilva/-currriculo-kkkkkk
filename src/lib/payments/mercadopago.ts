import crypto from "node:crypto";
import { env } from "@/lib/env";
import type { PaymentProvider, PaymentStatus, ProviderPayment } from "./types";

const API = "https://api.mercadopago.com";

export function mapMercadoPagoStatus(status: string, detail?: string): PaymentStatus | "unknown" {
  switch (status) {
    case "approved": return "approved";
    case "pending": case "in_process": case "in_mediation": case "authorized": return "pending";
    case "rejected": return "cancelled";
    case "cancelled": return detail === "expired" ? "expired" : "cancelled";
    case "refunded": case "charged_back": return "refunded";
    default: return "unknown";
  }
}

/** R$ 10,00 (número do provedor) → 1000. Usa arredondamento para evitar erro de ponto flutuante. */
export function toCents(amount: unknown): number | null {
  const n = typeof amount === "string" ? Number(amount) : (amount as number);
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n * 100) : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(p: any): ProviderPayment {
  const tx = p?.point_of_interaction?.transaction_data ?? {};
  return {
    id: String(p.id),
    status: mapMercadoPagoStatus(String(p.status), p.status_detail),
    rawStatus: String(p.status),
    amountCents: toCents(p.transaction_amount),
    currency: p.currency_id ?? null,
    externalReference: p.external_reference ?? null,
    metadata: p.metadata ?? {},
    qrCode: tx.qr_code,
    qrCodeBase64: tx.qr_code_base64,
    ticketUrl: tx.ticket_url,
    expiresAt: p.date_of_expiration ?? undefined,
  };
}

async function call(path: string, init: RequestInit & { idempotencyKey?: string } = {}) {
  if (!env.mpToken) throw new Error("Mercado Pago não configurado");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.mpToken}`,
      "Content-Type": "application/json",
      ...(init.idempotencyKey ? { "X-Idempotency-Key": init.idempotencyKey } : {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Nunca devolva o corpo completo (pode conter dados do pagador) a quem chamou.
    throw new Error(`Mercado Pago respondeu ${res.status}: ${String(json?.message ?? json?.error ?? "erro")}`.slice(0, 200));
  }
  return json;
}

export const mercadoPago: PaymentProvider = {
  async createPixPayment(i) {
    const json = await call("/v1/payments", {
      method: "POST",
      idempotencyKey: i.paymentId,
      body: JSON.stringify({
        transaction_amount: Number((i.amountCents / 100).toFixed(2)),
        description: i.description,
        payment_method_id: "pix",
        payer: { email: i.payerEmail },
        external_reference: i.paymentId,
        date_of_expiration: i.expiresAt.toISOString().replace("Z", "-00:00"),
        notification_url: i.notificationUrl,
        metadata: i.metadata,
      }),
    });
    return normalize(json);
  },
  async getPayment(id) {
    return normalize(await call(`/v1/payments/${encodeURIComponent(id)}`));
  },
  async cancelPayment(id) {
    await call(`/v1/payments/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });
  },
};

/**
 * Valida o cabeçalho x-signature do Mercado Pago:
 * manifest = `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` assinado com HMAC-SHA256.
 */
export function verifyWebhookSignature(opts: {
  secret: string;
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
  now?: number;
  toleranceSeconds?: number;
}): boolean {
  const { secret, signatureHeader, requestId, dataId } = opts;
  if (!secret || !signatureHeader || !requestId || !dataId) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, ...rest] = kv.trim().split("=");
      return [k, rest.join("=")];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const tsNum = Number(ts);
  const tol = opts.toleranceSeconds ?? 15 * 60;
  const nowMs = opts.now ?? Date.now();
  // Mercado Pago envia ts em ms (ou s, dependendo da versão): aceitamos ambos.
  const tsMs = tsNum > 1e12 ? tsNum : tsNum * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(nowMs - tsMs) > tol * 1000) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected, "hex");
  let b: Buffer;
  try { b = Buffer.from(v1, "hex"); } catch { return false; }
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
