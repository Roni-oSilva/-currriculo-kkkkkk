import { LegalPage } from "@/components/Legal";
import { env } from "@/lib/env";
export const metadata = { title: "Política de privacidade" };
export default function Page() {
  return (
    <LegalPage title="Política de privacidade (LGPD)" updated="23/10/2026">
      <h2>Dados que tratamos</h2>
      <ul>
        <li>Conta: nome e e-mail.</li>
        <li>Currículo: dados pessoais e profissionais que você informa, incluindo foto opcional.</li>
        <li>Pagamento: identificador e status da cobrança no Mercado Pago. Não armazenamos dados de cartão nem de conta bancária.</li>
        <li>Registros técnicos mínimos de segurança e erros, sem o conteúdo do currículo.</li>
      </ul>
      <h2>Finalidades e bases legais</h2>
      <p>Execução do serviço contratado (criar e entregar o currículo), cumprimento de obrigação legal (registros fiscais de pagamento), legítimo interesse (segurança e prevenção a fraudes) e consentimento (uso de IA e foto).</p>
      <h2>Envio de dados à IA</h2>
      <p>Somente com o seu consentimento expresso, enviamos ao provedor de IA configurado o conteúdo profissional do currículo (experiências, formação, cursos, habilidades, projetos e a descrição da vaga, se informada). Não enviamos e-mail, telefone, endereço, links nem foto. Você pode usar o serviço sem a IA.</p>
      <h2>Compartilhamento</h2>
      <p>Supabase (banco, autenticação e armazenamento), Mercado Pago (pagamentos) e o provedor de IA configurado, como operadores, e autoridades quando exigido por lei.</p>
      <h2>Retenção e exclusão</h2>
      <ul>
        <li>Você pode excluir currículos a qualquer momento e excluir a conta em “Minha conta”, o que apaga currículos, fotos, PDFs e histórico de IA.</li>
        <li>Registros de pagamento são mantidos sem vínculo com a sua identidade pelo prazo exigido por obrigações fiscais.</li>
        <li>Rascunhos sem compra e sem atividade por 18 meses são removidos automaticamente.</li>
      </ul>
      <h2>Seus direitos</h2>
      <p>Acesso, correção, portabilidade, eliminação, informação sobre compartilhamento e revogação de consentimento, pelo e-mail {env.contactEmail}.</p>
      <h2>Segurança</h2>
      <p>HTTPS, armazenamento privado de fotos e PDFs, controle de acesso por usuário (Row Level Security) e segredos mantidos apenas no servidor.</p>
    </LegalPage>
  );
}
