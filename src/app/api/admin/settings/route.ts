import { z } from "zod";
import { audit, authenticateAdmin, isResponse, json, jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  priceCents: z.number().int().min(100).max(100_000).optional(),
  repurchaseOnEdit: z.boolean().optional(),
});

/** Preço e política de recompra. Toda alteração fica registrada em admin_audit_log. */
export async function POST(req: Request) {
  const ctx = await authenticateAdmin();
  if (isResponse(ctx)) return ctx;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Valores inválidos. O preço deve estar entre R$ 1,00 e R$ 1.000,00.", 422);
  const db = createAdminClient();
  const rows = [];
  if (parsed.data.priceCents !== undefined) rows.push({ key: "price_cents", value: parsed.data.priceCents });
  if (parsed.data.repurchaseOnEdit !== undefined) rows.push({ key: "repurchase_on_edit", value: parsed.data.repurchaseOnEdit });
  if (!rows.length) return jsonError("Nada para atualizar.", 422);
  const { error } = await db.from("app_settings").upsert(rows.map((r) => ({ ...r, updated_at: new Date().toISOString(), updated_by: ctx.user.id })));
  if (error) return jsonError("Não foi possível salvar.", 500);
  await audit(ctx.user.id, "settings_update", null, parsed.data);
  return json({ ok: true });
}
