"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Notice, inputCls } from "./ui";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

export function SettingsForm({ priceCents, repurchaseOnEdit }: { priceCents: number; repurchaseOnEdit: boolean }) {
  const router = useRouter();
  const [price, setPrice] = useState((priceCents / 100).toFixed(2));
  const [repurchase, setRepurchase] = useState(repurchaseOnEdit);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(price.replace(",", ".")) * 100);
    const r = await post("/api/admin/settings", { priceCents: cents, repurchaseOnEdit: repurchase });
    setMsg({ ok: r.ok, t: r.ok ? "Configurações salvas (registrado na auditoria)." : r.json.error ?? "Erro" });
    if (r.ok) router.refresh();
  }
  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Preço por currículo (R$)" htmlFor="price" hint="Vale para novas cobranças. Cobranças já criadas mantêm o valor original.">
        <input id="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
      </Field>
      <label className="flex min-h-12 items-center gap-3 font-semibold">
        <input type="checkbox" checked={repurchase} onChange={(e) => setRepurchase(e.target.checked)} className="h-6 w-6" />
        Exigir nova compra quando o conteúdo for alterado após o pagamento (padrão)
      </label>
      <Button type="submit">Salvar</Button>
      {msg ? <Notice tone={msg.ok ? "ok" : "error"}>{msg.t}</Notice> : null}
    </form>
  );
}

export function TemplateToggle({ id, name, enabled }: { id: string; name: string; enabled: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  async function toggle() {
    const r = await post("/api/admin/templates", { id, enabled: !enabled });
    if (r.ok) router.refresh(); else setErr(r.json.error ?? "Erro");
  }
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3">
      <span className="font-bold">{name} <span className="text-sm font-semibold text-muted">({enabled ? "ativo" : "desativado"})</span></span>
      <Button variant="outline" onClick={toggle} className="!min-h-10 text-sm">{enabled ? "Desativar" : "Ativar"}</Button>
      {err ? <span role="alert" className="w-full text-sm text-red-700">{err}</span> : null}
    </li>
  );
}

export function ReconcileButton({ id }: { id: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  async function go() {
    const r = await post(`/api/admin/payments/${id}/reconcile`, {});
    setMsg(r.ok ? `Status no provedor: ${r.json.status}${r.json.rejected ? " (divergência: " + r.json.rejected.join(", ") + ")" : ""}` : r.json.error ?? "Erro");
    if (r.ok) router.refresh();
  }
  return <span className="inline-flex flex-col"><Button variant="outline" onClick={go} className="!min-h-9 !px-3 !py-1 text-xs">Reconsultar provedor</Button>{msg ? <span className="text-xs">{msg}</span> : null}</span>;
}
