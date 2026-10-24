import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // NEXT_STANDALONE=1 gera um pacote isolado (só arquivos rastreados), útil para simular a Vercel nos testes.
  ...(process.env.NEXT_STANDALONE ? { output: "standalone" as const } : {}),
  // Pacotes nativos / com arquivos auxiliares não devem ser empacotados.
  serverExternalPackages: ["sharp", "@react-pdf/renderer", "@hyzyla/pdfium"],
  // Alguns arquivos são carregados por "atalhos" internos dos pacotes (package.json "imports" / require dinâmico)
  // e o rastreador do deploy não os enxerga. Sem isto a Vercel falha com
  // "Cannot find module .../pdfkit/js/standard-fonts/Helvetica.cjs".
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/pdfkit/js/standard-fonts/**/*",
      "./node_modules/pdfkit/js/data/**/*",
      "./node_modules/fontkit/**/*.{js,cjs,mjs,json,trie}",
      "./node_modules/unicode-properties/**/*.{js,cjs,mjs,json,trie}",
      "./node_modules/linebreak/**/*.{js,cjs,mjs,json,trie}",
      "./node_modules/hyphen/**/*.{js,cjs,mjs,json}",
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
