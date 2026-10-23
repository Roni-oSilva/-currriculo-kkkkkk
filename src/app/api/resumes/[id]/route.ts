import { authenticate, isResponse, json, jsonError, limited, loadOwnedResume } from "@/lib/api";
import { minimumDataIssues, resumePayloadSchema } from "@/lib/resume/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/log";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const resume = await loadOwnedResume(ctx, (await params).id);
  if (!resume) return jsonError("Currículo não encontrado.", 404);
  return json({ resume });
}

/** Salvamento automático. A foto e a versão nunca são aceitas do cliente. */
export async function PUT(req: Request, { params }: Ctx) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const rl = limited(`resume-save:${ctx.user.id}`, 120, 60_000);
  if (rl) return rl;

  const { id } = await params;
  const current = await loadOwnedResume(ctx, id);
  if (!current) return jsonError("Currículo não encontrado.", 404);

  const raw = await req.text();
  if (raw.length > 350_000) return jsonError("Conteúdo grande demais.", 413);
  let parsed;
  try {
    parsed = resumePayloadSchema.safeParse(JSON.parse(raw));
  } catch {
    return jsonError("JSON inválido.", 400);
  }
  if (!parsed.success) {
    return jsonError("Dados inválidos.", 422, { issues: parsed.error.issues.slice(0, 10).map((i) => ({ path: i.path.join("."), message: i.message })) });
  }
  const { title, data, design } = parsed.data;
  // photoPath só é alterado pela rota de upload.
  data.personal.photoPath = current.data.personal.photoPath;

  const { data: enabled } = await ctx.supabase.from("templates").select("id").eq("id", design.template).eq("enabled", true).maybeSingle();
  if (!enabled) return jsonError("Modelo indisponível.", 422);

  const { data: row, error } = await ctx.supabase
    .from("resumes")
    .update({ title: title || "Meu currículo", data, design, template: design.template, status: minimumDataIssues(data).length ? "draft" : "ready" })
    .eq("id", id).eq("user_id", ctx.user.id)
    .select("version, updated_at")
    .single();
  if (error || !row) return jsonError("Não foi possível salvar.", 500);
  return json({ version: row.version, updatedAt: row.updated_at });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  const resume = await loadOwnedResume(ctx, id);
  if (!resume) return jsonError("Currículo não encontrado.", 404);

  const admin = createAdminClient();
  try {
    for (const bucket of ["resume-photos", "resume-files"]) {
      const prefix = `${ctx.user.id}/${id}`;
      const { data: files } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
      if (files?.length) await admin.storage.from(bucket).remove(files.map((f) => `${prefix}/${f.name}`));
    }
  } catch (e) {
    await logEvent("warn", "storage_cleanup_failed", String((e as Error).message));
  }
  const { error } = await ctx.supabase.from("resumes").delete().eq("id", id).eq("user_id", ctx.user.id);
  if (error) return jsonError("Não foi possível excluir.", 500);
  return json({ ok: true });
}
