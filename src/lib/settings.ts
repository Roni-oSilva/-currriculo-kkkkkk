import { createAdminClient } from "@/lib/supabase/admin";
import { configStatus } from "@/lib/env";

export const DEFAULT_PRICE_CENTS = 1000;

export interface AppSettings {
  priceCents: number;
  repurchaseOnEdit: boolean;
}

export async function getSettings(): Promise<AppSettings> {
  const defaults: AppSettings = { priceCents: DEFAULT_PRICE_CENTS, repurchaseOnEdit: true };
  if (!configStatus.supabaseAdmin()) return defaults;
  try {
    const { data } = await createAdminClient().from("app_settings").select("key, value");
    const map = new Map((data ?? []).map((r) => [r.key as string, r.value]));
    const price = Number(map.get("price_cents"));
    return {
      priceCents: Number.isInteger(price) && price > 0 ? price : defaults.priceCents,
      repurchaseOnEdit: map.get("repurchase_on_edit") === false ? false : true,
    };
  } catch {
    return defaults;
  }
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
