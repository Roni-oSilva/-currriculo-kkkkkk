import { z } from "zod";
import { authenticate, isResponse, json, jsonError, limited } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanText } from "@/lib/security/sanitize";
import { logEvent } from "@/lib/log";

export async function PATCH(req: Request) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const parsed = z.object({ fullName: z.string().min(1).max(120).transform(cleanText) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Nome inválido.", 422);
  const { error } = await ctx.supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", ctx.user.id);
  if (error) return jsonError("Não foi possível salvar.", 500);
  return json({ ok: true });
}

/**
 * Exclusão da conta (LGPD): apaga arquivos, currículos, versões, gerações de IA e o login.
 * Registros de pagamento são mantidos sem vínculo com a pessoa (user_id e resume_id nulos)
 * para cumprir obrigações fiscais/contábeis. Ver docs/PRIVACY.md.
 */
export async function DELETE(req: Request) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const rl = limited(`account-delete:${ctx.user.id}`, 3, 60 * 60_000);
  if (rl) return rl;
  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "EXCLUIR") return jsonError("Confirmação inválida. Digite EXCLUIR.", 422);

  const admin = createAdminClient();
  try {
    for (const bucket of ["resume-photos", "resume-files"]) {
      const { data: folders } = await admin.storage.from(bucket).list(ctx.user.id, { limit: 1000 });
      for (const f of folders ?? []) {
        const { data: files } = await admin.storage.from(bucket).list(`${ctx.user.id}/${f.name}`, { limit: 1000 });
        if (files?.length) await admin.storage.from(bucket).remove(files.map((x) => `${ctx.user.id}/${f.name}/${x.name}`));
      }
    }
    const { error } = await admin.auth.admin.deleteUser(ctx.user.id);
    if (error) throw error;
  } catch (e) {
    await logEvent("error", "account_delete_failed", String((e as Error).message));
    return jsonError("Não foi possível excluir a conta agora. Tente novamente ou contate o suporte.", 500);
  }
  await logEvent("info", "account_deleted", "");
  return json({ ok: true });
}
