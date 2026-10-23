import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { logEvent } from "@/lib/log";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Política de retenção (Vercel Cron). Exige `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const secret = env.cronSecret;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await createAdminClient().rpc("purge_stale_data");
  if (error) {
    await logEvent("error", "retention_failed", error.message);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  await logEvent("info", "retention_run", "", data ?? {});
  return NextResponse.json(data);
}
