import { NextResponse } from "next/server";
import { configStatus, env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderPreviewPdf } from "@/lib/pdf/render";
import { rasterizePdf } from "@/lib/pdf/rasterize";
import { sampleResume, samplePhoto } from "@/lib/resume/sample";
import { clientIp, rateLimit } from "@/lib/security/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

type Check = { ok: boolean; ms?: number; detail?: string };

async function check(fn: () => Promise<string | void>): Promise<Check> {
  const t0 = Date.now();
  try {
    const detail = await fn();
    return { ok: true, ms: Date.now() - t0, ...(detail ? { detail } : {}) };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, detail: String((e as Error)?.message ?? e).slice(0, 240) };
  }
}

/**
 * Diagnóstico do ambiente. Retorna APENAS verdadeiro/falso e mensagens de erro técnicas:
 * nenhuma chave, e-mail ou dado de usuário. Abra /api/health no navegador.
 */
export async function GET(req: Request) {
  if (!rateLimit(`health:${clientIp(req.headers)}`, 12, 60_000).ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const variaveis = {
    NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(env.supabaseUrl),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(env.supabaseAnonKey),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(env.supabaseServiceKey),
    MERCADOPAGO_ACCESS_TOKEN: Boolean(env.mpToken),
    MERCADOPAGO_WEBHOOK_SECRET: Boolean(env.mpWebhookSecret),
    CRON_SECRET: Boolean(env.cronSecret),
  };

  const out: Record<string, unknown> = { variaveis, integracoes: { supabase: configStatus.supabase(), supabaseAdmin: configStatus.supabaseAdmin(), pagamentos: configStatus.payments(), assistente: configStatus.ai() } };

  if (configStatus.supabaseAdmin()) {
    const db = createAdminClient();
    out.banco = {
      tabelas: await check(async () => {
        for (const t of ["profiles", "resumes", "payments", "templates", "app_settings", "resume_versions"]) {
          const { error } = await db.from(t).select("*", { head: true, count: "exact" }).limit(1);
          if (error) throw new Error(`tabela ${t}: ${error.message}`);
        }
        return "todas as tabelas respondem";
      }),
      preco: await check(async () => {
        const { data, error } = await db.from("app_settings").select("value").eq("key", "price_cents").maybeSingle();
        if (error) throw new Error(error.message);
        return `price_cents = ${JSON.stringify(data?.value)}`;
      }),
      buckets: await check(async () => {
        const { data, error } = await db.storage.listBuckets();
        if (error) throw new Error(error.message);
        const ids = (data ?? []).map((b) => `${b.id}:${b.public ? "PÚBLICO" : "privado"}`);
        for (const need of ["resume-photos", "resume-files"]) if (!ids.some((i) => i.startsWith(`${need}:`))) throw new Error(`bucket ${need} não existe (rode a migração 0003)`);
        return ids.join(", ");
      }),
    };
  }

  out.pdf = await check(async () => {
    const s = sampleResume("creative");
    const pdf = await renderPreviewPdf({ data: s.data, design: s.design, photo: await samplePhoto() });
    return `PDF gerado (${pdf.length} bytes)`;
  });
  out.imagem = await check(async () => {
    const s = sampleResume("modern");
    const pdf = await renderPreviewPdf({ data: s.data, design: s.design, photo: await samplePhoto() });
    const r = await rasterizePdf(pdf, 1);
    return `${r.pageCount} página(s) convertida(s) em imagem`;
  });

  const all = [out.pdf, out.imagem, ...Object.values((out.banco as Record<string, Check>) ?? {})] as Check[];
  out.tudoCerto = all.every((c) => c.ok) && variaveis.NEXT_PUBLIC_SUPABASE_URL && variaveis.NEXT_PUBLIC_SUPABASE_ANON_KEY && variaveis.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
