"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Notice, inputCls } from "./ui";

export function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: name }) });
    setMsg(res.ok ? { ok: true, text: "Dados salvos." } : { ok: false, text: "Não foi possível salvar." });
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <Field label="Nome" htmlFor="acc-name"><input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} maxLength={120} required /></Field>
      <Button type="submit">Salvar</Button>
      {msg ? <Notice tone={msg.ok ? "ok" : "error"}>{msg.text}</Notice> : null}
    </form>
  );
}

export function DeleteAccount() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function del() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) });
    if (res.ok) { router.push("/"); router.refresh(); } else { setErr((await res.json()).error ?? "Erro"); setBusy(false); }
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Apaga sua conta, currículos, fotos, PDFs e histórico de IA. Registros de pagamento permanecem sem vínculo com você, por obrigação fiscal. Não há como desfazer.</p>
      <Field label="Digite EXCLUIR para confirmar" htmlFor="del-confirm"><input id="del-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} autoComplete="off" /></Field>
      <Button variant="danger" onClick={del} disabled={busy || confirm !== "EXCLUIR"}>{busy ? "Excluindo…" : "Excluir minha conta e meus dados"}</Button>
      {err ? <Notice tone="error">{err}</Notice> : null}
    </div>
  );
}
