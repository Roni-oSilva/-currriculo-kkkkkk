import { z } from "zod";
import { authenticate, isResponse, json, jsonError, limited, loadOwnedResume } from "@/lib/api";
import { configStatus, env } from "@/lib/env";
import { AI_OPERATIONS, runAi } from "@/lib/ai/service";
import { AiNotConfiguredError } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanText } from "@/lib/security/sanitize";
import { logEvent } from "@/lib/log";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  resumeId: z.string().uuid(),
  operation: z.enum(AI_OPERATIONS),
  jobDescription: z.string().max(6000).transform(cleanText).optional(),
});

const OP_DB: Record<string, string> = { summary: "summary", experience: "experience", review: "review", tailor: "tailor", full: "full" };

export async function POST(req: Request) {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  if (!configStatus.ai()) {
    return jsonError("O assistente de sugestões ainda não foi ativado neste ambiente.", 503, { code: "ai_not_configured" });
  }
  const rl = limited(`ai:${ctx.user.id}`, 6, 60_000);
  if (rl) return rl;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Requisição inválida.", 422);
  const { resumeId, operation, jobDescription } = parsed.data;
  if (operation === "tailor" && !jobDescription) return jsonError("Cole a descrição da vaga para adaptar o currículo.", 422);

  const resume = await loadOwnedResume(ctx, resumeId);
  if (!resume) return jsonError("Currículo não encontrado.", 404);

  // Consentimento explícito (LGPD) antes de enviar qualquer conteúdo ao provedor de IA.
  const { data: profile } = await ctx.supabase.from("profiles").select("ai_consent_at").eq("id", ctx.user.id).maybeSingle();
  if (!profile?.ai_consent_at) return jsonError("É preciso autorizar o envio dos dados ao assistente.", 403, { code: "ai_consent_required" });

  // Limite persistente por usuário (vale entre instâncias serverless).
  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count } = await admin.from("ai_generations").select("id", { count: "exact", head: true }).eq("user_id", ctx.user.id).gte("created_at", since);
  if ((count ?? 0) >= env.aiRateLimitPerHour) return jsonError("Limite de usos do assistente por hora atingido. Tente mais tarde.", 429);

  const { data: gen } = await admin.from("ai_generations").insert({ user_id: ctx.user.id, resume_id: resumeId, operation: OP_DB[operation], status: "started", meta: { provider: env.aiProvider, model: env.aiModel } }).select("id").single();
  const started = Date.now();
  try {
    const result = await runAi(operation, resume.data, jobDescription);
    await admin.from("ai_generations").update({ status: "succeeded", meta: { provider: env.aiProvider, model: env.aiModel, suggestions: result.suggestions.length, rejected: result.rejected, ms: Date.now() - started } }).eq("id", gen?.id);
    return json(result);
  } catch (e) {
    await admin.from("ai_generations").update({ status: "failed", meta: { provider: env.aiProvider, ms: Date.now() - started } }).eq("id", gen?.id);
    await logEvent("error", "ai_failed", e instanceof Error ? e.constructor.name : "erro");
    if (e instanceof AiNotConfiguredError) return jsonError("O assistente de sugestões ainda não foi ativado neste ambiente.", 503, { code: "ai_not_configured" });
    return jsonError("O assistente não conseguiu responder agora. Seus dados não foram alterados. Tente novamente.", 502);
  }
}
