import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Card } from "@/components/ui";
import { TestimonialForm } from "@/components/TestimonialForm";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { configStatus } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deixe seu depoimento" };

export default async function TestimonialPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: t }, { data: paid }, { data: profile }] = await Promise.all([
    supabase.from("testimonials").select("display_name, quote, status, photo_path").eq("user_id", user.id).maybeSingle(),
    supabase.from("payments").select("id").eq("status", "approved").limit(1),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);
  let photoUrl: string | null = null;
  if (t?.photo_path && configStatus.supabaseAdmin()) {
    photoUrl = (await createAdminClient().storage.from("testimonial-photos").createSignedUrl(t.photo_path, 600)).data?.signedUrl ?? null;
  }
  const parts = (profile?.full_name ?? "").trim().split(/\s+/).filter(Boolean);
  const defaultName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : (parts[0] ?? "");
  return (
    <>
      <SiteHeader signedIn />
      <main id="conteudo" className="mx-auto max-w-2xl p-3 sm:p-5">
        <Card className="space-y-4">
          <div>
            <h1 className="text-3xl font-extrabold">Deixe seu depoimento</h1>
            <p className="mt-1 text-muted">Sua experiência ajuda outras pessoas a decidir. Escreva do seu jeito, com sinceridade. Só publicamos depois de aprovar.</p>
          </div>
          <TestimonialForm canSubmit={Boolean(paid?.length)} defaultName={defaultName} photoUrl={photoUrl}
            existing={t ? { name: t.display_name, quote: t.quote, status: t.status, hasPhoto: Boolean(t.photo_path) } : null} />
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
