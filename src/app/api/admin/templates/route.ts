import { z } from "zod";
import { audit, authenticateAdmin, isResponse, json, jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { TEMPLATE_IDS } from "@/lib/resume/schema";

const schema = z.object({ id: z.enum(TEMPLATE_IDS), enabled: z.boolean() });

export async function POST(req: Request) {
  const ctx = await authenticateAdmin();
  if (isResponse(ctx)) return ctx;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Requisição inválida.", 422);
  const db = createAdminClient();
  if (!parsed.data.enabled) {
    const { count } = await db.from("templates").select("id", { count: "exact", head: true }).eq("enabled", true);
    if ((count ?? 0) <= 1) return jsonError("Mantenha ao menos um modelo ativo.", 409);
  }
  const { error } = await db.from("templates").update({ enabled: parsed.data.enabled }).eq("id", parsed.data.id);
  if (error) return jsonError("Não foi possível salvar.", 500);
  await audit(ctx.user.id, "template_toggle", parsed.data.id, { enabled: parsed.data.enabled });
  return json({ ok: true });
}
