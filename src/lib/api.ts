import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { configStatus } from "@/lib/env";
import { rateLimit } from "@/lib/security/ratelimit";
import { resumeDataSchema, designSchema, type ResumeData, type ResumeDesign } from "@/lib/resume/schema";

export const noStore = { "Cache-Control": "no-store, private" };

export function jsonError(message: string, status = 400, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status, headers: { ...noStore, ...headers } });
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ApiContext {
  user: User;
  supabase: SupabaseClient;
}

/** Valida sessão no servidor (getUser consulta o Supabase Auth; não confia só no cookie). */
export async function authenticate(): Promise<ApiContext | NextResponse> {
  if (!configStatus.supabase()) return jsonError("Integração com Supabase pendente de configuração.", 503);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return jsonError("Sessão expirada. Entre novamente.", 401);
  return { user: data.user, supabase };
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

export function limited(key: string, limit: number, windowMs: number) {
  const r = rateLimit(key, limit, windowMs);
  return r.ok ? null : jsonError("Muitas requisições. Aguarde um momento.", 429, {}, { "Retry-After": String(r.retryAfter) });
}

export interface OwnedResume {
  id: string;
  user_id: string;
  title: string;
  data: ResumeData;
  design: ResumeDesign;
  template: string;
  status: string;
  version: number;
  updated_at: string;
}

/** Busca o currículo com a sessão do usuário: RLS garante que só o dono o enxergue. */
export async function loadOwnedResume(ctx: ApiContext, id: string): Promise<OwnedResume | null> {
  if (!UUID_RE.test(id)) return null;
  const { data } = await ctx.supabase.from("resumes").select("*").eq("id", id).eq("user_id", ctx.user.id).maybeSingle();
  if (!data) return null;
  return normalizeResumeRow(data);
}

export function normalizeResumeRow(row: { id: string; user_id: string; title: string; data: unknown; design: unknown; template: string; status: string; version: number; updated_at: string }): OwnedResume {
  const data = resumeDataSchema.parse(row.data ?? {});
  const design = designSchema.parse({ ...(row.design as object), template: row.template });
  return { id: row.id, user_id: row.user_id, title: row.title, data, design, template: row.template, status: row.status, version: row.version, updated_at: row.updated_at };
}

/** O caminho real da foto nunca vai ao navegador: apenas um marcador de que existe foto. */
export function maskPhoto(d: ResumeData): ResumeData {
  return { ...d, personal: { ...d.personal, photoPath: d.personal.photoPath ? "private" : "" } };
}

/** Lê a foto do armazenamento privado, conferindo que o caminho pertence ao dono. */
export async function loadPhoto(ownerId: string, path: string): Promise<Buffer | null> {
  if (!path || !path.startsWith(`${ownerId}/`) || path.includes("..")) return null;
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data, error } = await createAdminClient().storage.from("resume-photos").download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

/** Autoriza rotas administrativas: papel lido do banco no servidor, nunca do cliente. */
export async function authenticateAdmin(): Promise<ApiContext | NextResponse> {
  const ctx = await authenticate();
  if (isResponse(ctx)) return ctx;
  const { getRole } = await import("@/lib/auth");
  if ((await getRole(ctx.user.id)) !== "admin") return jsonError("Acesso negado.", 403);
  return ctx;
}

export async function audit(adminId: string, action: string, target: string | null, details: Record<string, unknown> = {}) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  await createAdminClient().from("admin_audit_log").insert({ admin_id: adminId, action, target, details });
}
