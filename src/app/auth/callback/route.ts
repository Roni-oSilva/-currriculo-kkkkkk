import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

/** Troca o código do e-mail (confirmação/recuperação) por uma sessão. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${env.appUrl}${safeNext}`);
  }
  return NextResponse.redirect(`${env.appUrl}/login?erro=link`);
}
