import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteChrome";
import { Wizard } from "@/components/wizard/Wizard";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { configStatus } from "@/lib/env";
import { maskPhoto, normalizeResumeRow, UUID_RE } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar currículo" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!UUID_RE.test(id)) notFound();
  const supabase = await createClient();
  const { data: row } = await supabase.from("resumes").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!row) notFound();
  const resume = normalizeResumeRow(row);

  const [{ data: profile }, { data: templates }] = await Promise.all([
    supabase.from("profiles").select("ai_consent_at").eq("id", user.id).maybeSingle(),
    supabase.from("templates").select("id").eq("enabled", true),
  ]);

  let photoUrl: string | null = null;
  const photoPath = resume.data.personal.photoPath;
  if (photoPath && photoPath.startsWith(`${user.id}/`) && configStatus.supabaseAdmin()) {
    const { data } = await createAdminClient().storage.from("resume-photos").createSignedUrl(photoPath, 600);
    photoUrl = data?.signedUrl ?? null;
  }

  return (
    <>
      <SiteHeader signedIn />
      <main id="conteudo">
        <Wizard resumeId={id} photoUrl={photoUrl} aiEnabled={configStatus.ai()} aiConsent={Boolean(profile?.ai_consent_at)}
          enabledTemplates={(templates ?? []).map((t) => t.id as string)}
          initial={{ title: resume.title, data: maskPhoto(resume.data), design: resume.design }} />
      </main>
    </>
  );
}
