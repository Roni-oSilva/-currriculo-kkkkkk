import { authenticate, isResponse, json, jsonError, limited, loadOwnedResume, loadPhoto, normalizeResumeRow } from "@/lib/api";
import { DOWNLOAD_URL_TTL_SECONDS, decideDownload } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";
import { renderFinalPdf } from "@/lib/pdf/render";
import { resumeFileName } from "@/lib/resume/format";
import { logEvent } from "@/lib/log";
import { configStatus } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

const REASONS: Record<string, [string, number]> = {
  not_paid: ["Pagamento necessário para baixar este currículo.", 402],
  pending: ["Pagamento ainda não confirmado.", 402],
  refunded: ["Este pagamento foi reembolsado e o download foi bloqueado.", 402],
  outdated_version: ["Versão inexistente.", 404],
  not_owner: ["Currículo não encontrado.", 404],
};

/**
 * Autoriza TODA requisição: sessão → propriedade → versão → pagamento aprovado.
 * Devolve uma URL assinada de curta duração (60 s) para o arquivo privado.
 */
export async function GET(req: Request, { params }: Ctx) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  if (!configStatus.supabaseAdmin()) return jsonError("Armazenamento ainda não configurado.", 503);
  const rl = limited(`download:${ctx.user.id}`, 20, 60_000);
  if (rl) return rl;

  const { id } = await params;
  const url = new URL(req.url);
  const requested = url.searchParams.get("version") ? Number(url.searchParams.get("version")) : undefined;
  const regenerate = url.searchParams.get("regenerate") === "1";
  if (requested !== undefined && (!Number.isInteger(requested) || requested < 1)) return jsonError("Versão inválida.", 400);

  const resume = await loadOwnedResume(ctx, id);
  if (!resume) return jsonError("Currículo não encontrado.", 404);

  const { data: payments } = await ctx.supabase.from("payments").select("resume_version, status").eq("resume_id", id);
  const settings = await getSettings();
  const decision = decideDownload({
    ownerId: resume.user_id, userId: ctx.user.id, currentVersion: resume.version, requestedVersion: requested,
    payments: (payments ?? []) as never, repurchaseOnEdit: settings.repurchaseOnEdit,
  });
  if (!decision.allowed) {
    const [msg, status] = REASONS[decision.reason] ?? ["Acesso negado.", 403];
    return jsonError(msg, status, { code: decision.reason });
  }

  const admin = createAdminClient();
  const version = decision.version;
  const path = `${ctx.user.id}/${id}/v${version}.pdf`;
  const bucket = admin.storage.from("resume-files");

  // Conteúdo da versão: a atual vem da tabela; versões antigas, do snapshot imutável.
  let source = resume;
  if (version !== resume.version) {
    const { data: snap } = await ctx.supabase.from("resume_versions").select("*").eq("resume_id", id).eq("version", version).maybeSingle();
    if (!snap) return jsonError("Versão inexistente.", 404);
    source = normalizeResumeRow({ ...resume, ...snap, id, user_id: resume.user_id, status: resume.status, version, updated_at: snap.created_at });
  }

  const { data: existing } = await admin.from("resume_files").select("id").eq("resume_id", id).eq("version", version).maybeSingle();
  const fileName = resumeFileName(source.data);

  if (!existing || regenerate) {
    try {
      const photo = source.design.showPhoto ? await loadPhoto(ctx.user.id, source.data.personal.photoPath) : null;
      const pdf = await renderFinalPdf({ data: source.data, design: source.design, photo });
      const up = await bucket.upload(path, pdf, { contentType: "application/pdf", upsert: true });
      if (up.error) throw new Error(up.error.message);
      const approved = (await admin.from("payments").select("id").eq("resume_id", id).eq("resume_version", version).eq("status", "approved").limit(1)).data?.[0];
      await admin.from("resume_files").upsert(
        { resume_id: id, user_id: ctx.user.id, version, storage_path: path, payment_id: approved?.id ?? null },
        { onConflict: "resume_id,version" },
      );
    } catch (e) {
      await logEvent("error", "pdf_generation_failed", String((e as Error).message), { resume_id: id, version });
      return jsonError("Não foi possível gerar o PDF agora. Tente novamente.", 500);
    }
  }

  const signed = await bucket.createSignedUrl(path, DOWNLOAD_URL_TTL_SECONDS, { download: fileName });
  if (signed.error || !signed.data) return jsonError("Não foi possível liberar o arquivo.", 500);
  return json({ url: signed.data.signedUrl, fileName, version, expiresIn: DOWNLOAD_URL_TTL_SECONDS });
}
