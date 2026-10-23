import { createAdminClient } from "@/lib/supabase/admin";
import { configStatus } from "@/lib/env";

type Level = "info" | "warn" | "error";

const SENSITIVE = /(email|phone|telefone|password|senha|token|secret|authorization|cookie|cpf|address|endereco|data|photo|qr)/i;

/** Remove qualquer campo potencialmente pessoal/sensível antes de registrar. */
export function redact(meta: Record<string, unknown> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE.test(k)) continue;
    out[k] = typeof v === "string" ? v.slice(0, 200) : v;
  }
  return out;
}

export async function logEvent(level: Level, type: string, message = "", meta: Record<string, unknown> = {}) {
  const safe = redact(meta);
  const line = `[${level}] ${type} ${message} ${JSON.stringify(safe)}`;
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
  if (!configStatus.supabaseAdmin()) return;
  try {
    await createAdminClient().from("event_logs").insert({ level, type, message: message.slice(0, 300), meta: safe });
  } catch {
    // Falha de log nunca deve quebrar o fluxo principal.
  }
}
