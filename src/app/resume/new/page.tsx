import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ProfessionPicker } from "@/components/ProfessionPicker";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo currículo" };

export default async function NewResume() {
  await requireUser();
  const { data } = await (await createClient()).from("templates").select("id").eq("enabled", true);
  return (
    <>
      <SiteHeader signedIn />
      <main id="conteudo" className="mx-auto max-w-5xl p-3 sm:p-5">
        <ProfessionPicker enabledTemplates={(data ?? []).map((t) => t.id as string)} />
      </main>
      <SiteFooter />
    </>
  );
}
