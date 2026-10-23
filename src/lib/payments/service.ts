import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { logEvent } from "@/lib/log";
import { mercadoPago } from "./mercadopago";
import { supabasePaymentStore } from "./supabase-store";
import { syncPaymentFromProvider } from "./core";
import type { PaymentRecord } from "./types";

export class PaymentError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export interface ChargeView {
  id: string;
  status: PaymentRecord["status"];
  amountCents: number;
  version: number;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  expiresAt: string | null;
}

export function toChargeView(p: PaymentRecord): ChargeView {
  return {
    id: p.id, status: p.status, amountCents: p.amount_cents, version: p.resume_version,
    qrCode: p.pix_qr_code, qrCodeBase64: p.pix_qr_base64, ticketUrl: p.pix_ticket_url, expiresAt: p.expires_at,
  };
}

/**
 * Cria (ou reaproveita) a cobrança Pix de um currículo. O preço vem SEMPRE do servidor
 * (`app_settings`), a propriedade do currículo é conferida pelo chamador via RLS.
 */
export async function createPixCharge(input: { userId: string; email: string; resumeId: string; version: number }): Promise<ChargeView> {
  const db = createAdminClient();
  const store = supabasePaymentStore(db);
  const { priceCents } = await getSettings();

  const { data: existing } = await db
    .from("payments").select("*")
    .eq("resume_id", input.resumeId).eq("resume_version", input.version).eq("user_id", input.userId)
    .in("status", ["pending", "approved"]).order("created_at", { ascending: false }).limit(1);
  let row = (existing?.[0] as PaymentRecord | undefined) ?? undefined;

  if (row?.status === "approved") return toChargeView(row);

  if (row?.status === "pending") {
    const synced = await syncPaymentFromProvider(store, mercadoPago, row).catch(() => null);
    if (synced?.status === "approved") return toChargeView((await store.getById(row.id))!);
    if (synced?.status === "pending" || !synced) {
      const fresh = (await store.getById(row.id))!;
      if (fresh.status === "pending" && fresh.pix_qr_code) return toChargeView(fresh);
    }
    row = undefined;
  }

  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + env.pixExpirationMinutes * 60_000);
  const { error } = await db.from("payments").insert({
    id, user_id: input.userId, resume_id: input.resumeId, resume_version: input.version,
    provider: "mercadopago", amount_cents: priceCents, currency: "BRL", status: "pending",
    idempotency_key: `pix:${id}`, expires_at: expiresAt.toISOString(),
  }).select("*").single();
  if (error) {
    // Índice único parcial: outra requisição simultânea já criou a cobrança pendente.
    if (error.code === "23505") {
      const { data: again } = await db.from("payments").select("*").eq("resume_id", input.resumeId)
        .eq("resume_version", input.version).eq("status", "pending").maybeSingle();
      if (again) return toChargeView(again as PaymentRecord);
    }
    throw new PaymentError("Não foi possível iniciar o pagamento. Tente novamente.", 500);
  }

  try {
    const notificationUrl = env.appUrl.startsWith("https://") ? `${env.appUrl}/api/webhooks/mercadopago` : undefined;
    const pp = await mercadoPago.createPixPayment({
      paymentId: id, amountCents: priceCents, description: "Currículo profissional (PDF)",
      payerEmail: input.email, expiresAt, notificationUrl,
      metadata: { user_id: input.userId, resume_id: input.resumeId, resume_version: input.version },
    });
    const { data: updated } = await db.from("payments").update({
      provider_payment_id: pp.id, pix_qr_code: pp.qrCode ?? null, pix_qr_base64: pp.qrCodeBase64 ?? null,
      pix_ticket_url: pp.ticketUrl ?? null,
    }).eq("id", id).select("*").single();
    await logEvent("info", "payment_created", "", { payment_id: id, version: input.version });
    return toChargeView(updated as PaymentRecord);
  } catch (e) {
    await db.from("payments").update({ status: "cancelled", last_error: String((e as Error).message).slice(0, 200) }).eq("id", id);
    await logEvent("error", "payment_create_failed", String((e as Error).message), { payment_id: id });
    throw new PaymentError("O provedor de pagamento não respondeu. Tente novamente em instantes.", 502);
  }
}

/** Verificação de status no servidor (fallback ao webhook). */
export async function refreshPaymentStatus(paymentId: string, userId: string | null): Promise<ChargeView | null> {
  const db = createAdminClient();
  const store = supabasePaymentStore(db);
  const row = await store.getById(paymentId);
  if (!row || (userId && row.user_id !== userId)) return null;
  if (row.status === "pending") {
    await syncPaymentFromProvider(store, mercadoPago, row).catch((e) => logEvent("warn", "payment_sync_failed", String(e.message), { payment_id: row.id }));
  }
  const fresh = await store.getById(paymentId);
  return fresh ? toChargeView(fresh) : null;
}
