import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Card } from "@/components/ui";
import { DeleteAccount, ProfileForm } from "@/components/AccountForms";
import { LogoutButton } from "@/components/DashboardButtons";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Minha conta" };

export default async function Account() {
  const user = await requireUser();
  const { data: profile } = await (await createClient()).from("profiles").select("full_name, ai_consent_at").eq("id", user.id).maybeSingle();
  return (
    <>
      <SiteHeader signedIn />
      <main id="conteudo" className="mx-auto max-w-2xl space-y-4 p-3 sm:p-5">
        <Card className="space-y-4"><h1 className="text-3xl font-extrabold">Minha conta</h1><p className="text-muted">{user.email}</p>
          <ProfileForm initialName={profile?.full_name ?? ""} />
          <p className="text-sm text-muted">Consentimento de IA: {profile?.ai_consent_at ? `concedido em ${new Date(profile.ai_consent_at).toLocaleDateString("pt-BR")}` : "ainda não concedido"}.</p>
          <LogoutButton action={logoutAction} />
        </Card>
        <Card className="space-y-3"><h2 className="text-xl font-extrabold text-red-800">Excluir conta e dados</h2><DeleteAccount /></Card>
      </main>
      <SiteFooter />
    </>
  );
}
