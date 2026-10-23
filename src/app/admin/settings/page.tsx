import { SiteHeader } from "@/components/SiteChrome";
import { Card } from "@/components/ui";
import { AdminNav } from "@/components/AdminNav";
import { SettingsForm, TemplateToggle } from "@/components/AdminForms";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — configurações" };

export default async function AdminSettings() {
  await requireAdmin();
  const [settings, { data: templates }] = await Promise.all([getSettings(), createAdminClient().from("templates").select("id, name, enabled").order("sort_order")]);
  return (
    <>
      <SiteHeader signedIn />
      <main id="conteudo" className="mx-auto max-w-3xl space-y-4 p-3 sm:p-5">
        <Card className="space-y-4"><h1 className="text-3xl font-extrabold">Preço e modelos</h1><AdminNav current="settings" /></Card>
        <Card className="space-y-4"><h2 className="text-xl font-extrabold">Preço e política de compra</h2><SettingsForm priceCents={settings.priceCents} repurchaseOnEdit={settings.repurchaseOnEdit} /></Card>
        <Card className="space-y-3"><h2 className="text-xl font-extrabold">Modelos</h2><ul className="space-y-2">{(templates ?? []).map((t) => <TemplateToggle key={t.id} id={t.id} name={t.name} enabled={t.enabled} />)}</ul></Card>
      </main>
    </>
  );
}
