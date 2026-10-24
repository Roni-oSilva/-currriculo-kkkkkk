import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteChrome";
import { PreviewClient } from "@/components/PreviewClient";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { configStatus } from "@/lib/env";
import { formatBRL, getSettings } from "@/lib/settings";
import { decideDownload } from "@/lib/access";
import { maskPhoto, normalizeResumeRow, UUID_RE } from "@/lib/api";
import { minimumDataIssues } from "@/lib/resume/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prévia do currículo" };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!UUID_RE.test(id)) notFound();
  const supabase = await createClient();
  const { data: row } = await supabase.from("resumes").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!row) notFound();
  const resume = normalizeResumeRow(row);
  const [{ data: payments }, settings] = await Promise.all([
    supabase.from("payments").select("resume_version, status").eq("resume_id", id),
    getSettings(),
  ]);
  const decision = decideDownload({ ownerId: resume.user_id, userId: user.id, currentVersion: resume.version, payments: (payments ?? []) as never, repurchaseOnEdit: settings.repurchaseOnEdit });

  return (
    <>
      <SiteHeader signedIn />
      <main id="conteudo">
        <PreviewClient resumeId={id} version={resume.version} data={maskPhoto(resume.data)} design={resume.design} priceLabel={formatBRL(settings.priceCents)}
          paymentsEnabled={configStatus.payments() && configStatus.supabaseAdmin()} alreadyPaid={decision.allowed} missingData={minimumDataIssues(resume.data)} repurchaseNotice={settings.repurchaseOnEdit} />
      </main>
    </>
  );
}
