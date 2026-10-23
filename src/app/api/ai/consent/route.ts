import { authenticate, isResponse, json, jsonError } from "@/lib/api";

/** Registra o consentimento explícito para envio do conteúdo do currículo ao provedor de IA. */
export async function POST() {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const { error } = await ctx.supabase.from("profiles").update({ ai_consent_at: new Date().toISOString() }).eq("id", ctx.user.id);
  if (error) return jsonError("Não foi possível registrar o consentimento.", 500);
  return json({ ok: true });
}
