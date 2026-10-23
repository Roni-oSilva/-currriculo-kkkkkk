import type { TemplateId } from "./schema";

export interface Profession {
  id: string;
  name: string;
  category: string;
  template: TemplateId;
  /** Segunda opção de modelo para a profissão */
  alt: TemplateId;
  /** Palavras-chave e competências típicas (sugestões que o usuário só adiciona se forem verdadeiras) */
  keywords: string[];
}

export const TEMPLATE_REASON: Record<TemplateId, string> = {
  classic: "Formato mais aceito por RH em áreas tradicionais e mais bem lido por sistemas de triagem (ATS): coluna única, fonte sóbria e títulos claros.",
  minimal: "Leitura limpa, sem elementos gráficos e com máxima compatibilidade com ATS. Ideal para funções técnicas e posições em que o conteúdo fala por si.",
  modern: "Barra lateral com foto, contato e competências. Valoriza a apresentação pessoal em funções com contato direto com pessoas e clientes.",
  "first-job": "Prioriza objetivo, formação, cursos e habilidades. Perfeito para quem está começando ou tem pouca experiência formal.",
  creative: "Foto grande e identidade visual marcante. Indicado para quem trabalha com imagem, design e portfólio.",
};

const ALT: Record<TemplateId, TemplateId> = { classic: "minimal", minimal: "classic", modern: "classic", "first-job": "classic", creative: "modern" };

type Row = [name: string, template: TemplateId, keywords: string[]];

const CATEGORIES: { name: string; rows: Row[] }[] = [
  { name: "Administrativo e escritório", rows: [
    ["Assistente administrativo", "classic", ["Pacote Office", "Organização de documentos", "Atendimento telefônico", "Controle de agenda", "Comunicação"]],
    ["Auxiliar administrativo", "classic", ["Excel", "Arquivo e protocolo", "Atendimento ao público", "Digitação", "Organização"]],
    ["Recepcionista", "modern", ["Atendimento ao cliente", "Gestão de agenda", "Telefonia", "Cordialidade", "Controle de visitantes"]],
    ["Secretária / Secretário executivo", "classic", ["Gestão de agenda", "Redação empresarial", "Organização de reuniões", "Excel", "Confidencialidade"]],
    ["Assistente financeiro", "classic", ["Contas a pagar e receber", "Conciliação bancária", "Excel avançado", "Fluxo de caixa", "Emissão de notas fiscais"]],
    ["Auxiliar contábil", "classic", ["Lançamentos contábeis", "Conciliação", "Notas fiscais", "Excel", "Sistemas contábeis"]],
    ["Contador", "classic", ["Contabilidade fiscal", "Balanços", "SPED", "Legislação tributária", "Sistemas contábeis"]],
    ["Analista financeiro", "classic", ["Análise de indicadores", "Orçamento", "Fluxo de caixa", "Excel avançado", "Relatórios gerenciais"]],
    ["Analista fiscal", "classic", ["Apuração de impostos", "SPED", "Notas fiscais", "Legislação tributária", "ERP"]],
    ["Assistente de RH / Departamento pessoal", "classic", ["Admissão e demissão", "Folha de pagamento", "Benefícios", "Legislação trabalhista", "eSocial"]],
    ["Analista de Recursos Humanos", "classic", ["Recrutamento e seleção", "Entrevistas por competências", "Treinamento", "Indicadores de RH", "Comunicação"]],
    ["Auxiliar de escritório", "first-job", ["Pacote Office", "Organização", "Atendimento", "Digitação", "Proatividade"]],
    ["Analista de compras / Comprador", "classic", ["Negociação com fornecedores", "Cotações", "ERP", "Controle de estoque", "Análise de custos"]],
    ["Gerente administrativo", "classic", ["Gestão de equipes", "Orçamento", "Controle de processos", "Indicadores", "Liderança"]],
  ]},
  { name: "Vendas e atendimento", rows: [
    ["Vendedor(a) de loja", "modern", ["Atendimento ao cliente", "Negociação", "Metas de vendas", "Pós-venda", "Comunicação"]],
    ["Operador(a) de caixa", "classic", ["Operação de PDV", "Atenção a detalhes", "Atendimento", "Fechamento de caixa", "Agilidade"]],
    ["Atendente de loja", "modern", ["Atendimento ao público", "Organização de vitrine", "Controle de estoque", "Comunicação", "Simpatia"]],
    ["Atendente de telemarketing / Call center", "classic", ["Atendimento receptivo", "Comunicação clara", "CRM", "Resolução de problemas", "Metas de qualidade"]],
    ["Representante comercial", "modern", ["Prospecção de clientes", "Negociação", "CRM", "Gestão de carteira", "Metas"]],
    ["Consultor(a) de vendas", "modern", ["Venda consultiva", "Prospecção", "Negociação", "CRM", "Relacionamento"]],
    ["Promotor(a) de vendas", "modern", ["Ações de ponto de venda", "Merchandising", "Relatórios de visita", "Negociação", "Dinamismo"]],
    ["Supervisor(a) de vendas", "classic", ["Gestão de equipe", "Indicadores comerciais", "Treinamento", "Metas", "Planejamento"]],
    ["Gerente de loja", "classic", ["Gestão de equipe", "Resultados de vendas", "Controle de estoque", "Atendimento", "Liderança"]],
    ["Atendente de farmácia", "classic", ["Atendimento ao cliente", "Conhecimento de medicamentos", "Controle de estoque", "Sistemas de PDV", "Ética"]],
    ["Analista de Customer Success", "modern", ["Relacionamento com clientes", "Onboarding", "Indicadores de satisfação", "CRM", "Comunicação"]],
  ]},
  { name: "Tecnologia", rows: [
    ["Desenvolvedor(a) de software", "minimal", ["Lógica de programação", "Git", "APIs REST", "Banco de dados", "Metodologias ágeis"]],
    ["Analista de sistemas", "minimal", ["Levantamento de requisitos", "Modelagem de dados", "SQL", "Documentação", "Metodologias ágeis"]],
    ["Analista de suporte / Help desk", "classic", ["Atendimento de chamados", "Windows e Linux", "Redes", "Resolução de problemas", "Comunicação"]],
    ["Técnico(a) de informática", "classic", ["Manutenção de computadores", "Redes", "Instalação de softwares", "Suporte ao usuário", "Hardware"]],
    ["Analista de dados", "minimal", ["SQL", "Excel avançado", "Power BI", "Python", "Visualização de dados"]],
    ["Cientista de dados", "minimal", ["Python", "Estatística", "Machine learning", "SQL", "Visualização de dados"]],
    ["Analista de qualidade (QA)", "minimal", ["Testes manuais e automatizados", "Plano de testes", "Jira", "Metodologias ágeis", "Atenção a detalhes"]],
    ["Engenheiro(a) DevOps", "minimal", ["CI/CD", "Docker", "Cloud (AWS/Azure/GCP)", "Linux", "Monitoramento"]],
    ["Designer UX/UI", "creative", ["Pesquisa com usuários", "Figma", "Prototipação", "Design system", "Usabilidade"]],
    ["Gerente de projetos de TI", "classic", ["Gestão de projetos", "Metodologias ágeis", "Cronogramas", "Gestão de riscos", "Comunicação com stakeholders"]],
    ["Analista de segurança da informação", "minimal", ["Gestão de vulnerabilidades", "Políticas de segurança", "Redes", "Resposta a incidentes", "LGPD"]],
  ]},
  { name: "Saúde", rows: [
    ["Enfermeiro(a)", "classic", ["Assistência de enfermagem", "SAE", "Segurança do paciente", "Gestão de equipe", "Registros clínicos"]],
    ["Técnico(a) de enfermagem", "classic", ["Cuidados ao paciente", "Aferição de sinais vitais", "Medicação", "Biossegurança", "Trabalho em equipe"]],
    ["Médico(a)", "classic", ["Atendimento clínico", "Prontuário eletrônico", "Diagnóstico", "Trabalho multiprofissional", "Ética médica"]],
    ["Dentista", "classic", ["Atendimento clínico", "Biossegurança", "Planejamento de tratamento", "Prontuário", "Relacionamento com pacientes"]],
    ["Fisioterapeuta", "classic", ["Avaliação funcional", "Reabilitação", "Planos de tratamento", "Atendimento humanizado", "Prontuário"]],
    ["Nutricionista", "classic", ["Avaliação nutricional", "Planos alimentares", "Orientação a pacientes", "Educação alimentar", "Atendimento clínico"]],
    ["Psicólogo(a)", "classic", ["Atendimento clínico", "Avaliação psicológica", "Escuta qualificada", "Ética profissional", "Elaboração de laudos"]],
    ["Farmacêutico(a)", "classic", ["Dispensação de medicamentos", "Atenção farmacêutica", "Controle de estoque", "Vigilância sanitária", "Legislação"]],
    ["Auxiliar de saúde bucal", "classic", ["Biossegurança", "Apoio ao dentista", "Esterilização", "Agendamento", "Atendimento"]],
    ["Cuidador(a) de idosos", "first-job", ["Cuidados diários", "Administração de medicação", "Paciência e empatia", "Primeiros socorros", "Acompanhamento"]],
    ["Biomédico(a)", "classic", ["Análises clínicas", "Biossegurança", "Controle de qualidade", "Equipamentos laboratoriais", "Laudos"]],
    ["Veterinário(a)", "classic", ["Atendimento clínico", "Cirurgia", "Vacinação", "Exames laboratoriais", "Relacionamento com tutores"]],
  ]},
  { name: "Educação", rows: [
    ["Professor(a)", "classic", ["Planejamento de aulas", "Didática", "Avaliação de aprendizagem", "BNCC", "Comunicação com famílias"]],
    ["Pedagogo(a) / Coordenador(a) pedagógico", "classic", ["Projeto político-pedagógico", "Formação de professores", "Gestão escolar", "Avaliação", "Mediação de conflitos"]],
    ["Auxiliar de educação infantil / Monitor(a)", "first-job", ["Cuidado com crianças", "Atividades lúdicas", "Primeiros socorros", "Comunicação com famílias", "Paciência"]],
    ["Instrutor(a) / Treinador(a)", "modern", ["Didática", "Elaboração de treinamentos", "Apresentações", "Avaliação de resultados", "Comunicação"]],
    ["Professor(a) de idiomas", "modern", ["Metodologias de ensino", "Conversação", "Preparação para exames", "Planejamento de aulas", "Fluência"]],
  ]},
  { name: "Engenharia e indústria", rows: [
    ["Engenheiro(a) civil", "classic", ["Gestão de obras", "AutoCAD", "Orçamento e planejamento", "Normas técnicas", "Fiscalização"]],
    ["Engenheiro(a) mecânico(a)", "classic", ["Projetos mecânicos", "SolidWorks", "Manutenção industrial", "Normas técnicas", "Melhoria contínua"]],
    ["Engenheiro(a) elétrico(a)", "classic", ["Projetos elétricos", "NR-10", "AutoCAD", "Automação", "Manutenção"]],
    ["Engenheiro(a) de produção", "classic", ["Melhoria contínua", "Lean manufacturing", "Indicadores (KPIs)", "Gestão de processos", "Excel"]],
    ["Técnico(a) em segurança do trabalho", "classic", ["Normas regulamentadoras (NRs)", "Inspeções de segurança", "Treinamentos", "CIPA", "Investigação de acidentes"]],
    ["Operador(a) de produção", "first-job", ["Operação de máquinas", "Controle de qualidade", "Normas de segurança", "Trabalho em equipe", "Organização"]],
    ["Mecânico(a) industrial", "classic", ["Manutenção preventiva e corretiva", "Leitura de desenho técnico", "Soldagem", "Normas de segurança", "Lubrificação"]],
    ["Eletricista", "classic", ["Instalações elétricas", "NR-10", "Manutenção", "Leitura de diagramas", "Quadros de comando"]],
    ["Soldador(a)", "classic", ["Soldagem MIG/TIG/eletrodo", "Leitura de desenho técnico", "Normas de segurança", "Corte e montagem", "Inspeção"]],
    ["Técnico(a) em eletrotécnica / mecatrônica", "classic", ["Automação industrial", "CLP", "Manutenção", "Leitura de diagramas", "Normas de segurança"]],
    ["Analista de qualidade industrial", "classic", ["Controle de qualidade", "ISO 9001", "Auditorias internas", "Indicadores", "Ações corretivas"]],
  ]},
  { name: "Logística e transporte", rows: [
    ["Auxiliar de logística / Estoquista", "classic", ["Recebimento e expedição", "Controle de estoque", "Inventário", "WMS", "Organização"]],
    ["Almoxarife", "classic", ["Controle de materiais", "Inventário", "Notas fiscais", "ERP", "Organização"]],
    ["Operador(a) de empilhadeira", "classic", ["Operação de empilhadeira", "Movimentação de cargas", "Normas de segurança", "Armazenagem", "Atenção"]],
    ["Motorista", "classic", ["CNH (categoria)", "Direção defensiva", "Roteirização", "Conferência de cargas", "Pontualidade"]],
    ["Motoboy / Entregador(a)", "first-job", ["CNH A", "Conhecimento de rotas", "Pontualidade", "Atendimento ao cliente", "Responsabilidade"]],
    ["Analista de logística", "classic", ["Planejamento logístico", "Indicadores", "Gestão de transportes", "ERP", "Excel avançado"]],
    ["Conferente", "classic", ["Conferência de cargas", "Notas fiscais", "Sistemas de estoque", "Organização", "Atenção a detalhes"]],
  ]},
  { name: "Construção e serviços gerais", rows: [
    ["Pedreiro / Mestre de obras", "classic", ["Alvenaria", "Leitura de projetos", "Acabamento", "Gestão de equipe", "Normas de segurança"]],
    ["Pintor(a)", "classic", ["Pintura residencial e predial", "Preparação de superfícies", "Acabamento", "Normas de segurança", "Capricho"]],
    ["Auxiliar de serviços gerais", "first-job", ["Limpeza e conservação", "Organização", "Pontualidade", "Responsabilidade", "Trabalho em equipe"]],
    ["Porteiro(a) / Controlador(a) de acesso", "classic", ["Controle de acesso", "Atendimento", "Registro de ocorrências", "Segurança patrimonial", "Cordialidade"]],
    ["Vigilante", "classic", ["Segurança patrimonial", "Rondas", "Registro de ocorrências", "Curso de vigilante", "Atenção"]],
    ["Zelador(a) / Auxiliar de manutenção predial", "classic", ["Manutenção predial", "Pequenos reparos", "Limpeza", "Organização", "Responsabilidade"]],
    ["Jardineiro(a)", "classic", ["Paisagismo", "Poda e manutenção", "Irrigação", "Uso de equipamentos", "Cuidado com plantas"]],
    ["Ajudante geral", "first-job", ["Auxílio em obras e serviços", "Disposição física", "Pontualidade", "Aprendizado rápido", "Trabalho em equipe"]],
    ["Auxiliar de limpeza", "first-job", ["Limpeza profissional", "Produtos e equipamentos", "Organização", "Pontualidade", "Responsabilidade"]],
  ]},
  { name: "Alimentação e hotelaria", rows: [
    ["Cozinheiro(a)", "classic", ["Preparo de pratos", "Boas práticas de manipulação", "Controle de estoque", "Fichas técnicas", "Organização de cozinha"]],
    ["Auxiliar de cozinha", "first-job", ["Pré-preparo", "Higiene e manipulação de alimentos", "Organização", "Agilidade", "Trabalho em equipe"]],
    ["Garçom / Garçonete", "modern", ["Atendimento ao cliente", "Conhecimento de cardápio", "Agilidade", "Trabalho em equipe", "Comunicação"]],
    ["Barista / Atendente de café", "modern", ["Preparo de bebidas", "Atendimento", "Higiene", "Operação de máquinas", "Agilidade"]],
    ["Padeiro(a) / Confeiteiro(a)", "classic", ["Panificação", "Confeitaria", "Boas práticas", "Controle de qualidade", "Criatividade"]],
    ["Recepcionista de hotel", "modern", ["Check-in e check-out", "Atendimento ao hóspede", "Idiomas", "Sistemas de reservas", "Cordialidade"]],
    ["Camareira / Governanta", "classic", ["Arrumação de quartos", "Padrões de qualidade", "Controle de enxoval", "Organização", "Atenção a detalhes"]],
    ["Gerente de restaurante", "classic", ["Gestão de equipe", "Controle de custos", "Atendimento", "Indicadores", "Escalas"]],
  ]},
  { name: "Marketing, comunicação e criação", rows: [
    ["Designer gráfico", "creative", ["Adobe Photoshop", "Illustrator", "Identidade visual", "Diagramação", "Criatividade"]],
    ["Social media", "creative", ["Planejamento de conteúdo", "Gestão de redes sociais", "Canva", "Métricas de engajamento", "Copywriting"]],
    ["Analista de marketing", "modern", ["Planejamento de campanhas", "Google Analytics", "Mídia paga", "SEO", "Relatórios de resultados"]],
    ["Redator(a) / Copywriter", "minimal", ["Redação publicitária", "SEO", "Revisão", "Pesquisa", "Storytelling"]],
    ["Jornalista", "classic", ["Apuração", "Redação jornalística", "Entrevistas", "Edição", "Ética profissional"]],
    ["Fotógrafo(a)", "creative", ["Fotografia", "Lightroom", "Iluminação", "Edição de imagens", "Portfólio"]],
    ["Editor(a) de vídeo / Videomaker", "creative", ["Premiere", "After Effects", "Roteiro", "Captação", "Edição de vídeo"]],
    ["Publicitário(a)", "modern", ["Criação de campanhas", "Planejamento", "Atendimento a clientes", "Briefing", "Mídia"]],
    ["Arquiteto(a) / Designer de interiores", "creative", ["AutoCAD", "SketchUp", "Projetos", "Renderização", "Portfólio"]],
    ["Produtor(a) de conteúdo", "creative", ["Roteiro", "Edição", "Redes sociais", "Pesquisa", "Criatividade"]],
    ["Assessor(a) de imprensa", "modern", ["Relacionamento com a mídia", "Release", "Gestão de crise", "Redação", "Planejamento"]],
  ]},
  { name: "Jurídico, finanças e gestão", rows: [
    ["Advogado(a)", "classic", ["Pesquisa jurídica", "Elaboração de peças", "Contratos", "Atendimento a clientes", "OAB"]],
    ["Assistente jurídico / Paralegal", "classic", ["Acompanhamento processual", "Redação de documentos", "Pesquisa", "Organização", "Sistemas jurídicos"]],
    ["Analista de projetos / PMO", "classic", ["Gestão de projetos", "Cronogramas", "Indicadores", "Gestão de riscos", "Comunicação"]],
    ["Gerente comercial", "classic", ["Gestão comercial", "Metas e resultados", "Negociação", "Liderança", "Planejamento estratégico"]],
    ["Consultor(a) empresarial", "classic", ["Diagnóstico organizacional", "Análise de processos", "Apresentações", "Gestão de projetos", "Comunicação"]],
    ["Analista de crédito / Bancário(a)", "classic", ["Análise de crédito", "Atendimento ao cliente", "Produtos bancários", "Compliance", "Excel"]],
    ["Diretor(a) / Executivo(a)", "minimal", ["Liderança estratégica", "Gestão de resultados", "Governança", "Planejamento", "Gestão de pessoas"]],
  ]},
  { name: "Beleza, bem-estar e esportes", rows: [
    ["Cabeleireiro(a)", "modern", ["Corte e coloração", "Escova e penteados", "Atendimento ao cliente", "Tendências", "Higiene"]],
    ["Manicure / Pedicure", "modern", ["Esmaltação", "Alongamento de unhas", "Biossegurança", "Atendimento", "Criatividade"]],
    ["Barbeiro(a)", "modern", ["Cortes masculinos", "Barba", "Atendimento ao cliente", "Higiene", "Tendências"]],
    ["Esteticista", "modern", ["Limpeza de pele", "Massagens", "Depilação", "Biossegurança", "Atendimento"]],
    ["Maquiador(a)", "creative", ["Maquiagem social e artística", "Visagismo", "Produtos e técnicas", "Atendimento", "Portfólio"]],
    ["Personal trainer / Educador(a) físico(a)", "modern", ["Prescrição de treinos", "Avaliação física", "Motivação", "CREF", "Acompanhamento de alunos"]],
    ["Massoterapeuta", "modern", ["Massagem terapêutica", "Anamnese", "Biossegurança", "Atendimento", "Técnicas corporais"]],
  ]},
  { name: "Agro e meio ambiente", rows: [
    ["Técnico(a) agrícola / Agrônomo(a)", "classic", ["Manejo de culturas", "Assistência técnica", "Máquinas agrícolas", "Gestão de insumos", "Relatórios técnicos"]],
    ["Operador(a) de máquinas agrícolas", "classic", ["Operação de tratores e colheitadeiras", "Manutenção básica", "Normas de segurança", "CNH", "Responsabilidade"]],
    ["Analista ambiental", "classic", ["Licenciamento ambiental", "Legislação ambiental", "Relatórios técnicos", "Gestão de resíduos", "Auditorias"]],
  ]},
  { name: "Primeiro emprego e estágio", rows: [
    ["Primeiro emprego (sem experiência)", "first-job", ["Comunicação", "Organização", "Proatividade", "Vontade de aprender", "Pacote Office"]],
    ["Jovem aprendiz", "first-job", ["Disposição para aprender", "Responsabilidade", "Pacote Office", "Trabalho em equipe", "Pontualidade"]],
    ["Estagiário(a) administrativo", "first-job", ["Pacote Office", "Organização", "Comunicação", "Proatividade", "Atenção a detalhes"]],
    ["Estagiário(a) de tecnologia", "first-job", ["Lógica de programação", "Git", "Trabalho em equipe", "Aprendizado rápido", "Inglês técnico"]],
    ["Estagiário(a) de marketing / comunicação", "first-job", ["Redes sociais", "Canva", "Redação", "Criatividade", "Pacote Office"]],
    ["Estagiário(a) de engenharia", "first-job", ["AutoCAD", "Excel", "Normas técnicas", "Proatividade", "Trabalho em equipe"]],
    ["Recém-formado(a) (trainee)", "first-job", ["Análise e resolução de problemas", "Comunicação", "Liderança", "Inglês", "Excel"]],
  ]},
];

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const PROFESSIONS: Profession[] = CATEGORIES.flatMap((c) =>
  c.rows.map(([name, template, keywords]): Profession => ({ id: slug(name), name, category: c.name, template, alt: ALT[template], keywords })),
);

export const PROFESSION_CATEGORIES = CATEGORIES.map((c) => c.name);

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\((a|o|as|os)\)/g, "").replace(/\s+/g, " ").trim();

export function getProfession(id: string | undefined | null): Profession | undefined {
  return id ? PROFESSIONS.find((p) => p.id === id) : undefined;
}

/** Associa o "cargo desejado" digitado à profissão da lista (comparação sem acentos). */
export function findProfessionByRole(role: string): Profession | undefined {
  const r = normalize(role);
  if (!r) return undefined;
  return PROFESSIONS.find((p) => normalize(p.name) === r);
}

export function searchProfessions(query: string, category?: string): Profession[] {
  const q = normalize(query);
  return PROFESSIONS.filter((p) => (!category || p.category === category) && (!q || normalize(p.name).includes(q) || normalize(p.category).includes(q)));
}
