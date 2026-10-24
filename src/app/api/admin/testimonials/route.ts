import { z } from "zod";
import { audit, authenticateAdmin, isResponse, json, jsonError, UUID_RE } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ id: z.string().regex(UUID_RE), action: z.enum(["approve", "reject"]) });

/** Moderação: só administrador (papel lido do banco). Cada decisão fica na auditoria. */
export async function POST(req: Request) {
  const ctx = await authenticateAdmin();
  if (isResponse(ctx)) return ctx;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Requisição inválida.", 422);
  const { data, error } = await createAdminClient()
    .from("testimonials")
    .update({ status: parsed.data.action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .select("id");
  if (error || !data?.length) return jsonError("Depoimento não encontrado.", 404);
  await audit(ctx.user.id, `testimonial_${parsed.data.action}`, parsed.data.id);
  return json({ ok: true });
}
