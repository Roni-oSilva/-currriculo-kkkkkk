import { LegalPage } from "@/components/Legal";
import { env } from "@/lib/env";
export const metadata = { title: "Política de reembolso" };
export default function Page() {
  return (
    <LegalPage title="Política de reembolso" updated="23/10/2026">
      <p>Por se tratar de produto digital entregue imediatamente após a confirmação do pagamento, adotamos a seguinte política:</p>
      <ul>
        <li>Direito de arrependimento (CDC, art. 49): você pode pedir reembolso integral em até 7 dias corridos da compra.</li>
        <li>Se o PDF apresentar falha técnica que não conseguimos corrigir, o valor é devolvido.</li>
        <li>O reembolso é feito pelo mesmo meio (Pix) e, uma vez processado, o download da versão reembolsada é bloqueado automaticamente.</li>
      </ul>
      <p>Para solicitar, escreva para {env.contactEmail} informando o e-mail da conta.</p>
    </LegalPage>
  );
}
