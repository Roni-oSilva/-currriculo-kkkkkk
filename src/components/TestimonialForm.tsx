"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Notice, inputCls } from "./ui";

type Existing = { name: string; quote: string; status: "pending" | "approved" | "rejected"; hasPhoto: boolean } | null;

const STATUS: Record<string, { tone: "info" | "ok" | "warn"; text: string }> = {
  pending: { tone: "info", text: "Recebemos o seu depoimento. Ele aparece no site depois que a nossa equipe aprovar." },
  approved: { tone: "ok", text: "Seu depoimento está publicado no site. Obrigado!" },
  rejected: { tone: "warn", text: "Não conseguimos publicar este depoimento. Você pode ajustar o texto e enviar de novo." },
};

export function TestimonialForm({ canSubmit, existing, photoUrl, defaultName }: { canSubmit: boolean; existing: Existing; photoUrl: string | null; defaultName: string }) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? defaultName);
  const [quote, setQuote] = useState(existing?.quote ?? "");
  const [consent, setConsent] = useState(false);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const fd = new FormData();
    fd.set("name", name); fd.set("quote", quote); fd.set("consent", consent ? "true" : "");
    const f = fileRef.current?.files?.[0];
    if (f) fd.set("photo", f);
    if (removePhoto) fd.set("removePhoto", "true");
    const res = await fetch("/api/testimonials", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setMsg({ ok: true, text: "Depoimento enviado! Ele será publicado depois da aprovação." }); router.refresh(); }
    else setMsg({ ok: false, text: json.error ?? "Não foi possível enviar." });
  }

  async function remove() {
    if (!window.confirm("Remover o seu depoimento e a foto do site?")) return;
    const res = await fetch("/api/testimonials", { method: "DELETE" });
    if (res.ok) { setQuote(""); setConsent(false); router.refresh(); }
  }

  if (!canSubmit && !existing) {
    return <Notice tone="info">O envio de depoimento fica disponível depois que você libera e baixa o seu currículo. Volte aqui quando terminar.</Notice>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {existing ? <Notice tone={STATUS[existing.status].tone}>{STATUS[existing.status].text}</Notice> : null}
      <Field label="Como você quer aparecer" htmlFor="t-name" hint="Primeiro nome e inicial do sobrenome. Ex.: Maria S.">
        <input id="t-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required className={inputCls} />
      </Field>
      <Field label="Seu depoimento" htmlFor="t-quote" hint={`Conte com as suas palavras como foi usar o site. ${quote.length}/600`}>
        <textarea id="t-quote" value={quote} onChange={(e) => setQuote(e.target.value)} rows={6} minLength={30} maxLength={600} required className={inputCls} />
      </Field>
      <Field label="Foto (opcional)" htmlFor="t-photo" hint="JPG, PNG ou WebP, até 2 MB. Sem foto, aparece só a inicial do seu nome.">
        <div className="flex flex-wrap items-center gap-3">
          {photoUrl && !removePhoto ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photoUrl} alt="Sua foto atual" className="h-16 w-16 rounded-xl object-cover" /> : null}
          <input ref={fileRef} id="t-photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="!min-h-11 text-sm">{fileName || (existing?.hasPhoto ? "Trocar foto" : "Escolher foto")}</Button>
          {existing?.hasPhoto && !removePhoto ? <Button variant="ghost" onClick={() => setRemovePhoto(true)} className="!min-h-11 text-sm">Remover foto</Button> : null}
        </div>
      </Field>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-chip/50 p-3 text-sm font-semibold">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--color-brand)]" />
        <span>Autorizo o Currículo Certo a publicar na página inicial o meu nome, a minha foto (se eu enviar) e este texto. Sei que posso pedir a remoção a qualquer momento, aqui nesta página ou pelo e-mail de contato.</span>
      </label>
      {msg ? <Notice tone={msg.ok ? "ok" : "error"}>{msg.text}</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="accent" disabled={busy || !consent || quote.trim().length < 30 || name.trim().length < 2}>{busy ? "Enviando…" : existing ? "Atualizar depoimento" : "Enviar depoimento"}</Button>
        {existing ? <Button variant="ghost" onClick={remove} className="!text-red-700">Remover meu depoimento</Button> : null}
      </div>
    </form>
  );
}
