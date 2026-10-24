import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: { default: "Currículo Certo — seu currículo pronto em minutos", template: "%s | Currículo Certo" },
  description: "Monte seu currículo em poucos minutos, escolha o modelo ideal para a sua profissão e baixe o PDF por R$ 10,00. A prévia é grátis.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#070a08" };

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
