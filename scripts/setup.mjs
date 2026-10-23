#!/usr/bin/env node
/**
 * Assistente de configuração (rode: npm run setup).
 * 1) pergunta as chaves (as secretas não aparecem na tela)
 * 2) grava .env.local
 * 3) opcional: envia as variáveis para a Vercel e faz o deploy
 * 4) opcional: roda supabase/verificacao.sql no seu banco e promove você a admin
 * Nada é enviado a ninguém além de Vercel (CLI oficial) e do seu próprio banco.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const isTTY = Boolean(process.stdin.isTTY);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: isTTY });
let muted = false;
const origWrite = rl._writeToOutput?.bind(rl);
if (isTTY && origWrite) rl._writeToOutput = (s) => { if (!muted) origWrite(s); else if (s.includes("\n") || s.includes("\r")) origWrite("\n"); };

// fila de linhas: funciona tanto digitando quanto com entrada colada/encadeada
const queue = [];
let waiting = null;
rl.on("line", (l) => { if (waiting) { const w = waiting; waiting = null; w(l); } else queue.push(l); });
rl.on("close", () => { if (waiting) { const w = waiting; waiting = null; w(""); } });
const nextLine = () => new Promise((res) => (queue.length ? res(queue.shift()) : (waiting = res)));

const ask = async (q, { secret = false, def = "" } = {}) => {
  process.stdout.write(`${q}${def ? ` [${def}]` : ""}: `);
  muted = secret && isTTY;
  const a = await nextLine();
  muted = false;
  if (!isTTY) process.stdout.write("\n");
  return (a || def).trim();
};
const yes = async (q, def = "s") => /^(s|y)/i.test(await ask(`${q} (s/n)`, { def }));
const say = (m = "") => console.log(m);
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32", cwd: ROOT, ...opts });

say("\n=== Currículo Certo: assistente de configuração ===\n");
say("Dica: as chaves secretas não aparecem enquanto você cola. É normal. Aperte Enter depois.\n");

// ---------- 1) valores ----------
const v = {};
say("--- Supabase (Project Settings > API) ---");
v.NEXT_PUBLIC_SUPABASE_URL = await ask("Project URL (https://xxxx.supabase.co)");
v.NEXT_PUBLIC_SUPABASE_ANON_KEY = await ask("anon / Publishable key (pública)");
v.SUPABASE_SERVICE_ROLE_KEY = await ask("service_role / Secret key (SECRETA)", { secret: true });
say("\n--- Site ---");
v.NEXT_PUBLIC_APP_URL = await ask("Endereço final do site (https://...)", { def: "http://localhost:3000" });
say("\n--- Mercado Pago (pode deixar vazio e voltar depois) ---");
v.MERCADOPAGO_ACCESS_TOKEN = await ask("Access Token de produção (APP_USR-...)", { secret: true });
v.MERCADOPAGO_WEBHOOK_SECRET = await ask("Assinatura secreta do webhook (só depois do site no ar)", { secret: true });
say("\n--- Assistente de sugestões (opcional) ---");
v.AI_API_KEY = await ask("Chave do provedor (vazio = desligado)", { secret: true });
if (v.AI_API_KEY) {
  v.AI_PROVIDER = await ask("Provedor (anthropic ou openai-compatible)", { def: "anthropic" });
  v.AI_MODEL = await ask("Nome do modelo");
  if (v.AI_PROVIDER === "openai-compatible") v.AI_BASE_URL = await ask("URL base (https://.../v1)");
}
v.CRON_SECRET = (await ask("CRON_SECRET (vazio = gerar automaticamente)", { secret: true })) || [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, "0")).join("");
for (const k of Object.keys(v)) if (!v[k]) delete v[k];

// ---------- 2) .env.local ----------
const envPath = path.join(ROOT, ".env.local");
const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#")) : [];
const map = new Map(existing.map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1)]));
for (const [k, val] of Object.entries(v)) map.set(k, val);
fs.writeFileSync(envPath, [...map].map(([k, val]) => `${k}=${val}`).join("\n") + "\n");
say(`\nOK: gravei ${envPath} (esse arquivo NÃO vai para o GitHub).`);

// ---------- 3) Vercel ----------
if (await yes("\nEnviar as variáveis para a Vercel agora?")) {
  const who = run("npx", ["--yes", "vercel", "whoami"], { stdio: "pipe" });
  if (who.status !== 0) { say("Faça login na Vercel (vai abrir o navegador):"); run("npx", ["--yes", "vercel", "login"]); }
  if (!fs.existsSync(path.join(ROOT, ".vercel", "project.json"))) { say("Vincule este código ao seu projeto da Vercel:"); run("npx", ["--yes", "vercel", "link"]); }
  const secrets = new Set(["SUPABASE_SERVICE_ROLE_KEY", "MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_WEBHOOK_SECRET", "AI_API_KEY", "CRON_SECRET"]);
  for (const [k, val] of Object.entries(v)) {
    const base = ["--yes", "vercel", "env", "add", k, "production", "--force"];
    let r = run("npx", secrets.has(k) ? [...base, "--sensitive"] : base, { input: val, stdio: ["pipe", "pipe", "pipe"] });
    if (r.status !== 0 && secrets.has(k)) r = run("npx", base, { input: val, stdio: ["pipe", "pipe", "pipe"] });
    say(`${r.status === 0 ? "OK  " : "FALHOU"} ${k}`);
  }
  if (await yes("Fazer o deploy de produção agora?")) run("npx", ["--yes", "vercel", "deploy", "--prod"]);
}

// ---------- 4) Banco ----------
say("\n--- Banco de dados ---");
say("Para rodar a verificação automaticamente, cole a string de conexão do Supabase:");
say("Supabase > botão 'Connect' > 'Session pooler' > copie a URI e troque [YOUR-PASSWORD] pela senha do banco.");
const dbUrl = await ask("Connection string (vazio = pular e rodar a verificação manualmente)", { secret: true });
if (dbUrl) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(ROOT, "supabase", "verificacao.sql"), "utf8").split(/\r?\n/).filter((l) => !l.trim().startsWith("--")).join("\n");
    const stmts = sql.split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
    let problems = 0;
    for (const s of stmts) {
      const res = await client.query(s);
      if (res.command === "SELECT" && res.rows.length) {
        console.table(res.rows);
        problems += res.rows.filter((r) => Object.values(r).some((x) => typeof x === "string" && x.startsWith("ERRO"))).length;
      }
    }
    say(problems ? `\nATENÇÃO: ${problems} item(ns) com ERRO acima. Me mostre a tabela.` : "\nTudo OK no banco (preço R$ 10,00 aplicado).");
    const email = await ask("\nSeu e-mail de cadastro no site para virar ADMIN (vazio = pular; crie a conta no site antes)");
    if (email) {
      const r = await client.query("update public.profiles set role = 'admin' where lower(email) = lower($1) returning email", [email]);
      say(r.rowCount ? `OK: ${email} agora é administrador.` : "Não achei essa conta. Cadastre-se no site primeiro e rode de novo.");
    }
  } catch (e) {
    say(`Não consegui falar com o banco: ${e.message}`);
  } finally {
    await client.end().catch(() => {});
  }
} else {
  say("Pulado. Abra o SQL Editor do Supabase e rode o arquivo supabase/verificacao.sql.");
}

// ---------- 5) o que sobra ----------
const site = v.NEXT_PUBLIC_APP_URL || "https://SEU-SITE";
say(`\n=== Falta só isto (só dá para fazer nos painéis) ===
1) Supabase > Authentication > URL Configuration:
   Site URL = ${site}
   Redirect URL = ${site}/auth/callback
2) Supabase > Authentication > SMTP: configure um e-mail próprio.
3) Mercado Pago > sua aplicação > Webhooks:
   URL = ${site}/api/webhooks/mercadopago  (evento: Pagamentos)
   Copie a assinatura secreta e rode 'npm run setup' de novo para salvá-la.
4) Faça 1 compra de R$ 10,00 de teste e baixe o PDF.
`);
rl.close();
