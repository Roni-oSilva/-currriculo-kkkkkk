import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { configStatus } from "@/lib/env";

export async function getSessionUser() {
  if (!configStatus.supabase()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/** Para páginas: redireciona ao login quando não há sessão. */
export async function requireUser() {
  if (!configStatus.supabase()) redirect("/configuracao-pendente");
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Papel do usuário lido do banco no servidor — nunca de um dado enviado pelo cliente. */
export async function getRole(userId: string): Promise<"user" | "admin"> {
  const { data } = await createAdminClient().from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin" ? "admin" : "user";
}

export async function requireAdmin() {
  const user = await requireUser();
  if ((await getRole(user.id)) !== "admin") redirect("/dashboard");
  return user;
}
