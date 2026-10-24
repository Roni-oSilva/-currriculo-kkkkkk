import crypto from "node:crypto";
import { z } from "zod";
import { authenticate, isResponse, json, jsonError, limited } from "@/lib/api";
import { ImageError, processProfilePhoto } from "@/lib/security/image";
import { cleanText } from "@/lib/security/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/log";

export const runtime = "nodejs";

const BUCKET = "testimonial-photos";
const fieldsSchema = z.object({
  name: z.string().transform(cleanText).pipe(z.string().min(2, "Informe como quer aparecer (ex.: Maria S.).").max(40, "Use até 40 caracteres no nome.")),
  quote: z.string().transform(cleanText).pipe(z.string().min(30, "Escreva ao menos 30 caracteres.").max(600, "Use até 600 caracteres.")),
  consent: z.enum(["true", "on"], { message: "É preciso autorizar a publicação." }),
});

async function hasApprovedPayment(ctx: Exclude<Awaited<ReturnType<typeof authenticate>>, Response>) {
  const { data } = await ctx.supabase.from("payments").select("id").eq("status", "approved").eq("user_id", ctx.user.id).limit(1);
  return Boolean(data?.length);
}

/** Estado do formulário: depoimento atual da pessoa e se ela já pode enviar. */
export async function GET() {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const { data } = await ctx.supabase.from("testimonials").select("display_name, quote, status, photo_path").eq("user_id", ctx.user.id).maybeSingle();
  return json({ canSubmit: await hasApprovedPayment(ctx), testimonial: data ? { name: data.display_name, quote: data.quote, status: data.status, hasPhoto: Boolean(data.photo_path) } : null });
}

/** Envia ou atualiza o depoimento. Fica "pendente" até um administrador aprovar. */
export async function POST(req: Request) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const rl = limited(`testimonial:${ctx.user.id}`, 10, 60 * 60_000);
  if (rl) return rl;
  if (!(await hasApprovedPayment(ctx))) return jsonError("O envio de depoimento fica disponível depois que você libera o seu currículo.", 403);

  let form: FormData;
  try { form = await req.formData(); } catch { return jsonError("Envio inválido.", 400); }
  const parsed = fieldsSchema.safeParse({ name: String(form.get("name") ?? ""), quote: String(form.get("quote") ?? ""), consent: String(form.get("consent") ?? "") });
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 422);

  const admin = createAdminClient();
  const { data: existing } = await ctx.supabase.from("testimonials").select("id, photo_path").eq("user_id", ctx.user.id).maybeSingle();
  let photoPath: string | null | undefined; // undefined = manter
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    try {
      const jpeg = await processProfilePhoto(new Uint8Array(await file.arrayBuffer()));
      const path = `${ctx.user.id}/${crypto.randomUUID()}.jpg`;
      const up = await admin.storage.from(BUCKET).upload(path, jpeg, { contentType: "image/jpeg", upsert: false });
      if (up.error) return jsonError("Não foi possível guardar a foto.", 500);
      photoPath = path;
    } catch (e) {
      return jsonError(e instanceof ImageError ? e.message : "Foto inválida.", 422);
    }
  } else if (form.get("removePhoto") === "true") {
    photoPath = null;
  }

  const base = { display_name: parsed.data.name, quote: parsed.data.quote, consent_at: new Date().toISOString(), ...(photoPath !== undefined ? { photo_path: photoPath } : {}) };
  const res = existing
    ? await ctx.supabase.from("testimonials").update(base).eq("user_id", ctx.user.id)
    : await ctx.supabase.from("testimonials").insert({ ...base, user_id: ctx.user.id });
  if (res.error) {
    await logEvent("error", "testimonial_save_failed", res.error.message);
    if (photoPath) await admin.storage.from(BUCKET).remove([photoPath]);
    return jsonError("Não foi possível enviar agora. Tente novamente.", 500);
  }
  if (photoPath !== undefined && existing?.photo_path && existing.photo_path !== photoPath) await admin.storage.from(BUCKET).remove([existing.photo_path]);
  return json({ ok: true, status: "pending" }, existing ? 200 : 201);
}

/** A pessoa pode retirar o depoimento (e a foto) quando quiser. */
export async function DELETE() {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const { data: existing } = await ctx.supabase.from("testimonials").select("photo_path").eq("user_id", ctx.user.id).maybeSingle();
  const { error } = await ctx.supabase.from("testimonials").delete().eq("user_id", ctx.user.id);
  if (error) return jsonError("Não foi possível remover.", 500);
  if (existing?.photo_path) await createAdminClient().storage.from(BUCKET).remove([existing.photo_path]);
  return json({ ok: true });
}
