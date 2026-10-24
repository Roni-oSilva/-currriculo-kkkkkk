import { authenticate, isResponse, json, jsonError, limited } from "@/lib/api";
import { emptyResume, TEMPLATE_IDS, type TemplateId } from "@/lib/resume/schema";
import { getTemplate } from "@/lib/resume/templates";
import { getProfession } from "@/lib/resume/professions";
import { cleanText } from "@/lib/security/sanitize";

export async function POST(req: Request) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const rl = limited(`resume-create:${ctx.user.id}`, 20, 60 * 60_000);
  if (rl) return rl;

  const body = await req.json().catch(() => ({}));
  // A profissão (validada contra a lista do servidor) define o modelo recomendado; o usuário pode escolher outro.
  const profession = getProfession(typeof body?.profession === "string" ? body.profession : undefined);
  // Profissão fora da lista: o próprio texto digitado vira o cargo desejado.
  const customRole = !profession && typeof body?.role === "string" ? cleanText(body.role).slice(0, 120) : "";
  const template: TemplateId = (TEMPLATE_IDS as readonly string[]).includes(body?.template) ? (body.template as TemplateId) : (profession?.template ?? "classic");
  const t = getTemplate(template);
  const base = emptyResume();
  const design = { ...base.design, template, accent: t.defaultAccent, sectionOrder: t.defaultOrder, showPhoto: t.supportsPhoto };

  const { count } = await ctx.supabase.from("resumes").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= 30) return jsonError("Limite de 30 currículos atingido. Exclua algum para criar outro.", 409);

  const { data, error } = await ctx.supabase
    .from("resumes")
    .insert({
      user_id: ctx.user.id,
      title: "Meu currículo",
      template,
      design,
      data: {
        ...base.data,
        personal: { ...base.data.personal, email: ctx.user.email ?? "" },
        objective: { ...base.data.objective, targetRole: profession?.name ?? customRole, area: profession && profession.category !== "Primeiro emprego e estágio" ? profession.category : "" },
      },
    })
    .select("id")
    .single();
  if (error || !data) return jsonError("Não foi possível criar o currículo.", 500);
  return json({ id: data.id }, 201);
}
