export const PAYMENT_STATUSES = ["pending", "approved", "cancelled", "expired", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface PaymentRecord {
  id: string;
  user_id: string | null;
  resume_id: string | null;
  resume_version: number;
  provider: string;
  provider_payment_id: string | null;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  idempotency_key: string;
  pix_qr_code: string | null;
  pix_qr_base64: string | null;
  pix_ticket_url: string | null;
  expires_at: string | null;
  confirmed_at: string | null;
  created_at: string;
}

/** Visão normalizada de uma cobrança consultada diretamente no provedor. */
export interface ProviderPayment {
  id: string;
  status: PaymentStatus | "unknown";
  rawStatus: string;
  amountCents: number | null;
  currency: string | null;
  externalReference: string | null;
  metadata: Record<string, unknown>;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  expiresAt?: string;
}

export interface PaymentProvider {
  createPixPayment(input: {
    paymentId: string;
    amountCents: number;
    description: string;
    payerEmail: string;
    expiresAt: Date;
    notificationUrl?: string;
    metadata: Record<string, unknown>;
  }): Promise<ProviderPayment>;
  getPayment(providerPaymentId: string): Promise<ProviderPayment>;
  cancelPayment?(providerPaymentId: string): Promise<void>;
}

/** Armazenamento abstrato: implementado com Supabase em produção e em memória nos testes. */
export interface PaymentStore {
  getById(id: string): Promise<PaymentRecord | null>;
  getByProviderId(providerPaymentId: string): Promise<PaymentRecord | null>;
  /**
   * Transição atômica e condicional: só aplica se o status atual estiver em `from`.
   * Retorna true somente para quem realmente efetuou a mudança (garante idempotência).
   */
  transition(id: string, from: PaymentStatus[], to: PaymentStatus, patch?: Partial<PaymentRecord>): Promise<boolean>;
  event(level: "info" | "warn" | "error", type: string, meta: Record<string, unknown>): Promise<void>;
}
