import Link from "next/link";

export function AdminNav({ current }: { current: "overview" | "settings" | "logs" }) {
  const items = [["overview", "/admin", "Visão geral"], ["settings", "/admin/settings", "Preço e modelos"], ["logs", "/admin/logs", "Logs"]] as const;
  return (
    <nav aria-label="Administração" className="flex flex-wrap gap-2">
      {items.map(([k, href, label]) => (
        <Link key={k} href={href} aria-current={k === current ? "page" : undefined}
          className={`min-h-11 rounded-full px-4 py-2.5 text-sm font-bold ${k === current ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-zinc-300"}`}>{label}</Link>
      ))}
    </nav>
  );
}
