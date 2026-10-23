import { authenticate, isResponse, json, jsonError, limited, loadOwnedResume } from "@/lib/api";
import { configStatus } from "@/lib/env";
import { PaymentError, createPixCharge } from "@/lib/payments/service";
import { minimumDataIssues } from "@/lib/resume/schema";

export const runtime = "nodejs";

/** Cria a cobrança Pix. O corpo só informa QUAL currículo; valor e versão são decididos no servidor. */
export async function POST(req: Request) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  if (!configStatus.payments() || !configStatus.supabaseAdmin()) {
    return jsonError("Pagamentos ainda não configurados. Veja docs/PAYMENTS.md.", 503, { code: "payments_not_configured" });
  }
  const rl = limited(`pay-create:${ctx.user.id}`, 10, 10 * 60_000);
  if (rl) return rl;

  const body = await req.json().catch(() => ({}));
  const resume = await loadOwnedResume(ctx, String(body?.resumeId ?? ""));
  if (!resume) return jsonError("Currículo não encontrado.", 404);
  const issues = minimumDataIssues(resume.data);
  if (issues.length) return jsonError(issues.join(" "), 422);

  try {
    const charge = await createPixCharge({ userId: ctx.user.id, email: ctx.user.email ?? "", resumeId: resume.id, version: resume.version });
    return json({ charge });
  } catch (e) {
    if (e instanceof PaymentError) return jsonError(e.message, e.status);
    return jsonError("Erro ao iniciar o pagamento.", 500);
  }
}
