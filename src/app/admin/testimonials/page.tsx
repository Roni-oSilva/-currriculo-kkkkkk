import { formatDateTime } from "@/lib/datetime";
import { SiteHeader } from "@/components/SiteChrome";
import { Card } from "@/components/ui";
import { AdminNav } from "@/components/AdminNav";
import { TestimonialModeration } from "@/components/TestimonialModeration";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — depoimentos" };

const LABEL: Record<string, string> = { pending: "Aguardando", approved: "Publicado", rejected: "Recusado" };

export default async function AdminTestimonials() {
  await requireAdmin();
  const db = createAdminClient();
  const { data } = await db.from("testimonials").select("id, display_name, quote, photo_path, status, created_at, updated_at").order("status", { ascending: true }).order("updated_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const paths = rows.map((r) => r.photo_path).filter((p): p is string => Boolean(p));
  const urls = new Map<string, string>();
  if (paths.length) for (const s of (await db.storage.from("testimonial-photos").createSignedUrls(paths, 600)).data ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  return (
    <>
      <SiteHeader signedIn />
      <main id="conteudo" className="mx-auto max-w-4xl space-y-4 p-3 sm:p-5">
        <Card className="space-y-3"><h1 className="text-3xl font-extrabold">Depoimentos</h1><AdminNav current="testimonials" />
          <p className="text-sm text-muted">Só publicamos depoimentos de quem pagou e marcou a autorização. Aprove apenas textos que você considera verdadeiros e adequados.</p></Card>
        {rows.length === 0 ? <Card><p className="text-muted">Nenhum depoimento recebido ainda.</p></Card> : null}
        {rows.map((r) => (
          <Card key={r.id} className="space-y-3">
            <div className="flex items-start gap-4">
              {r.photo_path && urls.get(r.photo_path) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={urls.get(r.photo_path)!} alt={`Foto de ${r.display_name}`} className="h-16 w-16 shrink-0 rounded-xl object-cover" /> : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-chip text-2xl font-extrabold text-navy">{r.display_name[0]}</span>}
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{r.display_name} <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${r.status === "approved" ? "bg-emerald-100 text-emerald-900" : r.status === "rejected" ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-900"}`}>{LABEL[r.status]}</span></p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{r.quote}</p>
                <p className="mt-1 text-xs text-muted">Recebido em {formatDateTime(r.created_at)}</p>
              </div>
            </div>
            <TestimonialModeration id={r.id} />
          </Card>
        ))}
      </main>
    </>
  );
}
