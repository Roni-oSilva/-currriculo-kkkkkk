import crypto from "node:crypto";
import { authenticate, isResponse, json, jsonError, limited, loadOwnedResume } from "@/lib/api";
import { ImageError, MAX_PHOTO_BYTES, processProfilePhoto } from "@/lib/security/image";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const rl = limited(`photo:${ctx.user.id}`, 15, 60 * 60_000);
  if (rl) return rl;

  const { id } = await params;
  const resume = await loadOwnedResume(ctx, id);
  if (!resume) return jsonError("Currículo não encontrado.", 404);

  // Recusa cedo requisições absurdamente grandes, antes de ler o corpo.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_PHOTO_BYTES + 100_000) return jsonError("A foto deve ter no máximo 2 MB.", 413);

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("photo");
    file = f instanceof File ? f : null;
  } catch {
    return jsonError("Envio inválido.", 400);
  }
  if (!file) return jsonError("Nenhuma foto enviada.", 400);

  let jpeg: Buffer;
  try {
    jpeg = await processProfilePhoto(new Uint8Array(await file.arrayBuffer()));
  } catch (e) {
    return jsonError(e instanceof ImageError ? e.message : "Foto inválida.", 422);
  }

  const admin = createAdminClient();
  const path = `${ctx.user.id}/${id}/${crypto.randomUUID()}.jpg`;
  const up = await admin.storage.from("resume-photos").upload(path, jpeg, { contentType: "image/jpeg", upsert: false });
  if (up.error) return jsonError("Não foi possível armazenar a foto.", 500);

  const data = { ...resume.data, personal: { ...resume.data.personal, photoPath: path } };
  const { error } = await ctx.supabase.from("resumes").update({ data }).eq("id", id).eq("user_id", ctx.user.id);
  if (error) {
    await admin.storage.from("resume-photos").remove([path]);
    return jsonError("Não foi possível salvar a foto.", 500);
  }
  // Remove a foto anterior (versões já compradas guardam o próprio caminho em snapshots).
  const old = resume.data.personal.photoPath;
  if (old && old !== path) {
    const { count } = await admin.from("resume_versions").select("resume_id", { count: "exact", head: true }).eq("resume_id", id).eq("data->personal->>photoPath", old);
    if (!count) await admin.storage.from("resume-photos").remove([old]);
  }
  const signed = await admin.storage.from("resume-photos").createSignedUrl(path, 300);
  return json({ ok: true, photoPath: "private", photoUrl: signed.data?.signedUrl ?? null });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  const resume = await loadOwnedResume(ctx, id);
  if (!resume) return jsonError("Currículo não encontrado.", 404);
  const old = resume.data.personal.photoPath;
  const data = { ...resume.data, personal: { ...resume.data.personal, photoPath: "" } };
  await ctx.supabase.from("resumes").update({ data }).eq("id", id).eq("user_id", ctx.user.id);
  if (old) {
    const admin = createAdminClient();
    const { count } = await admin.from("resume_versions").select("resume_id", { count: "exact", head: true }).eq("resume_id", id).eq("data->personal->>photoPath", old);
    if (!count) await admin.storage.from("resume-photos").remove([old]);
  }
  return json({ ok: true });
}
