import type { PaymentRecord, PaymentStatus, PaymentStore, ProviderPayment } from "./types";

export interface Verification {
  valid: boolean;
  reasons: string[];
}

/**
 * Confere se a cobrança consultada NO PROVEDOR corresponde ao registro local:
 * referência, valor exato em centavos, moeda BRL, usuário e currículo.
 * Nada vindo do navegador participa desta decisão.
 */
export function verifyProviderPayment(row: PaymentRecord, pp: ProviderPayment): Verification {
  const reasons: string[] = [];
  if (row.provider_payment_id && row.provider_payment_id !== pp.id) reasons.push("id_divergente");
  if (pp.externalReference !== row.id) reasons.push("referencia_divergente");
  if (pp.amountCents !== row.amount_cents) reasons.push("valor_divergente");
  if (pp.currency !== "BRL" || row.currency !== "BRL") reasons.push("moeda_divergente");
  if (pp.metadata.user_id !== undefined && pp.metadata.user_id !== row.user_id) reasons.push("usuario_divergente");
  if (pp.metadata.resume_id !== undefined && pp.metadata.resume_id !== row.resume_id) reasons.push("curriculo_divergente");
  return { valid: reasons.length === 0, reasons };
}

export interface ApplyResult {
  status: PaymentStatus;
  changed: boolean;
  rejected?: string[];
}

/**
 * Aplica o estado do provedor ao registro local de forma idempotente. Processar o mesmo
 * evento N vezes produz exatamente uma transição.
 */
export async function applyProviderState(store: PaymentStore, row: PaymentRecord, pp: ProviderPayment, now = new Date()): Promise<ApplyResult> {
  const v = verifyProviderPayment(row, pp);

  if (!v.valid) {
    // Qualquer divergência impede aprovar/reembolsar com base nesse evento.
    await store.event("error", "payment_mismatch", { payment_id: row.id, reasons: v.reasons, provider_status: pp.rawStatus });
    return { status: row.status, changed: false, rejected: v.reasons };
  }

  switch (pp.status) {
    case "approved": {
      const changed = await store.transition(row.id, ["pending", "expired"], "approved", {
        confirmed_at: now.toISOString(),
        provider_payment_id: pp.id,
      });
      if (changed) await store.event("info", "payment_approved", { payment_id: row.id });
      const fresh = await store.getById(row.id);
      return { status: fresh?.status ?? row.status, changed };
    }
    case "refunded": {
      const changed = await store.transition(row.id, ["approved"], "refunded");
      if (changed) await store.event("warn", "payment_refunded", { payment_id: row.id });
      const fresh = await store.getById(row.id);
      return { status: fresh?.status ?? row.status, changed };
    }
    case "cancelled":
    case "expired": {
      const changed = await store.transition(row.id, ["pending"], pp.status);
      if (changed) await store.event("info", `payment_${pp.status}`, { payment_id: row.id });
      const fresh = await store.getById(row.id);
      return { status: fresh?.status ?? row.status, changed };
    }
    case "pending":
      return { status: row.status, changed: false };
    default:
      await store.event("warn", "payment_unknown_status", { payment_id: row.id, provider_status: pp.rawStatus });
      return { status: row.status, changed: false };
  }
}

/** Consulta o provedor e aplica o estado. Usado pelo webhook e pela verificação de status. */
export async function syncPaymentFromProvider(
  store: PaymentStore,
  provider: { getPayment(id: string): Promise<ProviderPayment>; cancelPayment?(id: string): Promise<void> },
  row: PaymentRecord,
  now = new Date(),
): Promise<ApplyResult> {
  if (!row.provider_payment_id) return { status: row.status, changed: false };
  const pp = await provider.getPayment(row.provider_payment_id);
  let result = await applyProviderState(store, row, pp, now);

  // Cobrança pendente cujo prazo local venceu (e que o provedor não aprovou): expira.
  if (result.status === "pending" && row.expires_at && new Date(row.expires_at).getTime() < now.getTime()) {
    const changed = await store.transition(row.id, ["pending"], "expired");
    if (changed) {
      await store.event("info", "payment_expired", { payment_id: row.id });
      try { await provider.cancelPayment?.(row.provider_payment_id); } catch { /* melhor esforço */ }
    }
    result = { status: "expired", changed };
  }
  return result;
}
