import type { PaymentRecord, PaymentStatus, PaymentStore, ProviderPayment } from "@/lib/payments/types";

export function makeRecord(over: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: "11111111-1111-4111-8111-111111111111", user_id: "user-1", resume_id: "resume-1", resume_version: 1,
    provider: "mercadopago", provider_payment_id: "MP-1", amount_cents: 1000, currency: "BRL", status: "pending",
    idempotency_key: "pix:1", pix_qr_code: null, pix_qr_base64: null, pix_ticket_url: null,
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(), confirmed_at: null, created_at: new Date().toISOString(), ...over,
  };
}

export function makeProvider(over: Partial<ProviderPayment> = {}): ProviderPayment {
  return { id: "MP-1", status: "approved", rawStatus: "approved", amountCents: 1000, currency: "BRL", externalReference: "11111111-1111-4111-8111-111111111111", metadata: { user_id: "user-1", resume_id: "resume-1" }, ...over };
}

/** Armazém em memória com a mesma semântica de transição condicional atômica do Supabase. */
export class MemoryStore implements PaymentStore {
  rows = new Map<string, PaymentRecord>();
  events: { level: string; type: string; meta: Record<string, unknown> }[] = [];
  transitions = 0;
  constructor(rows: PaymentRecord[] = []) { rows.forEach((r) => this.rows.set(r.id, { ...r })); }
  async getById(id: string) { return this.rows.get(id) ?? null; }
  async getByProviderId(pid: string) { return [...this.rows.values()].find((r) => r.provider_payment_id === pid) ?? null; }
  async transition(id: string, from: PaymentStatus[], to: PaymentStatus, patch: Partial<PaymentRecord> = {}) {
    const r = this.rows.get(id);
    if (!r || !from.includes(r.status)) return false;
    this.rows.set(id, { ...r, ...patch, status: to });
    this.transitions++;
    return true;
  }
  async event(level: "info" | "warn" | "error", type: string, meta: Record<string, unknown>) { this.events.push({ level, type, meta }); }
}
