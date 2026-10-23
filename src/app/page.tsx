import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LinkButton, Marker } from "@/components/ui";
import { CountUp, Reveal, Sticker } from "@/components/Motion";
import { TEMPLATE_LIST } from "@/lib/resume/templates";
import { formatBRL, getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "1", t: "Preencha seus dados", d: "Dados pessoais, experiências, formação, cursos e habilidades. Tudo é opcional, menos nome e um contato. O progresso é salvo sozinho." },
  { n: "2", t: "Revise e veja sua nota", d: "O assistente melhora a redação sem inventar nada e você aprova cada sugestão. Receba uma nota de 0 a 10 de aceitação para o modelo escolhido." },
  { n: "3", t: "Baixe seu PDF", d: "Veja a prévia grátis, ajuste quantas vezes quiser e libere o PDF final, sem marca d’água, pagando uma única vez por currículo." },
];

const BENEFITS = [
  ["Nota de aceitação 0–10", "Mostramos o que falta para o seu currículo ser bem avaliado por RH e por sistemas de triagem (ATS)."],
  ["Texto melhor, fatos intactos", "Corrige e organiza, mas preserva empresas, datas, cursos e habilidades reais. Nada é inventado."],
  ["Você aprova tudo", "Nenhuma sugestão é aplicada sem o seu “aceitar”. Mude até achar que está bom."],
  ["Modelos que o RH aprova", "Clássico e Minimalista seguem o padrão mais aceito: fundo branco, coluna única e texto selecionável."],
  ["Funciona no celular", "Preencha e confira a prévia pelo telefone, com botões grandes e salvamento automático."],
  ["Privacidade de verdade", "Fotos e arquivos em armazenamento privado. Você exclui a conta e os dados quando quiser."],
];

const PREPARE = [
  "Nome completo, telefone e e-mail profissional",
  "Cidade, estado e link do LinkedIn (se tiver)",
  "Empresas, cargos e mês/ano de início e término",
  "O que você fazia e resultados reais (com números, se souber)",
  "Cursos, instituição, ano de conclusão e carga horária",
  "Idiomas e o seu nível real (básico, intermediário, fluente)",
  "Softwares e ferramentas que domina",
  "Descrição da vaga (opcional, para adaptar o currículo)",
];

const AUDIENCE = [
  ["Primeiro emprego", "Sem experiência? Destaque formação, cursos, projetos e voluntariado."],
  ["Recolocação", "Atualize e adapte o currículo para cada nova vaga em minutos."],
  ["Estágio e jovem aprendiz", "Modelo enxuto, de 1 página, direto ao ponto."],
  ["Mudança de área", "Reorganize as seções para valorizar o que combina com o novo objetivo."],
];

const RULES_DO = [
  "Fundo branco, texto preto e fonte sóbria",
  "Nome em destaque e contato completo no topo",
  "Resumo de 3 a 5 linhas com palavras-chave da vaga",
  "Experiências da mais recente para a mais antiga",
  "Resultados e números reais em tópicos",
  "Enviar em PDF e limitar a 1 ou 2 páginas",
];
const RULES_DONT = [
  "Barras de nível como “Excel: 80%”",
  "Várias colunas, caixas e gráficos complexos",
  "Foto grande (a menos que a vaga peça)",
  "CPF, RG, CNH e estado civil",
  "Endereço completo com CEP e número",
  "Mesmo currículo para todas as vagas",
];

const SCORE_PARTS = [
  ["Cabeçalho e contato", "1,0"], ["Resumo profissional", "1,5"], ["Experiência e resultados", "2,5"], ["Formação acadêmica", "1,0"],
  ["Habilidades", "1,2"], ["Idiomas com nível", "0,5"], ["Tamanho (1–2 páginas)", "1,0"], ["Modelo, foto e dados sensíveis", "1,3"],
];

const FAQ = [
  ["Preciso ter experiência profissional?", "Não. Use o modelo “Primeiro emprego” e destaque formação, cursos, projetos e voluntariado."],
  ["O assistente pode inventar informações?", "Não deve. Ele só reorganiza e melhora o que você escreveu, e descartamos qualquer sugestão com números ou nomes que você não informou. Você sempre aprova antes de aplicar."],
  ["Quanto custa?", "A prévia é grátis. Para baixar o PDF sem marca d’água, o valor é único por currículo liberado, via Pix. Não há mensalidade."],
  ["Como funciona a nota de 0 a 10?", "Avaliamos estrutura, resumo, experiência, formação, habilidades, tamanho e compatibilidade do modelo com sistemas ATS. É uma estimativa baseada em boas práticas de RH e não garante aprovação."],
  ["E se eu alterar o currículo depois de pagar?", "Cada pagamento libera uma versão. Alterações depois da compra pedem uma nova liberação; a versão paga continua disponível."],
  ["Meus dados são enviados a terceiros?", "O assistente de sugestões só recebe o conteúdo profissional (sem nome, e-mail, telefone ou endereço) e somente depois do seu consentimento. Veja a Política de Privacidade."],
  ["Posso excluir meus dados?", "Sim. Em “Minha conta” você apaga currículos, fotos, PDFs e a própria conta."],
];

export default async function Home() {
  const [{ priceCents }, user] = await Promise.all([getSettings(), getSessionUser()]);
  const price = formatBRL(priceCents);
  const cta = user ? "/dashboard" : "/cadastro";
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main id="conteudo" className="space-y-4 p-3 sm:p-5">
        {/* HERO */}
        <section className="relative mx-auto grid max-w-6xl items-center gap-8 overflow-hidden rounded-[32px] bg-paper p-6 sm:p-10 md:grid-cols-2">
          <div className="drift pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-chip/60 blur-2xl" aria-hidden />
          <div className="relative space-y-5">
            <span className="anim-pop inline-block rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white">Currículo profissional em minutos</span>
            <h1 className="anim-up text-4xl font-extrabold leading-tight text-ink sm:text-5xl" style={{ "--d": "100ms" } as React.CSSProperties}>
              Seu próximo emprego começa com um <Marker>bom currículo</Marker>
            </h1>
            <p className="anim-up text-lg text-muted" style={{ "--d": "200ms" } as React.CSSProperties}>
              Transformamos suas informações em um currículo profissional — sem inventar nada — e mostramos uma <strong>nota de 0 a 10</strong> de chance de aceitação para o modelo que você escolher.
            </p>
            <div className="anim-up flex flex-wrap gap-3" style={{ "--d": "300ms" } as React.CSSProperties}>
              <LinkButton href={cta} variant="accent" className="pulse-ring">Criar meu currículo</LinkButton>
              <LinkButton href="#modelos" variant="outline">Ver modelos</LinkButton>
            </div>
            <ul className="tick-list anim-up flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-muted" style={{ "--d": "400ms" } as React.CSSProperties}>
              <li>Prévia grátis</li><li>PDF por {price}</li><li>Pix, sem mensalidade</li><li>LGPD</li>
            </ul>
          </div>
          <div className="hero-blue swirl anim-up relative rounded-[28px] p-6 text-white" style={{ "--d": "250ms" } as React.CSSProperties}>
            <Sticker className="absolute -right-3 -top-6 h-16 w-16" />
            <p className="text-sm font-bold uppercase tracking-wide text-chip">Exemplo de avaliação</p>
            <div className="mt-3 flex items-end gap-2"><CountUp to={8.7} className="text-7xl font-extrabold" /><span className="pb-3 text-2xl font-bold text-chip">/10</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full w-[87%] origin-left rounded-full bg-chip" style={{ animation: "sweep 1.4s .3s cubic-bezier(.2,.7,.2,1) both" }} /></div>
            <p className="mt-3 font-bold">Alta chance de passar na triagem com este modelo.</p>
            <ul className="tick-list mt-4 space-y-2 text-sm">
              <li className="anim-in" style={{ "--d": "600ms" } as React.CSSProperties}>Contato completo e resumo no tamanho ideal</li>
              <li className="anim-in" style={{ "--d": "800ms" } as React.CSSProperties}>Experiências em ordem cronológica inversa</li>
              <li className="anim-in" style={{ "--d": "1000ms" } as React.CSSProperties}>Dica: acrescente resultados com números reais</li>
            </ul>
          </div>
        </section>

        {/* MODELOS */}
        <Reveal as="section" id="modelos" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Modelos <Marker>profissionais</Marker></h2>
          <p className="mt-2 max-w-2xl text-muted">Todos com texto selecionável e boa leitura por ATS.</p>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATE_LIST.map((t, i) => (
              <Reveal as="li" key={t.id} delay={i * 80} className="lift overflow-hidden rounded-2xl bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/examples/${t.id}.png`} alt={`Exemplo ilustrativo do modelo ${t.name}`} loading="lazy" width={600} height={850} className="aspect-[1/1.414] w-full border-b object-cover object-top" />
                <div className="space-y-1 p-4">
                  <h3 className="flex flex-wrap items-center gap-2 font-extrabold">{t.name}{t.recommendedByHr ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">Preferido por RH</span> : null}</h3>
                  <p className="text-sm text-muted">{t.description}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </Reveal>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="hero-blue swirl mx-auto max-w-6xl scroll-mt-20 rounded-[32px] p-6 text-white sm:p-10">
          <h2 className="text-3xl font-extrabold">Como funciona</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 120} className="lift rounded-2xl bg-white/10 p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-extrabold text-brand-dark">{s.n}</span>
                <h3 className="mt-3 text-xl font-extrabold">{s.t}</h3>
                <p className="mt-1 text-white/85">{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* O QUE TER EM MÃOS + PARA QUEM */}
        <section className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <Reveal as="div" className="rounded-[32px] bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">O que ter em <Marker>mãos</Marker></h2>
            <p className="mt-2 text-sm text-muted">Separe isso antes de começar e leva uns 10 minutos. Não tem tudo? Sem problema, preencha o que tiver.</p>
            <ul className="mt-4 space-y-2">
              {PREPARE.map((p, i) => <Reveal as="li" key={p} delay={i * 50} className="flex gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold"><span aria-hidden className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-brand" />{p}</Reveal>)}
            </ul>
          </Reveal>
          <Reveal as="div" delay={120} className="rounded-[32px] bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">Para quem é</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {AUDIENCE.map(([t, d]) => (
                <li key={t} className="lift rounded-2xl bg-white p-4"><span className="mb-2 block h-1.5 w-8 rounded-full bg-accent" aria-hidden /><h3 className="font-extrabold">{t}</h3><p className="text-sm text-muted">{d}</p></li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* DICAS DE RH */}
        <section id="dicas" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">O que o RH <Marker>quer ver</Marker></h2>
          <p className="mt-2 max-w-3xl text-muted">Modelos sóbrios, de coluna única, passam melhor pelos sistemas de triagem (ATS). Seguimos estas boas práticas no editor e na nota.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Reveal as="div" className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
              <h3 className="font-extrabold text-emerald-900">Faça</h3>
              <ul className="tick-list mt-2 space-y-1.5 text-sm">{RULES_DO.map((r) => <li key={r}>{r}</li>)}</ul>
            </Reveal>
            <Reveal as="div" delay={120} className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
              <h3 className="font-extrabold text-red-900">Evite</h3>
              <ul className="tick-list mt-2 space-y-1.5 text-sm">{RULES_DONT.map((r) => <li key={r}>{r}</li>)}</ul>
            </Reveal>
          </div>
          <h3 className="mt-8 text-xl font-extrabold">Estrutura ideal, na ordem certa</h3>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {["Cabeçalho", "Resumo profissional", "Experiência", "Formação", "Habilidades e idiomas"].map((s, i) => (
              <Reveal as="li" key={s} delay={i * 80} className="rounded-2xl bg-white p-4 text-center font-extrabold"><span className="mb-1 block text-sm text-brand">{i + 1}</span>{s}</Reveal>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">Tamanho: 1 página para início de carreira (ou até 5–7 anos de experiência) e 2 páginas para cargos sêniores ou de gestão.</p>
        </section>

        {/* NOTA */}
        <section className="mx-auto max-w-6xl rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Como calculamos a <Marker>nota</Marker></h2>
          <p className="mt-2 max-w-3xl text-muted">São 10 pontos distribuídos entre os itens abaixo. Quando algo estiver faltando, mostramos exatamente o que acrescentar — e a nota sobe na hora.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SCORE_PARTS.map(([t, p], i) => (
              <Reveal as="li" key={t} delay={i * 60} className="rounded-2xl bg-white p-4"><p className="text-sm font-bold text-muted">{t}</p><p className="text-2xl font-extrabold text-brand-dark">{p} <span className="text-sm text-muted">pts</span></p></Reveal>
            ))}
          </ul>
        </section>

        {/* BENEFÍCIOS */}
        <section className="mx-auto max-w-6xl rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Feito para ser <Marker>fácil</Marker></h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(([t, d], i) => (
              <Reveal as="li" key={t} delay={i * 70} className="lift rounded-2xl bg-white p-5">
                <span className="mb-2 block h-1.5 w-8 rounded-full bg-brand" aria-hidden />
                <h3 className="font-extrabold text-brand-dark">{t}</h3>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* PREÇO */}
        <section id="preco" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 text-center sm:p-10">
          <h2 className="text-3xl font-extrabold">Quanto <Marker>custa</Marker></h2>
          <Reveal as="div" className="mx-auto mt-6 max-w-md rounded-[28px] bg-brand p-8 text-white">
            <p className="text-6xl font-extrabold">{price}</p>
            <p className="mt-1 font-bold">por currículo liberado</p>
            <ul className="tick-list mt-4 space-y-1 text-left text-sm">
              <li>Prévia gratuita e edições ilimitadas antes de pagar</li>
              <li>PDF final sem marca d’água, com texto selecionável</li>
              <li>Nota de aceitação 0–10 e sugestões de melhoria</li>
              <li>Pagamento via Pix, sem mensalidade</li>
            </ul>
            <LinkButton href={cta} variant="accent" className="mt-6 w-full">Começar grátis</LinkButton>
          </Reveal>
        </section>

        {/* FAQ */}
        <section id="duvidas" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Perguntas <Marker>frequentes</Marker></h2>
          <div className="mt-6 space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-2xl bg-white p-5 transition-shadow open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-extrabold">{q}<span aria-hidden className="text-brand transition-transform group-open:rotate-45">+</span></summary>
                <p className="step-enter mt-2 text-muted">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">Não achou sua dúvida? Escreva para <a className="font-bold text-brand underline" href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>.</p>
        </section>

        {/* CTA FINAL */}
        <Reveal as="section" className="hero-blue swirl mx-auto max-w-6xl rounded-[32px] p-8 text-center text-white sm:p-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Pronto para o próximo passo?</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">Comece agora, veja a prévia e a sua nota gratuitamente. Você só paga quando estiver satisfeito.</p>
          <LinkButton href={cta} variant="accent" className="mt-6">Criar meu currículo</LinkButton>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
