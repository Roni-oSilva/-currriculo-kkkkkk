import type { SupabaseClient } from "@supabase/supabase-js";
import { logEvent } from "@/lib/log";
import type { PaymentRecord, PaymentStatus, PaymentStore } from "./types";

export function supabasePaymentStore(db: SupabaseClient): PaymentStore {
  return {
    async getById(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const { data } = await db.from("payments").select("*").eq("id", id).maybeSingle();
      return (data as PaymentRecord | null) ?? null;
    },
    async getByProviderId(pid) {
      const { data } = await db.from("payments").select("*").eq("provider", "mercadopago").eq("provider_payment_id", pid).maybeSingle();
      return (data as PaymentRecord | null) ?? null;
    },
    async transition(id, from, to, patch = {}) {
      const { data, error } = await db
        .from("payments")
        .update({ ...patch, status: to, ...(to === "refunded" ? { refunded_at: new Date().toISOString() } : {}) })
        .eq("id", id)
        .in("status", from as PaymentStatus[])
        .select("id");
      if (error) throw new Error(`Falha ao atualizar pagamento: ${error.message}`);
      return (data?.length ?? 0) > 0;
    },
    async event(level, type, meta) {
      await logEvent(level, type, "", meta);
    },
  };
}
