import { authenticate, isResponse, json, jsonError, limited, loadOwnedResume, loadPhoto } from "@/lib/api";
import { renderPreviewPdf } from "@/lib/pdf/render";
import { rasterizePdf } from "@/lib/pdf/rasterize";
import { minimumDataIssues } from "@/lib/resume/schema";
import { logEvent } from "@/lib/log";

export const runtime = "nodejs";
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

/**
 * Prévia protegida: o PDF é gerado só em memória, com marca d'água, e entregue como
 * IMAGENS (PNG) ao usuário autenticado dono do currículo. Nenhum PDF, caminho de arquivo
 * ou URL permanente é exposto antes do pagamento.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const rl = limited(`preview:${ctx.user.id}`, 30, 60_000);
  if (rl) return rl;

  const resume = await loadOwnedResume(ctx, (await params).id);
  if (!resume) return jsonError("Currículo não encontrado.", 404);
  const issues = minimumDataIssues(resume.data);
  if (issues.length) return jsonError(issues.join(" "), 422);

  try {
    const photo = resume.design.showPhoto ? await loadPhoto(ctx.user.id, resume.data.personal.photoPath) : null;
    const pdf = await renderPreviewPdf({ data: resume.data, design: resume.design, photo });
    const { pages, pageCount } = await rasterizePdf(pdf, 1.5);
    return json({ pages, pageCount, version: resume.version });
  } catch (e) {
    await logEvent("error", "preview_failed", String((e as Error).message));
    return jsonError("Não foi possível gerar a prévia agora. Tente novamente.", 500);
  }
}
