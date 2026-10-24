"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { configStatus, env } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/security/ratelimit";
import { logEvent } from "@/lib/log";
import { signupErrorMessage } from "@/lib/auth-errors";
import { forgotSchema, loginSchema, registerSchema, resetSchema } from "@/lib/auth-schemas";

export interface FormState {
  error?: string;
  ok?: string;
  fieldErrors?: Record<string, string>;
}

async function guard(bucket: string, limit: number): Promise<string | null> {
  if (!configStatus.supabase()) return "Login indisponível: Supabase ainda não configurado.";
  const ip = clientIp(await headers());
  const r = rateLimit(`${bucket}:${ip}`, limit, 10 * 60_000);
  return r.ok ? null : "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

function safeNext(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
}

export async function registerAction(_: FormState, form: FormData): Promise<FormState> {
  const blocked = await guard("register", 8);
  if (blocked) return { error: blocked };
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName }, emailRedirectTo: `${env.appUrl}/auth/callback?next=/dashboard` },
  });
  if (error) {
    await logEvent("error", "signup_failed", "", { code: (error as { code?: string }).code ?? "", status: (error as { status?: number }).status ?? 0, reason: error.message.slice(0, 120) });
    return { error: signupErrorMessage(error) };
  }
  // Sem confirmação de e-mail no Supabase, o cadastro já devolve a sessão: entra direto e escolhe a profissão.
  if (data.session) redirect("/resume/new");
  // Sem sessão: ou o e-mail já existia (o Supabase não revela isso) ou a confirmação ainda está ligada.
  const login = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (!login.error) redirect("/resume/new");
  if (/confirm/i.test(login.error.message)) {
    return { error: "A confirmação de e-mail ainda está ativada no servidor. Desative “Confirm email” no Supabase (Authentication > Providers > Email) para entrar direto." };
  }
  return { error: "Não foi possível criar a conta. Se você já tem cadastro com esse e-mail, use “Entrar”." };
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const blocked = await guard("login", 10);
  if (blocked) return { error: blocked };
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "E-mail ou senha incorretos, ou e-mail ainda não confirmado." };
  redirect(safeNext(form.get("next")));
}

export async function forgotAction(_: FormState, form: FormData): Promise<FormState> {
  const blocked = await guard("forgot", 5);
  if (blocked) return { error: blocked };
  const parsed = forgotSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${env.appUrl}/auth/callback?next=/redefinir-senha` });
  // Mesma resposta exista ou não a conta (evita enumeração de usuários).
  return { ok: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha." };
}

export async function resetAction(_: FormState, form: FormData): Promise<FormState> {
  const blocked = await guard("reset", 10);
  if (blocked) return { error: blocked };
  const parsed = resetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "O link expirou ou é inválido. Solicite um novo." };
  redirect("/dashboard");
}

export async function logoutAction() {
  if (configStatus.supabase()) await (await createClient()).auth.signOut();
  redirect("/");
}
