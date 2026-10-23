import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LinkButton, Marker } from "@/components/ui";
import { TEMPLATE_LIST } from "@/lib/resume/templates";
import { formatBRL, getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "1", t: "Preencha seus dados", d: "Dados pessoais, experiências, formação, cursos e habilidades. Tudo opcional, menos o básico. O progresso é salvo sozinho." },
  { n: "2", t: "Revise com a IA e veja sua nota", d: "A IA melhora a redação sem inventar nada e você aprova cada sugestão. Receba uma nota de 0 a 10 de aceitação para o modelo escolhido." },
  { n: "3", t: "Baixe seu PDF", d: "Veja a prévia grátis, ajuste quantas vezes quiser e libere o PDF final, sem marca d’água, pagando uma única vez por currículo." },
];

const BENEFITS = [
  ["Nota de aceitação 0–10", "Mostramos o que falta para o seu currículo ser bem avaliado por RH e sistemas ATS."],
  ["IA que não inventa", "Corrige texto e organiza informações, mas preserva empresas, datas, cursos e habilidades reais."],
  ["Você aprova tudo", "Nenhuma sugestão é aplicada sem o seu “aceitar”. Mude até achar que está bom."],
  ["Modelos que RH aprova", "Clássico e Minimalista seguem o padrão mais aceito: fundo branco, coluna única, texto selecionável."],
  ["Funciona no celular", "Preencha e confira a prévia pelo telefone, com botões grandes e salvamento automático."],
  ["Privacidade (LGPD)", "Fotos e arquivos em armazenamento privado. Você pode excluir sua conta e seus dados quando quiser."],
];

const FAQ = [
  ["Preciso ter experiência profissional?", "Não. Use o modelo “Primeiro emprego” e destaque formação, cursos, projetos e voluntariado."],
  ["A IA pode inventar informações?", "Não deve. Ela só reorganiza e melhora o que você escreveu, e nós descartamos qualquer sugestão com números ou nomes que você não informou. Você sempre aprova antes de aplicar."],
  ["Quanto custa?", "A prévia é grátis. Para baixar o PDF sem marca d’água, o valor é único por currículo liberado, via Pix."],
  ["Se eu alterar o currículo depois de pagar?", "Cada pagamento libera uma versão. Se mudar o conteúdo depois, é preciso uma nova compra para liberar a nova versão; a versão paga continua disponível para baixar."],
  ["Meus dados são enviados para a IA?", "Somente o conteúdo profissional (sem e-mail, telefone ou endereço), e só depois do seu consentimento. Veja a Política de Privacidade."],
  ["Como funciona o reembolso?", "Veja a Política de Reembolso no rodapé."],
];

export default async function Home() {
  const [{ priceCents }, user] = await Promise.all([getSettings(), getSessionUser()]);
  const price = formatBRL(priceCents);
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main id="conteudo" className="space-y-4 p-3 sm:p-5">
        {/* HERO */}
        <section className="mx-auto grid max-w-6xl items-center gap-8 rounded-[32px] bg-paper p-6 sm:p-10 md:grid-cols-2">
          <div className="space-y-5">
            <span className="inline-block rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white">Currículo com IA</span>
            <h1 className="text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              Seu próximo emprego começa com um <Marker>bom currículo</Marker>
            </h1>
            <p className="text-lg text-muted">
              A IA ajuda a transformar suas informações em um currículo profissional — sem inventar nada — e mostra uma <strong>nota de 0 a 10</strong> de chance de aceitação para o modelo que você escolher.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href={user ? "/dashboard" : "/cadastro"}>Criar meu currículo</LinkButton>
              <LinkButton href="#modelos" variant="outline">Ver modelos</LinkButton>
            </div>
            <p className="text-sm font-semibold text-muted">Prévia grátis • PDF por {price} • Pagamento via Pix</p>
          </div>
          <div className="hero-blue swirl rounded-[28px] p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-wide text-chip">Exemplo de avaliação</p>
            <div className="mt-3 flex items-end gap-2"><span className="text-7xl font-extrabold">8,7</span><span className="pb-3 text-2xl font-bold text-chip">/10</span></div>
            <p className="font-bold">Alta chance de passar na triagem com este modelo.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✔ Contato completo e resumo no tamanho ideal</li>
              <li>✔ Experiências em ordem cronológica inversa</li>
              <li>• Dica: acrescente resultados com números reais</li>
            </ul>
            <p className="mt-4 text-xs text-white/70">Exemplo ilustrativo da avaliação que você recebe no seu currículo.</p>
          </div>
        </section>

        {/* MODELOS */}
        <section id="modelos" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Modelos <Marker>profissionais</Marker></h2>
          <p className="mt-2 max-w-2xl text-muted">Todos com texto selecionável e boa leitura por ATS. Os dados abaixo são fictícios, apenas para ilustrar o layout.</p>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATE_LIST.map((t) => (
              <li key={t.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/examples/${t.id}`} alt={`Exemplo ilustrativo do modelo ${t.name}`} loading="lazy" width={600} height={850} className="aspect-[1/1.414] w-full border-b object-cover object-top" />
                <div className="space-y-1 p-4">
                  <h3 className="flex flex-wrap items-center gap-2 font-extrabold">{t.name}{t.recommendedByHr ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">Preferido por RH</span> : null}</h3>
                  <p className="text-sm text-muted">{t.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="hero-blue swirl mx-auto max-w-6xl scroll-mt-20 rounded-[32px] p-6 text-white sm:p-10">
          <h2 className="text-3xl font-extrabold">Como funciona</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-2xl bg-white/10 p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-extrabold text-brand-dark">{s.n}</span>
                <h3 className="mt-3 text-xl font-extrabold">{s.t}</h3>
                <p className="mt-1 text-white/85">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* BENEFÍCIOS */}
        <section className="mx-auto max-w-6xl rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Feito para ser <Marker>fácil</Marker></h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-white p-5">
                <h3 className="font-extrabold text-brand-dark">{t}</h3>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* PREÇO */}
        <section id="preco" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 text-center sm:p-10">
          <h2 className="text-3xl font-extrabold">Preço <Marker>transparente</Marker></h2>
          <div className="mx-auto mt-6 max-w-md rounded-[28px] bg-brand p-8 text-white">
            <p className="text-6xl font-extrabold">{price}</p>
            <p className="mt-1 font-bold">por currículo liberado</p>
            <ul className="mt-4 space-y-1 text-left text-sm">
              <li>✔ Prévia gratuita e edições ilimitadas antes de pagar</li>
              <li>✔ PDF final sem marca d’água, texto selecionável</li>
              <li>✔ Nota de aceitação 0–10 e sugestões da IA</li>
              <li>✔ Pagamento via Pix, sem mensalidade</li>
            </ul>
            <LinkButton href={user ? "/dashboard" : "/cadastro"} variant="light" className="mt-6 w-full">Começar grátis</LinkButton>
          </div>
        </section>

        {/* FAQ */}
        <section id="duvidas" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Perguntas <Marker>frequentes</Marker></h2>
          <div className="mt-6 space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-2xl bg-white p-5">
                <summary className="cursor-pointer list-none font-extrabold">{q}</summary>
                <p className="mt-2 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
