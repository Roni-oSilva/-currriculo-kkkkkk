import { verifyWebhookSignature } from "./mercadopago";
import { syncPaymentFromProvider } from "./core";
import type { PaymentProvider, PaymentStore } from "./types";

export interface WebhookInput {
  query: URLSearchParams;
  headers: Headers;
  body: unknown;
}

export interface WebhookDeps {
  store: PaymentStore;
  provider: Pick<PaymentProvider, "getPayment" | "cancelPayment">;
  secret: string;
  isProduction: boolean;
  now?: () => Date;
}

export interface WebhookOutcome {
  httpStatus: number;
  body: Record<string, unknown>;
}

/**
 * Fluxo: (1) valida assinatura → (2) extrai apenas o id da cobrança →
 * (3) consulta o provedor (fonte da verdade) → (4) confere valor/moeda/referência →
 * (5) aplica transição idempotente. O corpo do webhook nunca é usado para aprovar.
 */
export async function processMercadoPagoWebhook(input: WebhookInput, deps: WebhookDeps): Promise<WebhookOutcome> {
  const { store, provider, secret } = deps;
  const body = (input.body ?? {}) as { type?: string; topic?: string; data?: { id?: string | number } };
  const dataId = input.query.get("data.id") ?? (body.data?.id != null ? String(body.data.id) : null);
  const type = input.query.get("type") ?? input.query.get("topic") ?? body.type ?? body.topic;

  if (!secret) {
    if (deps.isProduction) {
      await store.event("error", "webhook_secret_missing", {});
      return { httpStatus: 503, body: { error: "webhook_not_configured" } };
    }
  } else {
    const ok = verifyWebhookSignature({
      secret,
      signatureHeader: input.headers.get("x-signature"),
      requestId: input.headers.get("x-request-id"),
      dataId: input.query.get("data.id") ?? dataId,
      now: deps.now?.().getTime(),
    });
    if (!ok) {
      await store.event("warn", "webhook_invalid_signature", {});
      return { httpStatus: 401, body: { error: "invalid_signature" } };
    }
  }

  if (type !== "payment" || !dataId) return { httpStatus: 200, body: { ignored: true } };

  let pp;
  try {
    pp = await provider.getPayment(dataId);
  } catch {
    await store.event("error", "webhook_provider_lookup_failed", { provider_payment_id: dataId });
    // 502 faz o Mercado Pago tentar novamente mais tarde.
    return { httpStatus: 502, body: { error: "provider_unavailable" } };
  }

  const row = (pp.externalReference ? await store.getById(pp.externalReference).catch(() => null) : null)
    ?? (await store.getByProviderId(pp.id));
  if (!row) {
    await store.event("warn", "webhook_unknown_payment", { provider_payment_id: pp.id });
    return { httpStatus: 200, body: { ignored: true } };
  }

  const result = await syncPaymentFromProvider(store, { getPayment: async () => pp, cancelPayment: provider.cancelPayment }, { ...row, provider_payment_id: row.provider_payment_id ?? pp.id }, deps.now?.());
  return { httpStatus: 200, body: { status: result.status, changed: result.changed } };
}
