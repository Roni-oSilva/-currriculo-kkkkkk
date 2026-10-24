import Image from "next/image";
import { Reveal } from "@/components/Motion";
import { Marker } from "@/components/ui";
import type { Testimonial } from "@/lib/testimonials";

const GRID = "absolute inset-0 bg-[linear-gradient(to_right,#ffffff1f_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1f_1px,transparent_1px)] bg-[size:44px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_110%)]";

type Tone = "blue" | "dark" | "light";
const TONES: Record<Tone, string> = {
  blue: "bg-brand text-white",
  dark: "bg-navy text-white",
  light: "bg-white text-ink ring-1 ring-zinc-200",
};

function Card({ t, tone, delay, grid = false, className = "" }: { t: Testimonial; tone: Tone; delay: number; grid?: boolean; className?: string }) {
  return (
    <Reveal as="article" delay={delay} className={`lift relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 ${TONES[tone]} ${className}`}>
      {grid ? <div aria-hidden className={GRID} /> : null}
      <blockquote className="relative">
        <span aria-hidden className={`mb-2 block text-5xl font-extrabold leading-none ${tone === "light" ? "text-brand" : "text-accent"}`}>“</span>
        <p className="text-[15px] leading-relaxed">{t.quote}</p>
      </blockquote>
      <footer className="relative mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold">{t.name}</p>
          <p className={`text-sm ${tone === "light" ? "text-muted" : "text-white/75"}`}>Cliente do site</p>
        </div>
        <Image src={t.photo} alt={`Foto de ${t.name}`} width={96} height={96} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      </footer>
    </Reveal>
  );
}

/** Depoimentos reais (com autorização). Sem itens, a seção não é exibida. */
export default function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  const [a, b, c, d] = items;
  return (
    <section id="depoimentos" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 sm:p-10" aria-labelledby="dep-title">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="dep-title" className="text-3xl font-extrabold">Quem já usou, <Marker>recomenda</Marker></h2>
        <p className="mt-2 text-muted">O que dizem as pessoas que montaram o currículo aqui.</p>
      </div>
      <div className="mt-8 grid gap-3 lg:grid-cols-3">
        {/* Em telas grandes: coluna 1 e 3 com um depoimento alto, coluna 2 com dois menores */}
        {c ? <Card t={c} tone="blue" grid delay={0} /> : null}
        <div className="grid gap-3">
          {a ? <Card t={a} tone="dark" delay={100} /> : null}
          {b ? <Card t={b} tone="light" delay={180} /> : null}
        </div>
        {d ? <Card t={d} tone="dark" grid delay={260} /> : null}
        {items.slice(4).map((t, i) => <Card key={t.name} t={t} tone={i % 2 ? "dark" : "light"} delay={i * 80} />)}
      </div>
    </section>
  );
}
