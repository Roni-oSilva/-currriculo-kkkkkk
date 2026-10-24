import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { configStatus } from "@/lib/env";
import type { Testimonial } from "@/lib/testimonials";

/** Depoimentos APROVADOS por um administrador, com URL assinada (1 h) das fotos privadas. */
export async function getApprovedTestimonials(limit = 12): Promise<Testimonial[]> {
  if (!configStatus.supabaseAdmin()) return [];
  try {
    const db = createAdminClient();
    const { data } = await db.from("testimonials").select("display_name, quote, photo_path, reviewed_at").eq("status", "approved").order("reviewed_at", { ascending: false }).limit(limit);
    const rows = data ?? [];
    const paths = rows.map((r) => r.photo_path).filter((p): p is string => Boolean(p));
    const urls = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await db.storage.from("testimonial-photos").createSignedUrls(paths, 3600);
      for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
    }
    return rows.map((r) => ({ name: r.display_name as string, quote: r.quote as string, photo: r.photo_path ? (urls.get(r.photo_path as string) ?? null) : null }));
  } catch {
    return [];
  }
}
