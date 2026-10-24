import { authenticate, isResponse, json, jsonError, limited, loadOwnedResume, loadPhoto } from "@/lib/api";
import { renderPreviewPdf } from "@/lib/pdf/render";
import { rasterizePdf } from "@/lib/pdf/rasterize";
import { logEvent } from "@/lib/log";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

/**
 * Prévia protegida: o PDF é gerado só em memória, com marca d'água, e entregue como
 * IMAGENS (PNG) ao usuário autenticado dono do currículo. Nenhum PDF, caminho de arquivo
 * ou URL permanente é exposto antes do pagamento.
 */
export async function GET(_req: Request, { params }: Ctx) {
  let stage = "sessão";
  try {
    const ctx = await authenticate();
    if (isResponse(ctx)) return ctx;
    const rl = limited(`preview:${ctx.user.id}`, 30, 60_000);
    if (rl) return rl;

    stage = "leitura do currículo";
    const resume = await loadOwnedResume(ctx, (await params).id);
    if (!resume) return jsonError("Currículo não encontrado.", 404);

    stage = "foto";
    const photo = resume.design.showPhoto ? await loadPhoto(ctx.user.id, resume.data.personal.photoPath).catch(() => null) : null;

    stage = "configurações de preço";
    const { priceCents } = await getSettings();

    stage = "montagem do PDF";
    const pdf = await renderPreviewPdf({ data: resume.data, design: resume.design, photo, priceCents });

    stage = "conversão em imagem";
    const { pages, pageCount } = await rasterizePdf(pdf, 1.5);
    return json({ pages, pageCount, version: resume.version });
  } catch (e) {
    const detail = String((e as Error)?.message ?? e).slice(0, 200);
    await logEvent("error", "preview_failed", detail, { stage });
    return jsonError("Não foi possível gerar a prévia agora.", 500, { stage, detail });
  }
}
