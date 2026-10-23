import { authenticate, isResponse, json, jsonError, limited, UUID_RE } from "@/lib/api";
import { refreshPaymentStatus } from "@/lib/payments/service";

export const runtime = "nodejs";

/** Consulta de status: o servidor confere no provedor; o cliente apenas exibe o resultado. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const rl = limited(`pay-status:${ctx.user.id}`, 60, 60_000);
  if (rl) return rl;
  const { id } = await params;
  if (!UUID_RE.test(id)) return jsonError("Pagamento não encontrado.", 404);
  const charge = await refreshPaymentStatus(id, ctx.user.id);
  if (!charge) return jsonError("Pagamento não encontrado.", 404);
  return json({ charge });
}
