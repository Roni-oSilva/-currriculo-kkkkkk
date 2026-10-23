import { audit, authenticateAdmin, isResponse, json, jsonError, UUID_RE } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { mercadoPago } from "@/lib/payments/mercadopago";
import { supabasePaymentStore } from "@/lib/payments/supabase-store";
import { syncPaymentFromProvider } from "@/lib/payments/core";

export const runtime = "nodejs";

/**
 * Único procedimento administrativo que pode alterar o status de um pagamento:
 * reconsulta o PROVEDOR e aplica o resultado pelas mesmas regras do webhook
 * (valor, moeda, referência). Administradores não podem "marcar como pago" manualmente.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authenticateAdmin();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!UUID_RE.test(id)) return jsonError("Pagamento não encontrado.", 404);
  const store = supabasePaymentStore(createAdminClient());
  const row = await store.getById(id);
  if (!row) return jsonError("Pagamento não encontrado.", 404);
  if (!row.provider_payment_id) return jsonError("Esta cobrança não chegou a ser criada no provedor.", 409);
  try {
    const before = row.status;
    const result = await syncPaymentFromProvider(store, mercadoPago, row);
    await audit(ctx.user.id, "payment_reconcile", id, { before, after: result.status, changed: result.changed, rejected: result.rejected ?? null });
    return json({ status: result.status, changed: result.changed, rejected: result.rejected ?? null });
  } catch {
    return jsonError("Não foi possível consultar o provedor agora.", 502);
  }
}
