import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LinkButton } from "@/components/ui";
import { Sticker } from "@/components/Motion";

export const metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-xl p-4">
        <div className="anim-pop space-y-4 rounded-[28px] bg-paper p-8 text-center">
          <Sticker className="mx-auto h-20 w-20" />
          <h1 className="text-3xl font-extrabold">Não encontramos essa página</h1>
          <p className="text-muted">O endereço pode ter mudado ou o currículo não existe mais.</p>
          <LinkButton href="/">Voltar ao início</LinkButton>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
