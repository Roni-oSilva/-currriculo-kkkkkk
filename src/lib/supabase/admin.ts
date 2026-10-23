import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Cliente service_role: ignora RLS. Usar SOMENTE no servidor, depois de validar sessão/propriedade. */
export function createAdminClient(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseServiceKey) {
    throw new Error("Supabase service role não configurado");
  }
  client ??= createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
