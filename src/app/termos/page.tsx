import { LegalPage } from "@/components/Legal";
import { env } from "@/lib/env";
export const metadata = { title: "Termos de uso" };
export default function Page() {
  return (
    <LegalPage title="Termos de uso" updated="23/10/2026">
      <h2>1. O serviço</h2>
      <p>O Currículo IA permite criar, revisar com apoio de inteligência artificial e baixar currículos em PDF. A prévia é gratuita; o PDF sem marca d’água é liberado após a confirmação do pagamento.</p>
      <h2>2. Sua conta e seus dados</h2>
      <p>Você é responsável pela veracidade das informações do currículo. A IA sugere melhorias de redação, mas nada é aplicado sem a sua aprovação, e você deve conferir o resultado final.</p>
      <h2>3. Pagamento</h2>
      <p>O valor é exibido antes da compra e cobrado por currículo liberado, via Pix. Cada pagamento libera uma versão específica do currículo. Alterações no conteúdo após a compra exigem nova compra para liberar a nova versão, salvo condição diferente informada na plataforma.</p>
      <h2>4. Uso aceitável</h2>
      <p>É proibido inserir conteúdo ilegal, de terceiros sem autorização, ou tentar burlar a marca d’água, o pagamento ou os limites de uso.</p>
      <h2>5. Limitação de responsabilidade</h2>
      <p>A nota de 0 a 10 é uma estimativa baseada em boas práticas; não garante aprovação em processos seletivos.</p>
      <h2>6. Contato</h2>
      <p>Dúvidas: {env.contactEmail}.</p>
    </LegalPage>
  );
}
