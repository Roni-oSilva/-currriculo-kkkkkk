import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: { default: "Currículo IA — currículo profissional em minutos", template: "%s | Currículo IA" },
  description: "Crie um currículo profissional com ajuda de IA, veja a nota de aceitação (0 a 10) para o modelo escolhido e baixe em PDF por R$ 7,99.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#26262b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
