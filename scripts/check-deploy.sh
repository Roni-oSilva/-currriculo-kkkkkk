#!/usr/bin/env bash
# Simula a Vercel: gera o pacote isolado (só os arquivos que o rastreador inclui),
# sobe o servidor fora da pasta do projeto e confere /api/health (PDF, imagem, 5 modelos e foto).
# Uso: npm run check:deploy   (rode antes de publicar)
set -euo pipefail
ROOT="$(pwd)"
TMP="$(mktemp -d)"
trap 'kill "${PID:-0}" 2>/dev/null || true; rm -rf "$TMP"' EXIT
rm -rf .next
NEXT_STANDALONE=1 npx next build > "$TMP/build.log" 2>&1 || { tail -30 "$TMP/build.log"; exit 1; }
cp -r .next/standalone/. "$TMP/app/" 2>/dev/null || { mkdir -p "$TMP/app"; cp -r .next/standalone/. "$TMP/app/"; }
mkdir -p "$TMP/app/.next" && cp -r .next/static "$TMP/app/.next/static"
[ -d public ] && cp -r public "$TMP/app/public"
cd "$TMP/app"
PORT=3199 HOSTNAME=127.0.0.1 node ./server.js > "$TMP/server.log" 2>&1 &
PID=$!
for i in $(seq 1 30); do curl -s -o /dev/null localhost:3199/ && break; sleep 1; done
RESULT="$(curl -s localhost:3199/api/health)"
node -e '
const j = JSON.parse(process.argv[1]);
const bad = ["pdf","imagem","modelos","foto"].filter((k) => !j[k] || !j[k].ok);
for (const k of ["pdf","imagem","modelos","foto"]) console.log((j[k]?.ok ? "OK    " : "FALHOU"), k, j[k]?.detail ?? "");
if (bad.length) process.exit(1);
' "$RESULT"
echo "Pacote isolado OK: a prévia e o PDF devem funcionar na Vercel."
cd "$ROOT"
