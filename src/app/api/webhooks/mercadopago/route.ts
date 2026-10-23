import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { mercadoPago } from "@/lib/payments/mercadopago";
import { supabasePaymentStore } from "@/lib/payments/supabase-store";
import { processMercadoPagoWebhook } from "@/lib/payments/webhook";
import { clientIp, rateLimit } from "@/lib/security/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!env.mpToken || !env.supabaseServiceKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  if (!rateLimit(`webhook:${clientIp(req.headers)}`, 300, 60_000).ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const raw = await req.text();
  if (raw.length > 50_000) return NextResponse.json({ error: "too_large" }, { status: 413 });
  let body: unknown = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { /* corpo ignorado: só o id importa */ }

  const out = await processMercadoPagoWebhook(
    { query: new URL(req.url).searchParams, headers: req.headers, body },
    { store: supabasePaymentStore(createAdminClient()), provider: mercadoPago, secret: env.mpWebhookSecret, isProduction: env.isProduction },
  );
  return NextResponse.json(out.body, { status: out.httpStatus });
}

// Algumas configurações do Mercado Pago validam a URL com GET.
export async function GET() {
  return NextResponse.json({ ok: true });
}
